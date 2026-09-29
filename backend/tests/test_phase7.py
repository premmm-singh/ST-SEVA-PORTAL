import pytest
from datetime import datetime, timezone
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.db.models.user import User, UserRole
from app.db.models.scheme import Scheme
from app.db.models.application import Application
from app.db.models.allocation import (
    AllocationCycle,
    AllocationCycleStatus,
    AllocationResult,
    AllocationResultStatus,
    QuotaCategory,
    SanctionOrder
)
from app.db.models.dbt import (
    PaymentBatch,
    PaymentBatchStatus,
    DisbursementTransaction,
    DisbursementComponentType,
    TransactionStatus,
    PennyDropVerification,
    TreasuryHeadLedger,
    TreasuryBill,
    TreasuryBillStatus
)
from app.services.dbt_service import DbtService, jaro_winkler_similarity
from app.core.security import create_access_token, hash_password

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture
def auth_tokens(db):
    officer_email = f"dbt_officer_{uuid4().hex[:6]}@gov.in"
    student_email = f"dbt_student_{uuid4().hex[:6]}@tribal.gov.in"

    officer = User(
        email=officer_email,
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.OFFICER,
        is_active=True,
        is_verified=True
    )
    student = User(
        email=student_email,
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True
    )
    db.add_all([officer, student])
    db.commit()
    db.refresh(officer)
    db.refresh(student)

    officer_token = create_access_token(data={"sub": officer.id, "email": officer.email, "role": officer.role.value})
    student_token = create_access_token(data={"sub": student.id, "email": student.email, "role": student.role.value})

    return {
        "officer": officer,
        "student": student,
        "officer_headers": {"Authorization": f"Bearer {officer_token}"},
        "student_headers": {"Authorization": f"Bearer {student_token}"}
    }

def create_test_scheme(db, prefix="SCHEME"):
    uid = uuid4().hex[:6]
    scheme = Scheme(
        id=f"SCHEME_{prefix}_{uid}",
        scheme_name=f"ST Scholarship {prefix}",
        scheme_code=f"MTA-{prefix}-{uid}",
        academic_year="2026-2027",
        is_active=True
    )
    db.add(scheme)
    db.commit()
    db.refresh(scheme)
    return scheme

def create_test_app(db, student_id, scheme_id, full_name="Beneficiary"):
    uid = uuid4().hex[:6]
    app_record = Application(
        application_number=f"APP-{uid}",
        student_id=student_id,
        scheme_id=scheme_id,
        academic_year="2026-2027",
        status="SANCTIONED",
        application_data={
            "full_name": full_name,
            "bank_account_number": "123456789012",
            "bank_ifsc": "SBIN0000001",
            "aadhaar_number": "987654321234"
        }
    )
    db.add(app_record)
    db.commit()
    db.refresh(app_record)
    return app_record

def create_test_cycle(db, scheme_id, officer_id, total_budget=1500000.0, total_seats=50):
    cycle = AllocationCycle(
        scheme_id=scheme_id,
        academic_year="2026-2027",
        financial_year="2026-2027",
        status=AllocationCycleStatus.FINALIZED,
        total_seats=total_seats,
        total_budget=total_budget,
        created_by=officer_id
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return cycle

def test_jaro_winkler_and_penny_drop_verification(db, auth_tokens):
    # F-73: Name matching algorithm tests
    assert jaro_winkler_similarity("BIRSA MUNDA", "BIRSA MUNDA") == 1.0
    assert jaro_winkler_similarity("BIRSA MUNDA", "BIRSA MUNDAA") >= 0.90
    assert jaro_winkler_similarity("BIRSA MUNDA", "XYZ 9876") < 0.50

    # Execute Penny Drop via Service
    rec = DbtService.perform_penny_drop_verification(
        db=db,
        student_id=auth_tokens["student"].id,
        account_number="30114529101",
        ifsc_code="SBIN0000001",
        entered_name="Birsa Munda"
    )
    assert rec.status == "MATCHED"
    assert rec.similarity_score >= 0.85
    assert rec.bank_name == "State Bank of India"
    assert rec.account_number_masked == "XXXXXX9101"

    # Execute Penny Drop via API Endpoint
    res = client.post(
        "/api/v1/dbt/penny-drop/verify",
        json={
            "account_number": "40228912345",
            "ifsc_code": "BKID0004001",
            "entered_name": "Birsa Munda"
        },
        headers=auth_tokens["student_headers"]
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "MATCHED"
    assert "PND-" in data["reference_ref"]

def test_npci_aadhaar_seeding_check(auth_tokens):
    # F-72: Active Aadhaar Seeding Check
    res_active = client.get(
        "/api/v1/dbt/npci/seeding-status?aadhaar_number=123456781234",
        headers=auth_tokens["student_headers"]
    )
    assert res_active.status_code == 200
    data_active = res_active.json()
    assert data_active["is_seeded"] is True
    assert data_active["seeding_status"] == "ACTIVE"
    assert data_active["apbs_eligible"] is True

    # Inactive Aadhaar Seeding Check (ends with 9999)
    res_inactive = client.get(
        "/api/v1/dbt/npci/seeding-status?aadhaar_number=123456789999",
        headers=auth_tokens["student_headers"]
    )
    assert res_inactive.status_code == 200
    data_inactive = res_inactive.json()
    assert data_inactive["is_seeded"] is False
    assert data_inactive["seeding_status"] == "INACTIVE_OR_DELINKED"
    assert data_inactive["apbs_eligible"] is False

def test_treasury_ledger_budget_tracking(db, auth_tokens):
    # F-77: Verify Treasury Head of Account Ledger
    ledger = DbtService.get_or_create_treasury_ledger(db, "2026-2027")
    assert ledger.major_head == "2225"
    assert ledger.sub_major_head == "02"
    assert ledger.minor_head == "277"
    assert ledger.allocated_budget >= 10000000.0

    res = client.get(
        "/api/v1/dbt/treasury-ledger?financial_year=2026-2027",
        headers=auth_tokens["officer_headers"]
    )
    assert res.status_code == 200
    data = res.json()
    assert data["major_head"] == "2225"
    assert data["balance_amount"] > 0

def test_payment_batch_generation_with_split_tuition_and_maintenance(db, auth_tokens):
    # F-74, F-75, F-76: Setup Scheme, Cycle, Sanctioned Application, and Allocations
    scheme = create_test_scheme(db, "PRE")
    cycle = create_test_cycle(db, scheme.id, auth_tokens["officer"].id, total_budget=1500000.0, total_seats=50)

    app_record = create_test_app(db, auth_tokens["student"].id, scheme.id, "Jaipal Singh Munda")

    alloc_res = AllocationResult(
        allocation_cycle_id=cycle.id,
        application_id=app_record.id,
        student_id=app_record.student_id,
        status=AllocationResultStatus.SELECTED,
        quota_category=QuotaCategory.GENERAL_ST,
        tuition_reimbursement=15000.0,
        maintenance_allowance=10000.0,
        sanction_order_number=f"ST/SANCTION/2026/JH/0099"
    )
    db.add(alloc_res)
    db.commit()

    # Generate Batch via Endpoint
    res = client.post(
        "/api/v1/dbt/batches/generate",
        json={
            "scheme_id": scheme.id,
            "cycle_id": cycle.id,
            "tranche_number": 1,
            "tranche_percentage": 100.0,
            "split_enabled": True
        },
        headers=auth_tokens["officer_headers"]
    )
    assert res.status_code == 200
    batch_data = res.json()
    assert batch_data["total_records"] == 2 # 1 Tuition + 1 Maintenance
    assert batch_data["total_amount"] == 25000.0
    assert batch_data["status"] == "DRAFT"
    batch_id = batch_data["id"]

    # Verify Detail
    detail_res = client.get(f"/api/v1/dbt/batches/{batch_id}", headers=auth_tokens["officer_headers"])
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["transactions"]) == 2

    # Check components
    comp_types = [tx["component_type"] for tx in detail["transactions"]]
    assert "TUITION_INSTITUTION" in comp_types
    assert "MAINTENANCE_STUDENT" in comp_types

def test_staggered_disbursement_tranches(db, auth_tokens):
    # F-75: Staggered tranches: Tranche 1 (60%)
    scheme = create_test_scheme(db, "POST")
    cycle = create_test_cycle(db, scheme.id, auth_tokens["officer"].id, total_budget=1500000.0, total_seats=50)

    app_record = create_test_app(db, auth_tokens["student"].id, scheme.id, "Soma Munda")

    alloc_res = AllocationResult(
        allocation_cycle_id=cycle.id,
        application_id=app_record.id,
        student_id=app_record.student_id,
        status=AllocationResultStatus.SELECTED,
        quota_category=QuotaCategory.GENERAL_ST,
        tuition_reimbursement=15000.0,
        maintenance_allowance=10000.0,
        sanction_order_number=f"ST/SANCTION/2026/JH/0100"
    )
    db.add(alloc_res)
    db.commit()

    # Generate 60% Tranche Batch
    batch = DbtService.generate_payment_batch(
        db=db,
        scheme_id=scheme.id,
        cycle_id=cycle.id,
        officer_id=auth_tokens["officer"].id,
        tranche_number=1,
        tranche_percentage=60.0,
        split_enabled=False
    )
    assert batch.total_amount == 15000.0 # 60% of 25,000

def test_pfms_xml_payload_generation_and_dispatch(db, auth_tokens):
    # F-71: PFMS XML and Dispatch
    scheme = create_test_scheme(db, "HIGHER")
    cycle = create_test_cycle(db, scheme.id, auth_tokens["officer"].id, total_budget=500000.0, total_seats=20)

    app_record = create_test_app(db, auth_tokens["student"].id, scheme.id, "Kanu Santhal")

    alloc_res = AllocationResult(
        allocation_cycle_id=cycle.id,
        application_id=app_record.id,
        student_id=app_record.student_id,
        status=AllocationResultStatus.SELECTED,
        quota_category=QuotaCategory.GENERAL_ST,
        tuition_reimbursement=15000.0,
        maintenance_allowance=10000.0,
        sanction_order_number=f"ST/SANCTION/2026/JH/0101"
    )
    db.add(alloc_res)
    db.commit()

    batch = DbtService.generate_payment_batch(
        db=db,
        scheme_id=scheme.id,
        cycle_id=cycle.id,
        officer_id=auth_tokens["officer"].id,
        tranche_number=1,
        tranche_percentage=100.0,
        split_enabled=True
    )

    # Dispatch to PFMS via API
    res = client.post(f"/api/v1/dbt/batches/{batch.id}/dispatch-pfms", headers=auth_tokens["officer_headers"])
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["status"] == "DISPATCHED_TO_PFMS"
    assert "PFMS-" in res_data["pfms_reference_id"]

    db.refresh(batch)
    assert "<PFMSPaymentRequest>" in batch.xml_payload
    assert "JH-ST-WELFARE-01" in batch.xml_payload

def test_pfms_batch_reconciliation_and_utr_assignment(db, auth_tokens):
    # F-71, F-80: Bank Reconciliation & UTR generation
    scheme = create_test_scheme(db, "TECH")
    cycle = create_test_cycle(db, scheme.id, auth_tokens["officer"].id, total_budget=500000.0, total_seats=20)

    app_record = create_test_app(db, auth_tokens["student"].id, scheme.id, "Maki Munda")

    alloc_res = AllocationResult(
        allocation_cycle_id=cycle.id,
        application_id=app_record.id,
        student_id=app_record.student_id,
        status=AllocationResultStatus.SELECTED,
        quota_category=QuotaCategory.GENERAL_ST,
        tuition_reimbursement=15000.0,
        maintenance_allowance=10000.0,
        sanction_order_number=f"ST/SANCTION/2026/JH/0102"
    )
    db.add(alloc_res)
    db.commit()

    batch = DbtService.generate_payment_batch(
        db=db,
        scheme_id=scheme.id,
        cycle_id=cycle.id,
        officer_id=auth_tokens["officer"].id,
        tranche_number=1,
        tranche_percentage=100.0,
        split_enabled=False
    )
    DbtService.dispatch_batch_to_pfms(db=db, batch_id=batch.id, officer_id=auth_tokens["officer"].id)

    # Reconcile via Endpoint
    res = client.post(f"/api/v1/dbt/batches/{batch.id}/reconcile", headers=auth_tokens["officer_headers"])
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["status"] == "PROCESSED"

    # Verify UTR number
    transactions = db.query(DisbursementTransaction).filter(DisbursementTransaction.batch_id == batch.id).all()
    assert len(transactions) > 0
    assert transactions[0].status == TransactionStatus.CREDIT_CONFIRMED
    assert transactions[0].utr_number.startswith("RBI")

def test_failed_transaction_smart_retry(db, auth_tokens):
    # F-78: Failed transaction retry
    scheme = create_test_scheme(db, "RETRY")
    app_record = create_test_app(db, auth_tokens["student"].id, scheme.id, "Retry Candidate")

    batch = PaymentBatch(
        batch_number=f"DBT/BATCH/2026/JH/{uuid4().hex[:4]}",
        scheme_id=scheme.id,
        created_by_officer_id=auth_tokens["officer"].id,
        status=PaymentBatchStatus.PROCESSED
    )
    db.add(batch)
    db.flush()

    tx = DisbursementTransaction(
        batch_id=batch.id,
        application_id=app_record.id,
        student_id=auth_tokens["student"].id,
        component_type=DisbursementComponentType.MAINTENANCE_STUDENT,
        beneficiary_name="Test Student",
        account_number_masked="XXXXXX1234",
        ifsc_code="SBIN0000001",
        bank_name="SBI",
        amount=10000.0,
        status=TransactionStatus.FAILED,
        failure_code="ERR_ACCOUNT_DORMANT",
        failure_reason="Account is dormant",
        retry_count=0,
        max_retries=3
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # Retry via API
    res = client.post(
        f"/api/v1/dbt/transactions/{tx.id}/retry",
        json={"new_account_number": "998877665544", "new_ifsc": "BKID0001001"},
        headers=auth_tokens["officer_headers"]
    )
    assert res.status_code == 200
    data = res.json()
    assert data["retry_count"] == 1
    assert data["status"] == "PENNY_DROP_VERIFIED"
    assert data["account_number_masked"] == "XXXXXX5544"
    assert data["ifsc_code"] == "BKID0001001"

def test_reverse_transaction_recovery(db, auth_tokens):
    # F-79: Reversal and budget recovery
    scheme = create_test_scheme(db, "REV")
    app_record = create_test_app(db, auth_tokens["student"].id, scheme.id, "Rev Candidate")

    batch = PaymentBatch(
        batch_number=f"DBT/BATCH/2026/JH/{uuid4().hex[:4]}",
        scheme_id=scheme.id,
        created_by_officer_id=auth_tokens["officer"].id,
        status=PaymentBatchStatus.PROCESSED
    )
    db.add(batch)
    db.flush()

    tx = DisbursementTransaction(
        batch_id=batch.id,
        application_id=app_record.id,
        student_id=auth_tokens["student"].id,
        component_type=DisbursementComponentType.MAINTENANCE_STUDENT,
        beneficiary_name="Reversal Beneficiary",
        account_number_masked="XXXXXX9999",
        ifsc_code="SBIN0000001",
        bank_name="SBI",
        amount=10000.0,
        status=TransactionStatus.CREDIT_CONFIRMED,
        utr_number="RBI20260901001"
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # Reverse via API
    res = client.post(
        f"/api/v1/dbt/transactions/{tx.id}/reverse",
        json={"reason": "Candidate secured duplicate central scholarship"},
        headers=auth_tokens["officer_headers"]
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "REVERSED"

def test_form_tr27_treasury_bill_with_digital_seal(db, auth_tokens):
    # F-82: Form TR-27 Treasury Bill Generation
    scheme = create_test_scheme(db, "TB")
    batch = PaymentBatch(
        batch_number=f"DBT/BATCH/2026/JH/{uuid4().hex[:4]}",
        scheme_id=scheme.id,
        total_records=10,
        total_amount=250000.0,
        created_by_officer_id=auth_tokens["officer"].id,
        status=PaymentBatchStatus.PROCESSED
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    # Generate Treasury Bill via API
    res = client.post(
        f"/api/v1/dbt/batches/{batch.id}/treasury-bill",
        json={"district": "RANCHI"},
        headers=auth_tokens["officer_headers"]
    )
    assert res.status_code == 200
    bill_data = res.json()
    assert bill_data["district"] == "RANCHI"
    assert bill_data["net_amount"] == 250000.0
    assert bill_data["status"] == "SIGNED"
    assert bill_data["digital_sign_hash"] is not None
    assert "TB/RANCHI/" in bill_data["bill_number"]

def test_student_dbt_tracking_vertical_timeline(db, auth_tokens):
    # F-80: Student Real-Time DBT Tracking
    scheme = create_test_scheme(db, "TRACK")
    app_record = create_test_app(db, auth_tokens["student"].id, scheme.id, "Birsa Munda")

    batch = PaymentBatch(
        batch_number=f"DBT/BATCH/2026/JH/{uuid4().hex[:4]}",
        scheme_id=scheme.id,
        created_by_officer_id=auth_tokens["officer"].id,
        status=PaymentBatchStatus.PROCESSED
    )
    db.add(batch)
    db.flush()

    tx = DisbursementTransaction(
        batch_id=batch.id,
        sanction_order_id="ST/SANCTION/2026/JH/0001",
        application_id=app_record.id,
        student_id=auth_tokens["student"].id,
        component_type=DisbursementComponentType.MAINTENANCE_STUDENT,
        beneficiary_name="Birsa Munda",
        account_number_masked="XXXXXX1122",
        ifsc_code="SBIN0001001",
        bank_name="State Bank of India",
        amount=10000.0,
        tranche_number=1,
        tranche_percentage=100.0,
        status=TransactionStatus.CREDIT_CONFIRMED,
        utr_number="RBI20260927001"
    )
    db.add(tx)
    db.commit()

    # Query student DBT tracking timeline
    res = client.get("/api/v1/dbt/student/my-dbt-timeline", headers=auth_tokens["student_headers"])
    assert res.status_code == 200
    timeline = res.json()
    assert len(timeline) >= 1
    record = timeline[0]
    assert record["amount"] == 10000.0
    assert record["utr_number"] == "RBI20260927001"
    assert len(record["milestones"]) == 5

def test_upi_mock_adapter_and_cag_audit_export(db, auth_tokens):
    # F-81: Payment Gateway / UPI Mock Adapter
    upi_res = client.post(
        "/api/v1/dbt/upi/initiate-refund",
        json={"amount": 2500.0, "purpose": "EXCESS_RECOVERY"},
        headers=auth_tokens["student_headers"]
    )
    assert upi_res.status_code == 200
    upi_data = upi_res.json()
    assert upi_data["status"] == "INITIATED"
    assert "upi://pay" in upi_data["upi_intent_uri"]
    assert "stseva.welfare@sbi" in upi_data["payee_vpa"]

    # F-83: CAG Compliance Audit Ledger Export
    cag_res = client.get("/api/v1/dbt/audit/cag-compliance-export", headers=auth_tokens["officer_headers"])
    assert cag_res.status_code == 200
    cag_data = cag_res.json()
    assert "cag_audit_seal" in cag_data
    assert "treasury_ledger" in cag_data
    assert cag_data["treasury_ledger"]["major_head"] == "2225"
    assert "records" in cag_data
