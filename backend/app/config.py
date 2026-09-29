import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "ST Seva Portal - ST Scholarship Certificate Verification System"
    API_V1_STR: str = "/api/v1"
    
    # Security & Cryptography
    SECRET_KEY: str = os.getenv("SECRET_KEY", "st_seva_super_secret_jwt_key_2026_gov_nic_in_tribal_portal_secure_token")
    AES_MASTER_KEY: str = os.getenv("AES_MASTER_KEY", "st_seva_portal_aes256_master_key_secure_nic_32b!") # 32 bytes
    HASH_PEPPER: str = os.getenv("HASH_PEPPER", "st_seva_blind_index_pepper_2026")
    
    # Token Expiration
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 2  # 2 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7         # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./st_seva.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    
    class Config:
        case_sensitive = True

settings = Settings()
