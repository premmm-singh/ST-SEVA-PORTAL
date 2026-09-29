from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class PreflightCheckItem(BaseModel):
    check_category: str # 'DATABASE', 'CACHE', 'CRYPTO_VAULT', 'STORAGE', 'GATEWAYS'
    component_name: str
    status: str # 'PASSED', 'WARNING', 'FAILED'
    latency_ms: float
    message: str

class PreflightReportResponse(BaseModel):
    overall_health: str # 'HEALTHY', 'DEGRADED', 'CRITICAL'
    total_checks: int
    passed_count: int
    warning_count: int
    failed_count: int
    checks: List[PreflightCheckItem]
    timestamp: datetime

class DrFailoverRequest(BaseModel):
    target_secondary_region: Optional[str] = "National DR Centre (NDC) Hyderabad"
    simulation_mode: Optional[bool] = True

class DrFailoverResponse(BaseModel):
    drill_id: str
    drill_type: str
    status: str # 'FAILOVER_SUCCESS'
    primary_region: str
    active_region: str
    rpo_seconds: float
    rto_seconds: float
    wal_sequence_verified: bool
    backup_hash: str
    summary: str
    timestamp: datetime

class SyntheticStepResult(BaseModel):
    step_number: int
    stage_name: str
    status: str # 'COMPLETED', 'FAILED'
    latency_ms: float
    output_token: Optional[str] = None

class SyntheticJourneyResponse(BaseModel):
    journey_id: str
    test_student_email: str
    total_stages: int
    successful_stages: int
    total_duration_ms: float
    overall_journey_status: str # 'JOURNEY_SUCCESS'
    stages: List[SyntheticStepResult]
    timestamp: datetime
