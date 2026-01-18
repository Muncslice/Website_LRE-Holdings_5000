import asyncio
import sys
import os
from unittest.mock import MagicMock, patch
import pytest

# Ensure app/backend is in the path
# This assumes the test file is in app/backend/tests/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# We need to mock sqlalchemy imports if they are not installed or to avoid side effects
# But since we installed requirements, we should be fine importing normally.
try:
    from core.database import DatabaseManager
except ImportError:
    # If core.database cannot be imported, we might need to adjust path or check structure
    # Try adding app/backend explicitly if the above didn't work
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))
    from core.database import DatabaseManager

@pytest.mark.asyncio
async def test_init_db_concurrency():
    """
    Verify that concurrent calls to init_db do not result in double initialization
    or race conditions, now that the lock covers the critical section.
    """

    # Mock settings to avoid environment errors
    with patch('core.database.settings') as mock_settings:
        mock_settings.database_url = "sqlite+aiosqlite:///:memory:"
        mock_settings.debug = False

        db = DatabaseManager()

        # We mock _init_db_internal to be slow and track calls.
        # This simulates the critical section.

        call_count = 0

        async def slow_init_internal():
            nonlocal call_count
            call_count += 1
            # Simulate work/IO that yields control
            await asyncio.sleep(0.1)
            # Set state so subsequent checks pass (engine is not None)
            db.engine = MagicMock()
            db.async_session_maker = MagicMock()

        with patch.object(db, '_init_db_internal', side_effect=slow_init_internal) as mock_method:

            # Launch two concurrent init_db calls
            task1 = asyncio.create_task(db.init_db())
            task2 = asyncio.create_task(db.init_db())

            await asyncio.gather(task1, task2)

            # Verify called exactly once
            assert call_count == 1, f"Expected 1 call, got {call_count}"
            assert mock_method.call_count == 1

@pytest.mark.asyncio
async def test_ensure_initialized_concurrency():
    """
    Verify that concurrent calls to ensure_initialized work correctly and do not deadlock.
    """
    with patch('core.database.settings') as mock_settings:
        mock_settings.database_url = "sqlite+aiosqlite:///:memory:"

        db = DatabaseManager()

        # Mock create_tables to avoid actual DB ops and errors
        # create_tables is async
        async def mock_create_tables():
            pass

        db.create_tables = mock_create_tables

        call_count = 0
        async def slow_init_internal():
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.1)
            db.engine = MagicMock()
            db.async_session_maker = MagicMock()

        with patch.object(db, '_init_db_internal', side_effect=slow_init_internal) as mock_method:

            # Launch two concurrent ensure_initialized calls
            task1 = asyncio.create_task(db.ensure_initialized())
            task2 = asyncio.create_task(db.ensure_initialized())

            await asyncio.gather(task1, task2)

            assert call_count == 1, f"Expected 1 call, got {call_count}"
            assert mock_method.call_count == 1
