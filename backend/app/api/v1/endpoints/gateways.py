from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User, UserRole
from app.api.deps import get_current_user, require_roles
from app.services.gateway_service import GatewayService
from app.schemas.gateways import (
    DigiLockerPullRequest,
    DigiLockerPullResponse,
    AadhaarTokenizeRequest,
    AadhaarTokenizeResponse,
    NpciSyncMapperRequest,
    NpciSyncMapperResponse,
    NpciStatusLookupResponse,
    PfmsBatchDispatchRequest,
    PfmsBatchDispatchResponse,
    AisheVerificationResponse,
    AcademicMarksVerifyRequest,
    AcademicMarksVerifyResponse,
    JharSewaCertificateVerifyRequest,
    JharSewaCertificateVerifyResponse,
    UmangSsoExchangeRequest,
    UmangSsoExchangeResponse,
    WebhookSubscribeRequest,
    WebhookSubscriptionResponse,
    WebhookDispatchLogResponse,
    RateLimitCheckResponse
)

router = APIRouter()

OFFICER_ADMIN_ROLES = [UserRole.OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]

# F-129: DigiLocker NeGD Gateway
@router.post("/digilocker/pull-document", response_model=DigiLockerPullResponse)
def pull_digilocker_document(payload: DigiLockerPullRequest) -> Any:
    return GatewayService.pull_digilocker_document(
        uri=payload.uri,
        consent_artifact_id=payload.consent_artifact_id
    )

# F-130: UIDAI Aadhaar Vault & Tokenization Engine
@router.post("/aadhaar/tokenize", response_model=AadhaarTokenizeResponse)
def tokenize_aadhaar(
    payload: AadhaarTokenizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    try:
        return GatewayService.tokenize_aadhaar_vault(
            db=db,
            user_id=current_user.id,
            raw_aadhaar=payload.raw_aadhaar_number
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# F-131: NPCI Aadhaar Payment Bridge (APB) Mapper Ingestion
@router.post("/npci/sync-mapper", response_model=NpciSyncMapperResponse, status_code=status.HTTP_201_CREATED)
def sync_npci_mapper(
    payload: NpciSyncMapperRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ADMIN_ROLES))
) -> Any:
    records_dict = [r.model_dump() for r in payload.records]
    return GatewayService.sync_npci_mapper_batch(
        db=db,
        batch_reference=payload.batch_reference,
        records=records_dict
    )

@router.get("/npci/lookup/{vault_token}", response_model=NpciStatusLookupResponse)
def lookup_npci_status(
    vault_token: str,
    db: Session = Depends(get_db)
) -> Any:
    record = GatewayService.lookup_npci_mapper_status(db=db, vault_token=vault_token)
    if not record:
        raise HTTPException(status_code=404, detail="No NPCI bank seeding record found for this token.")
    return record

# F-132: PFMS Core XML Exchange & Digital Signature (DSC)
@router.post("/pfms/dispatch-batch", response_model=PfmsBatchDispatchResponse)
def dispatch_pfms_batch(
    payload: PfmsBatchDispatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ADMIN_ROLES))
) -> Any:
    return GatewayService.dispatch_pfms_batch(
        db=db,
        batch_id=payload.batch_id,
        dsc_token_id=payload.dsc_token_id
    )

# F-133: AISHE Master Directory Sync & College Verification API
@router.get("/aishe/verify/{aishe_code}", response_model=AisheVerificationResponse)
def verify_aishe_institution(
    aishe_code: str,
    db: Session = Depends(get_db)
) -> Any:
    return GatewayService.verify_aishe_code(db=db, aishe_code=aishe_code)

# F-134: Academic Examination Boards (CBSE/JAC) e-Marksheet Webhooks
@router.post("/academic/verify-marks", response_model=AcademicMarksVerifyResponse)
def verify_academic_marks(payload: AcademicMarksVerifyRequest) -> Any:
    return GatewayService.verify_academic_marks(
        board_name=payload.board_name,
        roll_code=payload.roll_code,
        roll_number=payload.roll_number,
        passing_year=payload.passing_year
    )

# F-135: JharSewa / e-District Certificate API
@router.post("/jharsewa/verify-certificate", response_model=JharSewaCertificateVerifyResponse)
def verify_jharsewa_certificate(payload: JharSewaCertificateVerifyRequest) -> Any:
    return GatewayService.verify_jharsewa_certificate(
        certificate_number=payload.certificate_number,
        applicant_name=payload.applicant_name,
        certificate_type=payload.certificate_type
    )

# F-136: UMANG Mobile App REST Gateway & SSO
@router.post("/umang/sso-exchange", response_model=UmangSsoExchangeResponse)
def exchange_umang_sso(
    payload: UmangSsoExchangeRequest,
    db: Session = Depends(get_db)
) -> Any:
    return GatewayService.exchange_umang_sso(
        db=db,
        umang_auth_token=payload.umang_auth_token,
        mobile_number=payload.mobile_number
    )

# F-137: Webhook Subscription Hub & Outbound Event Dispatcher
@router.post("/webhooks/subscribe", response_model=WebhookSubscriptionResponse, status_code=status.HTTP_201_CREATED)
def subscribe_webhook(
    payload: WebhookSubscribeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ADMIN_ROLES))
) -> Any:
    return GatewayService.create_webhook_subscription(
        db=db,
        subscriber_name=payload.subscriber_name,
        target_url=payload.target_url,
        event_types=payload.event_types
    )

@router.get("/webhooks/logs", response_model=List[WebhookDispatchLogResponse])
def get_webhook_logs(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ADMIN_ROLES))
) -> Any:
    return GatewayService.get_webhook_logs(db=db, limit=limit)

# F-138: External API Rate Limiting & DDoS Shield
@router.get("/rate-limit/check", response_model=RateLimitCheckResponse)
def check_rate_limit(request: Request) -> Any:
    client_ip = request.client.host if request.client else "127.0.0.1"
    return GatewayService.check_rate_limit(client_ip=client_ip, endpoint="PUBLIC_PORTAL")
