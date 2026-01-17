import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.users_extended import Users_extended
from models.audit_logs import Audit_logs
from sqlalchemy import select, func, and_

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


class CreateUserRequest(BaseModel):
    email: str
    full_name: str
    phone: str
    role: str
    password: str


class UpdateUserStatusRequest(BaseModel):
    user_id: str
    status: str


class AnalyticsResponse(BaseModel):
    total_inventory: int
    warehouse_count: int
    consigned_count: int
    sold_count: int
    total_affiliates: int
    active_deliveries: int


@router.post("/users/create")
async def create_user(
    data: CreateUserRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Create a new user account"""
    # Check if current user is admin
    result = await db.execute(
        select(Users_extended).where(Users_extended.id == current_user.id)
    )
    admin_user = result.scalar_one_or_none()
    
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # In production, this would create auth.users entry first
    # For now, we'll create the extended user profile
    try:
        new_user = Users_extended(
            id=data.email,  # Temporary - should be auth.users.id
            role=data.role,
            status="active",
            full_name=data.full_name,
            phone=data.phone,
            created_at=datetime.now(),
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        return {"success": True, "user_id": new_user.id}
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")


@router.post("/users/update-status")
async def update_user_status(
    data: UpdateUserStatusRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Update user status (active/suspended)"""
    # Check if current user is admin
    result = await db.execute(
        select(Users_extended).where(Users_extended.id == current_user.id)
    )
    admin_user = result.scalar_one_or_none()
    
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        result = await db.execute(
            select(Users_extended).where(Users_extended.id == data.user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.status = data.status
        await db.commit()
        
        return {"success": True, "user_id": user.id, "status": user.status}
    except Exception as e:
        logger.error(f"Error updating user status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Get platform analytics"""
    # Check if current user is admin
    result = await db.execute(
        select(Users_extended).where(Users_extended.id == current_user.id)
    )
    admin_user = result.scalar_one_or_none()
    
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # This would query actual data in production
        return AnalyticsResponse(
            total_inventory=0,
            warehouse_count=0,
            consigned_count=0,
            sold_count=0,
            total_affiliates=0,
            active_deliveries=0,
        )
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


@router.get("/audit-logs")
async def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    table_name: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Get audit logs"""
    # Check if current user is admin
    result = await db.execute(
        select(Users_extended).where(Users_extended.id == current_user.id)
    )
    admin_user = result.scalar_one_or_none()
    
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        query = select(Audit_logs).order_by(Audit_logs.created_at.desc())
        
        if table_name:
            query = query.where(Audit_logs.table_name == table_name)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        logs = result.scalars().all()
        
        return {"logs": [log.__dict__ for log in logs], "total": len(logs)}
    except Exception as e:
        logger.error(f"Error fetching audit logs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch logs: {str(e)}")