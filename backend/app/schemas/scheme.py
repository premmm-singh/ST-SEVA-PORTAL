from pydantic import BaseModel
from typing import Optional
from datetime import date

class SchemeResponse(BaseModel):
    id: str
    scheme_name: str
    scheme_code: str
    scheme_type: str
    education_level: str
    financial_assistance_details: Optional[str] = None
    max_family_income: Optional[float] = None
    academic_year: str
    application_start_date: date
    application_deadline: date
    is_active: bool
    guidelines_url: Optional[str] = None

    class Config:
        from_attributes = True

class EligibilityCheckRequest(BaseModel):
    annual_family_income: Optional[float] = None
    education_level: Optional[str] = None
    category: Optional[str] = "Scheduled Tribe (ST)"

class EligibilityCheckResponse(BaseModel):
    is_eligible: bool
    scheme_id: str
    reasons: list[str] = []
    income_check: bool
    category_check: bool
    level_check: bool
