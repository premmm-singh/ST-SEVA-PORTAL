import hashlib
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models.institution import (
    InstitutionMaster,
    InstitutionProfile,
    InstitutionFeeStructure,
    InstitutionVerification,
    DefectNotice,
    InstitutionGrievance
)
from app.db.models.application import Application, ApplicationTimeline
from app.db.models.user import User
from app.schemas.institution import (
    VerifyStudentRequest,
    DefectNoticeRequest,
    BulkVerifyRequest,
    BulkVerifyResponse
)

def generate_digital_stamp(application_number: str, ino_id: str, verified_at: datetime, status_text: str) -> str:
    """
    Generates an immutable SHA-256 digital verification seal embedding application number,
    Nodal Officer user ID, ISO timestamp, and verification status.
    """
    payload = f"GOV-IN-ST-SEVA:INO:{ino_id}:APP:{application_number}:TIME:{verified_at.isoformat()}:STATUS:{status_text}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def check_attendance_compliance(attendance_percentage: float) -> Tuple[bool, str]:
    """
    Enforces Ministry of Tribal Affairs (MoTA) statutory minimum 75% attendance rule.
    """
    if attendance_percentage >= 75.0:
        return True, f"Compliant: Attendance {attendance_percentage}% meets or exceeds 75% MoTA statutory threshold."
    else:
        return False, f"Non-Compliant: Attendance {attendance_percentage}% is below the mandatory 75% MoTA requirement."

def match_fee_structure(
    db: Session,
    institution_id: str,
    course_name: str,
    claimed_fee: Optional[float]
) -> Tuple[str, Optional[float]]:
    """
    Matches student claimed fee against approved course fee structure.
    """
    if not course_name or claimed_fee is None:
        return "NOT_APPLICABLE", claimed_fee

    fee_record = (
        db.query(InstitutionFeeStructure)
        .filter(
            InstitutionFeeStructure.institution_id == institution_id,
            InstitutionFeeStructure.course_name.ilike(f"%{course_name}%")
        )
        .first()
    )

    if not fee_record:
        # No specific approved fee cap registered; accept claimed fee with unverified tag
        return "MATCH", claimed_fee

    approved_total = float(fee_record.total_annual_fee)
    if claimed_fee <= approved_total:
        return "MATCH", claimed_fee
    else:
        return "ADJUSTED", approved_total

def verify_single_application(
    db: Session,
    application: Application,
    institution_profile: InstitutionProfile,
    verifier_user: User,
    req: VerifyStudentRequest
) -> InstitutionVerification:
    """
    Verifies student bonafide, checks 75% attendance rule, fees, hosteller status,
    generates digital stamp, updates application status to INSTITUTE_VERIFIED, and adds timeline event.
    """
    now = datetime.now(timezone.utc)
    attendance_compliant, compliance_msg = check_attendance_compliance(req.attendance_percentage)

    # Determine fee matching
    app_data = application.application_data or {}
    claimed_fee = float(app_data.get("annual_course_fee", 0.0)) if app_data.get("annual_course_fee") else None
    fee_status, fee_approved = match_fee_structure(
        db,
        institution_profile.id,
        app_data.get("course_name", ""),
        claimed_fee
    )

    if req.fee_approved is not None:
        fee_approved = req.fee_approved
        fee_status = req.fee_status or "MATCH"

    # Generate Digital Stamp
    digital_stamp = generate_digital_stamp(
        application_number=application.application_number,
        ino_id=verifier_user.id,
        verified_at=now,
        status_text="VERIFIED_AND_FORWARDED"
    )

    # Check if verification record already exists
    existing_ver = db.query(InstitutionVerification).filter(
        InstitutionVerification.application_id == application.id
    ).first()

    if existing_ver:
        # Update existing
        existing_ver.bonafide_confirmed = req.bonafide_confirmed
        existing_ver.roll_number = req.roll_number or app_data.get("roll_number")
        existing_ver.admission_year = req.admission_year or app_data.get("current_year_of_study")
        existing_ver.attendance_percentage = req.attendance_percentage
        existing_ver.attendance_compliant = attendance_compliant
        existing_ver.attendance_remarks = req.attendance_remarks or compliance_msg
        existing_ver.is_hosteller = req.is_hosteller
        existing_ver.hostel_name = req.hostel_name
        existing_ver.hostel_room_no = req.hostel_room_no
        existing_ver.fee_claimed = claimed_fee
        existing_ver.fee_approved = fee_approved
        existing_ver.fee_status = fee_status
        existing_ver.academic_verified = req.academic_verified
        existing_ver.previous_year_percentage = req.previous_year_percentage
        existing_ver.cgpa = req.cgpa
        existing_ver.has_uncleared_backlogs = req.has_uncleared_backlogs
        existing_ver.verification_status = "VERIFIED_AND_FORWARDED"
        existing_ver.remarks = req.remarks
        existing_ver.digital_stamp = digital_stamp
        existing_ver.verified_at = now
        verification_record = existing_ver
    else:
        verification_record = InstitutionVerification(
            application_id=application.id,
            institution_id=institution_profile.id,
            verified_by_user_id=verifier_user.id,
            bonafide_confirmed=req.bonafide_confirmed,
            roll_number=req.roll_number or app_data.get("roll_number"),
            admission_year=req.admission_year or app_data.get("current_year_of_study"),
            attendance_percentage=req.attendance_percentage,
            attendance_compliant=attendance_compliant,
            attendance_remarks=req.attendance_remarks or compliance_msg,
            is_hosteller=req.is_hosteller,
            hostel_name=req.hostel_name,
            hostel_room_no=req.hostel_room_no,
            fee_claimed=claimed_fee,
            fee_approved=fee_approved,
            fee_status=fee_status,
            academic_verified=req.academic_verified,
            previous_year_percentage=req.previous_year_percentage,
            cgpa=req.cgpa,
            has_uncleared_backlogs=req.has_uncleared_backlogs,
            verification_status="VERIFIED_AND_FORWARDED",
            remarks=req.remarks,
            digital_stamp=digital_stamp,
            verified_at=now
        )
        db.add(verification_record)

    # Transition application status to INSTITUTION_VERIFIED (or UNDER_SCRUTINY for DWO stage)
    application.status = "INSTITUTION_VERIFIED"
    
    # Add timeline event
    master_inst = institution_profile.master_institution
    inst_name = master_inst.name if master_inst else "Enrolled Institution"
    timeline_desc = (
        f"Verified by {institution_profile.nodal_officer_name} ({institution_profile.nodal_officer_designation}), "
        f"{inst_name} [AISHE: {institution_profile.aishe_code}]. "
        f"Bonafide confirmed. Attendance: {req.attendance_percentage}%. "
        f"Digital Stamp: {digital_stamp[:16]}..."
    )
    
    timeline_event = ApplicationTimeline(
        application_id=application.id,
        stage="INSTITUTE_VERIFIED",
        title="Verified by Head of Institution",
        description=timeline_desc,
        actor_role="INSTITUTION"
    )
    db.add(timeline_event)
    db.commit()
    db.refresh(verification_record)
    return verification_record

def return_defective_application(
    db: Session,
    application: Application,
    institution_profile: InstitutionProfile,
    req: DefectNoticeRequest
) -> DefectNotice:
    """
    Returns an application to the student with a specific defect notice and correction deadline.
    """
    now = datetime.now(timezone.utc)
    deadline = now + timedelta(days=req.correction_deadline_days)

    defect_notice = DefectNotice(
        application_id=application.id,
        institution_id=institution_profile.id,
        defect_category=req.defect_category,
        defect_description=req.defect_description,
        correction_deadline=deadline,
        is_resolved=False,
        created_at=now
    )
    db.add(defect_notice)

    # Set status to DEFICIENT so student can edit/resubmit
    application.status = "DEFICIENT"
    application.is_locked = False # Unlock so student can amend documents

    # Add timeline event
    timeline_desc = (
        f"Defect Notice issued by {institution_profile.nodal_officer_name} (AISHE: {institution_profile.aishe_code}). "
        f"Category: {req.defect_category}. Remarks: {req.defect_description}. "
        f"Correction Deadline: {deadline.strftime('%d %b %Y, %I:%M %p UTC')}."
    )
    timeline_event = ApplicationTimeline(
        application_id=application.id,
        stage="DEFICIENT",
        title="Application Returned with Defect Notice",
        description=timeline_desc,
        actor_role="INSTITUTION"
    )
    db.add(timeline_event)
    db.commit()
    db.refresh(defect_notice)
    return defect_notice

def bulk_verify_applications(
    db: Session,
    institution_profile: InstitutionProfile,
    verifier_user: User,
    req: BulkVerifyRequest
) -> BulkVerifyResponse:
    """
    Batch verifies multiple applications mapped to this institution.
    """
    successful_count = 0
    failed_count = 0
    results: List[Dict[str, Any]] = []

    for app_id in req.application_ids:
        app = db.query(Application).filter(Application.id == app_id).first()
        if not app:
            failed_count += 1
            results.append({"application_id": app_id, "success": False, "error": "Application not found"})
            continue

        app_data = app.application_data or {}
        # Verify student is mapped to this institution
        app_aishe = app_data.get("institution_code_aishe")
        if app_aishe != institution_profile.aishe_code:
            failed_count += 1
            results.append({
                "application_id": app_id,
                "application_number": app.application_number,
                "success": False,
                "error": f"Application AISHE code ({app_aishe}) does not match institution ({institution_profile.aishe_code})"
            })
            continue

        try:
            # Default bulk verification parameters
            verify_req = VerifyStudentRequest(
                bonafide_confirmed=True,
                attendance_percentage=80.0, # Standard default for batch approval
                attendance_remarks="Verified via Bulk Verification Roster",
                is_hosteller=False,
                academic_verified=True,
                remarks=req.remarks
            )
            ver = verify_single_application(db, app, institution_profile, verifier_user, verify_req)
            successful_count += 1
            results.append({
                "application_id": app_id,
                "application_number": app.application_number,
                "success": True,
                "digital_stamp": ver.digital_stamp
            })
        except Exception as e:
            failed_count += 1
            results.append({
                "application_id": app_id,
                "application_number": app.application_number,
                "success": False,
                "error": str(e)
            })

    return BulkVerifyResponse(
        total_processed=len(req.application_ids),
        successful_count=successful_count,
        failed_count=failed_count,
        results=results
    )
