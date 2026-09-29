from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.db.models.user import User, UserRole
from app.db.models.profile import StudentProfile, OfficerProfile, AdminProfile
from app.db.models.security import MfaCredential
from app.core.crypto import encrypt_field, decrypt_field
from app.core.audit import record_audit_log
from app.schemas.profile import (
    UserProfileMeResponse, StudentProfileBase, StudentProfileResponse,
    OfficerProfileBase, OfficerProfileResponse, AdminProfileBase, AdminProfileResponse
)

router = APIRouter()

@router.get("/me", response_model=UserProfileMeResponse)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve full profile details for active user with masked sensitive fields."""
    mobile_plain = decrypt_field(current_user.mobile_number_enc)
    mobile_masked = f"+91-XXXXXX{mobile_plain[-4:]}" if mobile_plain else None
    
    # Check MFA status
    mfa = db.query(MfaCredential).filter(MfaCredential.user_id == current_user.id, MfaCredential.is_enabled == True).first()
    
    student_res = None
    if current_user.student_profile:
        sp = current_user.student_profile
        bank_plain = decrypt_field(sp.bank_account_enc)
        bank_masked = f"XXXXXXXX{bank_plain[-4:]}" if bank_plain else None
        student_res = StudentProfileResponse(
            id=sp.id,
            user_id=sp.user_id,
            full_name=sp.full_name,
            dob=sp.dob,
            gender=sp.gender,
            category=sp.category,
            sub_caste=sp.sub_caste,
            father_name=sp.father_name,
            mother_name=sp.mother_name,
            annual_family_income=float(sp.annual_family_income) if sp.annual_family_income else None,
            address_line1=sp.address_line1,
            address_line2=sp.address_line2,
            district=sp.district,
            state=sp.state,
            pincode=sp.pincode,
            bank_name=sp.bank_name,
            bank_account_number=None, # Never return full plaintext in public response
            bank_account_masked=bank_masked,
            bank_ifsc=sp.bank_ifsc,
            bank_branch=sp.bank_branch,
            institution_name=sp.institution_name,
            institution_code_aishe=sp.institution_code_aishe,
            course_name=sp.course_name,
            current_year_of_study=sp.current_year_of_study,
            created_at=sp.created_at,
            updated_at=sp.updated_at
        )
        
    officer_res = None
    if current_user.officer_profile:
        op = current_user.officer_profile
        officer_res = OfficerProfileResponse(
            id=op.id,
            user_id=op.user_id,
            full_name=op.full_name,
            designation=op.designation,
            department=op.department,
            state=op.state,
            district=op.district,
            office_address=op.office_address,
            employee_id=op.employee_id,
            assigned_schemes=op.assigned_schemes or [],
            created_at=op.created_at
        )
        
    admin_res = None
    if current_user.admin_profile:
        ap = current_user.admin_profile
        admin_res = AdminProfileResponse(
            id=ap.id,
            user_id=ap.user_id,
            full_name=ap.full_name,
            admin_level=ap.admin_level,
            jurisdiction=ap.jurisdiction,
            contact_email=ap.contact_email,
            created_at=ap.created_at
        )
        
    return UserProfileMeResponse(
        user_id=current_user.id,
        email=current_user.email,
        mobile_masked=mobile_masked,
        role=current_user.role.value,
        is_verified=current_user.is_verified,
        student_profile=student_res,
        officer_profile=officer_res,
        admin_profile=admin_res,
        has_mfa=bool(mfa)
    )

@router.put("/student", response_model=StudentProfileResponse)
def update_student_profile(
    data: StudentProfileBase,
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Feature 6: Update ST Student Profile with AES-256 encryption on bank accounts."""
    sp = current_user.student_profile
    if not sp:
        sp = StudentProfile(user_id=current_user.id, full_name=data.full_name)
        db.add(sp)
        
    sp.full_name = data.full_name
    sp.dob = data.dob
    sp.gender = data.gender
    sp.category = data.category or "Scheduled Tribe (ST)"
    sp.sub_caste = data.sub_caste
    sp.father_name = data.father_name
    sp.mother_name = data.mother_name
    sp.annual_family_income = data.annual_family_income
    sp.address_line1 = data.address_line1
    sp.address_line2 = data.address_line2
    sp.district = data.district
    sp.state = data.state
    sp.pincode = data.pincode
    sp.bank_name = data.bank_name
    sp.bank_ifsc = data.bank_ifsc
    sp.bank_branch = data.bank_branch
    sp.institution_name = data.institution_name
    sp.institution_code_aishe = data.institution_code_aishe
    sp.course_name = data.course_name
    sp.current_year_of_study = data.current_year_of_study
    
    if data.bank_account_number:
        sp.bank_account_enc = encrypt_field(data.bank_account_number)
        
    db.commit()
    db.refresh(sp)
    
    record_audit_log(
        db, action="STUDENT_PROFILE_UPDATED", resource_type="PROFILE",
        user_id=current_user.id, resource_id=sp.id,
        details={"name": sp.full_name, "district": sp.district}
    )
    
    bank_plain = decrypt_field(sp.bank_account_enc)
    bank_masked = f"XXXXXXXX{bank_plain[-4:]}" if bank_plain else None
    
    return StudentProfileResponse(
        id=sp.id,
        user_id=sp.user_id,
        full_name=sp.full_name,
        dob=sp.dob,
        gender=sp.gender,
        category=sp.category,
        sub_caste=sp.sub_caste,
        father_name=sp.father_name,
        mother_name=sp.mother_name,
        annual_family_income=float(sp.annual_family_income) if sp.annual_family_income else None,
        address_line1=sp.address_line1,
        address_line2=sp.address_line2,
        district=sp.district,
        state=sp.state,
        pincode=sp.pincode,
        bank_name=sp.bank_name,
        bank_account_masked=bank_masked,
        bank_ifsc=sp.bank_ifsc,
        bank_branch=sp.bank_branch,
        institution_name=sp.institution_name,
        institution_code_aishe=sp.institution_code_aishe,
        course_name=sp.course_name,
        current_year_of_study=sp.current_year_of_study,
        created_at=sp.created_at,
        updated_at=sp.updated_at
    )

@router.put("/officer", response_model=OfficerProfileResponse)
def update_officer_profile(
    data: OfficerProfileBase,
    current_user: User = Depends(require_roles([UserRole.OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Feature 7: Update Verification Officer Profile & Jurisdictions."""
    op = current_user.officer_profile
    if not op:
        op = OfficerProfile(user_id=current_user.id, full_name=data.full_name)
        db.add(op)
        
    op.full_name = data.full_name
    op.designation = data.designation
    op.department = data.department
    op.state = data.state
    op.district = data.district
    op.office_address = data.office_address
    op.employee_id = data.employee_id
    if data.assigned_schemes is not None:
        op.assigned_schemes = data.assigned_schemes
        
    db.commit()
    db.refresh(op)
    
    record_audit_log(
        db, action="OFFICER_PROFILE_UPDATED", resource_type="PROFILE",
        user_id=current_user.id, resource_id=op.id,
        details={"designation": op.designation, "district": op.district}
    )
    
    return OfficerProfileResponse(
        id=op.id,
        user_id=op.user_id,
        full_name=op.full_name,
        designation=op.designation,
        department=op.department,
        state=op.state,
        district=op.district,
        office_address=op.office_address,
        employee_id=op.employee_id,
        assigned_schemes=op.assigned_schemes,
        created_at=op.created_at
    )
