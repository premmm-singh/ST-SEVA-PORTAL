import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.rag.document_loader import load_documents, chunk_documents
from app.rag.vectorstore import get_vector_store
from app.rag.retriever import get_retriever

client = TestClient(app)

def test_documents_indexing():
    docs = load_documents()
    assert len(docs) >= 12, f"Expected 12 markdown documents, found {len(docs)}"
    chunks = chunk_documents(docs)
    assert len(chunks) >= 20, f"Expected at least 20 chunks, got {len(chunks)}"

def test_vector_store_and_mmr_retriever():
    vector_store = get_vector_store()
    retriever = get_retriever(k=4)
    results = retriever.get_relevant_documents("What is the family income limit for Post-Matric ST scholarship?", k=4)
    assert len(results) > 0
    sources = [r["metadata"]["source"] for r in results]
    assert any("post-matric" in s or "eligibility" in s or "faq" in s for s in sources)

def test_chat_message_endpoint_english():
    res = client.post("/chat/message", json={
        "message": "What is the family income limit for Post-Matric ST scholarship?",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["sources"]) > 0
    assert data["confidence"] > 0.4
    assert "2,50,000" in data["reply"] or "2.5" in data["reply"] or "Lakh" in data["reply"]

def test_chat_message_endpoint_hindi():
    res = client.post("/chat/message", json={
        "message": "टॉप क्लास छात्रवृत्ति में लैपटॉप के लिए कितना अनुदान मिलता है?",
        "language": "hi"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["language"] == "hi"
    assert len(data["sources"]) > 0

def test_chat_suggestions_endpoint():
    res_en = client.get("/chat/suggestions?language=en")
    assert res_en.status_code == 200
    assert len(res_en.json()["suggestions"]) == 5

    res_hi = client.get("/chat/suggestions?language=hi")
    assert res_hi.status_code == 200
    assert len(res_hi.json()["suggestions"]) == 5

def test_chat_feedback_and_history():
    # 1. Ask question to generate session turn
    res_chat = client.post("/chat/message", json={
        "message": "What is the stipend for NFST scholars?",
        "language": "en"
    })
    assert res_chat.status_code == 200
    chat_data = res_chat.json()
    session_id = chat_data["session_id"]
    message_id = chat_data["message_id"]

    # 2. Submit feedback
    res_fb = client.post("/chat/feedback", json={
        "session_id": session_id,
        "message_id": message_id,
        "rating": 5,
        "comment": "Accurate stipend rates verified!"
    })
    assert res_fb.status_code == 200
    assert res_fb.json()["status"] == "success"

    # 3. Retrieve session history
    res_hist = client.get(f"/chat/history/{session_id}")
    assert res_hist.status_code == 200
    history_items = res_hist.json()["messages"]
    assert len(history_items) >= 2

def test_unrelated_query_refuses_to_hallucinate():
    res = client.post("/chat/message", json={
        "message": "Can an astronaut apply for Martian scholarship?",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    assert "don't have that information" in data["reply"].lower()
    assert data["sources"] == []
