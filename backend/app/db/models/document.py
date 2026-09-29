import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(String, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Feature 31: Document categorization
    # CASTE_CERTIFICATE, INCOME_CERTIFICATE, MARKSHEET, DOMICILE_CERTIFICATE, BANK_PASSBOOK, FEE_RECEIPT, DISABILITY_CERTIFICATE
    document_category = Column(String, nullable=False, index=True)
    
    # File properties & Feature 27: Multi-format upload
    original_filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    
    # Feature 30: File integrity
    sha256_hash = Column(String(64), nullable=False, index=True)
    
    # Feature 28: Secure storage encrypted at rest (AES-256)
    is_encrypted = Column(Boolean, default=True, nullable=False)
    encryption_iv = Column(String, nullable=False)
    
    # Feature 29: Virus/malware scanning
    scan_status = Column(String, default="CLEAN", nullable=False) # PENDING, CLEAN, INFECTED
    scan_notes = Column(String, nullable=True)
    
    # Feature 32: Document versioning & soft delete
    version = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True) # Soft delete
    parent_document_id = Column(String, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    
    # Feature 34: Document expiry tracking
    issued_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True, index=True)
    is_expired = Column(Boolean, default=False, nullable=False)
    
    # Feature 35: DigiLocker document pull
    source = Column(String, default="DIRECT_UPLOAD", nullable=False) # DIRECT_UPLOAD, DIGILOCKER_FETCH
    digilocker_uri = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("User", backref="documents")
    application = relationship("Application", backref="documents")
    versions = relationship("Document", backref="parent_document", remote_side=[id])
