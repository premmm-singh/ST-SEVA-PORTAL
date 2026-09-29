from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User
from app.api.deps import get_current_user, get_current_user_optional, require_roles
from app.services.vapt_service import VaptService
from app.schemas.vapt import (
    SecurityHeadersReport,
    InputSanitizationProbe,
    MerkleInclusionProofRequest,
    MerkleInclusionProofResponse,
    VaptScanRequest,
    VaptScanResponse,
    SessionAnomalyCheckRequest,
    SessionAnomalyCheckResponse
)

router = APIRouter()

# F-145: OWASP Top-10 & CERT-In Compliance Guardrails
@router.get("/headers/status", response_model=SecurityHeadersReport)
def get_security_headers_status():
    """Retrieve CERT-In and OWASP compliant security headers configuration."""
    return VaptService.get_security_headers_status()

@router.post("/sanitize/probe", response_model=InputSanitizationProbe)
def test_input_sanitization(
    payload: str = Query(..., description="String payload to test"),
    injection_type: str = Query("SQLI", description="SQLI, XSS, or PATH_TRAVERSAL")
):
    """Test input sanitization and payload filtration guardrails against injection."""
    return VaptService.sanitize_input(payload, injection_type)

# F-146: Anti-Tamper Immutable Hash Chains & Merkle Trees for Audit Trails
@router.post("/merkle/record-leaf", response_model=MerkleInclusionProofResponse)
def record_merkle_leaf(
    request: MerkleInclusionProofRequest,
    db: Session = Depends(get_db)
):
    """Record an audit log / sanction order into the immutable Merkle tree chain."""
    return VaptService.record_and_prove_merkle_leaf(db, request)

@router.get("/merkle/verify/{record_id}")
def verify_merkle_node(
    record_id: str,
    db: Session = Depends(get_db)
):
    """Verify zero-tamper inclusion and cryptographic root hash for a recorded entity."""
    return VaptService.verify_merkle_node(db, record_id)

# F-147: Automated Vulnerability & Penetration Testing (VAPT) Simulation Testbed
@router.post("/scan/run", response_model=VaptScanResponse)
def run_vapt_scan(
    request: VaptScanRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Execute automated penetration scan testbed against OWASP Top-10 vectors."""
    return VaptService.run_vapt_audit(db, current_user, request)

# F-148: Session Hijacking Defense, IP Roaming Anomaly Detection & Adaptive Step-Up Auth
@router.post("/sessions/anomaly-check", response_model=SessionAnomalyCheckResponse)
def check_session_anomaly(
    request: SessionAnomalyCheckRequest,
    db: Session = Depends(get_db)
):
    """Analyze geographic dislocation and IP roaming anomaly to enforce MFA step-up."""
    return VaptService.evaluate_session_anomaly(db, request)
