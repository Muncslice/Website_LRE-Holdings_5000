import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.inventory import Inventory

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class InventoryService:
    """Service layer for Inventory operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Inventory]:
        """Create a new inventory"""
        try:
            obj = Inventory(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created inventory with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating inventory: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Inventory]:
        """Get inventory by ID"""
        try:
            query = select(Inventory).where(Inventory.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching inventory {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of inventorys"""
        try:
            query = select(Inventory)
            count_query = select(func.count(Inventory.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Inventory, field):
                        query = query.where(getattr(Inventory, field) == value)
                        count_query = count_query.where(getattr(Inventory, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Inventory, field_name):
                        query = query.order_by(getattr(Inventory, field_name).desc())
                else:
                    if hasattr(Inventory, sort):
                        query = query.order_by(getattr(Inventory, sort))
            else:
                query = query.order_by(Inventory.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching inventory list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Inventory]:
        """Update inventory"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Inventory {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated inventory {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating inventory {obj_id}: {str(e)}")
            raise

    async def batch_update(self, items: List[Dict[str, Any]]) -> List[Inventory]:
        """Batch update inventory items"""
        updated_objects = []
        try:
            item_ids = [item['id'] for item in items]

            # Fetch all objects to be updated in a single query
            query = select(Inventory).where(Inventory.id.in_(item_ids))
            result = await self.db.execute(query)
            objects_to_update = {obj.id: obj for obj in result.scalars().all()}

            if not objects_to_update:
                logger.warning("No inventory items found for batch update")
                return []

            for item in items:
                obj_id = item['id']
                update_data = item['updates']

                if obj_id in objects_to_update:
                    obj = objects_to_update[obj_id]
                    for key, value in update_data.items():
                        if hasattr(obj, key) and value is not None:
                            setattr(obj, key, value)
                    updated_objects.append(obj)

            await self.db.commit()

            # Refresh each object to get the updated state from the DB
            for obj in updated_objects:
                await self.db.refresh(obj)

            logger.info(f"Batch updated {len(updated_objects)} inventory items")
            return updated_objects
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error in batch update: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete inventory"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Inventory {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted inventory {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting inventory {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Inventory]:
        """Get inventory by any field"""
        try:
            if not hasattr(Inventory, field_name):
                raise ValueError(f"Field {field_name} does not exist on Inventory")
            result = await self.db.execute(
                select(Inventory).where(getattr(Inventory, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching inventory by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Inventory]:
        """Get list of inventorys filtered by field"""
        try:
            if not hasattr(Inventory, field_name):
                raise ValueError(f"Field {field_name} does not exist on Inventory")
            result = await self.db.execute(
                select(Inventory)
                .where(getattr(Inventory, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Inventory.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching inventorys by {field_name}: {str(e)}")
            raise