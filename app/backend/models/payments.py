from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class Payments(Base):
    __tablename__ = "payments"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    affiliate_id = Column(String, nullable=False)
    consignment_id = Column(Integer, nullable=True)
    amount = Column(Float, nullable=False)
    payment_type = Column(String, nullable=False)
    payment_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)