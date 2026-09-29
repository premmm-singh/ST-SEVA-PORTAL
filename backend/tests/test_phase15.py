import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_preflight_diagnostics_report(client: TestClient):
    res = client.get("/api/v1/production/preflight")
    assert res.status_code == 200
    data = res.json()
    assert data["overall_health"] in ["HEALTHY", "WARNING"]
    assert data["total_checks"] >= 7
    assert data["failed_count"] == 0
    categories = [c["check_category"] for c in data["checks"]]
    assert "DATABASE" in categories
    assert "CRYPTO_VAULT" in categories
    assert "GATEWAYS" in categories


def test_disaster_recovery_simulation_failover(client: TestClient):
    payload = {
        "target_secondary_region": "National DR Centre (NDC) Hyderabad",
        "simulation_mode": True
    }
    res = client.post("/api/v1/production/disaster-recovery/simulate-failover", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "FAILOVER_SUCCESS"
    assert data["rpo_seconds"] == 0.0
    assert data["rto_seconds"] < 30.0
    assert data["wal_sequence_verified"] is True
    assert len(data["backup_hash"]) == 64
    assert "Hyderabad" in data["active_region"]


def test_synthetic_end_to_end_journey(client: TestClient):
    res = client.post("/api/v1/production/smoke-test/run-full-journey")
    assert res.status_code == 200
    data = res.json()
    assert data["overall_journey_status"] == "JOURNEY_SUCCESS"
    assert data["total_stages"] == 8
    assert data["successful_stages"] == 8
    assert len(data["stages"]) == 8
    assert data["total_duration_ms"] > 0.0
    stage_names = [s["stage_name"] for s in data["stages"]]
    assert any("Student Registration" in s for s in stage_names)
    assert any("DigiLocker" in s for s in stage_names)
    assert any("PFMS Batch" in s for s in stage_names)
    assert any("Merkle Tree" in s for s in stage_names)
