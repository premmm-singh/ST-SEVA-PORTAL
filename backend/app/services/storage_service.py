import os
import time
import hmac
import hashlib
import uuid
import base64
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.crypto import get_aes_key
from app.config import settings

VAULT_DIR = Path("storage/vault")

class StorageService:
    @staticmethod
    def ensure_vault_dir(student_id: str) -> Path:
        target = VAULT_DIR / student_id
        target.mkdir(parents=True, exist_ok=True)
        return target

    @staticmethod
    def compute_sha256(data: bytes) -> str:
        """Feature 30: Cryptographic SHA-256 hash computation."""
        return hashlib.sha256(data).hexdigest()

    @staticmethod
    def encrypt_and_store(file_bytes: bytes, filename: str, student_id: str) -> dict:
        """
        Features 27 & 28:
        Computes SHA-256 hash, encrypts file using AES-256-GCM at rest, and stores in vault.
        """
        sha256_hash = StorageService.compute_sha256(file_bytes)
        key = get_aes_key()
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)
        
        ciphertext = aesgcm.encrypt(nonce, file_bytes, None)
        encrypted_payload = nonce + ciphertext
        
        user_vault = StorageService.ensure_vault_dir(student_id)
        file_uuid = uuid.uuid4().hex[:12]
        safe_name = "".join(c for c in filename if c.isalnum() or c in "._-")
        stored_filename = f"{file_uuid}_{safe_name}.enc"
        file_path = user_vault / stored_filename
        
        with open(file_path, "wb") as f:
            f.write(encrypted_payload)
            
        return {
            "storage_path": str(file_path.as_posix()),
            "sha256_hash": sha256_hash,
            "encryption_iv": base64.b64encode(nonce).decode('utf-8'),
            "file_size_bytes": len(file_bytes)
        }

    @staticmethod
    def retrieve_and_decrypt(storage_path: str, expected_sha256: str = None) -> bytes:
        """
        Features 28 & 30:
        Retrieves file from encrypted vault, decrypts with AES-256-GCM, and verifies SHA-256 integrity.
        """
        path = Path(storage_path)
        if not path.exists():
            raise FileNotFoundError(f"Storage path {storage_path} does not exist.")
            
        with open(path, "rb") as f:
            encrypted_data = f.read()
            
        if len(encrypted_data) < 12:
            raise ValueError("Corrupt encrypted payload.")
            
        nonce = encrypted_data[:12]
        ciphertext = encrypted_data[12:]
        key = get_aes_key()
        aesgcm = AESGCM(key)
        
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        
        # Verify SHA-256 integrity check (Feature 30)
        if expected_sha256:
            current_hash = StorageService.compute_sha256(decrypted_bytes)
            if current_hash.lower() != expected_sha256.lower():
                raise ValueError("Cryptographic Integrity Failure: SHA-256 hash mismatch!")
                
        return decrypted_bytes

    @staticmethod
    def generate_signed_token(doc_id: str, user_id: str, action: str = "preview", expiry_seconds: int = 900) -> dict:
        """
        Feature 28:
        Generates HMAC-signed URL parameters valid for exactly 15 minutes (900 seconds).
        """
        expires_at = int(time.time()) + expiry_seconds
        payload = f"{doc_id}:{user_id}:{action}:{expires_at}"
        signature = hmac.new(
            settings.SECRET_KEY.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return {
            "expires": expires_at,
            "token": signature,
            "query_string": f"token={signature}&expires={expires_at}"
        }

    @staticmethod
    def verify_signed_token(doc_id: str, user_id: str, action: str, token: str, expires: int) -> bool:
        """Validates 15-minute signed token."""
        now = int(time.time())
        if now > expires:
            return False # Expired
            
        payload = f"{doc_id}:{user_id}:{action}:{expires}"
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(token, expected_sig)
