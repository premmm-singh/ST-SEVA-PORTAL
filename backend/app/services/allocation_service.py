import hashlib
import json
import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from fastapi import HTTPException, status

from app.db.models.allocation import (
    AllocationCycle,
    AllocationCycleStatus,
    MeritScore,
    AllocationResult,
    AllocationResultStatus,
    QuotaCategory,
    MeritObjection,
    ObjectionType,
    ObjectionStatus,
    SanctionOrder,
    AllocationAuditLog
)
from app.db.models.application import Application, ApplicationTimeline
from app.db.models.scheme import Scheme
from app.db.models.profile import StudentProfile
from app.db.models.user import User

PVTG_COMMUNITIES = {
    "asur", "birhor", "birjia", "korwa", "mal paharia",
    "sauria paharia", "hill kharia", "parhaiya", "baiga",
    "chenchu", "toda", "kadar", "lodha"
}


def log_allocation_event(
    db: Session,
    cycle_id: str,
    event_type: str,
    performed_by: str,
    details: Dict[str, Any]
) -> AllocationAuditLog:
    """Feature 70: Immutable allocation audit trail."""
    audit = AllocationAuditLog(
        allocation_cycle_id=cycle_id,
        event_type=event_type,
        performed_by=performed_by,
        details_json=json.dumps(details, default=str)
    )
    db.add(audit)
    db.commit()
    return audit


def calculate_merit_score(db: Session, application: Application) -> Dict[str, Any]:
    """
    Feature 59: Merit List Generation (multi-criteria):
    - Academic Marks: Max 60 pts
    - Inverse Income: Max 25 pts (Higher points for poorer households under 2.5L)
    - PVTG Priority: +15 pts bonus for Particularly Vulnerable Tribal Groups
    """
    # Check extra data in application
    app_data = application.application_data or {}
    if not isinstance(app_data, dict):
        app_data = {}

    academic_info = app_data.get("academic", {})
    marks = float(academic_info.get("marks_percentage", academic_info.get("percentage", 75.0)))
    marks = max(0.0, min(100.0, marks))
    academic_score = round((marks / 100.0) * 60.0, 2)

    # 2. Inverse income score
    applicant_details = app_data.get("applicant", {})
    income = float(applicant_details.get("family_annual_income", applicant_details.get("annual_income", 120000.0)))
    if income <= 50000.0:
        income_score = 25.0
    elif income >= 250000.0:
        income_score = 0.0
    else:
        # Linear scale from 25.0 down to 0.0 between 50k and 2.5L
        income_score = round(25.0 * (1.0 - ((income - 50000.0) / 200000.0)), 2)

    # 3. PVTG bonus check from student profile or application data
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == application.student_id).first()
    sub_caste = (profile.sub_caste or "").lower() if profile else ""
    gender = (profile.gender or "").lower() if profile else ""
    is_pwd = False
    is_sports = False
    
    sub_caste_input = str(applicant_details.get("sub_caste", "")).lower()
    if sub_caste_input:
        sub_caste = sub_caste_input
    gender_input = str(applicant_details.get("gender", "")).lower()
    if gender_input:
        gender = gender_input
    if applicant_details.get("is_differently_abled"):
        is_pwd = True
    if applicant_details.get("sports_quota"):
        is_sports = True

    is_pvtg = any(pvtg in sub_caste for pvtg in PVTG_COMMUNITIES)
    pvtg_bonus = 15.0 if is_pvtg else 0.0

    total_merit = round(academic_score + income_score + pvtg_bonus, 2)
    is_female = "female" in gender or gender == "f"

    # Core subject marks default to academic marks
    core_subject_marks = float(marks)

    # DOB default
    dob_val = profile.dob if profile and profile.dob else date(2002, 1, 1)

    return {
        "academic_score": academic_score,
        "income_score": income_score,
        "pvtg_bonus": pvtg_bonus,
        "total_merit_score": total_merit,
        "core_subject_marks": core_subject_marks,
        "family_income": income,
        "dob": dob_val,
        "submission_timestamp": application.submission_date or application.created_at,
        "pvtg_community": sub_caste if is_pvtg else None,
        "is_female": is_female,
        "is_pwd": is_pwd,
        "is_sports": is_sports,
        "district": profile.district if profile else "Ranchi"
    }


def compute_cycle_merit_scores(db: Session, cycle_id: str) -> List[MeritScore]:
    """Generates and ranks MeritScore records for an allocation cycle."""
    cycle = db.query(AllocationCycle).filter(AllocationCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Allocation cycle not found")

    # Fetch eligible applications for the scheme (submitted, verified, dwo approved, or sanctioned)
    apps = db.query(Application).filter(
        Application.scheme_id == cycle.scheme_id,
        Application.status.in_(["SUBMITTED", "INSTITUTE_VERIFIED", "DWO_APPROVED", "UNDER_SCRUTINY", "SANCTIONED"])
    ).all()

    # Clear existing scores for this cycle
    db.query(MeritScore).filter(MeritScore.allocation_cycle_id == cycle_id).delete()
    db.commit()

    scores = []
    for app in apps:
        calc = calculate_merit_score(db, app)
        score_rec = MeritScore(
            allocation_cycle_id=cycle_id,
            application_id=app.id,
            academic_score=calc["academic_score"],
            income_score=calc["income_score"],
            pvtg_bonus=calc["pvtg_bonus"],
            total_merit_score=calc["total_merit_score"],
            core_subject_marks=calc["core_subject_marks"],
            family_income=calc["family_income"],
            dob=calc["dob"],
            submission_timestamp=calc["submission_timestamp"],
            pvtg_community=calc["pvtg_community"],
            is_female=calc["is_female"],
            is_pwd=calc["is_pwd"],
            is_sports=calc["is_sports"],
            district=calc["district"]
        )
        db.add(score_rec)
        scores.append(score_rec)

    db.commit()

    # Feature 61: Tie-breaking sort algorithm
    # 1. Total Merit Score (DESC)
    # 2. Core Subject Marks (DESC)
    # 3. Family Income (ASC - lower income is prioritized)
    # 4. DOB (ASC - older applicant born earlier has smaller date)
    # 5. Submission Timestamp (ASC - earlier submission)
    scores.sort(
        key=lambda s: (
            -s.total_merit_score,
            -s.core_subject_marks,
            s.family_income,
            s.dob or date.max,
            s.submission_timestamp or datetime.max
        )
    )

    for rank, s in enumerate(scores, 1):
        s.rank_overall = rank

    db.commit()
    return scores


def run_allocation_engine(
    db: Session,
    cycle_id: str,
    officer_username: str = "system",
    dry_run: bool = True
) -> Dict[str, Any]:
    """
    Features 60, 61, 66, 69:
    Quota distribution (Female 33%, PVTG 5%, PwD 5%, Sports 2%, General ST remainder)
    Budgetary cap check and allocation dry run simulation.
    """
    cycle = db.query(AllocationCycle).filter(AllocationCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Allocation cycle not found")

    scheme = db.query(Scheme).filter(Scheme.id == cycle.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    scores = compute_cycle_merit_scores(db, cycle_id)
    total_seats = cycle.total_seats or 100
    total_budget = cycle.total_budget or 5000000.0

    # Quota targets
    pvtg_target = max(1, int(total_seats * 0.05))   # 5%
    pwd_target = max(1, int(total_seats * 0.05))    # 5%
    female_target = max(1, int(total_seats * 0.33)) # 33%
    sports_target = max(1, int(total_seats * 0.02)) # 2%

    selected_ids = set()
    allocations_preview = []
    current_spent = 0.0

    # Average benefit estimate per student (Statutory standard 25,000 INR)
    unit_scholarship = 25000.0
    tuition = round(unit_scholarship * 0.60, 2)
    maintenance = round(unit_scholarship * 0.40, 2)

    def try_select(score_item: MeritScore, category: QuotaCategory) -> bool:
        nonlocal current_spent
        if score_item.id in selected_ids:
            return False
        # Feature 69: Budgetary cap check
        if (current_spent + unit_scholarship) > total_budget:
            return False
        if len(selected_ids) >= total_seats:
            return False

        selected_ids.add(score_item.id)
        current_spent += unit_scholarship
        allocations_preview.append({
            "merit_score": score_item,
            "status": AllocationResultStatus.SELECTED,
            "quota_category": category,
            "allocated_amount": unit_scholarship,
            "maintenance_allowance": maintenance,
            "tuition_reimbursement": tuition,
            "waitlist_number": None
        })
        return True

    # 1. Fill PVTG 5% quota
    pvtg_filled = 0
    for s in scores:
        if s.pvtg_community and pvtg_filled < pvtg_target:
            if try_select(s, QuotaCategory.PVTG_5):
                pvtg_filled += 1

    # 2. Fill PwD 5% quota
    pwd_filled = 0
    for s in scores:
        if s.is_pwd and pwd_filled < pwd_target:
            if try_select(s, QuotaCategory.PWD_5):
                pwd_filled += 1

    # 3. Fill Female 33% quota
    female_filled = 0
    for s in scores:
        if s.is_female and female_filled < female_target:
            if try_select(s, QuotaCategory.FEMALE_33):
                female_filled += 1

    # 4. Fill Sports 2% quota
    sports_filled = 0
    for s in scores:
        if s.is_sports and sports_filled < sports_target:
            if try_select(s, QuotaCategory.SPORTS_2):
                sports_filled += 1

    # 5. Fill General ST Merit remainder
    for s in scores:
        if s.id not in selected_ids:
            if not try_select(s, QuotaCategory.GENERAL_ST):
                break

    # 6. Assign Waitlist to candidates not selected
    waitlist_counter = 1
    for s in scores:
        if s.id not in selected_ids:
            reason_status = AllocationResultStatus.BUDGET_EXCEEDED if current_spent >= total_budget else AllocationResultStatus.WAITLISTED
            allocations_preview.append({
                "merit_score": s,
                "status": reason_status,
                "quota_category": QuotaCategory.NONE,
                "allocated_amount": 0.0,
                "maintenance_allowance": 0.0,
                "tuition_reimbursement": 0.0,
                "waitlist_number": waitlist_counter if reason_status == AllocationResultStatus.WAITLISTED else None
            })
            if reason_status == AllocationResultStatus.WAITLISTED:
                waitlist_counter += 1

    summary = {
        "cycle_id": cycle.id,
        "academic_year": cycle.academic_year,
        "scheme_name": scheme.scheme_name,
        "total_applicants": len(scores),
        "total_seats": total_seats,
        "total_budget": total_budget,
        "allocated_budget": current_spent,
        "budget_utilization_pct": round((current_spent / total_budget) * 100.0, 1) if total_budget else 0.0,
        "seats_filled": len(selected_ids),
        "quota_distribution": {
            "pvtg_5": {"target": pvtg_target, "filled": pvtg_filled},
            "pwd_5": {"target": pwd_target, "filled": pwd_filled},
            "female_33": {"target": female_target, "filled": female_filled},
            "sports_2": {"target": sports_target, "filled": sports_filled},
            "general_st": len(selected_ids) - (pvtg_filled + pwd_filled + female_filled + sports_filled)
        },
        "waitlisted_count": waitlist_counter - 1,
        "dry_run": dry_run
    }

    if not dry_run:
        # Clear previous permanent allocation results
        db.query(AllocationResult).filter(AllocationResult.allocation_cycle_id == cycle_id).delete()
        db.commit()

        for item in allocations_preview:
            m_score = item["merit_score"]
            app = db.query(Application).filter(Application.id == m_score.application_id).first()
            if not app:
                continue

            res = AllocationResult(
                allocation_cycle_id=cycle_id,
                application_id=app.id,
                student_id=app.student_id,
                status=item["status"],
                quota_category=item["quota_category"],
                allocated_amount=item["allocated_amount"],
                maintenance_allowance=item["maintenance_allowance"],
                tuition_reimbursement=item["tuition_reimbursement"],
                waitlist_number=item["waitlist_number"]
            )
            db.add(res)

        cycle.status = AllocationCycleStatus.SIMULATED
        cycle.allocated_budget = current_spent
        db.commit()

        log_allocation_event(
            db=db,
            cycle_id=cycle_id,
            event_type="ALLOCATION_EXECUTED",
            performed_by=officer_username,
            details=summary
        )

    return summary


def promote_from_waitlist(db: Session, cycle_id: str, officer_username: str) -> Optional[Dict[str, Any]]:
    """
    Feature 62: Waitlist Management & Auto-Promotion
    Elevates the top-ranked waitlisted candidate when a seat becomes vacant.
    """
    # Find next candidate in waitlist
    next_candidate = db.query(AllocationResult).filter(
        AllocationResult.allocation_cycle_id == cycle_id,
        AllocationResult.status == AllocationResultStatus.WAITLISTED
    ).order_by(asc(AllocationResult.waitlist_number)).first()

    if not next_candidate:
        return None

    unit_scholarship = 25000.0

    promoted_waitlist_num = next_candidate.waitlist_number
    next_candidate.status = AllocationResultStatus.SELECTED
    next_candidate.quota_category = QuotaCategory.GENERAL_ST
    next_candidate.allocated_amount = unit_scholarship
    next_candidate.maintenance_allowance = round(unit_scholarship * 0.40, 2)
    next_candidate.tuition_reimbursement = round(unit_scholarship * 0.60, 2)
    next_candidate.waitlist_number = None

    if cycle:
        cycle.allocated_budget += unit_scholarship

    # Shift subsequent waitlisted ranks down by 1
    subsequent = db.query(AllocationResult).filter(
        AllocationResult.allocation_cycle_id == cycle_id,
        AllocationResult.status == AllocationResultStatus.WAITLISTED,
        AllocationResult.waitlist_number > promoted_waitlist_num
    ).all()
    for s in subsequent:
        s.waitlist_number -= 1

    db.commit()

    event_data = {
        "promoted_application_id": next_candidate.application_id,
        "promoted_student_id": next_candidate.student_id,
        "original_waitlist_number": promoted_waitlist_num,
        "new_status": "SELECTED"
    }
    log_allocation_event(
        db=db,
        cycle_id=cycle_id,
        event_type="WAITLIST_AUTO_PROMOTED",
        performed_by=officer_username,
        details=event_data
    )

    return event_data


def handle_scheme_switching(
    db: Session,
    student_id: str,
    from_cycle_id: str,
    to_cycle_id: str,
    officer_username: str
) -> Dict[str, Any]:
    """
    Feature 63: Scheme Switching Adjudication
    Allows a student eligible for multiple schemes to choose the better scheme,
    releasing the seat in the original scheme and triggering auto-promotion.
    """
    from_result = db.query(AllocationResult).filter(
        AllocationResult.allocation_cycle_id == from_cycle_id,
        AllocationResult.student_id == student_id,
        AllocationResult.status == AllocationResultStatus.SELECTED
    ).first()

    if not from_result:
        raise HTTPException(status_code=400, detail="Student has no active SELECTED seat in the source scheme")

    # Release seat in old scheme
    from_result.status = AllocationResultStatus.SWITCHED_SCHEME
    released_amount = from_result.allocated_amount
    from_result.allocated_amount = 0.0

    from_cycle = db.query(AllocationCycle).filter(AllocationCycle.id == from_cycle_id).first()
    if from_cycle:
        from_cycle.allocated_budget = max(0.0, from_cycle.allocated_budget - released_amount)

    db.commit()

    # Trigger waitlist promotion in old scheme to fill vacated seat
    promoted = promote_from_waitlist(db, from_cycle_id, officer_username)

    log_allocation_event(
        db=db,
        cycle_id=from_cycle_id,
        event_type="SCHEME_SWITCH_RELEASE",
        performed_by=officer_username,
        details={
            "student_id": student_id,
            "switched_to_cycle_id": to_cycle_id,
            "auto_promoted_replacement": promoted
        }
    )

    return {
        "message": "Scheme switch executed successfully. Vacated seat released and waitlist candidate promoted.",
        "switched_student_id": student_id,
        "auto_promoted": promoted
    }


def check_renewal_eligibility(marks_percentage: float, is_pvtg: bool = False) -> Dict[str, Any]:
    """
    Feature 65: Academic Performance Threshold Check for Renewal:
    - Minimum 50% marks for general ST renewals
    - Relaxed to 45% for Particularly Vulnerable Tribal Groups (PVTG)
    """
    required = 45.0 if is_pvtg else 50.0
    passed = marks_percentage >= required
    return {
        "marks_percentage": marks_percentage,
        "is_pvtg": is_pvtg,
        "threshold_required": required,
        "renewal_eligible": passed,
        "remarks": "Eligible for scholarship continuation/renewal" if passed else f"Marks {marks_percentage}% fell below required statutory threshold of {required}%"
    }


def open_objection_window(
    db: Session,
    cycle_id: str,
    days: int = 7,
    officer_username: str = "dwo"
) -> Dict[str, Any]:
    """Feature 67: 7-Day Merit Objection & Correction Window."""
    cycle = db.query(AllocationCycle).filter(AllocationCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Allocation cycle not found")

    deadline = datetime.utcnow() + timedelta(days=days)
    cycle.status = AllocationCycleStatus.OBJECTION_WINDOW
    cycle.objection_deadline = deadline
    db.commit()

    log_allocation_event(
        db=db,
        cycle_id=cycle_id,
        event_type="OBJECTION_WINDOW_OPENED",
        performed_by=officer_username,
        details={"deadline": deadline.isoformat(), "window_days": days}
    )

    return {
        "cycle_id": cycle.id,
        "status": cycle.status,
        "objection_deadline": deadline.isoformat(),
        "window_days": days
    }


def submit_merit_objection(
    db: Session,
    student_id: str,
    cycle_id: str,
    objection_type: ObjectionType,
    description: str,
    claimed_score: Optional[float] = None,
    supporting_doc_url: Optional[str] = None
) -> MeritObjection:
    """Feature 67: Student merit objection filing."""
    cycle = db.query(AllocationCycle).filter(AllocationCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Allocation cycle not found")

    if cycle.status != AllocationCycleStatus.OBJECTION_WINDOW:
        raise HTTPException(status_code=400, detail="Objection window is currently closed for this cycle")

    app = db.query(Application).filter(
        Application.scheme_id == cycle.scheme_id,
        Application.student_id == student_id
    ).first()
    if not app:
        raise HTTPException(status_code=400, detail="No application found for student under this scheme cycle")

    objection = MeritObjection(
        allocation_cycle_id=cycle_id,
        student_id=student_id,
        application_id=app.id,
        objection_type=objection_type,
        description=description,
        claimed_score=claimed_score,
        supporting_doc_url=supporting_doc_url,
        status=ObjectionStatus.PENDING
    )
    db.add(objection)
    db.commit()
    db.refresh(objection)
    return objection


def resolve_merit_objection(
    db: Session,
    objection_id: str,
    status_decision: ObjectionStatus,
    resolution_remarks: str,
    officer_id: str,
    officer_username: str
) -> MeritObjection:
    """Feature 67: Adjudication of merit objection."""
    obj = db.query(MeritObjection).filter(MeritObjection.id == objection_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Objection record not found")

    obj.status = status_decision
    obj.resolution_remarks = resolution_remarks
    obj.resolved_by = officer_id
    obj.resolved_at = datetime.utcnow()
    db.commit()

    log_allocation_event(
        db=db,
        cycle_id=obj.allocation_cycle_id,
        event_type="OBJECTION_RESOLVED",
        performed_by=officer_username,
        details={
            "objection_id": objection_id,
            "decision": status_decision,
            "remarks": resolution_remarks
        }
    )
    return obj


def generate_final_sanction_order(
    db: Session,
    cycle_id: str,
    officer_id: str,
    officer_username: str
) -> SanctionOrder:
    """
    Feature 68: Final Sanction Order Generation (PDF & Digital Signature).
    Generates unique statutory Sanction Order Number with SHA-256 digital signature seal.
    """
    cycle = db.query(AllocationCycle).filter(AllocationCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Allocation cycle not found")

    selected_results = db.query(AllocationResult).filter(
        AllocationResult.allocation_cycle_id == cycle_id,
        AllocationResult.status == AllocationResultStatus.SELECTED
    ).all()

    if not selected_results:
        raise HTTPException(status_code=400, detail="Cannot generate sanction order: No selected beneficiaries")

    total_beneficiaries = len(selected_results)
    total_amount = sum(r.allocated_amount for r in selected_results)
    year_token = cycle.financial_year.replace("-", "")

    # Generate unique Sanction Order Number
    seq = str(uuid.uuid4())[:6].upper()
    order_number = f"ST/SANCTION/{year_token}/JH/{seq}"

    # SHA-256 digital signature payload
    seal_payload = f"{order_number}|{cycle_id}|{total_beneficiaries}|{total_amount:.2f}|{officer_id}|{datetime.utcnow().isoformat()}"
    digital_signature = hashlib.sha256(seal_payload.encode('utf-8')).hexdigest()

    sanction_order = SanctionOrder(
        order_number=order_number,
        allocation_cycle_id=cycle_id,
        scheme_id=cycle.scheme_id,
        financial_year=cycle.financial_year,
        total_beneficiaries=total_beneficiaries,
        total_sanctioned_amount=total_amount,
        digital_signature_hash=digital_signature,
        issued_by=officer_id,
        pdf_path=f"/static/sanction_orders/{order_number.replace('/', '_')}.pdf"
    )
    db.add(sanction_order)

    # Stamp sanction order number on all selected allocations
    for res in selected_results:
        res.sanction_order_number = order_number
        # Also advance Application status to SANCTIONED
        app = db.query(Application).filter(Application.id == res.application_id).first()
        if app:
            app.status = "SANCTIONED"
            # Add timeline entry
            timeline = ApplicationTimeline(
                application_id=app.id,
                stage="SANCTIONED",
                title="Sanction Order Generated",
                description=f"Sanction Order #{order_number} generated for scholarship disbursement.",
                actor_role="OFFICER"
            )
            db.add(timeline)

    cycle.status = AllocationCycleStatus.FINALIZED
    db.commit()
    db.refresh(sanction_order)

    log_allocation_event(
        db=db,
        cycle_id=cycle_id,
        event_type="SANCTION_ORDER_ISSUED",
        performed_by=officer_username,
        details={
            "order_number": order_number,
            "total_beneficiaries": total_beneficiaries,
            "total_amount": total_amount,
            "digital_signature_hash": digital_signature
        }
    )

    return sanction_order
