import os
import time
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from collections import Counter

from app.rag.chain import generate_answer, REFUSAL_MESSAGE
from app.rag.retriever import retrieve_context

# Directories
DOCS_DIR = Path(__file__).resolve().parent.parent / "rag" / "documents"

# In-memory logging for RAG monitoring and analytics
_CHAT_HISTORY: Dict[str, List[Dict[str, Any]]] = {}
_CHAT_FEEDBACK: List[Dict[str, Any]] = []
_QUERY_LOGS: List[Dict[str, Any]] = []

# Multilingual greetings and suggestions
SUGGESTIONS_BY_LANG = {
    "en": [
        "Am I eligible for post-matric?",
        "What is the income limit for top class?",
        "How do I get a caste certificate?",
        "What is the deadline for NFST?",
        "Can I apply for overseas scholarship with 50% marks?",
        "How much is the pre-matric scholarship amount?",
        "What is the helpline number?"
    ],
    "hi": [
        "क्या मैं पोस्ट-मैट्रिक छात्रवृत्ति के लिए पात्र हूँ?",
        "टॉप क्लास योजना के लिए पारिवारिक आय सीमा क्या है?",
        "जाति प्रमाण पत्र कैसे बनवाएं?",
        "राष्ट्रीय फेलोशिप (NFST) की अंतिम तिथि क्या है?",
        "क्या 50% अंकों के साथ विदेश छात्रवृत्ति मिल सकती है?",
        "प्री-मैट्रिक छात्रवृत्ति की राशि कितनी है?",
        "हेल्पलाइन नंबर क्या है?"
    ],
    "sat": [
        "Post-Matric ST scholarship re gharaunj aay sima tinak menah-a?",
        "Pre-Matric scholarship lagid chet kagaj lagao-a?",
        "Top Class scheme re laptop kiring lagid tinak taka namo-a?",
        "National Fellowship (NFST) re chando re tinak taka namo-a?",
        "DBT payment lagid NPCI Aadhaar linking chet leka te baihoya?"
    ],
    "mun": [
        "Post-Matric ST scholarship re parivar aay sima chilikana?",
        "Pre-Matric scholarship lagid chilikana kagajat dorkar menah-a?",
        "Top Class scholarship re computer lagid chilikana anudan menah-a?",
        "National Fellowship (NFST) re mahina re chilikana stepend namo-a?",
        "Aadhaar bank account NPCI mapper re linking chilikete hoba?"
    ],
    "bhili": [
        "पोस्ट-मैट्रिक छात्रवृत्ति माटे कुटुम्ब नी आवक मर्यादा केटली छे?",
        "प्री-मैट्रिक छात्रवृत्ति माटे कया कया कागळिया जोईए?",
        "टॉप क्लास योजना मां लेपटॉप माटे केटला रुपया मळे छे?",
        "राष्ट्रीय फेलोशिप (NFST) मां दर महिने केटलो वजीफो मळे छे?",
        "बैंक खाता मां आधार एनपीसीआई सीडिंग केम कराववुं?"
    ],
    "gondi": [
        "Post-Matric ST scholarship sathi kutum aavak parimiti bachi?",
        "Pre-Matric scholarship sathi batte kagad aavashyak manta?",
        "Top Class scheme te laptop sathi bachi rupaiah poyintor?",
        "National Fellowship (NFST) te nela sathi bachi stipend dorikintor?",
        "DBT payment sathi bank te Aadhaar NPCI linking baha kiyana?"
    ]
}

VERNACULAR_TRANSLATIONS = {
    "hi": {
        "disclaimer": "मंत्रालय के आधिकारिक दस्तावेज़ के अनुसार:",
        "helpline": "कृपया जनजातीय कार्य मंत्रालय के राष्ट्रीय टोल-फ्री हेल्पलाइन नंबर 1800-11-7777 अथवा एनएसपी हेल्पडेस्क 0120-6619540 पर संपर्क करें।"
    },
    "sat": {
        "disclaimer": "Ministry of Tribal Affairs reyaah official guidelines leka te:",
        "helpline": "Dayakate Ministry of Tribal Affairs helpline 1800-11-7777 se NSP helpdesk 0120-6619540 re sampark me."
    },
    "mun": {
        "disclaimer": "Tribal Affairs Ministry reyaah sorkari dastavej leka te:",
        "helpline": "Doyakate Tribal Ministry toll-free helpline 1800-11-7777 re goṛo nam me."
    },
    "bhili": {
        "disclaimer": "आदिवासी विकास मंत्रालय ना नियमो मुजब:",
        "helpline": "वधारे माहिती माटे हेल्पलाइन 1800-11-7777 पर फोन करो."
    },
    "gondi": {
        "disclaimer": "Tribal Affairs Ministry na niyam leka:",
        "helpline": "Vadhare jankari sathi helpline 1800-11-7777 te phone kiyat."
    }
}

class ChatService:
    """
    Production RAG Chat Service with comprehensive telemetry and logging.
    """
    def __init__(self):
        pass

    def generate_answer(self, query: str, language: str = "en", session_id: Optional[str] = None) -> Dict[str, Any]:
        start_time = time.perf_counter()
        if not session_id:
            session_id = str(uuid.uuid4())

        # Call RAG pipeline
        rag_res = generate_answer(query, language=language)
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        raw_reply = rag_res["answer"]
        sources = rag_res["sources"]
        scores = rag_res["scores"]
        confidence = rag_res["confidence"]
        verification = rag_res.get("verification", {})

        is_refused = "don't have that information" in raw_reply.lower()

        # Multilingual prefix formatting if vernacular selected
        final_reply = raw_reply
        if language in VERNACULAR_TRANSLATIONS and language != "en":
            t_data = VERNACULAR_TRANSLATIONS[language]
            if is_refused:
                final_reply = f"{t_data['helpline']}\n\n{raw_reply}"
            else:
                final_reply = f"{t_data['disclaimer']}\n\n{raw_reply}"

        message_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        # Log query metrics for retrieval quality monitoring
        query_log = {
            "id": message_id,
            "session_id": session_id,
            "query": query,
            "language": language,
            "timestamp": timestamp,
            "sources": sources,
            "scores": scores,
            "top_similarity": scores[0] if scores else 0.0,
            "status": "refused" if is_refused else "generated",
            "is_refused": is_refused,
            "confidence": confidence,
            "latency_ms": latency_ms,
            "verification": verification,
            "user_feedback": None
        }
        _QUERY_LOGS.append(query_log)

        # Record in session history
        if session_id not in _CHAT_HISTORY:
            _CHAT_HISTORY[session_id] = []

        _CHAT_HISTORY[session_id].append({
            "id": str(uuid.uuid4()),
            "sender": "user",
            "text": query,
            "timestamp": timestamp
        })

        _CHAT_HISTORY[session_id].append({
            "id": message_id,
            "sender": "bot",
            "text": final_reply,
            "sources": sources,
            "scores": scores,
            "confidence": confidence,
            "is_refused": is_refused,
            "verification": verification,
            "latency_ms": latency_ms,
            "language": language,
            "timestamp": timestamp
        })

        return {
            "message_id": message_id,
            "session_id": session_id,
            "reply": final_reply,
            "answer": final_reply,
            "sources": sources,
            "scores": scores,
            "confidence": confidence,
            "is_refused": is_refused,
            "verification": verification,
            "latency_ms": latency_ms,
            "language": language
        }

    def record_feedback(self, session_id: str, message_id: str, rating: Optional[int] = None, feedback_type: Optional[str] = None, comment: Optional[str] = None) -> Dict[str, Any]:
        """
        Records user feedback (thumbs up/down or 1-5 rating) and links to query log.
        """
        feedback_val = feedback_type or ("up" if rating and rating >= 4 else "down" if rating else None)
        record = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "message_id": message_id,
            "rating": rating,
            "feedback_type": feedback_val,
            "comment": comment or "",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        _CHAT_FEEDBACK.append(record)

        # Update query log
        for q in _QUERY_LOGS:
            if q["id"] == message_id:
                q["user_feedback"] = feedback_val
                break

        return {"status": "success", "message": "Feedback submitted successfully", "feedback_id": record["id"]}

    def get_history(self, session_id: str) -> List[Dict[str, Any]]:
        return _CHAT_HISTORY.get(session_id, [])

    def get_suggestions(self, language: str = "en") -> List[str]:
        items = SUGGESTIONS_BY_LANG.get(language, SUGGESTIONS_BY_LANG["en"])
        return items[:5]

    def get_document_content(self, doc_name: str) -> Optional[str]:
        """Reads and returns raw markdown content of knowledge base document."""
        safe_name = os.path.basename(doc_name)
        if not safe_name.endswith(".md"):
            safe_name += ".md"
        doc_path = DOCS_DIR / safe_name
        if doc_path.exists():
            with open(doc_path, "r", encoding="utf-8") as f:
                return f.read()
        return None

    def get_analytics(self) -> Dict[str, Any]:
        """
        Retrieval Quality Monitoring Analytics.
        Returns:
        - Top 20 most-asked questions
        - Queries with lowest retrieval scores (candidates for new documents)
        - Refusal rate (percentage)
        - Average response latency
        """
        total = len(_QUERY_LOGS)
        if total == 0:
            return {
                "total_queries": 0,
                "refusal_rate": 0.0,
                "average_latency_ms": 0.0,
                "top_20_questions": [],
                "lowest_scoring_queries": [],
                "feedback_summary": {"thumbs_up": 0, "thumbs_down": 0, "total": 0},
                "total_documents_indexed": 12,
                "recent_logs": []
            }

        refused_count = sum(1 for q in _QUERY_LOGS if q["is_refused"])
        refusal_rate = round((refused_count / total) * 100, 2)
        avg_latency = round(sum(q["latency_ms"] for q in _QUERY_LOGS) / total, 2)

        # Top 20 most asked questions
        q_counter = Counter(q["query"].strip() for q in _QUERY_LOGS)
        top_20 = [{"query": q, "count": count} for q, count in q_counter.most_common(20)]

        # Queries with lowest retrieval scores (candidates for new documents)
        sorted_by_score = sorted(
            [q for q in _QUERY_LOGS if q["status"] != "refused" or len(q["query"].split()) >= 3],
            key=lambda x: x["top_similarity"]
        )
        lowest_scoring = [
            {
                "query": q["query"],
                "top_similarity": q["top_similarity"],
                "sources": q["sources"],
                "status": q["status"]
            }
            for q in sorted_by_score[:10]
        ]

        # Thumbs up / down feedback counts
        thumbs_up = sum(1 for f in _CHAT_FEEDBACK if f.get("feedback_type") == "up" or (f.get("rating") and f["rating"] >= 4))
        thumbs_down = sum(1 for f in _CHAT_FEEDBACK if f.get("feedback_type") == "down" or (f.get("rating") and f["rating"] <= 2))

        return {
            "total_queries": total,
            "refusal_rate": refusal_rate,
            "average_latency_ms": avg_latency,
            "top_20_questions": top_20,
            "lowest_scoring_queries": lowest_scoring,
            "feedback_summary": {
                "thumbs_up": thumbs_up,
                "thumbs_down": thumbs_down,
                "total": len(_CHAT_FEEDBACK)
            },
            "total_documents_indexed": 12,
            "recent_logs": _QUERY_LOGS[-20:]
        }


chat_service = ChatService()
