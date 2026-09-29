from datetime import datetime, timezone, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models.user import User, UserRole
from app.db.models.document import Document
from app.schemas.document import (
    DocumentResponse, SignedUrlResponse, IntegrityCheckResponse,
    DigiLockerPullRequest, ExpiringDocumentsResponse
)
from app.services.storage_service import StorageService
from app.services.clamav_scanner import ClamAvScannerService
from app.services.watermark_service import WatermarkService
from app.services.digilocker_service import DigiLockerPullService
from app.core.audit import record_audit_log

router = APIRouter()

ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
]
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10 Megabytes

def _attach_signed_urls(doc: Document, user_id: str) -> dict:
    preview_token = StorageService.generate_signed_token(doc.id, user_id, action="preview", expiry_seconds=900)
    download_token = StorageService.generate_signed_token(doc.id, user_id, action="download", expiry_seconds=900)
    
    preview_url = f"/api/v1/documents/{doc.id}/preview?{preview_token['query_string']}"
    download_url = f"/api/v1/documents/{doc.id}/download?{download_token['query_string']}"
    
    return {
        "signed_preview_url": preview_url,
        "signed_download_url": download_url
    }

def _to_document_response(doc: Document, user_id: str) -> DocumentResponse:
    signed_urls = _attach_signed_urls(doc, user_id)
    return DocumentResponse(
        id=str(doc.id),
        student_id=str(doc.student_id),
        application_id=str(doc.application_id) if doc.application_id else None,
        document_category=doc.document_category,
        original_filename=doc.original_filename,
        file_size_bytes=doc.file_size_bytes,
        mime_type=doc.mime_type,
        sha256_hash=doc.sha256_hash,
        is_encrypted=doc.is_encrypted,
        scan_status=doc.scan_status,
        scan_notes=doc.scan_notes,
        version=doc.version,
        is_active=doc.is_active,
        parent_document_id=str(doc.parent_document_id) if doc.parent_document_id else None,
        issued_date=doc.issued_date,
        expiry_date=doc.expiry_date,
        is_expired=doc.is_expired,
        source=doc.source,
        digilocker_uri=doc.digilocker_uri,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        signed_preview_url=signed_urls["signed_preview_url"],
        signed_download_url=signed_urls["signed_download_url"],
    )

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_category: str = Form(...),
    application_id: Optional[str] = Form(None),
    issued_date: Optional[date] = Form(None),
    expiry_date: Optional[date] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Features 27, 28, 29, 30, 31, 32, 34:
    Multi-format document upload with ClamAV scanning, SHA-256 integrity,
    AES-256 encryption at rest, automatic versioning, and validity tracking.
    """
    # 1. Format validation (Feature 27)
    content_type = file.content_type or "application/octet-stream"
    if content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{content_type}'. Permitted formats: PDF, JPG, PNG, WEBP."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum permitted limit of 10 MB."
        )
    if len(file_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    # 2. Virus & Malware Scanning via ClamAV (Feature 29)
    scan_res = ClamAvScannerService.scan_file_bytes(file_bytes, file.filename)
    if not scan_res["is_clean"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security scan rejected file: {scan_res['threat_name']} ({scan_res['details']})"
        )

    # 3. Income certificate validity handling (Feature 34)
    today = date.today()
    if document_category == "INCOME_CERTIFICATE" and not expiry_date:
        base_date = issued_date if issued_date else today
        expiry_date = base_date + timedelta(days=365) # Valid for 1 year

    is_expired = False
    if expiry_date and expiry_date < today:
        is_expired = True

    # 4. Versioning check (Feature 32)
    # Check if a previous active version exists for this user, category, and application
    existing_query = db.query(Document).filter(
        Document.student_id == current_user.id,
        Document.document_category == document_category,
        Document.is_active == True
    )
    if application_id:
        existing_query = existing_query.filter(Document.application_id == application_id)
    prev_doc = existing_query.order_by(Document.version.desc()).first()

    next_version = 1
    parent_id = None
    if prev_doc:
        next_version = prev_doc.version + 1
        parent_id = prev_doc.id
        # Mark previous version as inactive (historical)
        prev_doc.is_active = False

    # 5. Encrypt at rest and store in vault (Features 28 & 30)
    store_meta = StorageService.encrypt_and_store(
        file_bytes=file_bytes,
        filename=file.filename,
        student_id=current_user.id
    )

    new_doc = Document(
        student_id=current_user.id,
        application_id=application_id,
        document_category=document_category,
        original_filename=file.filename,
        storage_path=store_meta["storage_path"],
        file_size_bytes=store_meta["file_size_bytes"],
        mime_type=content_type,
        sha256_hash=store_meta["sha256_hash"],
        is_encrypted=True,
        encryption_iv=store_meta["encryption_iv"],
        scan_status="CLEAN",
        scan_notes=scan_res["details"],
        version=next_version,
        is_active=True,
        parent_document_id=parent_id,
        issued_date=issued_date,
        expiry_date=expiry_date,
        is_expired=is_expired,
        source="DIRECT_UPLOAD"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    record_audit_log(
        db, action="DOCUMENT_UPLOADED", resource_type="DOCUMENT",
        user_id=current_user.id, resource_id=new_doc.id,
        details={
            "category": document_category,
            "filename": file.filename,
            "version": next_version,
            "sha256": store_meta["sha256_hash"][:16]
        }
    )

    return _to_document_response(new_doc, current_user.id)

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    category: Optional[str] = None,
    application_id: Optional[str] = None,
    include_history: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Features 31 & 32: List student documents with 15-minute signed access URLs."""
    query = db.query(Document)
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Document.student_id == current_user.id)
    
    if not include_history:
        query = query.filter(Document.is_active == True)
        
    if category:
        query = query.filter(Document.document_category == category)
    if application_id:
        query = query.filter(Document.application_id == application_id)
        
    docs = query.order_by(Document.created_at.desc()).all()
    return [_to_document_response(d, current_user.id) for d in docs]

@router.get("/expiring-soon", response_model=ExpiringDocumentsResponse)
def get_expiring_documents(
    days: int = Query(30, description="Window in days to check for expiring certificates"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 34:
    Tracks certificate validity (e.g. Income certificates) and flags those expiring within 30 days.
    """
    today = date.today()
    threshold = today + timedelta(days=days)
    
    query = db.query(Document).filter(
        Document.student_id == current_user.id,
        Document.is_active == True,
        Document.expiry_date != None,
        Document.expiry_date <= threshold
    )
    docs = query.order_by(Document.expiry_date.asc()).all()
    results = [_to_document_response(d, current_user.id) for d in docs]
    return ExpiringDocumentsResponse(count=len(results), expiring_documents=results)

@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document_details(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if current_user.role == UserRole.STUDENT and doc.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    return _to_document_response(doc, current_user.id)

@router.get("/{doc_id}/signed-url", response_model=SignedUrlResponse)
def get_signed_url(
    doc_id: str,
    action: str = Query("preview", pattern="^(preview|download)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 28: Generate signed URL valid for exactly 15 minutes."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if current_user.role == UserRole.STUDENT and doc.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    token_meta = StorageService.generate_signed_token(doc.id, current_user.id, action=action, expiry_seconds=900)
    endpoint = "preview" if action == "preview" else "download"
    full_url = f"/api/v1/documents/{doc.id}/{endpoint}?{token_meta['query_string']}"
    
    return SignedUrlResponse(
        document_id=doc.id,
        action=action,
        url=full_url,
        expires_at=token_meta["expires"],
        expires_in_seconds=900
    )

@router.get("/{doc_id}/preview")
def preview_document(
    doc_id: str,
    token: Optional[str] = None,
    expires: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Features 28, 33, 36:
    In-browser viewer endpoint with signed token validation and dynamic watermarking.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    # Verify 15-minute signed token (Feature 28)
    if not token or not expires or not StorageService.verify_signed_token(doc.id, doc.student_id, "preview", token, expires):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Signed access token has expired or is invalid.")

    # Retrieve and decrypt (Feature 28 & 30)
    try:
        raw_bytes = StorageService.retrieve_and_decrypt(doc.storage_path, doc.sha256_hash)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Storage retrieval failed: {str(e)}")

    # Apply dynamic security watermark (Feature 36)
    watermarked_bytes = WatermarkService.apply_watermark(
        file_bytes=raw_bytes,
        mime_type=doc.mime_type,
        user_identifier=f"Student-{doc.student_id[:8]}"
    )

    return Response(
        content=watermarked_bytes,
        media_type=doc.mime_type,
        headers={
            "Content-Disposition": f"inline; filename=Watermarked_{doc.original_filename}",
            "Cache-Control": "private, max-age=300"
        }
    )

@router.get("/{doc_id}/download")
def download_document(
    doc_id: str,
    token: Optional[str] = None,
    expires: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Features 24, 28, 36:
    Secure document download attachment with 15-minute signed token and security watermark.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if not token or not expires or not StorageService.verify_signed_token(doc.id, doc.student_id, "download", token, expires):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Download authorization expired or signature invalid.")

    try:
        raw_bytes = StorageService.retrieve_and_decrypt(doc.storage_path, doc.sha256_hash)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Decryption error: {str(e)}")

    watermarked_bytes = WatermarkService.apply_watermark(
        file_bytes=raw_bytes,
        mime_type=doc.mime_type,
        user_identifier=f"User-{doc.student_id[:8]}"
    )

    return Response(
        content=watermarked_bytes,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename=ST_Portal_{doc.original_filename}"
        }
    )

@router.get("/{doc_id}/verify-integrity", response_model=IntegrityCheckResponse)
def verify_document_integrity(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 30:
    Verifies that the decrypted file on disk exactly matches its cryptographic SHA-256 hash.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if current_user.role == UserRole.STUDENT and doc.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    try:
        decrypted_bytes = StorageService.retrieve_and_decrypt(doc.storage_path)
        computed_hash = StorageService.compute_sha256(decrypted_bytes)
        is_valid = computed_hash.lower() == doc.sha256_hash.lower()
    except Exception:
        computed_hash = "ERROR_READING_PAYLOAD"
        is_valid = False

    return IntegrityCheckResponse(
        document_id=doc.id,
        stored_sha256=doc.sha256_hash,
        computed_sha256=computed_hash,
        is_valid=is_valid,
        verified_at=datetime.now(timezone.utc)
    )

@router.delete("/{doc_id}")
def delete_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 32: Soft-delete document from student portal."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if current_user.role == UserRole.STUDENT and doc.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    doc.is_active = False
    db.commit()

    record_audit_log(
        db, action="DOCUMENT_DELETED", resource_type="DOCUMENT",
        user_id=current_user.id, resource_id=doc.id,
        details={"filename": doc.original_filename, "category": doc.document_category}
    )

    return {"message": f"Document {doc.original_filename} successfully removed (soft-deleted)."}

@router.post("/digilocker-pull", response_model=DocumentResponse)
def pull_from_digilocker(
    req: DigiLockerPullRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 35:
    One-click pull of verified ST Caste Certificate or Income Certificate from DigiLocker gateway.
    """
    if req.document_category not in ["CASTE_CERTIFICATE", "INCOME_CERTIFICATE"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DigiLocker direct pull is currently enabled for CASTE_CERTIFICATE and INCOME_CERTIFICATE."
        )

    student_name = current_user.student_profile.full_name if (current_user.student_profile and current_user.student_profile.full_name) else "ST Student Beneficiary"
    digi_data = DigiLockerPullService.pull_verified_certificate(
        student_name=student_name,
        doc_category=req.document_category
    )

    # Encrypt and store into vault (Feature 28 & 30)
    store_meta = StorageService.encrypt_and_store(
        file_bytes=digi_data["file_bytes"],
        filename=digi_data["original_filename"],
        student_id=current_user.id
    )

    # Manage versioning (Feature 32)
    existing_query = db.query(Document).filter(
        Document.student_id == current_user.id,
        Document.document_category == req.document_category,
        Document.is_active == True
    )
    if req.application_id:
        existing_query = existing_query.filter(Document.application_id == req.application_id)
    prev_doc = existing_query.order_by(Document.version.desc()).first()

    next_version = 1
    parent_id = None
    if prev_doc:
        next_version = prev_doc.version + 1
        parent_id = prev_doc.id
        prev_doc.is_active = False

    new_doc = Document(
        student_id=current_user.id,
        application_id=req.application_id,
        document_category=req.document_category,
        original_filename=digi_data["original_filename"],
        storage_path=store_meta["storage_path"],
        file_size_bytes=store_meta["file_size_bytes"],
        mime_type=digi_data["mime_type"],
        sha256_hash=store_meta["sha256_hash"],
        is_encrypted=True,
        encryption_iv=store_meta["encryption_iv"],
        scan_status="CLEAN",
        scan_notes="DigiLocker digitally signed certificate • Verified Issuer",
        version=next_version,
        is_active=True,
        parent_document_id=parent_id,
        issued_date=digi_data["issued_date"],
        expiry_date=digi_data["expiry_date"],
        is_expired=False,
        source="DIGILOCKER_FETCH",
        digilocker_uri=digi_data["digilocker_uri"]
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    record_audit_log(
        db, action="DIGILOCKER_DOCUMENT_PULLED", resource_type="DOCUMENT",
        user_id=current_user.id, resource_id=new_doc.id,
        details={
            "category": req.document_category,
            "digilocker_uri": digi_data["digilocker_uri"]
        }
    )

    return _to_document_response(new_doc, current_user.id)
