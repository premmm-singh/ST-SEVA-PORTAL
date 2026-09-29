import pytest
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

@pytest.fixture(scope="module")
def student_auth():
    # Login as student via OTP
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)
    send_resp = client.post("/auth/otp/send", json={"mobile_number": "9876543210", "purpose": "login"})
    assert send_resp.status_code == 200
    sandbox_otp = send_resp.json().get("sandbox_hint", "123456")
    
    verify_resp = client.post("/auth/otp/verify", json={
        "mobile_number": "9876543210",
        "otp_code": sandbox_otp,
        "device_name": "Pytest Runner"
    })
    assert verify_resp.status_code == 200
    token = verify_resp.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    yield client, headers
    client.close()

def test_schemes_catalog(student_auth):
    client, headers = student_auth
    resp = client.get("/schemes", headers=headers)
    assert resp.status_code == 200
    schemes = resp.json()
    assert len(schemes) >= 4
    scheme_ids = [s["id"] for s in schemes]
    assert "ST_POST_MATRIC" in scheme_ids
    assert "ST_PRE_MATRIC" in scheme_ids
    assert "NATIONAL_FELLOWSHIP_ST" in scheme_ids
    assert "TOP_CLASS_EDUCATION_ST" in scheme_ids

def test_scheme_eligibility_check(student_auth):
    client, headers = student_auth
    
    # 1. Eligible student
    resp = client.post("/schemes/ST_POST_MATRIC/check-eligibility", headers=headers, json={
        "category": "Scheduled Tribe (ST)",
        "annual_family_income": 180000.0,
        "education_level": "COLLEGE"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_eligible"] is True
    assert len(data["reasons"]) == 0
    assert data["income_check"] is True
    assert data["category_check"] is True
    assert data["level_check"] is True

    # 2. Ineligible due to income exceeding ₹2,50,000
    resp2 = client.post("/schemes/ST_POST_MATRIC/check-eligibility", headers=headers, json={
        "category": "Scheduled Tribe (ST)",
        "annual_family_income": 350000.0,
        "education_level": "COLLEGE"
    })
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["is_eligible"] is False
    assert data2["income_check"] is False
    assert any("income" in r.lower() for r in data2["reasons"])

    # 3. Ineligible due to category
    resp3 = client.post("/schemes/ST_POST_MATRIC/check-eligibility", headers=headers, json={
        "category": "General",
        "annual_family_income": 150000.0,
        "education_level": "COLLEGE"
    })
    assert resp3.status_code == 200
    data3 = resp3.json()
    assert data3["is_eligible"] is False
    assert data3["category_check"] is False
    assert any("scheduled tribe" in r.lower() for r in data3["reasons"])

def test_draft_save_and_retrieve(student_auth):
    client, headers = student_auth
    draft_payload = {
        "scheme_id": "ST_POST_MATRIC",
        "current_step": 2,
        "draft_data": {
            "personal": {
                "name": "Arjun Munda",
                "father_name": "Birsa Munda",
                "community": "Santhal",
                "sub_tribe": "Munda",
                "annual_income": 180000
            },
            "academic": {
                "institution_name": "Ranchi University",
                "course_name": "B.Tech Computer Science",
                "admission_year": 2024,
                "percentage_last_year": 82.5
            },
            "bank": {
                "account_number": "112233445566",
                "ifsc_code": "SBIN0001234",
                "bank_name": "State Bank of India",
                "dbt_seeded": True
            }
        }
    }
    
    # Save draft
    save_resp = client.post("/applications/draft", headers=headers, json=draft_payload)
    assert save_resp.status_code == 200
    save_data = save_resp.json()
    assert save_data["scheme_id"] == "ST_POST_MATRIC"
    assert save_data["current_step"] == 2
    assert save_data["draft_data"]["personal"]["community"] == "Santhal"

    # Retrieve draft
    get_resp = client.get("/applications/draft/ST_POST_MATRIC", headers=headers)
    assert get_resp.status_code == 200
    draft_data = get_resp.json()
    assert draft_data["current_step"] == 2
    assert draft_data["draft_data"]["academic"]["institution_name"] == "Ranchi University"

def test_submit_application_and_tracking(student_auth):
    client, headers = student_auth
    submit_payload = {
        "scheme_id": "ST_POST_MATRIC",
        "academic_year": "2026-2027",
        "application_data": {
            "personal": {
                "full_name": "Birsa Oraon",
                "gender": "MALE",
                "dob": "2004-06-15",
                "caste_category": "ST",
                "sub_caste": "Oraon",
                "annual_income": 160000.0,
                "disability_status": False
            },
            "academic": {
                "institution_name": "St. Xavier's College, Ranchi",
                "institution_code": "SXC-RN-001",
                "course_name": "B.Sc Information Technology",
                "current_year": 2,
                "hosteller_status": "HOSTELLER",
                "last_year_percentage": 79.4
            },
            "bank": {
                "account_holder_name": "Birsa Oraon",
                "account_number": "998877665544",
                "ifsc_code": "PUNB0024500",
                "bank_name": "Punjab National Bank",
                "branch_name": "Main Road Ranchi",
                "dbt_seeded": True
            }
        }
    }
    
    sub_resp = client.post("/applications/submit", headers=headers, json=submit_payload)
    assert sub_resp.status_code == 200
    app_data = sub_resp.json()
    assert app_data["application_number"].startswith("ST-2026-")
    assert app_data["status"] == "SUBMITTED"
    assert app_data["scheme_id"] == "ST_POST_MATRIC"
    app_id = app_data["id"]

    # Read application detail
    get_resp = client.get(f"/applications/{app_id}", headers=headers)
    assert get_resp.status_code == 200
    detail = get_resp.json()
    assert detail["application_number"] == app_data["application_number"]

    # Verify Timeline
    timeline_resp = client.get(f"/applications/{app_id}/timeline", headers=headers)
    assert timeline_resp.status_code == 200
    timeline = timeline_resp.json()
    assert len(timeline) >= 1
    assert timeline[0]["stage"] == "APPLICATION_SUBMITTED"

    # Export PDF summary
    pdf_resp = client.get(f"/applications/{app_id}/export-pdf", headers=headers)
    assert pdf_resp.status_code == 200
    assert len(pdf_resp.content) > 100

    # Withdraw application
    withdraw_resp = client.post(f"/applications/{app_id}/withdraw", headers=headers, json={
        "reason": "Need to correct bank IFSC and resubmit"
    })
    assert withdraw_resp.status_code == 200
    assert "withdrawn" in withdraw_resp.json()["message"].lower()

    # Reapply
    reapply_resp = client.post(f"/applications/{app_id}/reapply", headers=headers)
    assert reapply_resp.status_code == 200
    assert reapply_resp.json()["status"] == "DRAFT"

def test_multi_apply(student_auth):
    client, headers = student_auth
    multi_payload = {
        "scheme_ids": ["NATIONAL_FELLOWSHIP_ST"],
        "academic_year": "2026-2027",
        "shared_application_data": {
            "personal": {"full_name": "Sunita Marandi", "category": "ST", "annual_income": 200000},
            "academic": {"institution": "IIT Kharagpur", "course": "Ph.D Metallurgical Engineering"},
            "bank": {"account": "554433221100", "ifsc": "SBIN0000202", "dbt_seeded": True}
        }
    }
    
    resp = client.post("/applications/multi-apply", headers=headers, json=multi_payload)
    assert resp.status_code == 200
    res_data = resp.json()
    assert len(res_data["applications"]) == 1
    assert res_data["applications"][0]["scheme_id"] == "NATIONAL_FELLOWSHIP_ST"
    assert res_data["applications"][0]["tracking_number"].startswith("ST-2026-")
