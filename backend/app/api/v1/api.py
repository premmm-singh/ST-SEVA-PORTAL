from fastapi import APIRouter
from app.api.v1.endpoints import auth, profile, sessions, security, schemes, applications, documents, institutions, scrutiny, allocation, dbt, notifications, grievance, analytics, admin, gateways, mobile, vapt, production

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & User Management"])
api_router.include_router(profile.router, prefix="/profile", tags=["Profiles"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Multi-device & Sessions"])
api_router.include_router(security.router, prefix="/security", tags=["Security & Compliance"])
api_router.include_router(schemes.router, prefix="/schemes", tags=["Scholarship Schemes"])
api_router.include_router(applications.router, prefix="/applications", tags=["Student Applications"])
api_router.include_router(documents.router, prefix="/documents", tags=["Document Management"])
api_router.include_router(institutions.router, prefix="/institutions", tags=["Institutional Verification"])
api_router.include_router(scrutiny.router, prefix="/scrutiny", tags=["Verification & Scrutiny Engine"])
api_router.include_router(allocation.router, prefix="/allocation", tags=["Merit & Allocation Engine"])
api_router.include_router(dbt.router, prefix="/dbt", tags=["Direct Benefit Transfer (DBT) & Payment Gateway"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Communication & Notification Hub"])
api_router.include_router(grievance.router, prefix="/grievances", tags=["Grievance Redressal & Helpdesk System"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Reports, Analytics & Executive BI Dashboard"])
api_router.include_router(admin.router, prefix="/admin", tags=["System Administration, Multi-Tenancy & RBAC"])
api_router.include_router(gateways.router, prefix="/gateways", tags=["External Gateway Integrations & API Interoperability"])
api_router.include_router(mobile.router, prefix="/mobile", tags=["Mobile Readiness, Offline PWA & Vernacular Support"])
api_router.include_router(vapt.router, prefix="/vapt", tags=["Security Hardening, Cryptographic Integrity & VAPT Compliance"])
api_router.include_router(production.router, prefix="/production", tags=["Production Readiness, Disaster Recovery & Go-Live Finalization"])

