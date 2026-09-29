import secrets
from datetime import datetime, timezone
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.db.models.user import User, UserRole
from app.db.models.institution import (
    InstitutionMaster,
    InstitutionProfile,
    InstitutionFeeStructure,
    InstitutionVerification,
    DefectNotice,
    InstitutionGrievance
)
from app.db.models.application import Application, ApplicationTimeline
from app.db.models.document import Document
from app.core.security import hash_password, create_access_token, create_refresh_token
from app.core.crypto import encrypt_field, blind_index
from app.schemas.institution import (
    InstitutionMasterResponse,
    InstitutionRegisterRequest,
    InstitutionProfileResponse,
    DashboardStatsResponse,
    VerifyStudentRequest,
    DefectNoticeRequest,
    BulkVerifyRequest,
    BulkVerifyResponse,
    FeeStructureCreate,
    FeeStructureResponse,
    InstitutionGrievanceCreate,
    InstitutionGrievanceResponse
)
from app.services.institution_service import (
    verify_single_application,
    return_defective_application,
    bulk_verify_applications
)

router = APIRouter()

def _get_institution_profile_for_user(user: User, db: Session) -> InstitutionProfile:
    """Helper to retrieve or resolve the InstitutionProfile for the logged-in user."""
    if user.role == UserRole.INSTITUTION and user.institution_profile:
        return user.institution_profile
    
    # If officer/admin is testing/inspecting, fallback to the first active institution profile (e.g. BIT Sindri)
    if user.role in [UserRole.OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        profile = db.query(InstitutionProfile).first()
        if profile:
            return profile
            
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Logged-in user is not associated with an approved educational institution profile."
    )

@router.get("/lookup", response_model=List[InstitutionMasterResponse])
def lookup_institutions(
    query: str = Query(..., min_length=2, description="Search by AISHE code, UDISE code, or Institution Name"),
    db: Session = Depends(get_db)
):
    """
    Feature 37: Master Lookup of Accredited Higher Education and School Institutions.
    """
    search_term = f"%{query}%"
    results = (
        db.query(InstitutionMaster)
        .filter(
            InstitutionMaster.is_active == True,
            or_(
                InstitutionMaster.aishe_code.ilike(search_term),
                InstitutionMaster.udise_code.ilike(search_term),
                InstitutionMaster.name.ilike(search_term),
                InstitutionMaster.district.ilike(search_term)
            )
        )
        .limit(20)
        .all()
    )
    return results

@router.post("/register")
def register_institution(
    req: InstitutionRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Feature 37: Institutional Nodal Officer Onboarding.
    """
    # 1. Check AISHE code exists in Master Directory
    master_inst = db.query(InstitutionMaster).filter(
        InstitutionMaster.aishe_code == req.aishe_code,
        InstitutionMaster.is_active == True
    ).first()
    if not master_inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AISHE/U-DISE code '{req.aishe_code}' not found in the Government Accredited Directory."
        )

    # 2. Check if email already registered
    existing_user = db.query(User).filter(User.email == req.official_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this official email address already exists."
        )

    # 3. Create User
    new_user = User(
        email=req.official_email,
        hashed_password=hash_password(req.password),
        role=UserRole.INSTITUTION,
        is_active=True,
        is_verified=True,
        mobile_number_hash=blind_index(req.contact_mobile),
        mobile_number_enc=encrypt_field(req.contact_mobile)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Create InstitutionProfile
    profile = InstitutionProfile(
        user_id=new_user.id,
        aishe_code=master_inst.aishe_code,
        nodal_officer_name=req.nodal_officer_name,
        nodal_officer_designation=req.nodal_officer_designation,
        official_email=req.official_email,
        contact_mobile=req.contact_mobile,
        verification_status="APPROVED"
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    access_token = create_access_token(data={"sub": new_user.id, "role": new_user.role.value})
    refresh_token = create_refresh_token(data={"sub": new_user.id, "role": new_user.role.value})

    return {
        "message": f"Successfully registered Nodal Officer for {master_inst.name}",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "institution_name": master_inst.name,
        "aishe_code": master_inst.aishe_code
    }

@router.get("/profile", response_model=InstitutionProfileResponse)
def get_institution_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch active institutional profile and affiliation details."""
    profile = _get_institution_profile_for_user(current_user, db)
    master = profile.master_institution
    return InstitutionProfileResponse(
        id=profile.id,
        aishe_code=profile.aishe_code,
        institution_name=master.name if master else "Accredited Institution",
        institution_type=master.institution_type if master else "Higher Education",
        affiliated_university=master.affiliated_university if master else None,
        state=master.state if master else "Jharkhand",
        district=master.district if master else "Ranchi",
        nodal_officer_name=profile.nodal_officer_name,
        nodal_officer_designation=profile.nodal_officer_designation,
        official_email=profile.official_email,
        contact_mobile=profile.contact_mobile,
        verification_status=profile.verification_status
    )

@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 47: Institution Dashboard KPI counters.
    """
    profile = _get_institution_profile_for_user(current_user, db)
    aishe_code = profile.aishe_code

    all_apps = db.query(Application).all()
    # Filter applications mapped to this institution's AISHE code
    mapped_apps = [a for a in all_apps if (a.application_data or {}).get("institution_code_aishe") == aishe_code]

    pending = [a for a in mapped_apps if a.status in ["SUBMITTED", "DRAFT"]]
    verified = [a for a in mapped_apps if a.status in ["INSTITUTION_VERIFIED", "UNDER_SCRUTINY", "APPROVED"]]
    defective = [a for a in mapped_apps if a.status == "DEFICIENT"]
    rejected = [a for a in mapped_apps if a.status == "REJECTED"]

    return DashboardStatsResponse(
        pending_count=len(pending),
        verified_count=len(verified),
        defective_count=len(defective),
        rejected_count=len(rejected),
        total_count=len(mapped_apps),
        total_st_beneficiaries=len(mapped_apps)
    )

@router.get("/applications")
def list_institution_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    course: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists student applications mapped to this institution's AISHE code.
    """
    profile = _get_institution_profile_for_user(current_user, db)
    aishe_code = profile.aishe_code

    all_apps = db.query(Application).order_by(Application.created_at.desc()).all()
    filtered = []

    for app in all_apps:
        data = app.application_data or {}
        if data.get("institution_code_aishe") != aishe_code:
            continue

        if status_filter and status_filter.upper() != "ALL":
            if app.status != status_filter.upper():
                continue

        if course:
            app_course = data.get("course_name", "")
            if course.lower() not in app_course.lower():
                continue

        if search:
            q = search.lower()
            name = data.get("full_name", "").lower()
            app_no = app.application_number.lower()
            roll = str(data.get("roll_number", "")).lower()
            if q not in name and q not in app_no and q not in roll:
                continue

        filtered.append({
            "id": app.id,
            "application_number": app.application_number,
            "student_name": data.get("full_name", "ST Student"),
            "course_name": data.get("course_name", "N/A"),
            "year_of_study": data.get("current_year_of_study", 1),
            "roll_number": data.get("roll_number", "BIT-2023-ST-042"),
            "submission_date": app.submission_date.isoformat() if app.submission_date else None,
            "status": app.status,
            "annual_family_income": data.get("annual_family_income"),
            "scheme_name": app.scheme.scheme_name if app.scheme else "ST Post-Matric Scholarship",
            "is_locked": app.is_locked
        })

    return filtered

@router.get("/applications/{id}/details")
def get_application_verification_details(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Features 38, 39, 41, 42: Comprehensive Student Verification Dossier.
    """
    profile = _get_institution_profile_for_user(current_user, db)
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app_data = app.application_data or {}
    
    # Check AISHE code match
    if app_data.get("institution_code_aishe") != profile.aishe_code and current_user.role == UserRole.INSTITUTION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This application belongs to a different educational institution."
        )

    # Documents uploaded by this student
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
            "is_verified": (d.scan_status == "CLEAN"),
            "issued_date": d.issued_date.isoformat() if d.issued_date else None,
            "expiry_date": d.expiry_date.isoformat() if d.expiry_date else None,
            "is_digilocker": (d.source == "DIGILOCKER_FETCH"),
            "preview_url": f"/api/v1/documents/{d.id}/preview"
        })

    # Approved Fee Structure for this course
    course_name = app_data.get("course_name", "")
    approved_fee = (
        db.query(InstitutionFeeStructure)
        .filter(
            InstitutionFeeStructure.institution_id == profile.id,
            InstitutionFeeStructure.course_name.ilike(f"%{course_name}%")
        )
        .first()
    )

    # Existing verification if any
    verification = db.query(InstitutionVerification).filter(
        InstitutionVerification.application_id == app.id
    ).first()

    # Active defect notice if any
    defect = db.query(DefectNotice).filter(
        DefectNotice.application_id == app.id,
        DefectNotice.is_resolved == False
    ).order_by(DefectNotice.created_at.desc()).first()

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
        "student_details": {
            "full_name": app_data.get("full_name"),
            "dob": app_data.get("dob"),
            "gender": app_data.get("gender"),
            "category": app_data.get("category", "Scheduled Tribe (ST)"),
            "sub_caste": app_data.get("sub_caste"),
            "father_name": app_data.get("father_name"),
            "annual_family_income": app_data.get("annual_family_income"),
            "address": f"{app_data.get('address_line1', '')}, {app_data.get('district', '')}, {app_data.get('state', '')} - {app_data.get('pincode', '')}"
        },
        "academic_details": {
            "institution_name": app_data.get("institution_name"),
            "institution_code_aishe": app_data.get("institution_code_aishe"),
            "course_name": course_name,
            "current_year_of_study": app_data.get("current_year_of_study", 1),
            "roll_number": app_data.get("roll_number", "BIT-2023-ST-042"),
            "admission_date": app_data.get("admission_date", "2023-08-01")
        },
        "fee_details": {
            "claimed_annual_fee": float(app_data.get("annual_course_fee", 45000.0)),
            "approved_schedule": {
                "course_name": approved_fee.course_name if approved_fee else course_name,
                "tuition_fee": float(approved_fee.tuition_fee) if approved_fee else 35000.0,
                "admission_fee": float(approved_fee.admission_fee) if approved_fee else 2500.0,
                "exam_fee": float(approved_fee.exam_fee) if approved_fee else 3000.0,
                "library_fee": float(approved_fee.library_fee) if approved_fee else 1500.0,
                "hostel_fee": float(approved_fee.hostel_fee) if approved_fee else 12000.0,
                "total_annual_fee": float(approved_fee.total_annual_fee) if approved_fee else 54000.0
            } if approved_fee else None
        },
        "documents": doc_list,
        "existing_verification": {
            "bonafide_confirmed": verification.bonafide_confirmed,
            "attendance_percentage": verification.attendance_percentage,
            "attendance_compliant": verification.attendance_compliant,
            "is_hosteller": verification.is_hosteller,
            "hostel_name": verification.hostel_name,
            "fee_status": verification.fee_status,
            "fee_approved": float(verification.fee_approved) if verification.fee_approved else None,
            "digital_stamp": verification.digital_stamp,
            "verified_at": verification.verified_at.isoformat() if verification.verified_at else None,
            "remarks": verification.remarks
        } if verification else None,
        "active_defect_notice": {
            "id": defect.id,
            "defect_category": defect.defect_category,
            "defect_description": defect.defect_description,
            "correction_deadline": defect.correction_deadline.isoformat(),
            "created_at": defect.created_at.isoformat()
        } if defect else None
    }

@router.post("/applications/{id}/verify")
def verify_application_endpoint(
    id: str,
    req: VerifyStudentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Features 38, 39, 40, 41, 42, 46: Verify Student Bonafide, Attendance (75% rule), Fees, Hostel & Apply Digital Stamp.
    """
    profile = _get_institution_profile_for_user(current_user, db)
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app_data = app.application_data or {}
    if app_data.get("institution_code_aishe") != profile.aishe_code and current_user.role == UserRole.INSTITUTION:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized for this institution")

    ver = verify_single_application(db, app, profile, current_user, req)
    return {
        "message": f"Application {app.application_number} verified and digitally sealed by {profile.nodal_officer_name}.",
        "application_number": app.application_number,
        "verification_status": ver.verification_status,
        "attendance_percentage": ver.attendance_percentage,
        "attendance_compliant": ver.attendance_compliant,
        "digital_stamp": ver.digital_stamp,
        "verified_at": ver.verified_at.isoformat()
    }

@router.post("/applications/{id}/return-defective")
def return_defective_endpoint(
    id: str,
    req: DefectNoticeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 44: Defective Application Return with Category & Correction Deadline.
    """
    profile = _get_institution_profile_for_user(current_user, db)
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app_data = app.application_data or {}
    if app_data.get("institution_code_aishe") != profile.aishe_code and current_user.role == UserRole.INSTITUTION:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized for this institution")

    defect = return_defective_application(db, app, profile, req)
    return {
        "message": f"Defect notice issued for application {app.application_number}.",
        "defect_id": defect.id,
        "defect_category": defect.defect_category,
        "correction_deadline": defect.correction_deadline.isoformat(),
        "application_status": "DEFICIENT"
    }

@router.post("/applications/bulk-verify", response_model=BulkVerifyResponse)
def bulk_verify_endpoint(
    req: BulkVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 43: Bulk Verification Workflow.
    """
    profile = _get_institution_profile_for_user(current_user, db)
    return bulk_verify_applications(db, profile, current_user, req)

@router.get("/fee-structures", response_model=List[FeeStructureResponse])
def get_fee_structures(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 39: List approved fee structures for this institution.
    """
    profile = _get_institution_profile_for_user(current_user, db)
    return db.query(InstitutionFeeStructure).filter(
        InstitutionFeeStructure.institution_id == profile.id
    ).all()

@router.post("/fee-structures", response_model=FeeStructureResponse)
def create_fee_structure(
    req: FeeStructureCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 39: Define/update course-wise approved fee structure.
    """
    profile = _get_institution_profile_for_user(current_user, db)
    total = req.tuition_fee + req.admission_fee + req.exam_fee + req.library_fee + req.hostel_fee

    fee_rec = InstitutionFeeStructure(
        institution_id=profile.id,
        course_name=req.course_name,
        academic_year=req.academic_year,
        tuition_fee=req.tuition_fee,
        admission_fee=req.admission_fee,
        exam_fee=req.exam_fee,
        library_fee=req.library_fee,
        hostel_fee=req.hostel_fee,
        total_annual_fee=total
    )
    db.add(fee_rec)
    db.commit()
    db.refresh(fee_rec)
    return fee_rec

@router.get("/grievances", response_model=List[InstitutionGrievanceResponse])
def list_grievances(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 45: List institution grievances.
    """
    profile = _get_institution_profile_for_user(current_user, db)
    return db.query(InstitutionGrievance).filter(
        InstitutionGrievance.institution_id == profile.id
    ).order_by(InstitutionGrievance.created_at.desc()).all()

@router.post("/grievances", response_model=InstitutionGrievanceResponse)
def submit_grievance(
    req: InstitutionGrievanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 45: Lodge institution grievance.
    """
    profile = _get_institution_profile_for_user(current_user, db)
    ticket_no = f"GRV-INST-2026-{secrets.token_hex(3).upper()}"

    grv = InstitutionGrievance(
        institution_id=profile.id,
        ticket_number=ticket_no,
        category=req.category,
        subject=req.subject,
        description=req.description,
        priority=req.priority,
        status="OPEN"
    )
    db.add(grv)
    db.commit()
    db.refresh(grv)
    return grv
