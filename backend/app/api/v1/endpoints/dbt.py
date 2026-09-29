from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User, UserRole
from app.api.deps import get_current_user, require_roles
from app.services.dbt_service import DbtService
from app.db.models.dbt import PaymentBatch, DisbursementTransaction, TreasuryBill
from app.schemas.dbt import (
    PennyDropRequest,
    PennyDropResponse,
    NpciSeedingResponse,
    BatchCreateRequest,
    PaymentBatchResponse,
    PaymentBatchDetailResponse,
    DisbursementTransactionResponse,
    TreasuryBillCreateRequest,
    TreasuryBillResponse,
    RetryTransactionRequest,
    ReverseTransactionRequest,
    UpiPaymentInitiateRequest,
    UpiPaymentResponse,
    TreasuryLedgerResponse
)

router = APIRouter()

OFFICER_ROLES = [UserRole.OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]

# ==========================================
# F-72 & F-73: Penny Drop & NPCI APBS Checks
# ==========================================

@router.post("/penny-drop/verify", response_model=PennyDropResponse)
def verify_penny_drop(
    payload: PennyDropRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """F-73: Execute real-time Penny Drop validation with name similarity matching."""
    try:
        record = DbtService.perform_penny_drop_verification(
            db=db,
            student_id=current_user.id,
            account_number=payload.account_number,
            ifsc_code=payload.ifsc_code,
            entered_name=payload.entered_name,
            application_id=payload.application_id
        )
        return record
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/npci/seeding-status", response_model=NpciSeedingResponse)
def get_npci_seeding_status(
    aadhaar_number: str = Query(..., min_length=4, max_length=16),
    current_user: User = Depends(get_current_user)
) -> Any:
    """F-72: Query NPCI bank account seeding mapper."""
    return DbtService.verify_npci_aadhaar_seeding(aadhaar_number)

# ==========================================
# F-74, F-75, F-76: Payment Batch Generator
# ==========================================

@router.post("/batches/generate", response_model=PaymentBatchResponse)
def generate_payment_batch(
    payload: BatchCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-74, F-75, F-76: Generate Payment Batch with Split Payment (Tuition & Maintenance) and Tranches."""
    try:
        batch = DbtService.generate_payment_batch(
            db=db,
            scheme_id=payload.scheme_id,
            cycle_id=payload.cycle_id,
            officer_id=current_user.id,
            tranche_number=payload.tranche_number,
            tranche_percentage=payload.tranche_percentage,
            split_enabled=payload.split_enabled
        )
        return batch
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate payment batch: {str(e)}")

@router.get("/batches", response_model=List[PaymentBatchResponse])
def list_payment_batches(
    scheme_id: Optional[str] = None,
    cycle_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """List all DBT payment batches."""
    query = db.query(PaymentBatch)
    if scheme_id:
        query = query.filter(PaymentBatch.scheme_id == scheme_id)
    if cycle_id:
        query = query.filter(PaymentBatch.cycle_id == cycle_id)
    return query.order_by(PaymentBatch.created_at.desc()).all()

@router.get("/batches/{batch_id}", response_model=PaymentBatchDetailResponse)
def get_payment_batch_detail(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """Retrieve detailed payment batch with its transaction breakdown."""
    batch = db.query(PaymentBatch).filter(PaymentBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Payment batch not found")
    return batch

# ==========================================
# F-71: PFMS Dispatch & Bank Reconciliation
# ==========================================

@router.post("/batches/{batch_id}/dispatch-pfms", response_model=PaymentBatchResponse)
def dispatch_batch_to_pfms(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-71: Dispatch payment batch to PFMS."""
    try:
        return DbtService.dispatch_batch_to_pfms(db=db, batch_id=batch_id, officer_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/batches/{batch_id}/reconcile", response_model=PaymentBatchResponse)
def reconcile_batch(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-71, F-80: Poll and reconcile bank credit responses and generate RBI UTR numbers."""
    try:
        return DbtService.reconcile_pfms_batch(db=db, batch_id=batch_id, officer_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# F-78 & F-79: Retry & Reversal
# ==========================================

@router.post("/transactions/{transaction_id}/retry", response_model=DisbursementTransactionResponse)
def retry_transaction(
    transaction_id: str,
    payload: RetryTransactionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-78: Retry failed transaction with alternative or updated bank account details."""
    try:
        return DbtService.retry_failed_transaction(
            db=db,
            transaction_id=transaction_id,
            new_account_number=payload.new_account_number,
            new_ifsc=payload.new_ifsc,
            officer_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/transactions/{transaction_id}/reverse", response_model=DisbursementTransactionResponse)
def reverse_transaction(
    transaction_id: str,
    payload: ReverseTransactionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-79: Reverse disbursement and recover budget due to ineligible sanction or error."""
    try:
        return DbtService.reverse_disbursement_transaction(
            db=db,
            transaction_id=transaction_id,
            reason=payload.reason,
            officer_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# F-82: Form TR-27 Treasury Bill Generation
# ==========================================

@router.post("/batches/{batch_id}/treasury-bill", response_model=TreasuryBillResponse)
def generate_treasury_bill(
    batch_id: str,
    payload: TreasuryBillCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-82: Generate Form TR-27 Treasury Bill with SHA-256 digital sign-off."""
    try:
        bill = DbtService.generate_treasury_bill(
            db=db,
            batch_id=batch_id,
            district=payload.district,
            officer_id=current_user.id
        )
        return bill
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/treasury-bills/{batch_id}", response_model=Optional[TreasuryBillResponse])
def get_treasury_bill_by_batch(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    bill = db.query(TreasuryBill).filter(TreasuryBill.batch_id == batch_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Treasury bill not found for this batch")
    return bill

# ==========================================
# F-77: State Treasury Head of Account Ledger
# ==========================================

@router.get("/treasury-ledger", response_model=TreasuryLedgerResponse)
def get_treasury_ledger(
    financial_year: str = "2026-2027",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-77: View Treasury Major/Minor Head budget allocation and expenditure."""
    return DbtService.get_or_create_treasury_ledger(db, financial_year)

# ==========================================
# F-80: Student Real-Time DBT Tracking
# ==========================================

@router.get("/student/my-dbt-timeline")
def get_my_dbt_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """F-80: UMANG-style real-time DBT tracking vertical timeline for authenticated student."""
    return DbtService.get_student_dbt_tracking(db=db, student_id=current_user.id)

# ==========================================
# F-81: Payment Gateway / UPI Mock Adapter
# ==========================================

@router.post("/upi/initiate-refund", response_model=UpiPaymentResponse)
def initiate_upi_refund_payment(
    payload: UpiPaymentInitiateRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """F-81: Generate UPI Intent URI and QR code payload for scholarship refunds/recovery."""
    return DbtService.initiate_upi_payment_recovery(
        student_id=current_user.id,
        amount=payload.amount,
        purpose=payload.purpose
    )

# ==========================================
# F-83: CAG Compliance Export
# ==========================================

@router.get("/audit/cag-compliance-export")
def get_cag_compliance_export(
    financial_year: str = "2026-2027",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-83: Comptroller and Auditor General (CAG) compliance audit export with cryptographic hash seal."""
    return DbtService.export_cag_compliance_data(db=db, financial_year=financial_year)
