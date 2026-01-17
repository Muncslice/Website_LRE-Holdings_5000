from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class Deliveries(Base):
    __tablename__ = "deliveries"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    driver_id = Column(String, nullable=False)
    consignment_id = Column(Integer, nullable=False)
    delivery_address = Column(String, nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False)
    route_priority = Column(Integer, nullable=False)
    signature_url = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)