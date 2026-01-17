from core.database import Base
from sqlalchemy import Column, DateTime, String


class Users_extended(Base):
    __tablename__ = "users_extended"
    __table_args__ = {"extend_existing": True}

    id = Column(String, primary_key=True, index=True, nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)