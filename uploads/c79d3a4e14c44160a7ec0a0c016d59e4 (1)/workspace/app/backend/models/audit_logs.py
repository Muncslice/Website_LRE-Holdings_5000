from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class Audit_logs(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    table_name = Column(String, nullable=False)
    record_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    old_data = Column(String, nullable=True)
    new_data = Column(String, nullable=False)
    user_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)