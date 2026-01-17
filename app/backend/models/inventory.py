from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    sku = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True)
    unit_cost = Column(Float, nullable=False)
    retail_price = Column(Float, nullable=False)
    status = Column(String, nullable=False)
    location = Column(String, nullable=True)
    barcode = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)