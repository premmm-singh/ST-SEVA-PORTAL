from typing import List, Dict, Any, Tuple
from .retriever import get_retriever
from .llm_loader import get_llm
from .vectorstore import get_vector_store

SYSTEM_PROMPT = """You are the official ST Seva AI Scholarship Assistant for the Ministry of Tribal Affairs (MoTA), Government of India.
Your mission is to provide accurate, authoritative, and helpful answers regarding Scheduled Tribe (ST) pre-matric, post-matric, top class education scholarships, national fellowships (NFST), and overseas scholarships (NOS).

RULES:
1. Answer ONLY using the provided retrieved context.
2. If the context does not contain the answer, state: "I don't have information on this. Please contact helpline 1800-11-7777 or 0120-6619540."
3. Always mention specific eligibility thresholds (e.g. income ceilings Rs 2.5L / 6L), maintenance rates, documents required, and deadlines when applicable.
4. Keep the tone courteous, clear, and structured with bullet points.
"""

class STSevaRAGChain:
    """
    RAG Execution Chain for Ministry of Tribal Affairs Scholarship Queries.
    Retrieves top chunks via MMR, checks similarity thresholds, invokes LLM with custom prompt,
    and returns source citations and confidence metrics.
    """
    def __init__(self):
        self.retriever = get_retriever(k=4)
        self.vector_store = get_vector_store()
        self.llm = get_llm()

    def run(self, query: str, min_similarity_threshold: float = 0.35) -> Dict[str, Any]:
        # 1. Retrieve top 4 chunks using MMR
        relevant_chunks = self.retriever.get_relevant_documents(query, k=4)
        
        # Check similarity scores
        scored_chunks = self.vector_store.similarity_search_with_score(query, k=4)
        top_score = scored_chunks[0][1] if scored_chunks else 0.0

        # Topical check: verify if query keywords overlap with retrieved chunks
        from .vectorstore import VERNACULAR_MAP
        expanded = query.lower()
        for k_term, v_exp in VERNACULAR_MAP.items():
            if k_term in expanded:
                expanded += " " + v_exp

        stop_words = {"what", "when", "where", "which", "does", "have", "apply", "scholarship", "scheme", "tell", "about", "give", "info", "please", "can", "will", "i", "a", "an", "the", "for", "in", "to", "of", "and", "or", "is", "are"}
        q_words = [w for w in expanded.split() if len(w) > 2 and w not in stop_words]
        combined_context = " ".join([c["text"].lower() for c in relevant_chunks])
        has_topical_overlap = any(w in combined_context for w in q_words) if q_words else True

        # Fallback / refusal if below threshold or no topical overlap
        if not relevant_chunks or top_score < min_similarity_threshold or not has_topical_overlap:
            return {
                "reply": "I don't have that information in the official Ministry of Tribal Affairs guidelines. Please contact the national helpline at 1800-11-7777 or NSP helpdesk at 0120-6619540 (Mon-Sat, 8 AM - 8 PM).",
                "sources": [],
                "confidence": 0.0
            }

        # 2. Format context with source metadata
        context_parts = []
        sources = set()
        for idx, chunk in enumerate(relevant_chunks, 1):
            src = chunk.get("metadata", {}).get("source", "mota-guideline.md")
            sec = chunk.get("metadata", {}).get("section", "General")
            sources.add(src)
            context_parts.append(f"[Document: {src} | Section: {sec}]\n{chunk['text']}")

        formatted_context = "\n\n---\n\n".join(context_parts)

        # 3. Build user prompt with context
        user_prompt = f"""Context:
{formatted_context}

Question:
{query}

Please provide an accurate and detailed answer based strictly on the above context:"""

        # 4. Generate answer
        raw_reply = self.llm.generate_response(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            context_chunks=relevant_chunks,
            query=query
        )

        # If LLM itself stated it doesn't have the info:
        if "don't have that information" in raw_reply.lower() or "don't have information on this" in raw_reply.lower():
            return {
                "reply": "I don't have that information in the official Ministry of Tribal Affairs guidelines. Please contact the national helpline at 1800-11-7777 or NSP helpdesk at 0120-6619540 (Mon-Sat, 8 AM - 8 PM).",
                "sources": [],
                "confidence": 0.0
            }

        # Calculate confidence
        confidence = min(0.98, max(0.65, top_score))

        return {
            "reply": raw_reply.strip(),
            "sources": sorted(list(sources)),
            "confidence": round(float(confidence), 2)
        }
