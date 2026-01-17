import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.issues import IssuesService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/issues", tags=["issues"])


# ---------- Pydantic Schemas ----------
class IssuesData(BaseModel):
    """Entity data schema (for create/update)"""
    affiliate_id: str
    inventory_id: int
    issue_type: str
    description: str
    photo_url: str = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class IssuesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    affiliate_id: Optional[str] = None
    inventory_id: Optional[int] = None
    issue_type: Optional[str] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class IssuesResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    affiliate_id: str
    inventory_id: int
    issue_type: str
    description: str
    photo_url: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class IssuesListResponse(BaseModel):
    """List response schema"""
    items: List[IssuesResponse]
    total: int
    skip: int
    limit: int


class IssuesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[IssuesData]


class IssuesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: IssuesUpdateData


class IssuesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[IssuesBatchUpdateItem]


class IssuesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=IssuesListResponse)
async def query_issuess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query issuess with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying issuess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = IssuesService(db)
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
        logger.debug(f"Found {result['total']} issuess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying issuess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=IssuesListResponse)
async def query_issuess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query issuess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying issuess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = IssuesService(db)
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
        logger.debug(f"Found {result['total']} issuess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying issuess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=IssuesResponse)
async def get_issues(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single issues by ID (user can only see their own records)"""
    logger.debug(f"Fetching issues with id: {id}, fields={fields}")
    
    service = IssuesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Issues with id {id} not found")
            raise HTTPException(status_code=404, detail="Issues not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching issues {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=IssuesResponse, status_code=201)
async def create_issues(
    data: IssuesData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new issues"""
    logger.debug(f"Creating new issues with data: {data}")
    
    service = IssuesService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create issues")
        
        logger.info(f"Issues created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating issues: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating issues: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[IssuesResponse], status_code=201)
async def create_issuess_batch(
    request: IssuesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple issuess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} issuess")
    
    service = IssuesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} issuess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[IssuesResponse])
async def update_issuess_batch(
    request: IssuesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple issuess in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} issuess")
    
    service = IssuesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} issuess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=IssuesResponse)
async def update_issues(
    id: int,
    data: IssuesUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing issues (requires ownership)"""
    logger.debug(f"Updating issues {id} with data: {data}")

    service = IssuesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Issues with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Issues not found")
        
        logger.info(f"Issues {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating issues {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating issues {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_issuess_batch(
    request: IssuesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple issuess by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} issuess")
    
    service = IssuesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} issuess successfully")
        return {"message": f"Successfully deleted {deleted_count} issuess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_issues(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single issues by ID (requires ownership)"""
    logger.debug(f"Deleting issues with id: {id}")
    
    service = IssuesService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Issues with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Issues not found")
        
        logger.info(f"Issues {id} deleted successfully")
        return {"message": "Issues deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting issues {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")