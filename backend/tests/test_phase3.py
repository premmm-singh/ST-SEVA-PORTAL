import io
import time
from datetime import date
import pytest
import httpx
from PIL import Image

BASE_URL = "http://127.0.0.1:8000/api/v1"

@pytest.fixture(scope="module")
def student_auth():
    # Login as student via OTP
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)
    send_resp = client.post("/auth/otp/send", json={"mobile_number": "9876543210", "purpose": "login"})
    assert send_resp.status_code == 200
    sandbox_otp = send_resp.json().get("sandbox_hint", "123456")
    
    verify_resp = client.post("/auth/otp/verify", json={
        "mobile_number": "9876543210",
        "otp_code": sandbox_otp,
        "device_name": "Phase 3 Pytest Runner"
    })
    assert verify_resp.status_code == 200
    token = verify_resp.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    yield client, headers
    client.close()

def _create_sample_png() -> bytes:
    img = Image.new("RGB", (200, 100), color=(73, 109, 137))
    out = io.BytesIO()
    img.save(out, format="PNG")
    return out.getvalue()

def _create_sample_pdf() -> bytes:
    return b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 300 144]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF"

def test_multi_format_upload_and_sha256(student_auth):
    client, headers = student_auth
    
    # 1. Upload sample PNG Marks Card (Feature 27 & 31)
    png_bytes = _create_sample_png()
    files = {"file": ("marksheet_sem4.png", png_bytes, "image/png")}
    data = {"document_category": "MARKSHEET"}
    
    resp = client.post("/documents/upload", headers=headers, files=files, data=data)
    assert resp.status_code == 200
    doc = resp.json()
    assert doc["document_category"] == "MARKSHEET"
    assert doc["mime_type"] == "image/png"
    assert len(doc["sha256_hash"]) == 64
    assert doc["is_encrypted"] is True
    assert doc["scan_status"] == "CLEAN"
    assert doc["version"] >= 1
    assert "signed_preview_url" in doc

def test_file_integrity_verification(student_auth):
    client, headers = student_auth
    
    # Upload sample PDF
    pdf_bytes = _create_sample_pdf()
    files = {"file": ("domicile_ranchi.pdf", pdf_bytes, "application/pdf")}
    data = {"document_category": "DOMICILE_CERTIFICATE"}
    
    upload_resp = client.post("/documents/upload", headers=headers, files=files, data=data)
    assert upload_resp.status_code == 200
    doc_id = upload_resp.json()["id"]
    
    # Feature 30: Cryptographic SHA-256 verification on access
    integrity_resp = client.get(f"/documents/{doc_id}/verify-integrity", headers=headers)
    assert integrity_resp.status_code == 200
    integrity_data = integrity_resp.json()
    assert integrity_data["is_valid"] is True
    assert integrity_data["stored_sha256"] == integrity_data["computed_sha256"]

def test_virus_scan_clamav(student_auth):
    client, headers = student_auth
    
    # Feature 29: ClamAV standard test signature
    eicar_malware_bytes = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
    files = {"file": ("infected_document.pdf", eicar_malware_bytes, "application/pdf")}
    data = {"document_category": "FEE_RECEIPT"}
    
    resp = client.post("/documents/upload", headers=headers, files=files, data=data)
    assert resp.status_code == 400
    assert "security scan rejected" in resp.json()["detail"].lower()

def test_15_minute_signed_url_and_watermark_preview(student_auth):
    client, headers = student_auth
    
    # Upload clean image
    png_bytes = _create_sample_png()
    files = {"file": ("bank_passbook.png", png_bytes, "image/png")}
    data = {"document_category": "BANK_PASSBOOK"}
    
    upload_resp = client.post("/documents/upload", headers=headers, files=files, data=data)
    assert upload_resp.status_code == 200
    doc = upload_resp.json()
    doc_id = doc["id"]
    
    # Feature 28: 15-minute signed URL generation
    signed_resp = client.get(f"/documents/{doc_id}/signed-url?action=preview", headers=headers)
    assert signed_resp.status_code == 200
    signed_data = signed_resp.json()
    assert signed_data["expires_in_seconds"] == 900
    assert "token=" in signed_data["url"]
    
    # Feature 33 & 36: Preview with dynamic security watermark
    rel_url = signed_data["url"].replace("/api/v1", "")
    preview_resp = client.get(rel_url) # Signed URL works without Authorization header
    assert preview_resp.status_code == 200
    assert "image" in preview_resp.headers["content-type"]
    assert len(preview_resp.content) > 0
    
    # Negative test: Tampered or expired token
    tampered_url = rel_url.replace("token=", "token=TAMPERED_")
    bad_resp = client.get(tampered_url)
    assert bad_resp.status_code == 403

def test_document_versioning(student_auth):
    client, headers = student_auth
    
    # Upload Version 1
    pdf_bytes1 = _create_sample_pdf()
    files1 = {"file": ("st_caste_cert_v1.pdf", pdf_bytes1, "application/pdf")}
    data1 = {"document_category": "CASTE_CERTIFICATE"}
    v1_resp = client.post("/documents/upload", headers=headers, files=files1, data=data1)
    assert v1_resp.status_code == 200
    v1_doc = v1_resp.json()
    v1_id = v1_doc["id"]
    v1_ver = v1_doc["version"]
    
    # Feature 32: Upload Version 2 (Re-upload / update)
    pdf_bytes2 = _create_sample_pdf()
    files2 = {"file": ("st_caste_cert_v2_updated.pdf", pdf_bytes2, "application/pdf")}
    data2 = {"document_category": "CASTE_CERTIFICATE"}
    v2_resp = client.post("/documents/upload", headers=headers, files=files2, data=data2)
    assert v2_resp.status_code == 200
    v2_doc = v2_resp.json()
    
    assert v2_doc["version"] == v1_ver + 1
    assert v2_doc["parent_document_id"] == v1_id
    assert v2_doc["is_active"] is True
    
    # Check that v1 is now marked inactive (historical record)
    old_doc_resp = client.get(f"/documents/{v1_id}", headers=headers)
    assert old_doc_resp.status_code == 200
    assert old_doc_resp.json()["is_active"] is False

def test_soft_delete(student_auth):
    client, headers = student_auth
    
    # Upload document to delete
    pdf_bytes = _create_sample_pdf()
    files = {"file": ("old_fee_receipt.pdf", pdf_bytes, "application/pdf")}
    data = {"document_category": "FEE_RECEIPT"}
    up_resp = client.post("/documents/upload", headers=headers, files=files, data=data)
    assert up_resp.status_code == 200
    doc_id = up_resp.json()["id"]
    
    # Feature 32: Soft delete
    del_resp = client.delete(f"/documents/{doc_id}", headers=headers)
    assert del_resp.status_code == 200
    assert "soft-deleted" in del_resp.json()["message"].lower()
    
    # Verify not in active list
    list_resp = client.get("/documents", headers=headers)
    assert list_resp.status_code == 200
    active_ids = [d["id"] for d in list_resp.json()]
    assert doc_id not in active_ids

def test_income_certificate_expiry_tracking(student_auth):
    client, headers = student_auth
    
    # Feature 34: Auto-calculated 1-year expiry on Income Certificate
    pdf_bytes = _create_sample_pdf()
    files = {"file": ("income_cert_2026.pdf", pdf_bytes, "application/pdf")}
    data = {"document_category": "INCOME_CERTIFICATE"}
    
    up_resp = client.post("/documents/upload", headers=headers, files=files, data=data)
    assert up_resp.status_code == 200
    doc = up_resp.json()
    assert doc["expiry_date"] is not None
    
    # Check expiring soon endpoint
    exp_resp = client.get("/documents/expiring-soon?days=400", headers=headers)
    assert exp_resp.status_code == 200
    exp_data = exp_resp.json()
    assert exp_data["count"] >= 1

def test_digilocker_document_pull(student_auth):
    client, headers = student_auth
    
    # Feature 35: Pull verified ST Caste Certificate from DigiLocker
    pull_resp = client.post("/documents/digilocker-pull", headers=headers, json={
        "document_category": "CASTE_CERTIFICATE"
    })
    assert pull_resp.status_code == 200
    doc = pull_resp.json()
    assert doc["source"] == "DIGILOCKER_FETCH"
    assert "digilocker_uri" in doc
    assert doc["digilocker_uri"].startswith("in.gov.jharkhand.edistrict-CAST-")
    assert doc["scan_status"] == "CLEAN"
    assert doc["is_encrypted"] is True
    assert doc["file_size_bytes"] > 500
