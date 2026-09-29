import pytest
from app.core.crypto import encrypt_field, decrypt_field, blind_index
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.services.otp_service import generate_otp, send_and_record_otp, verify_otp_code
from app.db.session import SessionLocal
import app.db.models # Ensure all mapped models are registered

def test_aes256_encryption_decryption():
    raw_aadhaar = "987654321098"
    enc = encrypt_field(raw_aadhaar)
    assert enc != raw_aadhaar
    assert len(enc) > 20
    dec = decrypt_field(enc)
    assert dec == raw_aadhaar

def test_blind_indexing_deterministic():
    phone1 = "9876543210"
    phone2 = "9876543210"
    phone3 = "9876543211"
    
    hash1 = blind_index(phone1)
    hash2 = blind_index(phone2)
    hash3 = blind_index(phone3)
    
    assert hash1 == hash2
    assert hash1 != hash3
    assert len(hash1) == 64

def test_password_hashing():
    pwd = "GovSecurePassword@2026"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_lifecycle():
    data = {"sub": "user-12345", "role": "student"}
    token = create_access_token(data)
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-12345"
    assert decoded["role"] == "student"

def test_otp_verification_flow():
    db = SessionLocal()
    try:
        phone = "9988776655"
        otp = send_and_record_otp(db, phone, purpose="login")
        assert len(otp) == 6
        assert otp.isdigit()
        
        # Test wrong OTP fails
        bad_res = verify_otp_code(db, phone, "000000", purpose="login")
        assert bad_res is False
        
        # Test correct OTP succeeds
        good_res = verify_otp_code(db, phone, otp, purpose="login")
        assert good_res is True
        
        # Test reuse fails
        reuse_res = verify_otp_code(db, phone, otp, purpose="login")
        assert reuse_res is False
    finally:
        db.close()
