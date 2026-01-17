from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class Consignments(Base):
    __tablename__ = "consignments"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    affiliate_id = Column(String, nullable=False)
    inventory_id = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    consigned_date = Column(DateTime(timezone=True), nullable=True)
    return_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)