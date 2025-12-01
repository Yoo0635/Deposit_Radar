from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint
from backend.app.database.config import Base


class ProcessedNotificationORM(Base):
    """처리된 알림을 저장하는 테이블 (중복 방지용)"""
    __tablename__ = "processed_notifications"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('notification_id', name='uq_notification_id'),
    )

