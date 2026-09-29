import sys
import os
import pytest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.rag.chain import generate_answer
from app.rag.verifier import verify_grounding

HALLUCINATION_TESTS = [
    # (query, should_refuse, expected_source_if_answered)
    ("Am I eligible for post-matric?", False, "post-matric-scheme.md"),
    ("What is the income limit for top class?", False, "top-class-scheme.md"),
    ("How do I get a caste certificate?", False, "certificates-guide.md"),
    ("What is the weather today?", True, None),
    ("Who is the Prime Minister?", True, None),
    ("What is the deadline for NFST?", False, "deadlines-calendar.md"),
    ("Can I apply for overseas scholarship with 50% marks?", False, "overseas-scholarship.md"),
    ("What is the capital of France?", True, None),
    ("How much is the pre-matric scholarship amount?", False, "pre-matric-scheme.md"),
    ("What is the helpline number?", False, "grievance-redressal.md"),
]

def test_no_hallucination():
    for query, should_refuse, expected_source in HALLUCINATION_TESTS:
        result = generate_answer(query)
        if should_refuse:
            assert "don't have that information" in result["answer"].lower(), (
                f"Query '{query}' should have been refused, got: {result['answer']}"
            )
        else:
            assert expected_source in result["sources"], (
                f"Expected source '{expected_source}' not in sources for query '{query}': {result['sources']}"
            )
            # Verify numbers in answer appear in retrieved context
            verification = verify_grounding(result["answer"], result["context"])
            assert verification["grounded"], (
                f"Ungrounded facts in answer for '{query}': {verification.get('ungrounded_facts')}"
            )


@pytest.mark.parametrize("query,should_refuse,expected_source", HALLUCINATION_TESTS)
def test_individual_hallucination_cases(query, should_refuse, expected_source):
    result = generate_answer(query)
    if should_refuse:
        assert "don't have that information" in result["answer"].lower()
    else:
        assert expected_source in result["sources"]
        verification = verify_grounding(result["answer"], result["context"])
        assert verification["grounded"], f"Ungrounded facts: {verification.get('ungrounded_facts')}"
