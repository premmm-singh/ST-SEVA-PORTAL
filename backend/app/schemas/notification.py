from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.db.models.notification import (
    NotificationCategory,
    NotificationPriority,
    DeliveryChannel,
    DeliveryStatus
)

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    application_id: Optional[str] = None
    category: NotificationCategory
    priority: NotificationPriority
    title: str
    message: str
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    unread_count: int
    items: List[NotificationResponse]

class NotificationPreferenceResponse(BaseModel):
    id: str
    user_id: str
    sms_enabled: bool
    whatsapp_enabled: bool
    email_enabled: bool
    in_app_enabled: bool
    preferred_language: str
    dnd_start_hour: int
    dnd_end_hour: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationPreferenceUpdateRequest(BaseModel):
    sms_enabled: Optional[bool] = None
    whatsapp_enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None
    in_app_enabled: Optional[bool] = None
    preferred_language: Optional[str] = None
    dnd_start_hour: Optional[int] = None
    dnd_end_hour: Optional[int] = None

class BroadcastCampaignRequest(BaseModel):
    title: str
    message_text: str
    target_role: str = "STUDENT"
    target_district: Optional[str] = None
    target_scheme_id: Optional[str] = None
    channels: List[str] = ["IN_APP", "SMS"]

class BroadcastCampaignResponse(BaseModel):
    id: str
    title: str
    message_text: str
    target_role: str
    target_district: Optional[str] = None
    target_scheme_id: Optional[str] = None
    channels: str
    total_recipients: int
    success_count: int
    failed_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DlrWebhookPayload(BaseModel):
    gateway_ref_id: str
    delivery_status: str
    dlr_code: Optional[str] = None
    failure_reason: Optional[str] = None

class TriggerEventRequest(BaseModel):
    event_type: str
    user_id: str
    application_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
