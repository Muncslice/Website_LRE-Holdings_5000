"""
Seed script to populate database with sample data for testing.
Run this after database tables are created.
"""
import asyncio
from datetime import datetime, timedelta
import random

# This would use the actual database connection
# For now, this is a template showing the data structure

SAMPLE_USERS = [
    {
        "id": "admin-001",
        "role": "admin",
        "status": "active",
        "full_name": "Admin User",
        "phone": "+1-555-0100",
    },
    {
        "id": "affiliate-001",
        "role": "affiliate",
        "status": "active",
        "full_name": "John Reseller",
        "phone": "+1-555-0101",
    },
    {
        "id": "affiliate-002",
        "role": "affiliate",
        "status": "active",
        "full_name": "Jane Merchant",
        "phone": "+1-555-0102",
    },
    {
        "id": "driver-001",
        "role": "driver",
        "status": "active",
        "full_name": "Mike Driver",
        "phone": "+1-555-0103",
    },
]

SAMPLE_INVENTORY = [
    {
        "sku": "WH-001",
        "product_name": "Industrial Safety Helmet",
        "description": "High-impact resistant safety helmet with adjustable straps",
        "category": "Safety Equipment",
        "unit_cost": 25.00,
        "retail_price": 49.99,
        "status": "WAREHOUSE",
        "location": "A-12-3",
        "barcode": "7891234567890",
    },
    {
        "sku": "WH-002",
        "product_name": "Heavy Duty Work Gloves",
        "description": "Cut-resistant work gloves, size L",
        "category": "Safety Equipment",
        "unit_cost": 12.00,
        "retail_price": 24.99,
        "status": "WAREHOUSE",
        "location": "A-12-4",
        "barcode": "7891234567891",
    },
    {
        "sku": "WH-003",
        "product_name": "Safety Vest - Orange",
        "description": "High-visibility safety vest with reflective strips",
        "category": "Safety Equipment",
        "unit_cost": 8.00,
        "retail_price": 16.99,
        "status": "CONSIGNED",
        "location": "affiliate-001",
        "barcode": "7891234567892",
    },
    {
        "sku": "WH-004",
        "product_name": "Steel Toe Boots",
        "description": "OSHA-compliant steel toe work boots, size 10",
        "category": "Footwear",
        "unit_cost": 45.00,
        "retail_price": 89.99,
        "status": "WAREHOUSE",
        "location": "B-05-2",
        "barcode": "7891234567893",
    },
    {
        "sku": "WH-005",
        "product_name": "Tool Belt",
        "description": "Heavy-duty leather tool belt with multiple pockets",
        "category": "Tools",
        "unit_cost": 30.00,
        "retail_price": 59.99,
        "status": "CONSIGNED",
        "location": "affiliate-002",
        "barcode": "7891234567894",
    },
]

SAMPLE_CONSIGNMENTS = [
    {
        "affiliate_id": "affiliate-001",
        "inventory_id": 3,
        "quantity": 50,
        "consigned_date": datetime.now() - timedelta(days=10),
        "status": "CONFIRMED",
        "notes": "Initial consignment batch",
    },
    {
        "affiliate_id": "affiliate-002",
        "inventory_id": 5,
        "quantity": 30,
        "consigned_date": datetime.now() - timedelta(days=5),
        "status": "CONFIRMED",
        "notes": "Spring inventory",
    },
]

SAMPLE_DELIVERIES = [
    {
        "driver_id": "driver-001",
        "consignment_id": 1,
        "delivery_address": "123 Industrial Park Dr, Los Angeles, CA 90001",
        "scheduled_date": datetime.now() + timedelta(hours=2),
        "status": "PENDING",
        "route_priority": 1,
        "notes": "Call upon arrival",
    },
    {
        "driver_id": "driver-001",
        "consignment_id": 2,
        "delivery_address": "456 Commerce Blvd, Los Angeles, CA 90002",
        "scheduled_date": datetime.now() + timedelta(hours=4),
        "status": "PENDING",
        "route_priority": 2,
        "notes": "Dock access available",
    },
]

SAMPLE_PAYMENTS = [
    {
        "affiliate_id": "affiliate-001",
        "consignment_id": 1,
        "amount": 1249.75,
        "payment_type": "SALE",
        "payment_date": datetime.now() - timedelta(days=2),
        "status": "COMPLETED",
        "notes": "25 units sold",
    },
    {
        "affiliate_id": "affiliate-002",
        "consignment_id": 2,
        "amount": 899.85,
        "payment_type": "SALE",
        "payment_date": datetime.now() - timedelta(days=1),
        "status": "COMPLETED",
        "notes": "15 units sold",
    },
]

async def seed_database():
    """
    Seed the database with sample data.
    This is a template - actual implementation would use BackendManager.
    """
    print("Seeding database with sample data...")
    print(f"Users: {len(SAMPLE_USERS)}")
    print(f"Inventory: {len(SAMPLE_INVENTORY)}")
    print(f"Consignments: {len(SAMPLE_CONSIGNMENTS)}")
    print(f"Deliveries: {len(SAMPLE_DELIVERIES)}")
    print(f"Payments: {len(SAMPLE_PAYMENTS)}")
    print("\nSample data structure ready for insertion.")

if __name__ == "__main__":
    asyncio.run(seed_database())