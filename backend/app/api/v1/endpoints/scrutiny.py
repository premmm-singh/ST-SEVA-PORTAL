import secrets
from datetime import datetime, timezone
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.db.models.user import User, UserRole
from app.db.models.application import Application, ApplicationTimeline
from app.db.models.document import Document
from app.db.models.institution import InstitutionVerification
from app.db.models.scrutiny import (
    ScrutinyAction,
    DuplicateFlag,
    PhysicalInspection,
    DiscrepancyFlag
)
from app.schemas.scrutiny import (
    ScrutinyStatsResponse,
    CrossVerifyRequest,
    CrossVerifyResponse,
    DuplicateFlagResponse,
    PhysicalInspectionCreate,
    PhysicalInspectionResponse,
    ScrutinyActionRequest,
    ScrutinyActionResponse,
    ClearDuplicateRequest
)
from app.services.scrutiny_service import (
    verify_caste_certificate_external,
    verify_income_certificate_external,
    verify_domicile_certificate_external,
    verify_ration_card_external,
    verify_udid_disability_external,
    verify_death_certificate_external,
    run_duplicate_detection,
    calculate_risk_assessment,
    execute_scrutiny_action
)

router = APIRouter()

# Authorize Welfare Officers and Admins
require_welfare_officer = require_roles([UserRole.OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN])

@router.get("/dashboard-stats", response_model=ScrutinyStatsResponse)
def get_scrutiny_dashboard_stats(
    current_user: User = Depends(require_welfare_officer),
    db: Session = Depends(get_db)
):
    """
    Feature 48 & 57: Real-time scrutiny counters and risk levels.
    """
    all_apps = db.query(Application).all()
    
    pending_l1 = [a for a in all_apps if a.status in ["SUBMITTED", "INSTITUTION_VERIFIED"]]
    pending_l2 = [a for a in all_apps if a.status == "UNDER_SCRUTINY"]
    pending_l3 = [a for a in all_apps if a.status == "DWO_APPROVED"]
    sanctioned = [a for a in all_apps if a.status == "SANCTIONED"]
    deficient = [a for a in all_apps if a.status == "DEFICIENT"]
    rejected = [a for a in all_apps if a.status == "REJECTED"]

    # Red risk flags count
    red_flags = db.query(DiscrepancyFlag).filter(
        DiscrepancyFlag.risk_level == "RED",
        DiscrepancyFlag.is_resolved == False
    ).count()

    return ScrutinyStatsResponse(
        pending_l1_count=len(pending_l1),
        pending_l2_count=len(pending_l2),
        pending_l3_count=len(pending_l3),
        sanctioned_count=len(sanctioned),
        deficient_count=len(deficient),
        rejected_count=len(rejected),
        red_risk_count=red_flags,
        total_count=len(all_apps)
    )

@router.get("/applications")
def list_scrutiny_queue(
    stage: Optional[str] = Query(None, description="SUBMITTED, INSTITUTION_VERIFIED, UNDER_SCRUTINY, DWO_APPROVED, SANCTIONED, DEFICIENT, ALL"),
    district: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_welfare_officer),
    db: Session = Depends(get_db)
):
    """
    Feature 48 & 57: Filterable scrutiny queue for Welfare Officers.
    """
    query = db.query(Application).order_by(Application.created_at.desc())
    all_apps = query.all()

    results = []
    for app in all_apps:
        data = app.application_data or {}
        
        # Filter stage
        if stage and stage.upper() != "ALL":
            if app.status != stage.upper():
                continue

        # Filter district
        app_dist = data.get("district", "")
        if district and district.lower() not in app_dist.lower():
            continue

        # Search filter
        if search:
            q = search.lower()
            name = (data.get("full_name") or "").lower()
            app_no = app.application_number.lower()
            roll = str(data.get("roll_number") or "").lower()
            if q not in name and q not in app_no and q not in roll:
                continue

        # Calculate live risk assessment
        risk_info = calculate_risk_assessment(db, app)
        if risk_level and risk_level.upper() != "ALL":
            if risk_info["risk_level"] != risk_level.upper():
                continue

        results.append({
            "id": app.id,
            "application_number": app.application_number,
            "student_name": data.get("full_name", "ST Applicant"),
            "district": app_dist or "Ranchi",
            "state": data.get("state", "Jharkhand"),
            "course_name": data.get("course_name", "N/A"),
            "institution_name": data.get("institution_name", "N/A"),
            "annual_family_income": data.get("annual_family_income"),
            "status": app.status,
            "submission_date": app.submission_date.isoformat() if app.submission_date else None,
            "risk_level": risk_info["risk_level"],
            "risk_flags_count": risk_info["flags_count"],
            "duplicate_count": risk_info["duplicate_count"],
            "scheme_name": app.scheme.scheme_name if app.scheme else "ST Post-Matric Scholarship"
        })

    return results

@router.get("/applications/{id}/dossier")
def get_scrutiny_dossier(
    id: str,
    current_user: User = Depends(require_welfare_officer),
    db: Session = Depends(get_db)
):
    """
    Features 48, 49, 50, 51, 52, 53, 55, 56, 57: Comprehensive Welfare Officer Scrutiny Dossier.
    """
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app_data = app.application_data or {}
    
    # 1. Run live duplicate scan
    run_duplicate_detection(db, app)

    # 2. Risk Assessment
    risk_info = calculate_risk_assessment(db, app)

    # 3. Documents
    docs = db.query(Document).filter(
        Document.student_id == app.student_id,
        Document.is_active == True
    ).all()

    doc_list = []
    for d in docs:
        doc_list.append({
            "id": d.id,
            "category": d.document_category,
            "original_filename": d.original_filename,
            "file_size": d.file_size_bytes,
            "sha256_hash": d.sha256_hash,
            "is_digilocker": (d.source == "DIGILOCKER_FETCH"),
            "issued_date": d.issued_date.isoformat() if d.issued_date else None,
            "expiry_date": d.expiry_date.isoformat() if d.expiry_date else None,
            "preview_url": f"/api/v1/documents/{d.id}/preview"
        })

    # 4. Institutional Verification Record
    inst_ver = db.query(InstitutionVerification).filter(
        InstitutionVerification.application_id == app.id
    ).first()

    # 5. Duplicate Flags
    dup_flags = db.query(DuplicateFlag).filter(
        DuplicateFlag.application_id == app.id
    ).all()
    dup_list = []
    for df in dup_flags:
        matched_app = db.query(Application).filter(Application.id == df.matched_application_id).first()
        dup_list.append({
            "id": df.id,
            "match_type": df.match_type,
            "confidence_score": df.confidence_score,
            "match_details": df.match_details,
            "matched_application_id": df.matched_application_id,
            "matched_application_number": matched_app.application_number if matched_app else "N/A",
            "is_cleared": df.is_cleared,
            "cleared_remarks": df.cleared_remarks
        })

    # 6. Physical Spot Inspections
    inspections = db.query(PhysicalInspection).filter(
        PhysicalInspection.application_id == app.id
    ).all()
    insp_list = []
    for pi in inspections:
        inspector_user = db.query(User).filter(User.id == pi.inspector_id).first()
        insp_name = inspector_user.officer_profile.full_name if (inspector_user and inspector_user.officer_profile) else "Field Inspector"
        insp_list.append({
            "id": pi.id,
            "inspector_name": insp_name,
            "institution_name": pi.institution_name,
            "latitude": pi.latitude,
            "longitude": pi.longitude,
            "location_address": pi.location_address,
            "student_present": pi.student_present,
            "hostel_room_verified": pi.hostel_room_verified,
            "inspection_summary": pi.inspection_summary,
            "inspected_at": pi.inspected_at.isoformat()
        })

    # 7. Past Scrutiny Actions
    actions = db.query(ScrutinyAction).filter(
        ScrutinyAction.application_id == app.id
    ).order_by(ScrutinyAction.action_at.asc()).all()
    action_list = []
    for a in actions:
        off_user = db.query(User).filter(User.id == a.officer_id).first()
        off_name = off_user.officer_profile.full_name if (off_user and off_user.officer_profile) else "Officer"
        action_list.append({
            "id": a.id,
            "officer_name": off_name,
            "scrutiny_level": a.scrutiny_level,
            "decision": a.decision,
            "remarks": a.remarks,
            "digital_signature_hash": a.digital_signature_hash,
            "action_at": a.action_at.isoformat()
        })

    return {
        "application_id": app.id,
        "application_number": app.application_number,
        "status": app.status,
        "submission_date": app.submission_date.isoformat() if app.submission_date else None,
        "academic_year": app.academic_year,
        "scheme": {
            "id": app.scheme.id if app.scheme else None,
            "name": app.scheme.scheme_name if app.scheme else "ST Post-Matric Scholarship",
            "type": app.scheme.scheme_type if app.scheme else "CENTRAL_SECTOR"
        },
        "student_profile": {
            "full_name": app_data.get("full_name"),
            "dob": app_data.get("dob"),
            "gender": app_data.get("gender"),
            "category": app_data.get("category", "Scheduled Tribe (ST)"),
            "sub_caste": app_data.get("sub_caste"),
            "father_name": app_data.get("father_name"),
            "annual_family_income": app_data.get("annual_family_income"),
            "district": app_data.get("district", "Ranchi"),
            "state": app_data.get("state", "Jharkhand"),
            "bank_name": app_data.get("bank_name"),
            "bank_ifsc": app_data.get("bank_ifsc"),
            "dbt_seeded": True
        },
        "institutional_verification": {
            "bonafide_confirmed": inst_ver.bonafide_confirmed if inst_ver else True,
            "attendance_percentage": inst_ver.attendance_percentage if inst_ver else 84.5,
            "attendance_compliant": inst_ver.attendance_compliant if inst_ver else True,
            "is_hosteller": inst_ver.is_hosteller if inst_ver else False,
            "hostel_name": inst_ver.hostel_name if inst_ver else None,
            "fee_status": inst_ver.fee_status if inst_ver else "MATCH",
            "fee_approved": float(inst_ver.fee_approved) if (inst_ver and inst_ver.fee_approved) else 54000.0,
            "digital_stamp": inst_ver.digital_stamp if inst_ver else None,
            "verified_at": inst_ver.verified_at.isoformat() if (inst_ver and inst_ver.verified_at) else None
        } if inst_ver else None,
        "documents": doc_list,
        "risk_assessment": risk_info,
        "duplicate_flags": dup_list,
        "physical_inspections": insp_list,
        "scrutiny_history": action_list
    }

@router.post("/applications/{id}/cross-verify", response_model=CrossVerifyResponse)
def cross_verify_certificate(
    id: str,
    req: CrossVerifyRequest,
    current_user: User = Depends(require_welfare_officer),
    db: Session = Depends(get_db)
):
    """
    Features 49, 50, 51, 52, 54, 55: Automated State Database Cross-Verification Stubs.
    """
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app_data = app.application_data or {}
    cert_type = req.cert_type.upper()

    if cert_type == "CASTE":
        res = verify_caste_certificate_external(req.cert_number, req.sub_caste or app_data.get("sub_caste"))
    elif cert_type == "INCOME":
        claimed_income = req.claimed_income or float(app_data.get("annual_family_income", 120000.0))
        res = verify_income_certificate_external(req.cert_number, claimed_income)
    elif cert_type == "DOMICILE":
        res = verify_domicile_certificate_external(req.cert_number, req.district or app_data.get("district", "Ranchi"))
    elif cert_type == "RATION_CARD":
        res = verify_ration_card_external(req.cert_number, app_data.get("full_name", ""))
    elif cert_type == "UDID":
        res = verify_udid_disability_external(req.cert_number)
    elif cert_type == "DEATH":
        res = verify_death_certificate_external(req.cert_number)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported certificate type '{cert_type}'")

    return CrossVerifyResponse(
        cert_type=cert_type,
        verified=res.get("verified", False),
        details=res
    )

@router.post("/applications/{id}/run-deduplication")
def trigger_duplicate_scan(
    id: str,
    current_user: User = Depends(require_welfare_officer),
    db: Session = Depends(get_db)
):
    """
    Feature 53: Trigger multi-vector duplicate scan.
    """
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    flags = run_duplicate_detection(db, app)
    return {
        "message": f"Scan complete. {len(flags)} duplicate collision(s) detected.",
        "collisions_count": len(flags)
    }

@router.post("/applications/{id}/action", response_model=ScrutinyActionResponse)
def submit_scrutiny_action(
    id: str,
    req: ScrutinyActionRequest,
    current_user: User = Depends(require_welfare_officer),
    db: Session = Depends(get_db)
):
    """
    Features 48 & 58: Submit multi-level scrutiny action with mandatory checklist sign-off.
    """
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    action = execute_scrutiny_action(
        db=db,
        application=app,
        officer_user=current_user,
        scrutiny_level=req.scrutiny_level,
        decision=req.decision,
        checklist=req.checklist,
        remarks=req.remarks
    )

    officer_name = current_user.officer_profile.full_name if current_user.officer_profile else "Welfare Officer"
    return ScrutinyActionResponse(
        id=action.id,
        application_id=action.application_id,
        officer_name=officer_name,
        scrutiny_level=action.scrutiny_level,
        decision=action.decision,
        digital_signature_hash=action.digital_signature_hash,
        action_at=action.action_at,
        remarks=action.remarks
    )

@router.post("/applications/{id}/physical-inspection", response_model=PhysicalInspectionResponse)
def record_physical_inspection(
    id: str,
    req: PhysicalInspectionCreate,
    current_user: User = Depends(require_welfare_officer),
    db: Session = Depends(get_db)
):
    """
    Feature 56: Physical spot inspection report upload with GPS coordinates.
    """
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    pi = PhysicalInspection(
        application_id=app.id,
        inspector_id=current_user.id,
        institution_name=req.institution_name,
        latitude=req.latitude,
        longitude=req.longitude,
        location_address=req.location_address,
        student_present=req.student_present,
        hostel_room_verified=req.hostel_room_verified,
        inspection_summary=req.inspection_summary,
        photo_url=req.photo_url
    )
    db.add(pi)

    # Add timeline event
    inspector_name = current_user.officer_profile.full_name if current_user.officer_profile else "Field Welfare Inspector"
    t_desc = (
        f"On-site verification conducted at {req.institution_name} by {inspector_name}. "
        f"Student presence: {'Confirmed' if req.student_present else 'Absent'}. "
        f"GPS: ({req.latitude or 'N/A'}, {req.longitude or 'N/A'}). Summary: {req.inspection_summary}"
    )
    timeline_event = ApplicationTimeline(
        application_id=app.id,
        stage="SPOT_INSPECTION_CONDUCTED",
        title="Physical Spot Inspection Conducted",
        description=t_desc,
        actor_role="WELFARE_OFFICER"
    )
    db.add(timeline_event)
    db.commit()
    db.refresh(pi)

    return PhysicalInspectionResponse(
        id=pi.id,
        inspector_id=pi.inspector_id,
        inspector_name=inspector_name,
        institution_name=pi.institution_name,
        latitude=pi.latitude,
        longitude=pi.longitude,
        location_address=pi.location_address,
        student_present=pi.student_present,
        hostel_room_verified=pi.hostel_room_verified,
        inspection_summary=pi.inspection_summary,
        photo_url=pi.photo_url,
        inspected_at=pi.inspected_at
    )

@router.post("/flags/{flag_id}/clear")
def clear_duplicate_flag(
    flag_id: str,
    req: ClearDuplicateRequest,
    current_user: User = Depends(require_welfare_officer),
    db: Session = Depends(get_db)
):
    """
    Feature 53: Officer justification for clearing a duplicate collision flag.
    """
    flag = db.query(DuplicateFlag).filter(DuplicateFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Duplicate flag not found")

    flag.is_cleared = True
    flag.cleared_by_officer_id = current_user.id
    flag.cleared_remarks = req.remarks
    db.commit()

    return {
        "message": "Duplicate collision cleared with officer justification.",
        "flag_id": flag.id,
        "is_cleared": True
    }
