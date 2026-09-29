import pytest
from datetime import datetime, timezone
from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.db.models.user import User, UserRole
from app.db.models.analytics import ParliamentQuestionExport, SessionType
from app.core.security import create_access_token, hash_password

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture
def auth_tokens(db):
    officer_email = f"analytics_officer_{uuid4().hex[:6]}@gov.in"
    officer = User(
        email=officer_email,
        hashed_password=hash_password("Pass@1234"),
        role=UserRole.OFFICER,
        is_active=True,
        is_verified=True
    )
    db.add(officer)
    db.commit()
    db.refresh(officer)

    officer_token = create_access_token(data={"sub": officer.id, "email": officer.email, "role": officer.role.value})
    return {
        "officer": officer,
        "officer_headers": {"Authorization": f"Bearer {officer_token}"}
    }

def test_executive_overview_metrics():
    """F-108: Central & State Macro Real-Time KPIs & Beneficiary Counters."""
    res = client.get("/api/v1/analytics/executive-summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_applications" in data
    assert "institute_verified" in data
    assert "sanctioned_beneficiaries" in data
    assert "total_disbursed_crores" in data
    assert "pvtg_beneficiaries_count" in data
    assert "female_representation_pct" in data
    assert "sla_compliance_pct" in data
    assert data["total_applications"] > 0
    assert data["total_disbursed_crores"] > 0

def test_district_heatmap_24_districts():
    """F-109: Interactive Geo-Spatial Heatmap across all 24 districts of Jharkhand."""
    res = client.get("/api/v1/analytics/district-heatmap")
    assert res.status_code == 200
    data = res.json()
    assert "districts" in data
    districts = data["districts"]
    assert len(districts) == 24
    
    # Verify key districts exist
    district_names = [d["district_name"] for d in districts]
    assert "Ranchi" in district_names
    assert "Khunti" in district_names
    assert "Dumka" in district_names
    assert "East Singhbhum" in district_names
    assert "West Singhbhum" in district_names
    
    # Validate fields on a district item
    first = districts[0]
    assert "total_applications" in first
    assert "total_disbursed_amount" in first
    assert "saturation_rate" in first
    assert "female_ratio" in first
    assert "avg_tat_days" in first

def test_tribal_demographics_and_pvtg():
    """F-110 & F-117: Demographic & Tribal Sub-Caste Equity Analysis & PVTG Surveillance."""
    res = client.get("/api/v1/analytics/demographics")
    assert res.status_code == 200
    data = res.json()
    assert "total_st_beneficiaries" in data
    assert "sub_castes" in data
    assert "pvtg_summary" in data
    
    sub_castes = [sc["sub_caste"] for sc in data["sub_castes"]]
    assert "Santhal" in sub_castes
    assert "Oraon" in sub_castes
    assert "Munda" in sub_castes
    assert "Ho" in sub_castes
    
    pvtg = data["pvtg_summary"]
    assert pvtg["total_pvtg_enrolled"] > 0
    assert pvtg["pvtg_saturation_rate_pct"] > 0

def test_budget_utilization_breakdown():
    """F-111: Financial Outlay, Treasury Drawdown & Budget Utilization Charts."""
    res = client.get("/api/v1/analytics/budget-utilization")
    assert res.status_code == 200
    data = res.json()
    assert "total_budget_allocated" in data
    assert "total_disbursed_amount" in data
    assert "central_share_disbursed" in data
    assert "state_share_disbursed" in data
    assert "schemes" in data
    assert len(data["schemes"]) >= 4

def test_scrutiny_tat_and_bottlenecks():
    """F-112: Scrutiny Turnaround Time (TAT) & Bottleneck Identification."""
    res = client.get("/api/v1/analytics/scrutiny-tat")
    assert res.status_code == 200
    data = res.json()
    assert "overall_avg_tat_days" in data
    assert "stages" in data
    assert "bottleneck_districts" in data
    assert len(data["stages"]) >= 4
    assert len(data["bottleneck_districts"]) >= 1

def test_institution_league_table():
    """F-113: Educational Institution Performance League Table & Defaulter Tracking."""
    res = client.get("/api/v1/analytics/institutions-ranking")
    assert res.status_code == 200
    data = res.json()
    assert "top_performers" in data
    assert "defaulters" in data
    assert len(data["top_performers"]) > 0

def test_dbt_health_analytics():
    """F-114: DBT Direct Bank Credit Success & Failure Analytics."""
    res = client.get("/api/v1/analytics/dbt-health")
    assert res.status_code == 200
    data = res.json()
    assert "total_transactions" in data
    assert "success_rate_pct" in data
    assert "failure_reasons" in data
    assert data["success_rate_pct"] > 90.0

def test_parliament_question_export_cag(auth_tokens):
    """F-115: Automated Statutory CAG & Parliament Question (PQ) Report Exporter."""
    payload = {
        "question_reference_no": "LS-STARRED-PQ-2026-442",
        "session_type": "LOK_SABHA",
        "export_title": "District-wise ST Post-Matric Saturation & PVTG Outlay",
        "financial_year": "2026-2027",
        "export_format": "CSV"
    }
    res = client.post("/api/v1/analytics/export/parliament-report", json=payload, headers=auth_tokens["officer_headers"])
    assert res.status_code == 201
    data = res.json()
    assert data["question_reference_no"] == "LS-STARRED-PQ-2026-442"
    assert data["record_count"] == 24
    assert data["sha256_hash"] is not None
    assert "SL_NO,DISTRICT" in data["export_data"]

def test_budget_forecasting_engine():
    """F-116: Predictive Budget & Outlay Forecasting Engine."""
    res = client.get("/api/v1/analytics/forecast")
    assert res.status_code == 200
    data = res.json()
    assert data["forecast_year"] == "2027-2028"
    assert data["projected_applications"] > 0
    assert data["projected_budget_required_crores"] > 0
    assert data["confidence_interval_high_cr"] > data["confidence_interval_low_cr"]

def test_scheduled_report_digest(auth_tokens):
    """F-118: Executive Scheduled Digest Configuration."""
    payload = {
        "report_title": "Weekly Welfare Cabinet Summary for Chief Secretary",
        "recipient_role": "CHIEF_SECRETARY",
        "recipient_email": "cs-jharkhand@nic.in",
        "frequency": "WEEKLY"
    }
    res = client.post("/api/v1/analytics/scheduled-reports", json=payload, headers=auth_tokens["officer_headers"])
    assert res.status_code == 201
    data = res.json()
    assert data["report_title"] == "Weekly Welfare Cabinet Summary for Chief Secretary"
    assert data["is_active"] is True
