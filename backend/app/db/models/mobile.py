import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class OfflineSyncQueue(Base):
    __tablename__ = "offline_sync_queue"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String(100), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    idempotency_token = Column(String(100), unique=True, nullable=False, index=True)
    entity_type = Column(String(50), nullable=False) # 'APPLICATION_DRAFT', 'GRIEVANCE', 'DOCUMENT_UPLOAD'
    action = Column(String(50), nullable=False) # 'CREATE', 'UPDATE', 'SUBMIT'
    payload = Column(JSON, nullable=False)
    sync_status = Column(String(30), default="PENDING", index=True) # 'PENDING', 'SYNCED', 'CONFLICT', 'FAILED'
    error_message = Column(Text, nullable=True)
    client_timestamp = Column(DateTime, nullable=True)
    synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class BiometricCredential(Base):
    __tablename__ = "biometric_credentials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    credential_id = Column(String(255), unique=True, nullable=False, index=True)
    public_key = Column(Text, nullable=False)
    sign_counter = Column(Integer, default=0)
    device_name = Column(String(100), nullable=True)
    attestation_type = Column(String(50), default="none")
    aaguid = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)

    user = relationship("User")
