from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.scheme import Scheme
from app.schemas.scheme import SchemeResponse, EligibilityCheckRequest, EligibilityCheckResponse
from app.api.deps import get_current_user
from app.db.models.user import User

router = APIRouter()

@router.get("", response_model=List[SchemeResponse])
def list_schemes(db: Session = Depends(get_db)):
    """Feature 14: List all available Ministry of Tribal Affairs schemes."""
    schemes = db.query(Scheme).filter(Scheme.is_active == True).all()
    return schemes

@router.get("/{scheme_id}", response_model=SchemeResponse)
def get_scheme(scheme_id: str, db: Session = Depends(get_db)):
    """Feature 14: Get details and guidelines of a specific scheme."""
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found")
    return scheme

@router.post("/{scheme_id}/check-eligibility", response_model=EligibilityCheckResponse)
def check_eligibility(
    scheme_id: str,
    req: EligibilityCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Feature 22: Automated eligibility pre-check against scheme rules before form starts."""
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found")
        
    reasons = []
    
    # 1. Social Category check (Must be ST)
    category_check = req.category == "Scheduled Tribe (ST)"
    if not category_check:
        reasons.append("This scheme is exclusively reserved for candidates belonging to Scheduled Tribe (ST).")
        
    # 2. Income ceiling check
    income = req.annual_family_income
    if income is None and current_user.student_profile and current_user.student_profile.annual_family_income:
        income = float(current_user.student_profile.annual_family_income)
        
    income_check = True
    if scheme.max_family_income and income is not None:
        if income > float(scheme.max_family_income):
            income_check = False
            reasons.append(f"Family income ₹{income:,.2f} exceeds the scheme limit of ₹{float(scheme.max_family_income):,.2f}/annum.")
            
    # 3. Education level check
    level_check = True
    if req.education_level:
        if scheme.education_level != "ANY" and req.education_level.upper() != scheme.education_level.upper():
            level_check = False
            reasons.append(f"Scheme is targeted for {scheme.education_level} education, but {req.education_level} was selected.")
            
    is_eligible = category_check and income_check and level_check
    
    return EligibilityCheckResponse(
        is_eligible=is_eligible,
        scheme_id=scheme_id,
        reasons=reasons,
        income_check=income_check,
        category_check=category_check,
        level_check=level_check
    )
