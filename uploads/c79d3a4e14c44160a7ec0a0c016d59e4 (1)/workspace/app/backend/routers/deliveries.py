import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.deliveries import DeliveriesService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/deliveries", tags=["deliveries"])


# ---------- Pydantic Schemas ----------
class DeliveriesData(BaseModel):
    """Entity data schema (for create/update)"""
    driver_id: str
    consignment_id: int
    delivery_address: str
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    status: str
    route_priority: int
    signature_url: str = None
    photo_url: str = None
    notes: str = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class DeliveriesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    driver_id: Optional[str] = None
    consignment_id: Optional[int] = None
    delivery_address: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    status: Optional[str] = None
    route_priority: Optional[int] = None
    signature_url: Optional[str] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class DeliveriesResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    driver_id: str
    consignment_id: int
    delivery_address: str
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    status: str
    route_priority: int
    signature_url: Optional[str] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DeliveriesListResponse(BaseModel):
    """List response schema"""
    items: List[DeliveriesResponse]
    total: int
    skip: int
    limit: int


class DeliveriesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[DeliveriesData]


class DeliveriesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: DeliveriesUpdateData


class DeliveriesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[DeliveriesBatchUpdateItem]


class DeliveriesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=DeliveriesListResponse)
async def query_deliveriess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query deliveriess with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying deliveriess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = DeliveriesService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} deliveriess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying deliveriess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=DeliveriesListResponse)
async def query_deliveriess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query deliveriess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying deliveriess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = DeliveriesService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} deliveriess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying deliveriess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=DeliveriesResponse)
async def get_deliveries(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single deliveries by ID (user can only see their own records)"""
    logger.debug(f"Fetching deliveries with id: {id}, fields={fields}")
    
    service = DeliveriesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Deliveries with id {id} not found")
            raise HTTPException(status_code=404, detail="Deliveries not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching deliveries {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=DeliveriesResponse, status_code=201)
async def create_deliveries(
    data: DeliveriesData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new deliveries"""
    logger.debug(f"Creating new deliveries with data: {data}")
    
    service = DeliveriesService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create deliveries")
        
        logger.info(f"Deliveries created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating deliveries: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating deliveries: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[DeliveriesResponse], status_code=201)
async def create_deliveriess_batch(
    request: DeliveriesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple deliveriess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} deliveriess")
    
    service = DeliveriesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} deliveriess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[DeliveriesResponse])
async def update_deliveriess_batch(
    request: DeliveriesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple deliveriess in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} deliveriess")
    
    service = DeliveriesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} deliveriess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=DeliveriesResponse)
async def update_deliveries(
    id: int,
    data: DeliveriesUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing deliveries (requires ownership)"""
    logger.debug(f"Updating deliveries {id} with data: {data}")

    service = DeliveriesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Deliveries with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Deliveries not found")
        
        logger.info(f"Deliveries {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating deliveries {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating deliveries {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_deliveriess_batch(
    request: DeliveriesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple deliveriess by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} deliveriess")
    
    service = DeliveriesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} deliveriess successfully")
        return {"message": f"Successfully deleted {deleted_count} deliveriess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_deliveries(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single deliveries by ID (requires ownership)"""
    logger.debug(f"Deleting deliveries with id: {id}")
    
    service = DeliveriesService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Deliveries with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Deliveries not found")
        
        logger.info(f"Deliveries {id} deleted successfully")
        return {"message": "Deliveries deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting deliveries {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")