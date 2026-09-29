from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SessionResponse(BaseModel):
    id: str
    device_name: str
    ip_address: str
    location_estimate: str
    is_current: bool = False
    last_active_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class LoginActivityResponse(BaseModel):
    id: str
    auth_method: str
    status: str
    failure_reason: Optional[str] = None
    ip_address: str
    device_summary: str
    location: str
    is_new_device: bool
    created_at: datetime

    class Config:
        from_attributes = True
