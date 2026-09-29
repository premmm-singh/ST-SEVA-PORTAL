from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class SecurityHeadersReport(BaseModel):
    hsts_enabled: bool
    csp_header: str
    x_frame_options: str
    x_content_type_options: str
    referrer_policy: str
    cert_in_compliance_status: str

class InputSanitizationProbe(BaseModel):
    payload_tested: str
    injection_type: str # 'SQLI', 'XSS', 'PATH_TRAVERSAL'
    is_blocked: bool
    sanitized_output: str

class MerkleInclusionProofRequest(BaseModel):
    record_id: str
    entity_type: str # 'SANCTION_ORDER', 'DBT_TRANSACTION', 'ADMIN_DELEGATION'
    data_payload: Dict[str, Any]

class MerkleInclusionProofResponse(BaseModel):
    record_id: str
    entity_type: str
    leaf_hash: str
    root_hash: str
    block_height: int
    audit_proof_chain: List[str]
    is_tamper_evident: bool
    integrity_status: str

class VaptScanRequest(BaseModel):
    scan_type: Optional[str] = "AUTOMATED_DAST"
    target_component: Optional[str] = "PORTAL_API_CORE"
    include_privilege_escalation: Optional[bool] = True

class VaptFindingSchema(BaseModel):
    vuln_id: str
    title: str
    severity: str # 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'
    status: str # 'SECURED', 'MITIGATED', 'OPEN'
    cvss_score: float
    cwe_id: str
    description: str
    remediation: str

class VaptScanResponse(BaseModel):
    scan_id: str
    scan_type: str
    target_component: str
    total_checks: int
    passed_checks: int
    failed_checks: int
    cert_in_score: float
    findings: List[VaptFindingSchema]
    remediation_plan: str
    compliance_grade: str
    created_at: datetime

class SessionAnomalyCheckRequest(BaseModel):
    user_id: str
    session_id: Optional[str] = None
    current_ip: str
    current_city: Optional[str] = "Ranchi"
    user_agent: Optional[str] = "Mozilla/5.0 Chrome/122"

class SessionAnomalyCheckResponse(BaseModel):
    user_id: str
    risk_score: float
    anomaly_detected: bool
    anomaly_type: Optional[str] = None
    action_required: str # 'NONE', 'MFA_STEP_UP', 'TERMINATE_SESSION'
    reason: str
    previous_ip: Optional[str] = None
    current_ip: str
