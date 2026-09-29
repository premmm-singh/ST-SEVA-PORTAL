import os
import hmac
import hashlib
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings

# 32-byte key for AES-256
def get_aes_key() -> bytes:
    key_bytes = settings.AES_MASTER_KEY.encode('utf-8')
    if len(key_bytes) < 32:
        return key_bytes.ljust(32, b'0')
    return key_bytes[:32]

def encrypt_field(plaintext: str) -> str:
    """Encrypts plaintext using AES-256-GCM and returns base64 string."""
    if not plaintext:
        return ""
    key = get_aes_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12) # 96-bit nonce
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
    # Combine nonce + ciphertext
    combined = nonce + ciphertext
    return base64.b64encode(combined).decode('utf-8')

def decrypt_field(encrypted_str: str) -> str:
    """Decrypts base64 AES-256-GCM string back to plaintext."""
    if not encrypted_str:
        return ""
    try:
        data = base64.b64decode(encrypted_str.encode('utf-8'))
        nonce = data[:12]
        ciphertext = data[12:]
        key = get_aes_key()
        aesgcm = AESGCM(key)
        decrypted = aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted.decode('utf-8')
    except Exception:
        return ""

def blind_index(value: str) -> str:
    """Computes deterministic HMAC-SHA256 for exact match search without decrypting."""
    if not value:
        return ""
    normalized = value.strip().lower()
    return hmac.new(
        settings.HASH_PEPPER.encode('utf-8'),
        normalized.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
