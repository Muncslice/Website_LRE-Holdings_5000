import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.inventory import InventoryService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/inventory", tags=["inventory"])


# ---------- Pydantic Schemas ----------
class InventoryData(BaseModel):
    """Entity data schema (for create/update)"""
    sku: str
    product_name: str
    description: str = None
    category: str = None
    unit_cost: float
    retail_price: float
    status: str
    location: str = None
    barcode: str = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class InventoryUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    sku: Optional[str] = None
    product_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit_cost: Optional[float] = None
    retail_price: Optional[float] = None
    status: Optional[str] = None
    location: Optional[str] = None
    barcode: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class InventoryResponse(BaseModel):
    """Entity response schema"""
    id: int
    sku: str
    product_name: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit_cost: float
    retail_price: float
    status: str
    location: Optional[str] = None
    barcode: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventoryListResponse(BaseModel):
    """List response schema"""
    items: List[InventoryResponse]
    total: int
    skip: int
    limit: int


class InventoryBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[InventoryData]


class InventoryBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: InventoryUpdateData


class InventoryBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[InventoryBatchUpdateItem]


class InventoryBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=InventoryListResponse)
async def query_inventorys(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query inventorys with filtering, sorting, and pagination"""
    logger.debug(f"Querying inventorys: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = InventoryService(db)
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
        )
        logger.debug(f"Found {result['total']} inventorys")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying inventorys: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=InventoryListResponse)
async def query_inventorys_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query inventorys with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying inventorys: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = InventoryService(db)
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
        logger.debug(f"Found {result['total']} inventorys")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying inventorys: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=InventoryResponse)
async def get_inventory(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single inventory by ID"""
    logger.debug(f"Fetching inventory with id: {id}, fields={fields}")
    
    service = InventoryService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Inventory with id {id} not found")
            raise HTTPException(status_code=404, detail="Inventory not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching inventory {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=InventoryResponse, status_code=201)
async def create_inventory(
    data: InventoryData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new inventory"""
    logger.debug(f"Creating new inventory with data: {data}")
    
    service = InventoryService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create inventory")
        
        logger.info(f"Inventory created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating inventory: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating inventory: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[InventoryResponse], status_code=201)
async def create_inventorys_batch(
    request: InventoryBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple inventorys in a single request"""
    logger.debug(f"Batch creating {len(request.items)} inventorys")
    
    service = InventoryService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} inventorys successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[InventoryResponse])
async def update_inventorys_batch(
    request: InventoryBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple inventorys in a single request"""
    logger.debug(f"Batch updating {len(request.items)} inventorys")

    service = InventoryService(db)

    try:
        # Prepare data for the service layer
        items_to_update = [item.model_dump() for item in request.items]

        results = await service.batch_update(items_to_update)

        logger.info(f"Batch updated {len(results)} inventorys successfully")
        return results
    except Exception as e:
        # The service layer now handles the rollback
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=InventoryResponse)
async def update_inventory(
    id: int,
    data: InventoryUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing inventory"""
    logger.debug(f"Updating inventory {id} with data: {data}")

    service = InventoryService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Inventory with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Inventory not found")
        
        logger.info(f"Inventory {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating inventory {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating inventory {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_inventorys_batch(
    request: InventoryBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple inventorys by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} inventorys")
    
    service = InventoryService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} inventorys successfully")
        return {"message": f"Successfully deleted {deleted_count} inventorys", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_inventory(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single inventory by ID"""
    logger.debug(f"Deleting inventory with id: {id}")
    
    service = InventoryService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Inventory with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Inventory not found")
        
        logger.info(f"Inventory {id} deleted successfully")
        return {"message": "Inventory deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting inventory {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")