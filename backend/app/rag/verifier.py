import re
from typing import List, Dict, Any

def verify_grounding(answer: str, context_chunks: List[str]) -> Dict[str, Any]:
    """
    Check if the answer is grounded in the context.
    Extracts key numerical facts, amounts, and dates from the answer
    and verifies that they exist in the retrieved context.
    Returns confidence score, ungrounded facts list, and grounding flag.
    """
    if not context_chunks:
        return {
            "grounded": False,
            "confidence": 0.0,
            "ungrounded_facts": ["No context provided"]
        }

    context_text = " ".join(context_chunks).lower()
    answer_lower = answer.lower()

    # Extract key facts from answer (numbers, amounts, percentages, years)
    facts_in_answer = re.findall(r'\b\d[\d,.]*\b', answer)

    # Check if facts appear in context
    grounded_facts = sum(1 for f in facts_in_answer if f.lower() in context_text)
    total_facts = len(facts_in_answer)

    if total_facts == 0:
        return {
            "grounded": True,
            "confidence": 0.9,
            "ungrounded_facts": []
        }

    ratio = grounded_facts / total_facts
    return {
        "grounded": ratio >= 0.8,
        "confidence": round(float(ratio), 2),
        "ungrounded_facts": [f for f in facts_in_answer if f.lower() not in context_text]
    }
