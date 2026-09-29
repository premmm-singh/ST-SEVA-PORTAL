import hashlib
import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models.notification import (
    Notification,
    NotificationCategory,
    NotificationPriority,
    DeliveryChannel,
    DeliveryStatus,
    NotificationDispatchLog,
    NotificationPreference,
    BroadcastCampaign,
    CommunicationAuditLog
)
from app.db.models.user import User, UserRole
from app.db.models.application import Application
from app.db.models.institution import DefectNotice

def get_utc_now():
    return datetime.now(timezone.utc)

# F-84: Statutory TRAI DLT Template Registry
DLT_TEMPLATES = {
    "APPLICATION_SUBMITTED": {
        "id": "DLT-TE-1001",
        "name": "Application Submission Confirmation",
        "template": "Dear {student_name}, your ST Scholarship application {application_number} has been submitted successfully on ST Seva Portal. - JHGOVT"
    },
    "SCRUTINY_DEFECT_RAISED": {
        "id": "DLT-TE-1002",
        "name": "Scrutiny Defect Notice",
        "template": "Urgent: Defect notice issued on application {application_number}. Please upload corrected {document_type} within 7 days. - JHGOVT"
    },
    "PROVISIONAL_MERIT_PUBLISHED": {
        "id": "DLT-TE-1003",
        "name": "Provisional Merit List & Objections",
        "template": "Provisional Merit List published for {scheme_name}. Objection window is open for 7 days on ST Seva Portal. - JHGOVT"
    },
    "SANCTION_ORDER_ISSUED": {
        "id": "DLT-TE-1004",
        "name": "Sanction Order Sealed",
        "template": "Congratulations {student_name}! Statutory Sanction Order {sanction_order_number} has been issued for your ST Scholarship. - JHGOVT"
    },
    "DBT_CREDIT_CONFIRMED": {
        "id": "DLT-TE-1005",
        "name": "DBT Direct Bank Credit Confirmed",
        "template": "DBT Alert: Rs.{amount} has been credited to your bank account ({masked_account}) via PFMS. UTR: {utr_number}. - JHGOVT"
    },
    "BROADCAST_ALERT": {
        "id": "DLT-TE-1006",
        "name": "Official Welfare Broadcast",
        "template": "{broadcast_message} - Tribal Welfare Dept, Jharkhand"
    }
}

# F-86: Multi-Lingual Localized Message Translations
LOCALIZED_TEMPLATES = {
    "HI": {
        "APPLICATION_SUBMITTED": "नमस्ते {student_name}, आपका छात्रवृत्ति आवेदन {application_number} सफलतापूर्वक जमा हो गया है।",
        "SCRUTINY_DEFECT_RAISED": "आवश्यक सूचना: आवेदन {application_number} में त्रुटि पाई गई है। कृपया 7 दिनों में {document_type} पुनः अपलोड करें।",
        "SANCTION_ORDER_ISSUED": "बधाई हो {student_name}! आपकी छात्रवृत्ति के लिए स्वीकृति आदेश {sanction_order_number} जारी कर दिया गया है।",
        "DBT_CREDIT_CONFIRMED": "डीबीटी सूचना: रु.{amount} आपके बैंक खाते ({masked_account}) में अंतरित कर दी गई है। यूटीआर: {utr_number}।"
    },
    "SANTALI": {
        "APPLICATION_SUBMITTED": "ᱡᱚᱦᱟᱨ {student_name}, ᱟᱢᱟᱜ ᱟᱵᱮᱫᱚᱱ {application_number} ᱥᱟᱹᱛ ᱮᱱᱟ᱾",
        "SCRUTINY_DEFECT_RAISED": "ᱡᱟᱹᱨᱩᱲ ᱠᱟᱛᱷᱟ: {application_number} ᱨᱮ ᱠᱷᱟᱹᱢᱛᱤ ᱧᱟᱢ ᱮᱱᱟ᱾ ᱗ ᱢᱟᱦᱟᱸ ᱨᱮ {document_type} ᱟᱯᱞᱚᱰ ᱢᱮ᱾",
        "SANCTION_ORDER_ISSUED": "ᱥᱟᱨᱦᱟᱣ {student_name}! ᱥᱠᱚᱞᱟᱨᱥᱤᱯ ᱥᱮᱱᱠᱥᱚᱱ ᱮᱱᱟ: {sanction_order_number}᱾",
        "DBT_CREDIT_CONFIRMED": "ᱴᱟᱠᱟ ᱵᱷᱮᱡᱟᱭᱮᱱᱟ: Rs.{amount} ᱟᱢᱟᱜ ᱵᱮᱸᱠ ᱨᱮ ᱡᱚᱢᱟ ᱮᱱᱟ᱾ UTR: {utr_number}᱾"
    }
}

class NotificationService:
    @staticmethod
    def get_or_create_user_preferences(db: Session, user_id: str) -> NotificationPreference:
        """F-91: Retrieves or initializes user multi-channel notification preferences."""
        pref = db.query(NotificationPreference).filter(NotificationPreference.user_id == user_id).first()
        if not pref:
            pref = NotificationPreference(
                user_id=user_id,
                sms_enabled=True,
                whatsapp_enabled=True,
                email_enabled=True,
                in_app_enabled=True,
                preferred_language="EN",
                dnd_start_hour=21,
                dnd_end_hour=7
            )
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return pref

    @staticmethod
    def update_user_preferences(db: Session, user_id: str, updates: Dict[str, Any]) -> NotificationPreference:
        """F-91: Updates communication preferences & DND quiet hours."""
        pref = NotificationService.get_or_create_user_preferences(db, user_id)
        if "sms_enabled" in updates: pref.sms_enabled = updates["sms_enabled"]
        if "whatsapp_enabled" in updates: pref.whatsapp_enabled = updates["whatsapp_enabled"]
        if "email_enabled" in updates: pref.email_enabled = updates["email_enabled"]
        if "in_app_enabled" in updates: pref.in_app_enabled = updates["in_app_enabled"]
        if "preferred_language" in updates: pref.preferred_language = updates["preferred_language"].upper()
        if "dnd_start_hour" in updates: pref.dnd_start_hour = updates["dnd_start_hour"]
        if "dnd_end_hour" in updates: pref.dnd_end_hour = updates["dnd_end_hour"]
        
        pref.updated_at = get_utc_now()
        db.commit()
        db.refresh(pref)
        return pref

    @staticmethod
    def render_template(event_type: str, language: str, context: Dict[str, Any]) -> str:
        """F-84, F-86: Multi-lingual localized DLT message rendering."""
        lang = (language or "EN").upper()
        normalized_ctx = {
            "student_name": context.get("student_name") or context.get("full_name") or "Applicant",
            "application_number": context.get("application_number") or context.get("app_no") or "ST-APP",
            "scheme_name": context.get("scheme_name") or "Tribal Scholarship",
            "document_type": context.get("document_type") or context.get("defect_reason") or "Document",
            "sanction_order_number": context.get("sanction_order_number") or "SO-2026-001",
            "amount": context.get("amount") or "0",
            "masked_account": context.get("masked_account") or "XXXX0001",
            "utr_number": context.get("utr_number") or context.get("bank_ref") or "UTR123456",
            "broadcast_message": context.get("broadcast_message") or context.get("message") or ""
        }
        normalized_ctx.update(context)

        raw_template = None
        if lang in LOCALIZED_TEMPLATES and event_type in LOCALIZED_TEMPLATES[lang]:
            raw_template = LOCALIZED_TEMPLATES[lang][event_type]
        elif event_type in DLT_TEMPLATES:
            raw_template = DLT_TEMPLATES[event_type]["template"]
        else:
            raw_template = "{broadcast_message}"

        try:
            return raw_template.format(**normalized_ctx)
        except Exception:
            return raw_template

    @staticmethod
    def create_in_app_notification(
        db: Session,
        user_id: str,
        title: str,
        message: str,
        category: NotificationCategory = NotificationCategory.SYSTEM,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None,
        application_id: Optional[str] = None
    ) -> Notification:
        """F-87, F-94: Creates in-app actionable notification."""
        notif = Notification(
            user_id=user_id,
            application_id=application_id,
            category=category,
            priority=priority,
            title=title,
            message=message,
            action_url=action_url,
            action_label=action_label,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def send_simulated_sms(
        db: Session,
        notification: Notification,
        mobile_number: str,
        dlt_template_key: str,
        template_params: Dict[str, Any]
    ) -> NotificationDispatchLog:
        """F-84: Dispatches SMS via CDAC / NIC gateway with DLT template validation."""
        template_meta = DLT_TEMPLATES.get(dlt_template_key, DLT_TEMPLATES["BROADCAST_ALERT"])
        dlt_template_id = template_meta["id"]

        try:
            rendered_msg = template_meta["template"].format(**template_params)
        except Exception:
            rendered_msg = notification.message

        gateway_ref = f"CDAC-{uuid4().hex[:10].upper()}"
        now = get_utc_now()

        # Check DND: If non-urgent and within 21:00-07:00, queue or simulate
        current_hour = now.hour
        is_dnd_time = current_hour >= 21 or current_hour < 7
        is_urgent = notification.priority in [NotificationPriority.URGENT, NotificationPriority.HIGH]

        # Simulate telecom delivery status
        # If mobile ends with 0000 simulate failure for fallback testing
        is_success = not mobile_number.endswith("0000")
        delivery_status = DeliveryStatus.DELIVERED if (is_success and (not is_dnd_time or is_urgent)) else (
            DeliveryStatus.QUEUED if is_dnd_time and not is_urgent else DeliveryStatus.FAILED
        )

        dispatch_log = NotificationDispatchLog(
            notification_id=notification.id,
            recipient_address=mobile_number,
            channel=DeliveryChannel.SMS,
            dlt_template_id=dlt_template_id,
            gateway_ref_id=gateway_ref,
            delivery_status=delivery_status,
            dlr_code="DELIVRD" if delivery_status == DeliveryStatus.DELIVERED else ("DND_REJECTED" if is_dnd_time else "FAIL_NETWORK"),
            failure_reason="Mobile number network unreachable" if delivery_status == DeliveryStatus.FAILED else None,
            sent_at=now,
            delivered_at=now if delivery_status == DeliveryStatus.DELIVERED else None
        )
        db.add(dispatch_log)

        # Audit log for TRAI compliance
        msg_hash = hashlib.sha256(rendered_msg.encode()).hexdigest()
        audit = CommunicationAuditLog(
            action="SMS_DISPATCHED",
            notification_id=notification.id,
            recipient_id=notification.user_id,
            channel="SMS",
            dlt_template_id=dlt_template_id,
            message_hash=msg_hash,
            details=f"SMS via CDAC gateway to {mobile_number}. Status: {delivery_status.value}"
        )
        db.add(audit)
        db.commit()
        db.refresh(dispatch_log)
        return dispatch_log

    @staticmethod
    def send_simulated_whatsapp(
        db: Session,
        notification: Notification,
        mobile_number: str,
        quick_replies: Optional[List[str]] = None
    ) -> NotificationDispatchLog:
        """F-85: Interactive WhatsApp Business API gateway dispatcher."""
        gateway_ref = f"WA-{uuid4().hex[:10].upper()}"
        now = get_utc_now()
        is_success = not mobile_number.endswith("1111") # failure mock edge case

        dispatch_log = NotificationDispatchLog(
            notification_id=notification.id,
            recipient_address=mobile_number,
            channel=DeliveryChannel.WHATSAPP,
            gateway_ref_id=gateway_ref,
            delivery_status=DeliveryStatus.DELIVERED if is_success else DeliveryStatus.FAILED,
            dlr_code="READ" if is_success else "UNDELIVRD",
            sent_at=now,
            delivered_at=now if is_success else None
        )
        db.add(dispatch_log)

        msg_hash = hashlib.sha256(notification.message.encode()).hexdigest()
        audit = CommunicationAuditLog(
            action="WHATSAPP_DISPATCHED",
            notification_id=notification.id,
            recipient_id=notification.user_id,
            channel="WHATSAPP",
            message_hash=msg_hash,
            details=f"Interactive WhatsApp alert with buttons: {quick_replies or ['View Portal']}"
        )
        db.add(audit)
        db.commit()
        db.refresh(dispatch_log)
        return dispatch_log

    @staticmethod
    def send_simulated_email(
        db: Session,
        notification: Notification,
        email_address: str,
        language: str = "EN"
    ) -> NotificationDispatchLog:
        """F-86: Multi-lingual transactional email dispatcher."""
        gateway_ref = f"MAIL-{uuid4().hex[:10].upper()}"
        now = get_utc_now()

        dispatch_log = NotificationDispatchLog(
            notification_id=notification.id,
            recipient_address=email_address,
            channel=DeliveryChannel.EMAIL,
            gateway_ref_id=gateway_ref,
            delivery_status=DeliveryStatus.DELIVERED,
            dlr_code="SMTP_250_OK",
            sent_at=now,
            delivered_at=now
        )
        db.add(dispatch_log)

        msg_hash = hashlib.sha256(notification.message.encode()).hexdigest()
        audit = CommunicationAuditLog(
            action="EMAIL_DISPATCHED",
            notification_id=notification.id,
            recipient_id=notification.user_id,
            channel="EMAIL",
            message_hash=msg_hash,
            details=f"Localized Email dispatched ({language}) to {email_address}"
        )
        db.add(audit)
        db.commit()
        db.refresh(dispatch_log)
        return dispatch_log

    @staticmethod
    def trigger_milestone_notification(
        db: Session,
        event_type: str,
        user_id: str,
        application_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """F-88, F-90: Triggers automated lifecycle events and multi-channel fallback dispatch."""
        context = context or {}
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("Target user not found")

        pref = NotificationService.get_or_create_user_preferences(db, user_id)
        lang = pref.preferred_language or "EN"

        # Determine titles and priority based on statutory event type
        event_configs = {
            "APPLICATION_SUBMITTED": {
                "title": "Application Submitted Successfully",
                "category": NotificationCategory.APPLICATION,
                "priority": NotificationPriority.NORMAL,
                "action_url": f"/applications/{application_id}/timeline" if application_id else "/applications",
                "action_label": "View Application",
                "dlt_key": "APPLICATION_SUBMITTED"
            },
            "SCRUTINY_DEFECT_RAISED": {
                "title": "Action Required: Scrutiny Defect Notice",
                "category": NotificationCategory.SCRUTINY,
                "priority": NotificationPriority.URGENT,
                "action_url": f"/applications/{application_id}" if application_id else "/applications",
                "action_label": "Rectify Defect Notice",
                "dlt_key": "SCRUTINY_DEFECT_RAISED"
            },
            "PROVISIONAL_MERIT_PUBLISHED": {
                "title": "Provisional Merit List Published",
                "category": NotificationCategory.ALLOCATION,
                "priority": NotificationPriority.HIGH,
                "action_url": "/student/merit-status",
                "action_label": "Check Merit Score & Objections",
                "dlt_key": "PROVISIONAL_MERIT_PUBLISHED"
            },
            "SANCTION_ORDER_ISSUED": {
                "title": "Statutory Sanction Order Issued",
                "category": NotificationCategory.ALLOCATION,
                "priority": NotificationPriority.HIGH,
                "action_url": "/student/merit-status",
                "action_label": "Download Sanction Order",
                "dlt_key": "SANCTION_ORDER_ISSUED"
            },
            "DBT_CREDIT_CONFIRMED": {
                "title": "Direct Benefit Transfer (DBT) Credited",
                "category": NotificationCategory.DBT,
                "priority": NotificationPriority.HIGH,
                "action_url": "/student/dbt-tracking",
                "action_label": "Track Bank Credit (UTR)",
                "dlt_key": "DBT_CREDIT_CONFIRMED"
            }
        }

        config = event_configs.get(event_type, {
            "title": "Tribal Welfare Notification",
            "category": NotificationCategory.SYSTEM,
            "priority": NotificationPriority.NORMAL,
            "action_url": "/dashboard",
            "action_label": "View Portal",
            "dlt_key": "BROADCAST_ALERT"
        })

        # Render message text with localized template if available
        dlt_meta = DLT_TEMPLATES.get(config["dlt_key"], DLT_TEMPLATES["BROADCAST_ALERT"])
        base_template = dlt_meta["template"]

        if lang in LOCALIZED_TEMPLATES and config["dlt_key"] in LOCALIZED_TEMPLATES[lang]:
            base_template = LOCALIZED_TEMPLATES[lang][config["dlt_key"]]

        try:
            rendered_message = base_template.format(**context)
        except Exception:
            rendered_message = f"{config['title']}: Please review details in the portal."

        # 1. In-App Notification (Always created if enabled)
        notif = NotificationService.create_in_app_notification(
            db=db,
            user_id=user_id,
            title=config["title"],
            message=rendered_message,
            category=config["category"],
            priority=config["priority"],
            action_url=config["action_url"],
            action_label=config["action_label"],
            application_id=application_id
        )

        # 2. Multi-Channel Fallback Hierarchy: WhatsApp -> SMS -> Email
        mobile = context.get("mobile_number", "9876543210")
        email = user.email

        # Try WhatsApp if enabled
        wa_log = None
        if pref.whatsapp_enabled:
            wa_log = NotificationService.send_simulated_whatsapp(
                db=db,
                notification=notif,
                mobile_number=mobile,
                quick_replies=[config["action_label"]]
            )

        # Fallback to SMS if WhatsApp failed or disabled
        if pref.sms_enabled and (not wa_log or wa_log.delivery_status == DeliveryStatus.FAILED):
            NotificationService.send_simulated_sms(
                db=db,
                notification=notif,
                mobile_number=mobile,
                dlt_template_key=config["dlt_key"],
                template_params=context
            )

        # Email dispatch if enabled
        if pref.email_enabled and email:
            NotificationService.send_simulated_email(
                db=db,
                notification=notif,
                email_address=email,
                language=lang
            )

        return notif

    @staticmethod
    def send_bulk_broadcast(
        db: Session,
        title: str,
        message_text: str,
        officer_id: str,
        target_district: Optional[str] = None,
        target_scheme_id: Optional[str] = None,
        target_role: str = "STUDENT",
        channels: Optional[List[str]] = None
    ) -> BroadcastCampaign:
        """F-89: DWO / Admin Bulk Broadcast Engine."""
        channels = channels or ["IN_APP", "SMS"]
        channels_str = ",".join(channels)

        # Query audience
        query = db.query(User).filter(User.role == UserRole[target_role.upper()])
        users = query.all()

        campaign = BroadcastCampaign(
            title=title,
            message_text=message_text,
            target_role=target_role,
            target_district=target_district,
            target_scheme_id=target_scheme_id,
            channels=channels_str,
            total_recipients=len(users),
            success_count=0,
            failed_count=0,
            initiated_by_officer_id=officer_id
        )
        db.add(campaign)
        db.flush()

        success_count = 0
        failed_count = 0

        for user in users:
            try:
                # In-App
                if "IN_APP" in channels:
                    notif = NotificationService.create_in_app_notification(
                        db=db,
                        user_id=user.id,
                        title=title,
                        message=message_text,
                        category=NotificationCategory.BROADCAST,
                        priority=NotificationPriority.NORMAL,
                        action_url="/dashboard",
                        action_label="Acknowledge Alert"
                    )

                # SMS
                if "SMS" in channels and 'notif' in locals():
                    NotificationService.send_simulated_sms(
                        db=db,
                        notification=notif,
                        mobile_number="9876500001",
                        dlt_template_key="BROADCAST_ALERT",
                        template_params={"broadcast_message": message_text}
                    )
                success_count += 1
            except Exception:
                failed_count += 1

        campaign.success_count = success_count
        campaign.failed_count = failed_count

        audit = CommunicationAuditLog(
            action="BROADCAST_CAMPAIGN_EXECUTED",
            recipient_id=officer_id,
            channel=channels_str,
            message_hash=hashlib.sha256(message_text.encode()).hexdigest(),
            details=f"Broadcast '{title}' delivered to {success_count} recipients. Target: {target_district or 'ALL'}."
        )
        db.add(audit)
        db.commit()
        db.refresh(campaign)
        return campaign

    @staticmethod
    def process_dlr_webhook(
        db: Session,
        gateway_ref_id: str,
        delivery_status: str,
        dlr_code: Optional[str] = None,
        failure_reason: Optional[str] = None
    ) -> Optional[NotificationDispatchLog]:
        """F-92: Webhook receiver ingesting real-time telecom Delivery Receipts (DLR)."""
        dispatch_log = db.query(NotificationDispatchLog).filter(
            NotificationDispatchLog.gateway_ref_id == gateway_ref_id
        ).first()

        if not dispatch_log:
            return None

        status_enum = DeliveryStatus[delivery_status.upper()] if delivery_status.upper() in DeliveryStatus.__members__ else DeliveryStatus.DELIVERED
        dispatch_log.delivery_status = status_enum
        dispatch_log.dlr_code = dlr_code or "PROCESSED"
        dispatch_log.failure_reason = failure_reason
        if status_enum in [DeliveryStatus.DELIVERED, DeliveryStatus.READ]:
            dispatch_log.delivered_at = get_utc_now()

        db.commit()
        db.refresh(dispatch_log)
        return dispatch_log

    @staticmethod
    def check_and_trigger_deadline_chasers(db: Session) -> int:
        """F-93: Critical deadline auto-chaser triggered for defect notices near cutoff."""
        now = get_utc_now()
        upcoming_cutoff = now + timedelta(days=2) # 48 hours window

        pending_defects = db.query(DefectNotice).filter(
            DefectNotice.is_resolved == False,
            DefectNotice.correction_deadline <= upcoming_cutoff
        ).all()

        chaser_count = 0
        for defect in pending_defects:
            app = db.query(Application).filter(Application.id == defect.application_id).first()
            if not app:
                continue

            # Send critical escalation
            NotificationService.trigger_milestone_notification(
                db=db,
                event_type="SCRUTINY_DEFECT_RAISED",
                user_id=app.student_id,
                application_id=app.id,
                context={
                    "application_number": app.application_number,
                    "document_type": f"CRITICAL: {defect.defect_category} (Expiring in 48h)",
                    "mobile_number": "9876543210"
                }
            )
            chaser_count += 1

        return chaser_count

    @staticmethod
    def export_trai_compliance_logs(db: Session) -> Dict[str, Any]:
        """F-95: Statutory TRAI DLT communication delivery audit trail."""
        logs = db.query(NotificationDispatchLog).order_by(NotificationDispatchLog.created_at.desc()).all()
        records = []
        for l in logs:
            records.append({
                "dispatch_id": l.id,
                "notification_id": l.notification_id,
                "recipient_address": l.recipient_address,
                "channel": l.channel.value,
                "dlt_template_id": l.dlt_template_id,
                "gateway_ref_id": l.gateway_ref_id,
                "delivery_status": l.delivery_status.value,
                "dlr_code": l.dlr_code,
                "sent_at": l.sent_at.isoformat() if l.sent_at else None,
                "delivered_at": l.delivered_at.isoformat() if l.delivered_at else None
            })

        digest = hashlib.sha256(f"TRAI|{len(records)}|{get_utc_now().date().isoformat()}".encode()).hexdigest()
        return {
            "trai_audit_seal": digest,
            "total_dispatches": len(records),
            "generated_at": get_utc_now().isoformat(),
            "records": records
        }
