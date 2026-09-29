from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.api import api_router
from app.db.init_db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database on startup
    init_db()
    # Initialize RAG Knowledge Base Vectorstore on startup
    try:
        from app.rag.indexer import build_index
        build_index()
    except Exception as e:
        print(f"[Lifespan] RAG index initialization notice: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Unified AI-Powered ST Scholarship Certificate Verification System & Portal (MoTA, Govt of India)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development allow all; in prod use settings.BACKEND_CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers.chat_router import router as chat_router

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix="/chat", tags=["RAG Scholarship Chatbot"])
app.include_router(chat_router, prefix=f"{settings.API_V1_STR}/chat", tags=["RAG Scholarship Chatbot"])

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "ST Seva Portal Core Engine",
        "environment": "production-grade",
        "version": "1.0.0-phase1"
    }

@app.get("/")
def root():
    return {
        "portal": "ST Seva Portal - Ministry of Tribal Affairs, Government of India",
        "standard": "GIGW Compliant (Guidelines for Indian Government Websites)",
        "docs_url": "/docs",
        "api_v1": "/api/v1"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
