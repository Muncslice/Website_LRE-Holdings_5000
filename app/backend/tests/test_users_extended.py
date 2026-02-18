import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from services.users_extended import Users_extendedService
from models.users_extended import Users_extended

@pytest.mark.asyncio
async def test_batch_update_success():
    mock_db = AsyncMock(spec=AsyncSession)
    service = Users_extendedService(mock_db)

    items_to_update = [
        {"id": "user1", "updates": {"full_name": "New Name 1"}},
        {"id": "user2", "updates": {"status": "suspended"}},
    ]

    mock_user1 = Users_extended(id="user1", full_name="Old Name 1", status="active", role="admin")
    mock_user2 = Users_extended(id="user2", full_name="User 2", status="active", role="user")

    # Mock the database execute call to return our mock objects
    mock_result = AsyncMock()
    mock_result.scalars.return_value.all.return_value = [mock_user1, mock_user2]
    mock_db.execute.return_value = mock_result

    updated_items = await service.batch_update(items_to_update)

    assert len(updated_items) == 2
    assert updated_items[0].full_name == "New Name 1"
    assert updated_items[1].status == "suspended"
    mock_db.commit.assert_called_once()
    assert mock_db.refresh.call_count == 2

@pytest.mark.asyncio
async def test_batch_update_no_items_found():
    mock_db = AsyncMock(spec=AsyncSession)
    service = Users_extendedService(mock_db)

    items_to_update = [
        {"id": "nonexistent", "updates": {"full_name": "New Name"}},
    ]

    # Mock the database to return no items
    mock_result = AsyncMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    updated_items = await service.batch_update(items_to_update)

    assert len(updated_items) == 0
    mock_db.commit.assert_not_called()
    mock_db.rollback.assert_not_called()
