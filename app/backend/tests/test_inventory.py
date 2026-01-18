import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from services.inventory import InventoryService
from models.inventory import Inventory

@pytest.mark.asyncio
async def test_batch_update_success():
    mock_db = AsyncMock(spec=AsyncSession)
    service = InventoryService(mock_db)

    items_to_update = [
        {"id": 1, "updates": {"product_name": "New Name 1"}},
        {"id": 2, "updates": {"retail_price": 99.99}},
    ]

    mock_inventory1 = Inventory(id=1, product_name="Old Name 1", retail_price=50.0)
    mock_inventory2 = Inventory(id=2, product_name="Product 2", retail_price=75.0)

    # Mock the database execute call to return our mock objects
    mock_result = AsyncMock()
    mock_result.scalars.return_value.all.return_value = [mock_inventory1, mock_inventory2]
    mock_db.execute.return_value = mock_result

    updated_items = await service.batch_update(items_to_update)

    assert len(updated_items) == 2
    assert updated_items[0].product_name == "New Name 1"
    assert updated_items[1].retail_price == 99.99
    mock_db.commit.assert_called_once()
    assert mock_db.refresh.call_count == 2

@pytest.mark.asyncio
async def test_batch_update_no_items_found():
    mock_db = AsyncMock(spec=AsyncSession)
    service = InventoryService(mock_db)

    items_to_update = [
        {"id": 1, "updates": {"product_name": "New Name 1"}},
    ]

    # Mock the database to return no items
    mock_result = AsyncMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    updated_items = await service.batch_update(items_to_update)

    assert len(updated_items) == 0
    mock_db.commit.assert_not_called()
    mock_db.rollback.assert_not_called()
