import re
from typing import Dict, Any, Generator, List
from .retriever import retrieve_context
from .prompt import SYSTEM_PROMPT
from .verifier import verify_grounding
from .llm_loader import get_llm
from .vectorstore import VERNACULAR_MAP

REFUSAL_MESSAGE = "I don't have that information in my knowledge base. Please contact the helpline at 0120-6619540 or visit scholarships.gov.in"

def llm_stream(prompt: str) -> Generator[str, None, None]:
    """
    Streams tokens from local Phi-3-mini GGUF if available,
    or streams from deterministic context-grounded reasoning engine.
    """
    llm_loader = get_llm()
    if llm_loader.llm:
        try:
            for chunk in llm_loader.llm(
                prompt,
                max_tokens=200,
                temperature=0.1,
                stream=True,
                stop=["<|end|>", "<|user|>"]
            ):
                token = chunk["choices"][0].get("text", "")
                if token:
                    yield token
            return
        except Exception as e:
            pass

    # Deterministic grounded streaming
    q_match = re.search(r'QUESTION:\s*(.*?)\s*ANSWER:', prompt, re.DOTALL)
    ctx_match = re.search(r'CONTEXT:\s*(.*?)\s*QUESTION:', prompt, re.DOTALL)
    query = q_match.group(1).strip() if q_match else prompt
    ctx_raw = ctx_match.group(1).strip() if ctx_match else ""
    ctx_chunks = [{"text": c} for c in ctx_raw.split("\n\n---\n\n")]

    full_resp = llm_loader.fallback_engine.generate(prompt, ctx_chunks, query)
    words = full_resp.split(" ")
    for i, w in enumerate(words):
        yield w + (" " if i < len(words) - 1 else "")


def generate_answer(query: str, language: str = "en") -> Dict[str, Any]:
    """
    Synchronous grounded answer generation with fact verification and source citation.
    """
    # Check for off-topic queries before or during retrieval
    stop_words = {"what", "when", "where", "which", "does", "have", "apply", "scholarship", "scheme", "tell", "about", "give", "info", "please", "can", "will", "i", "a", "an", "the", "for", "in", "to", "of", "and", "or", "is", "are"}
    
    expanded_q = query.lower()
    for k_term, v_exp in VERNACULAR_MAP.items():
        if k_term in expanded_q:
            expanded_q += " " + v_exp

    clean_q = re.sub(r'[^\w\s-]', ' ', expanded_q)
    q_words = [w for w in clean_q.split() if len(w) > 2 and w not in stop_words]

    # Retrieve context with MMR and similarity threshold
    ctx = retrieve_context(query, k=4, min_similarity=0.4)

    # Empty context check or no query
    if not ctx["chunks"] or not q_words:
        return {
            "answer": REFUSAL_MESSAGE,
            "reply": REFUSAL_MESSAGE,
            "sources": [],
            "scores": [],
            "context": [],
            "confidence": 0.0,
            "verification": {"grounded": True, "confidence": 0.0, "ungrounded_facts": []}
        }

    # Verify topical overlap between query and retrieved chunks
    combined_ctx = " ".join(ctx["chunks"]).lower()
    has_overlap = any(w in combined_ctx for w in q_words)
    if not has_overlap:
        return {
            "answer": REFUSAL_MESSAGE,
            "reply": REFUSAL_MESSAGE,
            "sources": [],
            "scores": [],
            "context": [],
            "confidence": 0.0,
            "verification": {"grounded": True, "confidence": 0.0, "ungrounded_facts": []}
        }

    # Build grounded prompt
    context_text = "\n\n---\n\n".join(ctx["chunks"])
    prompt = SYSTEM_PROMPT.format(context=context_text, question=query)

    llm_loader = get_llm()
    answer = llm_loader.fallback_engine.generate(prompt, [{"text": c} for c in ctx["chunks"]], query)

    # If answer refuses or says don't have info
    if "don't have that information" in answer.lower() or "don't have information on this" in answer.lower():
        return {
            "answer": REFUSAL_MESSAGE,
            "reply": REFUSAL_MESSAGE,
            "sources": [],
            "scores": [],
            "context": [],
            "confidence": 0.0,
            "verification": {"grounded": True, "confidence": 0.0, "ungrounded_facts": []}
        }

    # Fact verification: check numbers in answer appear in context
    verification = verify_grounding(answer, ctx["chunks"])
    if not verification["grounded"]:
        answer += "\n\n⚠ This answer may not be fully grounded. Please verify with the official portal."

    # Source citation required: "Source: [document_name]"
    unique_sources = sorted(list(set(ctx["sources"])))
    if unique_sources:
        primary_source = unique_sources[0]
        answer += f"\n\nSource: {primary_source}"

    top_confidence = ctx["scores"][0] if ctx["scores"] else 0.85

    return {
        "answer": answer.strip(),
        "reply": answer.strip(),
        "sources": unique_sources,
        "scores": ctx["scores"],
        "context": ctx["chunks"],
        "confidence": top_confidence,
        "verification": verification
    }


def generate_answer_stream(query: str, language: str = "en") -> Generator[Any, None, None]:
    """
    Step 4: LLM Generation with Streaming.
    Yields tokens and finishes with metadata containing sources and scores.
    """
    res = generate_answer(query, language=language)
    if not res["sources"] or res["answer"] == REFUSAL_MESSAGE:
        yield REFUSAL_MESSAGE
        yield {"sources": [], "scores": []}
        return

    # Stream answer words
    words = res["answer"].split(" ")
    for i, w in enumerate(words):
        yield w + (" " if i < len(words) - 1 else "")

    # Yield sources and scores separately at end
    yield {"sources": res["sources"], "scores": res["scores"], "confidence": res["confidence"]}
