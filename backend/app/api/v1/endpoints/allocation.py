from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.db.models.user import User, UserRole
from app.db.models.scheme import Scheme
from app.db.models.application import Application
from app.db.models.profile import StudentProfile
from app.db.models.allocation import (
    AllocationCycle,
    AllocationCycleStatus,
    MeritScore,
    AllocationResult,
    AllocationResultStatus,
    MeritObjection,
    ObjectionStatus,
    SanctionOrder,
    AllocationAuditLog
)
from app.schemas.allocation import (
    AllocationCycleCreate,
    AllocationCycleResponse,
    MeritScoreResponse,
    AllocationResultResponse,
    AllocationSimulationResponse,
    SchemeSwitchRequest,
    SchemeSwitchResponse,
    RenewalCheckRequest,
    RenewalCheckResponse,
    MeritObjectionCreate,
    MeritObjectionResolve,
    MeritObjectionResponse,
    SanctionOrderResponse,
    AllocationAuditResponse
)
from app.api.deps import get_current_user, require_roles
from app.services import allocation_service

router = APIRouter()

require_welfare_officer = require_roles([UserRole.OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN])


@router.post("/cycles", response_model=AllocationCycleResponse)
def create_allocation_cycle(
    payload: AllocationCycleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_welfare_officer)
):
    """Creates a new scholarship allocation cycle for a scheme and academic year."""
    scheme = db.query(Scheme).filter(Scheme.id == payload.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    cycle = AllocationCycle(
        scheme_id=payload.scheme_id,
        academic_year=payload.academic_year,
        financial_year=payload.financial_year,
        total_budget=payload.total_budget,
        total_seats=payload.total_seats,
        status=AllocationCycleStatus.DRAFT,
        created_by=current_user.id
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)

    resp = AllocationCycleResponse.model_validate(cycle)
    resp.scheme_name = scheme.scheme_name
    return resp


@router.get("/cycles", response_model=List[AllocationCycleResponse])
def list_allocation_cycles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all allocation cycles."""
    cycles = db.query(AllocationCycle).order_by(desc(AllocationCycle.created_at)).all()
    results = []
    for c in cycles:
        resp = AllocationCycleResponse.model_validate(c)
        if c.scheme:
            resp.scheme_name = c.scheme.scheme_name
        results.append(resp)
    return results


@router.get("/cycles/{cycle_id}", response_model=AllocationCycleResponse)
def get_allocation_cycle(
    cycle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches details of an allocation cycle."""
    cycle = db.query(AllocationCycle).filter(AllocationCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Allocation cycle not found")

    resp = AllocationCycleResponse.model_validate(cycle)
    if cycle.scheme:
        resp.scheme_name = cycle.scheme.scheme_name
    return resp


@router.post("/cycles/{cycle_id}/simulate", response_model=AllocationSimulationResponse)
def run_cycle_simulation(
    cycle_id: str,
    dry_run: bool = Query(True, description="Dry run simulation preview vs permanent allocation"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_welfare_officer)
):
    """
    Feature 66: Allocation Simulator & Dry Run preview.
    Features 60 & 69: Quota distribution and budgetary cap validation.
    """
    summary = allocation_service.run_allocation_engine(
        db=db,
        cycle_id=cycle_id,
        officer_username=current_user.email or current_user.id,
        dry_run=dry_run
    )
    return summary


@router.get("/cycles/{cycle_id}/merit-list", response_model=List[MeritScoreResponse])
def get_merit_list(
    cycle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Feature 59 & 61: Ranked merit list with tie-breaking criteria."""
    scores = db.query(MeritScore).filter(
        MeritScore.allocation_cycle_id == cycle_id
    ).order_by(MeritScore.rank_overall).all()

    # If scores haven't been computed yet, compute them now
    if not scores:
        scores = allocation_service.compute_cycle_merit_scores(db, cycle_id)

    results = []
    for s in scores:
        resp = MeritScoreResponse.model_validate(s)
        app = s.application
        if app and app.student_id:
            resp.student_id = app.student_id
            profile = db.query(StudentProfile).filter(StudentProfile.user_id == app.student_id).first()
            user = db.query(User).filter(User.id == app.student_id).first()
            resp.student_name = profile.full_name if profile else (user.email if user else "Student")
        results.append(resp)
    return results


@router.get("/cycles/{cycle_id}/results", response_model=List[AllocationResultResponse])
def get_allocation_results(
    cycle_id: str,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches seat allocation results (Selected, Waitlisted, etc.)."""
    q = db.query(AllocationResult).filter(AllocationResult.allocation_cycle_id == cycle_id)
    if status_filter:
        q = q.filter(AllocationResult.status == status_filter)

    items = q.all()
    results = []
    for item in items:
        resp = AllocationResultResponse.model_validate(item)
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == item.student_id).first()
        user = db.query(User).filter(User.id == item.student_id).first()
        resp.student_name = profile.full_name if profile else (user.email if user else "Student")
        results.append(resp)
    return results


@router.post("/cycles/{cycle_id}/promote-waitlist")
def promote_waitlist_candidate(
    cycle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_welfare_officer)
):
    """Feature 62: Manual or dropout-triggered waitlist auto-promotion."""
    promoted = allocation_service.promote_from_waitlist(
        db=db,
        cycle_id=cycle_id,
        officer_username=current_user.email or current_user.id
    )
    if not promoted:
        return {"message": "No waitlisted candidates available for promotion", "promoted": None}
    return {"message": "Waitlisted candidate elevated to SELECTED", "promoted": promoted}


@router.post("/switch-scheme", response_model=SchemeSwitchResponse)
def execute_scheme_switching(
    payload: SchemeSwitchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Feature 63: Student multi-scheme offer switching with seat release & auto-fill."""
    target_student_id = current_user.id
    res = allocation_service.handle_scheme_switching(
        db=db,
        student_id=target_student_id,
        from_cycle_id=payload.from_cycle_id,
        to_cycle_id=payload.to_cycle_id,
        officer_username=current_user.email or current_user.id
    )
    return res


@router.post("/check-renewal", response_model=RenewalCheckResponse)
def evaluate_renewal_eligibility(
    payload: RenewalCheckRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Feature 65: Academic performance threshold validator for renewals
    (≥50% ST, ≥45% PVTG).
    """
    res = allocation_service.check_renewal_eligibility(
        marks_percentage=payload.marks_percentage,
        is_pvtg=payload.is_pvtg
    )
    return res


@router.post("/cycles/{cycle_id}/open-objection-window")
def open_cycle_objection_window(
    cycle_id: str,
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_welfare_officer)
):
    """Feature 67: Open 7-Day Merit Objection & Grievance Window."""
    return allocation_service.open_objection_window(
        db=db,
        cycle_id=cycle_id,
        days=days,
        officer_username=current_user.email or current_user.id
    )


@router.post("/cycles/{cycle_id}/objections", response_model=MeritObjectionResponse)
def file_merit_objection(
    cycle_id: str,
    payload: MeritObjectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Feature 67: Submit student merit objection."""
    obj = allocation_service.submit_merit_objection(
        db=db,
        student_id=current_user.id,
        cycle_id=cycle_id,
        objection_type=payload.objection_type,
        description=payload.description,
        claimed_score=payload.claimed_score,
        supporting_doc_url=payload.supporting_doc_url
    )
    return obj


@router.get("/cycles/{cycle_id}/objections", response_model=List[MeritObjectionResponse])
def list_cycle_objections(
    cycle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all objections filed for this cycle."""
    if current_user.role == UserRole.STUDENT:
        objs = db.query(MeritObjection).filter(
            MeritObjection.allocation_cycle_id == cycle_id,
            MeritObjection.student_id == current_user.id
        ).all()
    else:
        objs = db.query(MeritObjection).filter(
            MeritObjection.allocation_cycle_id == cycle_id
        ).all()
    return objs


@router.post("/objections/{objection_id}/resolve", response_model=MeritObjectionResponse)
def adjudicate_merit_objection(
    objection_id: str,
    payload: MeritObjectionResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_welfare_officer)
):
    """Feature 67: Officer resolution of merit objection."""
    obj = allocation_service.resolve_merit_objection(
        db=db,
        objection_id=objection_id,
        status_decision=payload.status_decision,
        resolution_remarks=payload.resolution_remarks,
        officer_id=current_user.id,
        officer_username=current_user.email or current_user.id
    )
    return obj


@router.post("/cycles/{cycle_id}/generate-sanction-order", response_model=SanctionOrderResponse)
def create_sanction_order(
    cycle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_welfare_officer)
):
    """
    Feature 68: Generates final Sanction Order with unique order number
    and SHA-256 digital signature seal.
    """
    order = allocation_service.generate_final_sanction_order(
        db=db,
        cycle_id=cycle_id,
        officer_id=current_user.id,
        officer_username=current_user.email or current_user.id
    )
    return order


@router.get("/cycles/{cycle_id}/sanction-orders", response_model=List[SanctionOrderResponse])
def get_cycle_sanction_orders(
    cycle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List sanction orders issued for an allocation cycle."""
    orders = db.query(SanctionOrder).filter(SanctionOrder.allocation_cycle_id == cycle_id).all()
    return orders


@router.get("/cycles/{cycle_id}/audit-trail", response_model=List[AllocationAuditResponse])
def get_cycle_audit_trail(
    cycle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_welfare_officer)
):
    """Feature 70: Immutable allocation audit trail."""
    logs = db.query(AllocationAuditLog).filter(
        AllocationAuditLog.allocation_cycle_id == cycle_id
    ).order_by(desc(AllocationAuditLog.timestamp)).all()
    return logs


@router.get("/student/my-allocations")
def get_student_allocations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Student view of their merit rankings and scholarship award outcomes."""
    results = db.query(AllocationResult).filter(AllocationResult.student_id == current_user.id).all()
    output = []
    for r in results:
        cycle = r.allocation_cycle
        scheme = cycle.scheme if cycle else None
        m_score = db.query(MeritScore).filter(
            MeritScore.allocation_cycle_id == r.allocation_cycle_id,
            MeritScore.application_id == r.application_id
        ).first()

        output.append({
            "cycle_id": r.allocation_cycle_id,
            "scheme_name": scheme.scheme_name if scheme else "Tribal Scholarship",
            "academic_year": cycle.academic_year if cycle else "2026-2027",
            "allocation_status": r.status,
            "quota_category": r.quota_category,
            "allocated_amount": r.allocated_amount,
            "waitlist_number": r.waitlist_number,
            "sanction_order_number": r.sanction_order_number,
            "rank_overall": m_score.rank_overall if m_score else None,
            "total_merit_score": m_score.total_merit_score if m_score else None,
            "objection_window_open": cycle.status == AllocationCycleStatus.OBJECTION_WINDOW if cycle else False
        })
    return output
