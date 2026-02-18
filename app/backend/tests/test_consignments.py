import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from services.consignments import ConsignmentsService
from models.consignments import Consignments

@pytest.mark.asyncio
async def test_create_batch_success():
    mock_db = AsyncMock(spec=AsyncSession)
    service = ConsignmentsService(mock_db)

    items_data = [
        {"affiliate_id": "aff1", "inventory_id": 1, "quantity": 10, "status": "pending"},
        {"affiliate_id": "aff2", "inventory_id": 2, "quantity": 20, "status": "completed"},
    ]
    user_id = "user123"

    # We don't need to mock refresh behavior deeply, just ensure it's called
    results = await service.create_batch(items_data, user_id=user_id)

    assert len(results) == 2
    assert results[0].affiliate_id == "aff1"
    assert results[0].user_id == user_id
    assert results[1].affiliate_id == "aff2"
    assert results[1].user_id == user_id

    mock_db.add_all.assert_called_once()
    mock_db.commit.assert_called_once()
    assert mock_db.refresh.call_count == 2

@pytest.mark.asyncio
async def test_create_batch_empty():
    mock_db = AsyncMock(spec=AsyncSession)
    service = ConsignmentsService(mock_db)

    results = await service.create_batch([], user_id="user123")

    assert results == []
    mock_db.add_all.assert_not_called()
    mock_db.commit.assert_not_called()

@pytest.mark.asyncio
async def test_create_batch_error():
    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.commit.side_effect = Exception("DB Error")
    service = ConsignmentsService(mock_db)

    items_data = [{"affiliate_id": "aff1", "inventory_id": 1, "quantity": 10, "status": "pending"}]

    with pytest.raises(Exception) as excinfo:
        await service.create_batch(items_data, user_id="user123")

    assert "DB Error" in str(excinfo.value)
    mock_db.rollback.assert_called_once()
