from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User, UserRole
from app.api.deps import get_current_user, require_roles
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import (
    ExecutiveOverviewResponse,
    DistrictHeatmapResponse,
    DemographicBreakdownResponse,
    BudgetUtilizationResponse,
    ScrutinyTatResponse,
    InstitutionLeagueResponse,
    DbtHealthAnalyticsResponse,
    ParliamentQuestionExportRequest,
    ParliamentQuestionExportResponse,
    BudgetForecastResponse,
    ScheduledReportCreateRequest,
    ScheduledReportResponse
)

router = APIRouter()

OFFICER_ROLES = [UserRole.OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]

@router.get("/executive-summary", response_model=ExecutiveOverviewResponse)
def get_executive_summary(
    financial_year: str = "2026-2027",
    db: Session = Depends(get_db)
) -> Any:
    """F-108: Central & State Macro Real-Time KPIs & Beneficiary Counters."""
    return AnalyticsService.get_executive_overview(db=db, financial_year=financial_year)

@router.get("/district-heatmap", response_model=DistrictHeatmapResponse)
def get_district_heatmap(
    financial_year: str = "2026-2027",
    db: Session = Depends(get_db)
) -> Any:
    """F-109: Interactive Geo-Spatial Heatmap across all 24 districts of Jharkhand."""
    districts = AnalyticsService.get_district_heatmap_data(db=db, financial_year=financial_year)
    return {
        "financial_year": financial_year,
        "districts": districts
    }

@router.get("/demographics", response_model=DemographicBreakdownResponse)
def get_demographics(
    db: Session = Depends(get_db)
) -> Any:
    """F-110 & F-117: Demographic & Tribal Sub-Caste Equity Analysis & PVTG Surveillance."""
    return AnalyticsService.get_tribal_demographics(db=db)

@router.get("/budget-utilization", response_model=BudgetUtilizationResponse)
def get_budget_utilization(
    financial_year: str = "2026-2027",
    db: Session = Depends(get_db)
) -> Any:
    """F-111: Financial Outlay, Treasury Drawdown & Budget Utilization Charts."""
    return AnalyticsService.get_budget_utilization(db=db, financial_year=financial_year)

@router.get("/scrutiny-tat", response_model=ScrutinyTatResponse)
def get_scrutiny_tat(
    db: Session = Depends(get_db)
) -> Any:
    """F-112: Scrutiny Turnaround Time (TAT) & Bottleneck Identification."""
    return AnalyticsService.get_scrutiny_tat_analytics(db=db)

@router.get("/institutions-ranking", response_model=InstitutionLeagueResponse)
def get_institutions_ranking(
    db: Session = Depends(get_db)
) -> Any:
    """F-113: Educational Institution Performance League Table & Defaulter Tracking."""
    return AnalyticsService.get_institution_league_table(db=db)

@router.get("/dbt-health", response_model=DbtHealthAnalyticsResponse)
def get_dbt_health(
    db: Session = Depends(get_db)
) -> Any:
    """F-114: DBT Direct Bank Credit Success & Failure Analytics."""
    return AnalyticsService.get_dbt_health_analytics(db=db)

@router.post("/export/parliament-report", response_model=ParliamentQuestionExportResponse, status_code=status.HTTP_201_CREATED)
def export_parliament_report(
    payload: ParliamentQuestionExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-115: Automated Statutory CAG & Parliament Question (PQ) Report Exporter."""
    return AnalyticsService.export_parliament_question_data(
        db=db,
        user_id=current_user.id,
        question_reference_no=payload.question_reference_no,
        session_type=payload.session_type,
        export_title=payload.export_title,
        financial_year=payload.financial_year,
        export_format=payload.export_format,
        district=payload.district,
        scheme_id=payload.scheme_id
    )

@router.get("/forecast", response_model=BudgetForecastResponse)
def get_budget_forecast(
    financial_year: str = "2026-2027"
) -> Any:
    """F-116: Predictive Budget & Outlay Forecasting Engine."""
    return AnalyticsService.calculate_budget_forecast(current_year=financial_year)

@router.post("/scheduled-reports", response_model=ScheduledReportResponse, status_code=status.HTTP_201_CREATED)
def create_scheduled_report(
    payload: ScheduledReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(OFFICER_ROLES))
) -> Any:
    """F-118: Executive Scheduled Digest Configuration."""
    return AnalyticsService.create_scheduled_report(
        db=db,
        report_title=payload.report_title,
        recipient_role=payload.recipient_role,
        recipient_email=payload.recipient_email,
        frequency=payload.frequency
    )
