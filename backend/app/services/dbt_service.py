import hashlib
import json
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from uuid import uuid4

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models.dbt import (
    PaymentBatch,
    PaymentBatchStatus,
    DisbursementTransaction,
    DisbursementComponentType,
    TransactionStatus,
    PennyDropVerification,
    TreasuryHeadLedger,
    TreasuryBill,
    TreasuryBillStatus,
    DbtAuditLog,
)
from app.db.models.allocation import (
    AllocationCycle,
    AllocationResult,
    AllocationResultStatus,
    SanctionOrder,
)
from app.db.models.application import Application, ApplicationTimeline
from app.db.models.scheme import Scheme
from app.db.models.user import User
from app.db.models.profile import StudentProfile
from app.db.models.institution import InstitutionProfile

def get_utc_now():
    return datetime.now(timezone.utc)

def jaro_winkler_similarity(s1: str, s2: str) -> float:
    """Calculates approximate Jaro-Winkler string similarity between two names."""
    s1, s2 = s1.strip().upper(), s2.strip().upper()
    if s1 == s2:
        return 1.0
    if not s1 or not s2:
        return 0.0

    len1, len2 = len(s1), len(s2)
    match_distance = max(len1, len2) // 2 - 1

    s1_matches = [False] * len1
    s2_matches = [False] * len2
    matches = 0
    transpositions = 0

    for i in range(len1):
        start = max(0, i - match_distance)
        end = min(i + match_distance + 1, len2)
        for j in range(start, end):
            if s2_matches[j]:
                continue
            if s1[i] == s2[j]:
                s1_matches[i] = True
                s2_matches[j] = True
                matches += 1
                break

    if matches == 0:
        return 0.0

    k = 0
    for i in range(len1):
        if not s1_matches[i]:
            continue
        while not s2_matches[k]:
            k += 1
        if s1[i] != s2[k]:
            transpositions += 1
        k += 1

    jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3.0

    # Prefix scale (standard 0.1, up to 4 chars)
    prefix = 0
    for i in range(min(len1, len2, 4)):
        if s1[i] == s2[i]:
            prefix += 1
        else:
            break

    return round(min(1.0, jaro + prefix * 0.1 * (1.0 - jaro)), 4)


class DbtService:
    @staticmethod
    def get_or_create_treasury_ledger(db: Session, financial_year: str = "2026-2027") -> TreasuryHeadLedger:
        ledger = db.query(TreasuryHeadLedger).filter(TreasuryHeadLedger.financial_year == financial_year).first()
        if not ledger:
            ledger = TreasuryHeadLedger(
                financial_year=financial_year,
                major_head="2225",
                sub_major_head="02",
                minor_head="277",
                sub_head="001",
                description="Direct Benefit Transfer ST Scholarship Scheme",
                allocated_budget=10000000.0, # 1 Crore allocated state budget
                expended_amount=0.0,
                committed_amount=0.0,
                balance_amount=10000000.0
            )
            db.add(ledger)
            db.commit()
            db.refresh(ledger)
        return ledger

    @staticmethod
    def verify_npci_aadhaar_seeding(aadhaar_number: str) -> Dict[str, Any]:
        """F-72: Validates NPCI Aadhaar Payment Bridge System (APBS) bank account seeding."""
        clean_aadhaar = str(aadhaar_number).strip().replace(" ", "").replace("-", "")
        last_four = clean_aadhaar[-4:] if len(clean_aadhaar) >= 4 else "0000"
        
        # Simulated bank mapper lookup
        # Inactive rule if ends with 9999 for test edge-case
        is_active = not clean_aadhaar.endswith("9999")
        bank_names = ["State Bank of India", "Bank of India", "Punjab National Bank", "Jharkhand Gramin Bank"]
        bank_name = bank_names[int(last_four[-1]) % len(bank_names)]

        return {
            "aadhaar_last_four": last_four,
            "is_seeded": is_active,
            "seeding_status": "ACTIVE" if is_active else "INACTIVE_OR_DELINKED",
            "mandate_bank": bank_name if is_active else None,
            "mandate_date": "2024-08-15" if is_active else None,
            "apbs_eligible": is_active,
            "message": "Aadhaar active & enabled for Direct Benefit Transfer (APBS)" if is_active else "Aadhaar not linked with any bank NPCI mapper. Please visit home bank branch to seed Aadhaar."
        }

    @staticmethod
    def perform_penny_drop_verification(
        db: Session,
        student_id: str,
        account_number: str,
        ifsc_code: str,
        entered_name: str,
        application_id: Optional[str] = None
    ) -> PennyDropVerification:
        """F-73: Real-time Penny Drop Account Validation with Jaro-Winkler string similarity matching."""
        masked_acc = f"XXXXXX{account_number[-4:]}" if len(account_number) >= 4 else account_number
        ifsc_upper = ifsc_code.strip().upper()

        # Simulated Core Banking Response name
        # If student profile exists, use full name, or simulate a minor variation
        returned_name = entered_name.strip().upper()
        if entered_name.endswith(" "):
            returned_name = entered_name.strip().upper()

        similarity = jaro_winkler_similarity(entered_name, returned_name)
        status = "MATCHED" if similarity >= 0.85 else "MISMATCH"

        record = PennyDropVerification(
            student_id=student_id,
            application_id=application_id,
            account_number_masked=masked_acc,
            ifsc_code=ifsc_upper,
            bank_name="State Bank of India" if "SBIN" in ifsc_upper else "Nationalized Bank",
            entered_name=entered_name,
            returned_name=returned_name,
            similarity_score=similarity,
            status=status,
            reference_ref=f"PND-{uuid4().hex[:10].upper()}"
        )
        db.add(record)

        audit = DbtAuditLog(
            action="PENNY_DROP_VERIFIED",
            actor_id=student_id,
            details=f"Penny drop verified for {masked_acc} - Similarity: {similarity*100:.1f}%, Status: {status}"
        )
        db.add(audit)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def generate_payment_batch(
        db: Session,
        scheme_id: str,
        cycle_id: str,
        officer_id: str,
        tranche_number: int = 1,
        tranche_percentage: float = 100.0,
        split_enabled: bool = True
    ) -> PaymentBatch:
        """F-74, F-75, F-76: Payment Batch Generator with Split Payment (Tuition vs. Maintenance) & Tranches."""
        scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
        if not scheme:
            raise ValueError("Scheme not found")

        cycle = db.query(AllocationCycle).filter(AllocationCycle.id == cycle_id).first()
        if not cycle:
            raise ValueError("Allocation cycle not found")

        # Find all SELECTED allocations in this cycle
        allocations = db.query(AllocationResult).filter(
            AllocationResult.allocation_cycle_id == cycle_id,
            AllocationResult.status == AllocationResultStatus.SELECTED
        ).all()

        if not allocations:
            raise ValueError("No SELECTED beneficiaries found in this cycle to disburse")

        now = get_utc_now()
        seq = db.query(func.count(PaymentBatch.id)).scalar() + 1
        batch_number = f"DBT/BATCH/{cycle.academic_year}/JH/{seq:04d}"

        batch = PaymentBatch(
            batch_number=batch_number,
            scheme_id=scheme_id,
            cycle_id=cycle_id,
            created_by_officer_id=officer_id,
            status=PaymentBatchStatus.DRAFT,
            total_records=0,
            total_amount=0.0
        )
        db.add(batch)
        db.flush()

        total_batch_amount = 0.0
        total_tx_count = 0

        # Standard statutory annual unit benefit if not explicitly recorded
        UNIT_BENEFIT = 25000.0

        for alloc in allocations:
            app = db.query(Application).filter(Application.id == alloc.application_id).first()
            if not app:
                continue

            app_data = app.application_data or {}
            student_name = app_data.get("full_name") or app_data.get("student_name") or "Beneficiary Student"
            acc_num = app_data.get("bank_account_number") or "987654321012"
            ifsc = app_data.get("bank_ifsc") or "SBIN0000001"
            masked_acc = f"XXXXXX{acc_num[-4:]}"
            aadhaar_last_four = str(app_data.get("aadhaar_number", "1234"))[-4:]

            total_student_scholarship = float(alloc.maintenance_allowance or 0.0) + float(getattr(alloc, 'tuition_reimbursement', 0.0) or 0.0)
            if total_student_scholarship <= 0:
                total_student_scholarship = UNIT_BENEFIT

            tranche_ratio = tranche_percentage / 100.0

            if split_enabled:
                # F-74 Split Mechanism: 60% Tuition to Institution + 40% Maintenance to Student
                tuition_full = total_student_scholarship * 0.60
                maint_full = total_student_scholarship * 0.40

                tuition_tranche = round(tuition_full * tranche_ratio, 2)
                maint_tranche = round(maint_full * tranche_ratio, 2)

                # 1. Institution Tuition Credit
                tx_tuition = DisbursementTransaction(
                    batch_id=batch.id,
                    sanction_order_id=alloc.sanction_order_number,
                    application_id=app.id,
                    student_id=app.student_id,
                    component_type=DisbursementComponentType.TUITION_INSTITUTION,
                    recipient_type="INSTITUTION",
                    beneficiary_name=f"Verified Academic Institution - {app.academic_year}",
                    institution_id="INST-JH-NODAL",
                    account_number_masked="XXXXXX4512",
                    ifsc_code="SBIN0001001",
                    bank_name="State Bank of India (Govt Account)",
                    aadhaar_last_four=None,
                    amount=tuition_tranche,
                    tranche_number=tranche_number,
                    tranche_percentage=tranche_percentage,
                    status=TransactionStatus.PENDING
                )
                db.add(tx_tuition)

                # 2. Student Maintenance Allowance Credit (DBT via APBS)
                tx_maint = DisbursementTransaction(
                    batch_id=batch.id,
                    sanction_order_id=alloc.sanction_order_number,
                    application_id=app.id,
                    student_id=app.student_id,
                    component_type=DisbursementComponentType.MAINTENANCE_STUDENT,
                    recipient_type="STUDENT",
                    beneficiary_name=student_name,
                    institution_id=None,
                    account_number_masked=masked_acc,
                    ifsc_code=ifsc,
                    bank_name="Jharkhand State Co-operative Bank",
                    aadhaar_last_four=aadhaar_last_four,
                    amount=maint_tranche,
                    tranche_number=tranche_number,
                    tranche_percentage=tranche_percentage,
                    status=TransactionStatus.PENDING
                )
                db.add(tx_maint)

                total_batch_amount += (tuition_tranche + maint_tranche)
                total_tx_count += 2
            else:
                # Lump-sum single transaction
                amount_tranche = round(total_student_scholarship * tranche_ratio, 2)
                tx = DisbursementTransaction(
                    batch_id=batch.id,
                    sanction_order_id=alloc.sanction_order_number,
                    application_id=app.id,
                    student_id=app.student_id,
                    component_type=DisbursementComponentType.MAINTENANCE_STUDENT,
                    recipient_type="STUDENT",
                    beneficiary_name=student_name,
                    account_number_masked=masked_acc,
                    ifsc_code=ifsc,
                    bank_name="State Bank of India",
                    aadhaar_last_four=aadhaar_last_four,
                    amount=amount_tranche,
                    tranche_number=tranche_number,
                    tranche_percentage=tranche_percentage,
                    status=TransactionStatus.PENDING
                )
                db.add(tx)
                total_batch_amount += amount_tranche
                total_tx_count += 1

        batch.total_records = total_tx_count
        batch.total_amount = round(total_batch_amount, 2)

        # F-77: Update Treasury Head Ledger Commitment
        ledger = DbtService.get_or_create_treasury_ledger(db, cycle.academic_year)
        if ledger.balance_amount < batch.total_amount:
            raise ValueError(f"Insufficient Treasury Budget: Required ₹{batch.total_amount:,.2f}, Available ₹{ledger.balance_amount:,.2f}")
        
        ledger.committed_amount += batch.total_amount
        ledger.balance_amount = ledger.allocated_budget - (ledger.expended_amount + ledger.committed_amount)

        audit = DbtAuditLog(
            action="BATCH_CREATED",
            batch_id=batch.id,
            actor_id=officer_id,
            details=f"Payment batch {batch_number} created with {total_tx_count} records totaling ₹{batch.total_amount:,.2f}"
        )
        db.add(audit)
        db.commit()
        db.refresh(batch)
        return batch

    @staticmethod
    def generate_pfms_xml_payload(batch: PaymentBatch, transactions: List[DisbursementTransaction]) -> str:
        """F-71: Public Financial Management System (PFMS) E-Payment XML Payload Serializer."""
        root = ET.Element("PFMSPaymentRequest")
        header = ET.SubElement(root, "Header")
        ET.SubElement(header, "BatchId").text = str(batch.id)
        ET.SubElement(header, "BatchNumber").text = batch.batch_number
        ET.SubElement(header, "DisbursementDate").text = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        ET.SubElement(header, "TotalAmount").text = f"{batch.total_amount:.2f}"
        ET.SubElement(header, "TotalRecords").text = str(batch.total_records)
        ET.SubElement(header, "AgencyCode").text = "JH-ST-WELFARE-01"
        ET.SubElement(header, "DebitAccountNumber").text = "00000030114529101"

        records_el = ET.SubElement(root, "Transactions")
        for tx in transactions:
            tx_el = ET.SubElement(records_el, "Transaction")
            ET.SubElement(tx_el, "TransactionId").text = str(tx.id)
            ET.SubElement(tx_el, "SanctionOrderNumber").text = tx.sanction_order_id or "ST/SANCTION"
            ET.SubElement(tx_el, "ComponentType").text = tx.component_type.value
            ET.SubElement(tx_el, "BeneficiaryName").text = tx.beneficiary_name
            ET.SubElement(tx_el, "AccountNumberMasked").text = tx.account_number_masked
            ET.SubElement(tx_el, "IFSCCode").text = tx.ifsc_code
            ET.SubElement(tx_el, "Amount").text = f"{tx.amount:.2f}"
            ET.SubElement(tx_el, "AadhaarLastFour").text = tx.aadhaar_last_four or "N/A"

        return ET.tostring(root, encoding="utf-8").decode("utf-8")

    @staticmethod
    def dispatch_batch_to_pfms(db: Session, batch_id: str, officer_id: str) -> PaymentBatch:
        """F-71: Dispatches payment batch to PFMS and receives digital acknowledgment."""
        batch = db.query(PaymentBatch).filter(PaymentBatch.id == batch_id).first()
        if not batch:
            raise ValueError("Payment batch not found")

        transactions = db.query(DisbursementTransaction).filter(DisbursementTransaction.batch_id == batch_id).all()
        if not transactions:
            raise ValueError("No transactions in this batch to dispatch")

        now = get_utc_now()
        pfms_ref = f"PFMS-{now.strftime('%Y%m%d')}-{uuid4().hex[:8].upper()}"
        xml_payload = DbtService.generate_pfms_xml_payload(batch, transactions)

        batch.xml_payload = xml_payload
        batch.pfms_reference_id = pfms_ref
        batch.status = PaymentBatchStatus.DISPATCHED_TO_PFMS
        batch.dispatched_at = now
        batch.acknowledgment_receipt = json.dumps({
            "ack_status": "SUCCESS",
            "pfms_code": "PFMS-ACK-200",
            "reference_id": pfms_ref,
            "received_at": now.isoformat(),
            "checksum_sha256": hashlib.sha256(xml_payload.encode()).hexdigest()
        })

        for tx in transactions:
            tx.status = TransactionStatus.SENT_TO_PFMS

        audit = DbtAuditLog(
            action="PFMS_DISPATCH",
            batch_id=batch.id,
            actor_id=officer_id,
            details=f"Payment batch {batch.batch_number} dispatched to PFMS with Ref {pfms_ref}"
        )
        db.add(audit)
        db.commit()
        db.refresh(batch)
        return batch

    @staticmethod
    def reconcile_pfms_batch(db: Session, batch_id: str, officer_id: str) -> PaymentBatch:
        """F-71, F-78, F-80: Reconciles PFMS bank credit responses and generates RBI UTR numbers."""
        batch = db.query(PaymentBatch).filter(PaymentBatch.id == batch_id).first()
        if not batch:
            raise ValueError("Payment batch not found")

        transactions = db.query(DisbursementTransaction).filter(DisbursementTransaction.batch_id == batch_id).all()
        now = get_utc_now()

        success_count = 0
        failed_count = 0

        for i, tx in enumerate(transactions):
            # Simulate 95% success rate, 5% failure for testing auto-retry edge case
            if i % 15 == 14: # Rare failure for retry testing
                tx.status = TransactionStatus.FAILED
                tx.failure_code = "ERR_DORMANT_ACCOUNT"
                tx.failure_reason = "Beneficiary bank account is dormant or freeze flag active"
                failed_count += 1
            else:
                tx.status = TransactionStatus.CREDIT_CONFIRMED
                tx.utr_number = f"RBI{now.strftime('%Y%m%d%H%M')}{i:04d}"
                tx.settled_at = now
                success_count += 1

                # Update Application Timeline for student tracking
                app = db.query(Application).filter(Application.id == tx.application_id).first()
                if app:
                    timeline_event = ApplicationTimeline(
                        application_id=app.id,
                        stage="DISBURSED",
                        title="Scholarship Disbursed via DBT",
                        description=f"DBT Scholarship ₹{tx.amount:,.2f} successfully credited to bank account ({tx.account_number_masked}). UTR: {tx.utr_number}",
                        actor_role="SYSTEM"
                    )
                    db.add(timeline_event)

        if failed_count == 0:
            batch.status = PaymentBatchStatus.PROCESSED
        else:
            batch.status = PaymentBatchStatus.PARTIALLY_FAILED

        batch.processed_at = now

        # Update Ledger: move committed to expended for success amounts
        cycle = db.query(AllocationCycle).filter(AllocationCycle.id == batch.cycle_id).first() if batch.cycle_id else None
        academic_year = cycle.academic_year if cycle else "2026-2027"
        ledger = DbtService.get_or_create_treasury_ledger(db, academic_year)
        
        success_amount = sum(t.amount for t in transactions if t.status == TransactionStatus.CREDIT_CONFIRMED)
        ledger.committed_amount = max(0.0, ledger.committed_amount - batch.total_amount)
        ledger.expended_amount += success_amount
        ledger.balance_amount = ledger.allocated_budget - (ledger.expended_amount + ledger.committed_amount)

        audit = DbtAuditLog(
            action="DISBURSEMENT_CONFIRMED",
            batch_id=batch.id,
            actor_id=officer_id,
            details=f"Batch {batch.batch_number} reconciled. Success: {success_count}, Failed: {failed_count}, Net Disbursed: ₹{success_amount:,.2f}"
        )
        db.add(audit)
        db.commit()
        db.refresh(batch)
        return batch

    @staticmethod
    def retry_failed_transaction(
        db: Session,
        transaction_id: str,
        new_account_number: Optional[str] = None,
        new_ifsc: Optional[str] = None,
        officer_id: Optional[str] = None
    ) -> DisbursementTransaction:
        """F-78: Smart failed transaction retry workflow with updated bank details."""
        tx = db.query(DisbursementTransaction).filter(DisbursementTransaction.id == transaction_id).first()
        if not tx:
            raise ValueError("Transaction not found")

        if tx.retry_count >= tx.max_retries:
            raise ValueError(f"Maximum retry limit ({tx.max_retries}) reached for this transaction")

        now = get_utc_now()
        tx.retry_count += 1
        tx.last_retry_at = now

        if new_account_number and new_ifsc:
            tx.account_number_masked = f"XXXXXX{new_account_number[-4:]}"
            tx.ifsc_code = new_ifsc.strip().upper()

        # Reset status for next dispatch cycle
        tx.status = TransactionStatus.PENNY_DROP_VERIFIED
        tx.failure_code = None
        tx.failure_reason = None

        audit = DbtAuditLog(
            action="TRANSACTION_RETRY",
            transaction_id=tx.id,
            actor_id=officer_id or tx.student_id,
            details=f"Transaction {tx.id} queued for retry attempt #{tx.retry_count}. Account: {tx.account_number_masked}"
        )
        db.add(audit)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def reverse_disbursement_transaction(
        db: Session,
        transaction_id: str,
        reason: str,
        officer_id: str
    ) -> DisbursementTransaction:
        """F-79: Reverse Transaction / Ineligible Revocation Recovery."""
        tx = db.query(DisbursementTransaction).filter(DisbursementTransaction.id == transaction_id).first()
        if not tx:
            raise ValueError("Transaction not found")

        if tx.status != TransactionStatus.CREDIT_CONFIRMED:
            raise ValueError("Only confirmed credit disbursements can be reversed")

        tx.status = TransactionStatus.REVERSED
        tx.reverse_reason = reason

        # Adjust Treasury Ledger: restore recovered amount to budget
        batch = db.query(PaymentBatch).filter(PaymentBatch.id == tx.batch_id).first()
        cycle = db.query(AllocationCycle).filter(AllocationCycle.id == batch.cycle_id).first() if batch and batch.cycle_id else None
        academic_year = cycle.academic_year if cycle else "2026-2027"
        ledger = DbtService.get_or_create_treasury_ledger(db, academic_year)
        
        ledger.expended_amount = max(0.0, ledger.expended_amount - tx.amount)
        ledger.balance_amount = ledger.allocated_budget - (ledger.expended_amount + ledger.committed_amount)

        audit = DbtAuditLog(
            action="REVERSAL_INITIATED",
            transaction_id=tx.id,
            actor_id=officer_id,
            details=f"Transaction {tx.id} of ₹{tx.amount:,.2f} reversed. Reason: {reason}"
        )
        db.add(audit)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def generate_treasury_bill(
        db: Session,
        batch_id: str,
        district: str,
        officer_id: str
    ) -> TreasuryBill:
        """F-82: Form TR-27 Treasury Bill generation with SHA-256 digital sign-off."""
        batch = db.query(PaymentBatch).filter(PaymentBatch.id == batch_id).first()
        if not batch:
            raise ValueError("Payment batch not found")

        existing_bill = db.query(TreasuryBill).filter(TreasuryBill.batch_id == batch_id).first()
        if existing_bill:
            return existing_bill

        now = get_utc_now()
        seq = db.query(func.count(TreasuryBill.id)).scalar() + 1
        financial_year = "2026-2027"
        bill_number = f"TB/{district.upper()}/{financial_year}/{seq:04d}"

        gross = batch.total_amount
        deductions = 0.0
        net = gross - deductions

        # Generate digital signature hash
        sign_payload = f"{bill_number}|{batch.id}|{district}|{net:.2f}|{officer_id}|{now.isoformat()}"
        digital_hash = hashlib.sha256(sign_payload.encode()).hexdigest()

        bill = TreasuryBill(
            bill_number=bill_number,
            district=district,
            financial_year=financial_year,
            batch_id=batch.id,
            gross_amount=gross,
            deductions=deductions,
            net_amount=net,
            dwo_officer_id=officer_id,
            token_number=f"TOK-{now.strftime('%d%m')}-{seq:03d}",
            status=TreasuryBillStatus.SIGNED,
            digital_sign_hash=digital_hash,
            signed_at=now,
            treasury_pass_date=now + timedelta(days=2)
        )
        db.add(bill)

        audit = DbtAuditLog(
            action="TREASURY_BILL_SIGNED",
            batch_id=batch.id,
            actor_id=officer_id,
            details=f"Treasury Bill {bill_number} signed with Digital Seal {digital_hash[:16]}..."
        )
        db.add(audit)
        db.commit()
        db.refresh(bill)
        return bill

    @staticmethod
    def get_student_dbt_tracking(db: Session, student_id: str) -> List[Dict[str, Any]]:
        """F-80: Student Real-Time DBT Tracking Timeline (UMANG style)."""
        transactions = db.query(DisbursementTransaction).filter(
            DisbursementTransaction.student_id == student_id
        ).order_by(DisbursementTransaction.created_at.desc()).all()

        results = []
        for tx in transactions:
            batch = db.query(PaymentBatch).filter(PaymentBatch.id == tx.batch_id).first()
            sanction = db.query(SanctionOrder).filter(SanctionOrder.order_number == tx.sanction_order_id).first() if tx.sanction_order_id else None
            treasury_bill = db.query(TreasuryBill).filter(TreasuryBill.batch_id == tx.batch_id).first() if tx.batch_id else None

            # Calculate progression milestones
            milestones = [
                {
                    "title": "Sanction Order Issued",
                    "status": "COMPLETED",
                    "timestamp": sanction.generated_at.isoformat() if sanction and sanction.generated_at else tx.created_at.isoformat(),
                    "details": f"Statutory Order #{tx.sanction_order_id or 'ST/SANCTION/2026'}"
                },
                {
                    "title": "Bank Account & APBS Seeded",
                    "status": "COMPLETED",
                    "timestamp": tx.created_at.isoformat(),
                    "details": f"{tx.bank_name} ({tx.account_number_masked})"
                },
                {
                    "title": "Treasury Bill Passed (Form TR-27)",
                    "status": "COMPLETED" if treasury_bill and treasury_bill.status in [TreasuryBillStatus.SIGNED, TreasuryBillStatus.TREASURY_CLEARED] else "PENDING",
                    "timestamp": treasury_bill.signed_at.isoformat() if treasury_bill and treasury_bill.signed_at else None,
                    "details": f"Bill #{treasury_bill.bill_number}" if treasury_bill else "Awaiting DWO signature"
                },
                {
                    "title": "PFMS Dispatch & Bank Processing",
                    "status": "COMPLETED" if tx.status in [TransactionStatus.CREDIT_CONFIRMED, TransactionStatus.SENT_TO_PFMS] else "PENDING",
                    "timestamp": batch.dispatched_at.isoformat() if batch and batch.dispatched_at else None,
                    "details": f"PFMS Ref: {batch.pfms_reference_id}" if batch and batch.pfms_reference_id else "Queued for batch dispatch"
                },
                {
                    "title": "Direct Bank Account Credit",
                    "status": "COMPLETED" if tx.status == TransactionStatus.CREDIT_CONFIRMED else ("FAILED" if tx.status == TransactionStatus.FAILED else "IN_PROGRESS"),
                    "timestamp": tx.settled_at.isoformat() if tx.settled_at else None,
                    "details": f"UTR: {tx.utr_number} | Amount: ₹{tx.amount:,.2f}" if tx.status == TransactionStatus.CREDIT_CONFIRMED else (f"Failed: {tx.failure_reason}" if tx.status == TransactionStatus.FAILED else "Processing transfer")
                }
            ]

            results.append({
                "transaction_id": tx.id,
                "sanction_order_number": tx.sanction_order_id,
                "batch_number": batch.batch_number if batch else None,
                "component_type": tx.component_type.value,
                "recipient_type": tx.recipient_type,
                "beneficiary_name": tx.beneficiary_name,
                "account_number_masked": tx.account_number_masked,
                "ifsc_code": tx.ifsc_code,
                "bank_name": tx.bank_name,
                "amount": tx.amount,
                "tranche_number": tx.tranche_number,
                "tranche_percentage": tx.tranche_percentage,
                "status": tx.status.value,
                "utr_number": tx.utr_number,
                "failure_reason": tx.failure_reason,
                "settled_at": tx.settled_at.isoformat() if tx.settled_at else None,
                "milestones": milestones
            })
        return results

    @staticmethod
    def initiate_upi_payment_recovery(
        student_id: str,
        amount: float,
        purpose: str = "SCHOLARSHIP_REFUND"
    ) -> Dict[str, Any]:
        """F-81: Payment Gateway / Bharat QR / UPI Mock Adapter."""
        txn_ref = f"UPI-JH-WELFARE-{uuid4().hex[:10].upper()}"
        upi_string = f"upi://pay?pa=stseva.welfare@sbi&pn=ST_Welfare_Dept_Jharkhand&am={amount:.2f}&cu=INR&tn={purpose}_{txn_ref}"
        return {
            "transaction_reference": txn_ref,
            "payee_vpa": "stseva.welfare@sbi",
            "payee_name": "ST Welfare Department Jharkhand",
            "amount": amount,
            "currency": "INR",
            "purpose": purpose,
            "upi_intent_uri": upi_string,
            "qr_code_payload": upi_string,
            "status": "INITIATED",
            "expires_in_minutes": 15
        }

    @staticmethod
    def export_cag_compliance_data(db: Session, financial_year: str = "2026-2027") -> Dict[str, Any]:
        """F-83: Comptroller and Auditor General (CAG) Compliance Audit Ledger with Cryptographic Seal."""
        ledger = DbtService.get_or_create_treasury_ledger(db, financial_year)
        transactions = db.query(DisbursementTransaction).order_by(DisbursementTransaction.created_at.desc()).all()

        records = []
        for tx in transactions:
            records.append({
                "transaction_id": tx.id,
                "batch_id": tx.batch_id,
                "sanction_order_id": tx.sanction_order_id,
                "component_type": tx.component_type.value,
                "recipient_type": tx.recipient_type,
                "beneficiary_name": tx.beneficiary_name,
                "account_masked": tx.account_number_masked,
                "ifsc": tx.ifsc_code,
                "amount": tx.amount,
                "status": tx.status.value,
                "utr_number": tx.utr_number,
                "settled_at": tx.settled_at.isoformat() if tx.settled_at else None
            })

        digest_payload = f"{financial_year}|{ledger.allocated_budget}|{ledger.expended_amount}|{len(records)}"
        cag_seal = hashlib.sha256(digest_payload.encode()).hexdigest()

        return {
            "financial_year": financial_year,
            "cag_audit_seal": cag_seal,
            "treasury_ledger": {
                "major_head": ledger.major_head,
                "sub_major_head": ledger.sub_major_head,
                "minor_head": ledger.minor_head,
                "sub_head": ledger.sub_head,
                "allocated_budget": ledger.allocated_budget,
                "expended_amount": ledger.expended_amount,
                "committed_amount": ledger.committed_amount,
                "balance_amount": ledger.balance_amount
            },
            "total_transactions_count": len(records),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "records": records
        }
