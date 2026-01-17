from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class Issues(Base):
    __tablename__ = "issues"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    affiliate_id = Column(String, nullable=False)
    inventory_id = Column(Integer, nullable=False)
    issue_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    photo_url = Column(String, nullable=True)
    status = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)