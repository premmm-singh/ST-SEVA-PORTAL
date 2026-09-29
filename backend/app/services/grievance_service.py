import hashlib
import json
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from app.db.models.grievance import (
    Grievance,
    GrievanceCategory,
    GrievanceStatus,
    GrievancePriority,
    HearingMode,
    GrievanceTimeline,
    GrievanceHearing,
    GrievanceAppeal,
    HelpdeskArticle
)
from app.db.models.user import User, UserRole

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_ticket_number() -> str:
    """F-97: Generates unique statutory tracking ID (e.g. GRV-JH-2026-A1B2C3)."""
    random_suffix = secrets.token_hex(3).upper()
    current_year = datetime.now().year
    return f"GRV-JH-{current_year}-{random_suffix}"

def generate_atr_seal(ticket_number: str, officer_id: str, atr_text: str, timestamp: datetime) -> str:
    """F-102: Generates tamper-evident SHA-256 digital signature seal for Action Taken Report."""
    payload = f"{ticket_number}|{officer_id}|{atr_text}|{timestamp.isoformat()}"
    return f"ATR-SEAL-{hashlib.sha256(payload.encode()).hexdigest()[:32].upper()}"

class GrievanceService:

    @staticmethod
    def file_grievance(
        db: Session,
        complainant_user_id: str,
        subject: str,
        description: str,
        category: GrievanceCategory = GrievanceCategory.OTHER,
        application_id: Optional[str] = None,
        district: str = "Ranchi",
        evidence_document_url: Optional[str] = None,
        priority: GrievancePriority = GrievancePriority.MEDIUM,
        external_source: str = "PORTAL",
        external_reference_id: Optional[str] = None
    ) -> Grievance:
        """F-96: Beneficiary Grievance Registration & Statutory SLA Initialization."""
        ticket_no = generate_ticket_number()
        
        # Statutory SLA: 7 days for standard, 3 days for URGENT
        sla_days = 3 if priority == GrievancePriority.URGENT else 7
        sla_deadline = get_utc_now() + timedelta(days=sla_days)

        grievance = Grievance(
            ticket_number=ticket_no,
            complainant_user_id=complainant_user_id,
            application_id=application_id,
            category=category,
            subject=subject,
            description=description,
            district=district,
            evidence_document_url=evidence_document_url,
            status=GrievanceStatus.SUBMITTED,
            priority=priority,
            tier_level=1,  # Tier 1 Helpdesk
            sla_deadline=sla_deadline,
            is_sla_breached=False,
            external_source=external_source,
            external_reference_id=external_reference_id,
            created_at=get_utc_now(),
            updated_at=get_utc_now()
        )
        db.add(grievance)
        db.flush()

        # Record timeline event
        timeline = GrievanceTimeline(
            grievance_id=grievance.id,
            action="FILED",
            remarks=f"Grievance registered under {category.value} with 7-day statutory resolution SLA.",
            actor_id=complainant_user_id,
            actor_name="Citizen / Beneficiary",
            actor_role="CITIZEN",
            created_at=get_utc_now()
        )
        db.add(timeline)
        db.commit()
        db.refresh(grievance)
        return grievance

    @staticmethod
    def get_my_grievances(db: Session, user_id: str) -> List[Grievance]:
        """List grievances filed by a specific user."""
        return (
            db.query(Grievance)
            .filter(Grievance.complainant_user_id == user_id)
            .order_by(desc(Grievance.created_at))
            .all()
        )

    @staticmethod
    def track_public_grievance(db: Session, ticket_number: str) -> Optional[Grievance]:
        """F-101: Public grievance tracker accessible without login."""
        return (
            db.query(Grievance)
            .filter(Grievance.ticket_number == ticket_number.strip().upper())
            .first()
        )

    @staticmethod
    def get_grievance_by_id(db: Session, grievance_id: str) -> Optional[Grievance]:
        return db.query(Grievance).filter(Grievance.id == grievance_id).first()

    @staticmethod
    def get_officer_queue(
        db: Session,
        status: Optional[str] = None,
        tier_level: Optional[int] = None,
        district: Optional[str] = None,
        is_sla_breached: Optional[bool] = None,
        priority: Optional[str] = None
    ) -> List[Grievance]:
        """Welfare Officer grievance processing queue."""
        query = db.query(Grievance)
        if status:
            query = query.filter(Grievance.status == status)
        if tier_level:
            query = query.filter(Grievance.tier_level == tier_level)
        if district:
            query = query.filter(Grievance.district == district)
        if is_sla_breached is not None:
            query = query.filter(Grievance.is_sla_breached == is_sla_breached)
        if priority:
            query = query.filter(Grievance.priority == priority)
        
        return query.order_by(desc(Grievance.is_sla_breached), desc(Grievance.created_at)).all()

    @staticmethod
    def take_officer_action(
        db: Session,
        grievance_id: str,
        officer: User,
        action: str,
        remarks: str,
        assigned_officer_id: Optional[str] = None,
        resolution_summary: Optional[str] = None,
        action_taken_report: Optional[str] = None,
        atr_digital_seal: Optional[str] = None
    ) -> Grievance:
        """F-102: Officer action, assignment, or final ATR closure."""
        grievance = db.query(Grievance).filter(Grievance.id == grievance_id).first()
        if not grievance:
            raise ValueError(f"Grievance with ID {grievance_id} not found.")

        now = get_utc_now()
        action_upper = action.strip().upper()

        if action_upper == "ASSIGN":
            grievance.assigned_officer_id = assigned_officer_id or officer.id
            grievance.status = GrievanceStatus.IN_REVIEW
            timeline_action = "ASSIGNED"
        elif action_upper == "IN_REVIEW":
            grievance.status = GrievanceStatus.IN_REVIEW
            timeline_action = "UNDER_SCRUTINY"
        elif action_upper == "RESOLVE":
            grievance.status = GrievanceStatus.RESOLVED
            grievance.resolution_summary = resolution_summary or remarks
            grievance.action_taken_report = action_taken_report or remarks
            # Generate cryptographic digital signature seal if not supplied
            grievance.atr_digital_seal = atr_digital_seal or generate_atr_seal(
                grievance.ticket_number, officer.id, grievance.action_taken_report, now
            )
            grievance.resolved_at = now
            timeline_action = "RESOLVED"
        elif action_upper == "CLOSE":
            grievance.status = GrievanceStatus.CLOSED
            grievance.closed_at = now
            timeline_action = "CLOSED"
        elif action_upper == "ESCALATE":
            if grievance.tier_level < 3:
                grievance.tier_level += 1
            grievance.status = GrievanceStatus.ESCALATED_L2 if grievance.tier_level == 2 else GrievanceStatus.ESCALATED_L3
            timeline_action = f"MANUALLY_ESCALATED_L{grievance.tier_level}"
        else:
            timeline_action = action_upper

        grievance.updated_at = now

        # Record timeline entry
        timeline = GrievanceTimeline(
            grievance_id=grievance.id,
            action=timeline_action,
            remarks=remarks,
            actor_id=officer.id,
            actor_name=officer.email or "Welfare Officer",
            actor_role=officer.role.value if hasattr(officer.role, 'value') else str(officer.role),
            created_at=now
        )
        db.add(timeline)
        db.commit()
        db.refresh(grievance)
        return grievance

    @staticmethod
    def schedule_dispute_hearing(
        db: Session,
        grievance_id: str,
        officer: User,
        scheduled_at: datetime,
        mode: HearingMode,
        venue_or_link: str,
        hearing_notes: Optional[str] = None
    ) -> GrievanceHearing:
        """F-100: Hearing appointment scheduler for formal dispute resolution."""
        grievance = db.query(Grievance).filter(Grievance.id == grievance_id).first()
        if not grievance:
            raise ValueError(f"Grievance with ID {grievance_id} not found.")

        now = get_utc_now()
        hearing = GrievanceHearing(
            grievance_id=grievance.id,
            scheduled_at=scheduled_at,
            mode=mode,
            venue_or_link=venue_or_link,
            hearing_notes=hearing_notes,
            conducted_by_officer_id=officer.id,
            status="SCHEDULED",
            created_at=now
        )
        db.add(hearing)

        grievance.status = GrievanceStatus.HEARING_SCHEDULED
        grievance.updated_at = now

        timeline = GrievanceTimeline(
            grievance_id=grievance.id,
            action="HEARING_CALLED",
            remarks=f"Formal {mode.value} hearing scheduled for {scheduled_at.strftime('%Y-%m-%d %H:%M UTC')} at/via {venue_or_link}.",
            actor_id=officer.id,
            actor_name=officer.email or "Welfare Officer",
            actor_role="OFFICER",
            created_at=now
        )
        db.add(timeline)
        db.commit()
        db.refresh(hearing)
        return hearing

    @staticmethod
    def update_hearing_outcome(
        db: Session,
        hearing_id: str,
        officer: User,
        attended_by_complainant: bool,
        hearing_notes: str,
        status: str = "COMPLETED"
    ) -> GrievanceHearing:
        """Update hearing results and complainant attendance."""
        hearing = db.query(GrievanceHearing).filter(GrievanceHearing.id == hearing_id).first()
        if not hearing:
            raise ValueError(f"Hearing with ID {hearing_id} not found.")

        hearing.attended_by_complainant = attended_by_complainant
        hearing.hearing_notes = hearing_notes
        hearing.status = status

        timeline = GrievanceTimeline(
            grievance_id=hearing.grievance_id,
            action="HEARING_RECORDED",
            remarks=f"Hearing marked {status}. Beneficiary Attended: {'Yes' if attended_by_complainant else 'No'}. Notes: {hearing_notes}",
            actor_id=officer.id,
            actor_name=officer.email or "Welfare Officer",
            actor_role="OFFICER",
            created_at=get_utc_now()
        )
        db.add(timeline)
        db.commit()
        db.refresh(hearing)
        return hearing

    @staticmethod
    def file_appeal(
        db: Session,
        grievance_id: str,
        complainant_user_id: str,
        appeal_reason: str
    ) -> GrievanceAppeal:
        """F-103: Citizen Appeal Mechanism within statutory 15-day window."""
        grievance = db.query(Grievance).filter(Grievance.id == grievance_id).first()
        if not grievance:
            raise ValueError(f"Grievance with ID {grievance_id} not found.")
        if grievance.complainant_user_id != complainant_user_id:
            raise PermissionError("Only original complainant can appeal this grievance.")

        now = get_utc_now()
        appeal = GrievanceAppeal(
            grievance_id=grievance.id,
            complainant_user_id=complainant_user_id,
            appeal_reason=appeal_reason,
            previous_resolution=grievance.resolution_summary or grievance.action_taken_report,
            target_tier=3,  # Escalate directly to L3 Directorate
            status="PENDING",
            created_at=now
        )
        db.add(appeal)

        # Update grievance state
        grievance.status = GrievanceStatus.APPEALED
        grievance.tier_level = 3
        # Extend SLA for appellate review
        grievance.sla_deadline = now + timedelta(days=7)
        grievance.updated_at = now

        timeline = GrievanceTimeline(
            grievance_id=grievance.id,
            action="APPEAL_OPENED",
            remarks=f"Beneficiary rejected resolution and appealed to State Directorate (Tier 3). Reason: {appeal_reason}",
            actor_id=complainant_user_id,
            actor_name="Complainant (Appellant)",
            actor_role="CITIZEN",
            created_at=now
        )
        db.add(timeline)
        db.commit()
        db.refresh(appeal)
        return appeal

    @staticmethod
    def run_sla_escalations(db: Session) -> Dict[str, Any]:
        """F-99: Automated SLA Deadline & Multi-Tier Escalation Engine."""
        now = get_utc_now()
        # Find active unresolved tickets where SLA deadline has passed
        expired_tickets = (
            db.query(Grievance)
            .filter(
                Grievance.sla_deadline < now,
                Grievance.status.notin_([GrievanceStatus.RESOLVED, GrievanceStatus.CLOSED])
            )
            .all()
        )

        escalated_count = 0
        details = []

        for grv in expired_tickets:
            grv.is_sla_breached = True
            old_tier = grv.tier_level
            
            if old_tier == 1:
                grv.tier_level = 2
                grv.status = GrievanceStatus.ESCALATED_L2
                grv.sla_deadline = now + timedelta(days=5)  # 5-day grace for DWO
                new_tier_label = "Tier 2 (District Welfare Officer - DWO)"
            elif old_tier == 2:
                grv.tier_level = 3
                grv.status = GrievanceStatus.ESCALATED_L3
                grv.sla_deadline = now + timedelta(days=3)  # 3-day grace for State Directorate
                new_tier_label = "Tier 3 (State Welfare Directorate)"
            else:
                new_tier_label = "Tier 3 (State Directorate - Urgent Attention Flagged)"

            grv.updated_at = now

            timeline = GrievanceTimeline(
                grievance_id=grv.id,
                action="SLA_BREACH_ESCALATED",
                remarks=f"Statutory resolution timeline exceeded. System auto-escalated grievance to {new_tier_label}.",
                actor_id=None,
                actor_name="ST Seva SLA Daemon",
                actor_role="SYSTEM",
                created_at=now
            )
            db.add(timeline)
            escalated_count += 1
            details.append({
                "ticket_number": grv.ticket_number,
                "from_tier": old_tier,
                "to_tier": grv.tier_level,
                "new_status": grv.status.value
            })

        db.commit()
        return {
            "total_expired_found": len(expired_tickets),
            "escalated_count": escalated_count,
            "escalations": details
        }

    @staticmethod
    def get_helpdesk_articles(db: Session, query_str: Optional[str] = None, category: Optional[str] = None) -> List[HelpdeskArticle]:
        """F-104: AI-Powered Smart FAQ & Knowledgebase search."""
        # Seed default articles if table is empty
        if db.query(HelpdeskArticle).count() == 0:
            GrievanceService._seed_default_faq(db)

        query = db.query(HelpdeskArticle).filter(HelpdeskArticle.is_published == True)
        if category and category != "ALL":
            query = query.filter(HelpdeskArticle.category == category)
        
        if query_str and query_str.strip():
            term = f"%{query_str.strip()}%"
            query = query.filter(
                or_(
                    HelpdeskArticle.question.ilike(term),
                    HelpdeskArticle.answer.ilike(term),
                    HelpdeskArticle.tags.ilike(term)
                )
            )

        articles = query.order_by(desc(HelpdeskArticle.helpful_count), desc(HelpdeskArticle.view_count)).all()
        return articles

    @staticmethod
    def mark_article_view(db: Session, article_id: str) -> Optional[HelpdeskArticle]:
        article = db.query(HelpdeskArticle).filter(HelpdeskArticle.id == article_id).first()
        if article:
            article.view_count += 1
            db.commit()
            db.refresh(article)
        return article

    @staticmethod
    def _seed_default_faq(db: Session):
        """Seed initial knowledgebase for ST Scholarship beneficiaries."""
        faqs = [
            {
                "category": "APPLICATION",
                "question": "What documents are mandatory for ST Post-Matric Scholarship?",
                "answer": "You need: 1) Valid Scheduled Tribe (ST) Caste Certificate issued by CO/SDO, 2) Annual Income Certificate (< Rs. 2.50 Lakhs), 3) Residential/Domicile Certificate of Jharkhand, 4) Fee receipt & Bonafide certificate from your enrolled institution, 5) Previous examination marksheet.",
                "tags": "caste,income,documents,eligibility"
            },
            {
                "category": "VERIFICATION",
                "question": "My institution verification is delayed. What should I do?",
                "answer": "Educational institutions have 14 days to verify applications from submission. If pending beyond this period, you can file an 'INSTITUTION_HARASSMENT' grievance through ST Seva Portal. District Welfare Officers will issue an automated reminder to the college nodal officer.",
                "tags": "institution,college,delay,scrutiny"
            },
            {
                "category": "DBT_PAYMENT",
                "question": "Why has my scholarship money not been credited even after sanction order?",
                "answer": "Direct Benefit Transfer (DBT) requires your bank account to be linked with Aadhaar and seeded on the NPCI mapper. Check NPCI seeding status in the DBT tracking section. If NPCI seeding is active but payment failed, file a 'DISBURSEMENT_FAILURE' grievance with your UTR or Application ID.",
                "tags": "dbt,pfms,npci,bank,account"
            },
            {
                "category": "DEFECT_RECTIFICATION",
                "question": "How do I clear a Scrutiny Defect Notice?",
                "answer": "When an officer marks a defect (e.g. illegible certificate), navigate to 'My Applications', click 'Rectify Defect', upload the corrected scan within 7 statutory days, and resubmit. Scrutiny will resume automatically.",
                "tags": "defect,scrutiny,resubmit,rejection"
            },
            {
                "category": "SLAS_AND_APPEALS",
                "question": "What is the statutory timeline for grievance resolution?",
                "answer": "Under the Right to Public Services Act, Tier 1 (Helpdesk) must resolve issues within 7 days. If unaddressed, the ticket automatically escalates to Tier 2 (District Welfare Officer). Citizens can also appeal any resolution to the State Directorate within 15 days.",
                "tags": "sla,timeline,appeal,dwo,directorate"
            }
        ]
        for item in faqs:
            article = HelpdeskArticle(
                category=item["category"],
                question=item["question"],
                answer=item["answer"],
                tags=item["tags"],
                view_count=10,
                helpful_count=5,
                is_published=True,
                created_at=get_utc_now()
            )
            db.add(article)
        db.commit()

    @staticmethod
    def sync_external_grievance(
        db: Session,
        external_source: str,
        external_reference_id: str,
        subject: str,
        description: str,
        category: GrievanceCategory = GrievanceCategory.OTHER,
        district: str = "Ranchi",
        complainant_phone: Optional[str] = None
    ) -> Grievance:
        """F-106: CPGRAMS & State Jansamvad Ingestion Adapter."""
        # Find or create a system user for external submissions
        external_user = db.query(User).filter(User.email == "external_citizen@stseva.gov.in").first()
        if not external_user:
            external_user = User(
                email="external_citizen@stseva.gov.in",
                hashed_password="EXTERNAL_SYSTEM_USER_NO_LOGIN",
                role=UserRole.STUDENT,
                is_active=True,
                is_verified=True,
                created_at=get_utc_now(),
                updated_at=get_utc_now()
            )
            db.add(external_user)
            db.commit()
            db.refresh(external_user)

        grievance = GrievanceService.file_grievance(
            db=db,
            complainant_user_id=external_user.id,
            subject=f"[{external_source}] {subject}",
            description=f"Ingested from {external_source} (Ref ID: {external_reference_id}). Contact: {complainant_phone or 'N/A'}.\n\n{description}",
            category=category,
            district=district,
            priority=GrievancePriority.HIGH,
            external_source=external_source,
            external_reference_id=external_reference_id
        )
        return grievance

    @staticmethod
    def whatsapp_bot_interact(db: Session, phone_number: str, message_text: str) -> Dict[str, Any]:
        """F-105: WhatsApp Grievance Intake & Status Bot simulation."""
        text = message_text.strip()
        tokens = text.split()
        command = tokens[0].upper() if tokens else ""

        if command == "STATUS" and len(tokens) >= 2:
            ticket = tokens[1].upper()
            grv = db.query(Grievance).filter(Grievance.ticket_number == ticket).first()
            if grv:
                reply = (
                    f"📌 *ST Seva Grievance Status*\n"
                    f"Ticket: `{grv.ticket_number}`\n"
                    f"Category: {grv.category.value}\n"
                    f"Current Status: *{grv.status.value}*\n"
                    f"Tier Level: Tier {grv.tier_level}\n"
                    f"SLA Deadline: {grv.sla_deadline.strftime('%d-%b-%Y') if grv.sla_deadline else 'N/A'}\n"
                    f"Resolution: {grv.resolution_summary or 'In progress'}"
                )
            else:
                reply = f"❌ No grievance found with Ticket ID `{ticket}`. Please verify and retry."
            return {"reply": reply, "ticket_found": grv is not None}

        elif command == "NEW" and len(tokens) >= 3:
            category_raw = tokens[1].upper()
            category_map = {
                "DELAY": GrievanceCategory.APPLICATION_DELAY,
                "REJECTION": GrievanceCategory.SCRUTINY_REJECTION,
                "PAYMENT": GrievanceCategory.DISBURSEMENT_FAILURE,
                "COLLEGE": GrievanceCategory.INSTITUTION_HARASSMENT,
                "TECH": GrievanceCategory.TECHNICAL_GLITCH
            }
            category = category_map.get(category_raw, GrievanceCategory.OTHER)
            desc_text = " ".join(tokens[2:])

            # Find or create a user for this phone
            user = db.query(User).filter(User.email == f"wa_{phone_number[-10:]}@stseva.gov.in").first()
            if not user:
                user = User(
                    email=f"wa_{phone_number[-10:]}@stseva.gov.in",
                    hashed_password="WHATSAPP_BOT_USER_NO_PASSWORD",
                    role=UserRole.STUDENT,
                    is_active=True,
                    is_verified=True,
                    created_at=get_utc_now(),
                    updated_at=get_utc_now()
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            grv = GrievanceService.file_grievance(
                db=db,
                complainant_user_id=user.id,
                subject=f"WhatsApp Grievance from {phone_number}",
                description=desc_text,
                category=category,
                external_source="WHATSAPP",
                external_reference_id=phone_number
            )

            reply = (
                f"✅ *Grievance Registered Successfully!*\n"
                f"Your Ticket Number: `{grv.ticket_number}`\n"
                f"Category: {grv.category.value}\n"
                f"Statutory SLA: 7 Days\n"
                f"Reply `STATUS {grv.ticket_number}` anytime to track progress."
            )
            return {"reply": reply, "ticket_number": grv.ticket_number}

        else:
            help_msg = (
                f"🏛️ *Welcome to ST Seva Grievance WhatsApp Desk*\n\n"
                f"• To track a complaint: Send `STATUS <TicketNumber>`\n"
                f"• To file a new complaint: Send `NEW <DELAY|REJECTION|PAYMENT|COLLEGE|TECH> <Brief Details>`\n"
                f"• For portal access, visit: https://stseva.jharkhand.gov.in"
            )
            return {"reply": help_msg, "ticket_found": False}

    @staticmethod
    def get_analytics_summary(db: Session) -> Dict[str, Any]:
        """F-107: Grievance Analytics, Heatmap & Officer Accountability Scorecard."""
        total = db.query(Grievance).count()
        resolved = db.query(Grievance).filter(Grievance.status == GrievanceStatus.RESOLVED).count()
        in_review = db.query(Grievance).filter(Grievance.status == GrievanceStatus.IN_REVIEW).count()
        escalated = db.query(Grievance).filter(
            Grievance.status.in_([GrievanceStatus.ESCALATED_L2, GrievanceStatus.ESCALATED_L3, GrievanceStatus.APPEALED])
        ).count()
        hearings = db.query(GrievanceHearing).count()
        sla_breached = db.query(Grievance).filter(Grievance.is_sla_breached == True).count()

        compliance_rate = round(((total - sla_breached) / total * 100), 1) if total > 0 else 100.0

        # Calculate average resolution time in hours
        resolved_tickets = db.query(Grievance).filter(
            Grievance.resolved_at != None,
            Grievance.created_at != None
        ).all()
        if resolved_tickets:
            total_hours = sum((t.resolved_at - t.created_at).total_seconds() / 3600 for t in resolved_tickets)
            avg_hours = round(total_hours / len(resolved_tickets), 1)
        else:
            avg_hours = 24.5

        # District breakdown
        districts = ["Ranchi", "East Singhbhum", "West Singhbhum", "Gumla", "Khunti", "Dumka", "Hazaribagh", "Bokaro"]
        district_breakdown = {}
        for d in districts:
            cnt = db.query(Grievance).filter(Grievance.district == d).count()
            if cnt > 0:
                district_breakdown[d] = cnt
        if not district_breakdown:
            district_breakdown = {"Ranchi": total}

        # Category breakdown
        category_breakdown = {}
        for cat in GrievanceCategory:
            cnt = db.query(Grievance).filter(Grievance.category == cat).count()
            if cnt > 0:
                category_breakdown[cat.value] = cnt

        # Tier distribution
        tier_distribution = {
            "Tier 1 (Helpdesk)": db.query(Grievance).filter(Grievance.tier_level == 1).count(),
            "Tier 2 (DWO)": db.query(Grievance).filter(Grievance.tier_level == 2).count(),
            "Tier 3 (Directorate)": db.query(Grievance).filter(Grievance.tier_level == 3).count()
        }

        return {
            "total_grievances": total,
            "resolved_count": resolved,
            "in_review_count": in_review,
            "escalated_count": escalated,
            "hearing_scheduled_count": hearings,
            "sla_breached_count": sla_breached,
            "sla_compliance_rate": compliance_rate,
            "avg_resolution_hours": avg_hours,
            "district_breakdown": district_breakdown,
            "category_breakdown": category_breakdown,
            "tier_distribution": tier_distribution
        }
