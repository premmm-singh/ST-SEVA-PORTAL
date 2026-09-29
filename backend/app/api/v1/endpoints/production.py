from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User
from app.api.deps import get_current_user, get_current_user_optional, require_roles
from app.services.production_service import ProductionService
from app.schemas.production import (
    PreflightReportResponse,
    DrFailoverRequest,
    DrFailoverResponse,
    SyntheticJourneyResponse
)

router = APIRouter()

@router.get("/preflight", response_model=PreflightReportResponse)
def get_preflight_diagnostics(
    db: Session = Depends(get_db)
):
    """Execute pre-flight production diagnostics across DB, cache, crypto, storage and gateways."""
    return ProductionService.run_preflight_diagnostics(db)

@router.post("/disaster-recovery/simulate-failover", response_model=DrFailoverResponse)
def simulate_dr_failover(
    request: DrFailoverRequest,
    db: Session = Depends(get_db)
):
    """Trigger simulated automated failover drill to secondary National DR Centre with RPO=0."""
    return ProductionService.simulate_dr_failover(db, request)

@router.post("/smoke-test/run-full-journey", response_model=SyntheticJourneyResponse)
def run_synthetic_journey(
    db: Session = Depends(get_db)
):
    """Execute automated end-to-end lifecycle journey smoke test through all 8 stages."""
    return ProductionService.run_synthetic_journey(db)
