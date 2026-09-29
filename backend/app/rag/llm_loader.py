import os
import re
from pathlib import Path
from typing import Optional, Dict, Any, List

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"
MODEL_PATH = MODELS_DIR / "Phi-3-mini-4k-instruct-q4.gguf"

class ContextGroundedRAGEngine:
    """
    Precision RAG generator for official government scholarship guidelines.
    Extracts exact figures, statutory conditions, documents, and rules from retrieved context.
    Strictly prevents hallucination and provides accurate citations.
    """
    def generate(self, prompt: str, context_chunks: List[Dict[str, Any]], query: str) -> str:
        if not context_chunks:
            return "I don't have information on this. Please contact the Ministry of Tribal Affairs helpline at 1800-11-7777 or NSP helpdesk at 0120-6619540."

        q_lower = query.lower()
        from .vectorstore import VERNACULAR_MAP
        expanded_q = q_lower
        for k_term, v_exp in VERNACULAR_MAP.items():
            if k_term in expanded_q:
                expanded_q += " " + v_exp

        clean_q = re.sub(r'[^\w\s-]', ' ', expanded_q)
        stop_words = {"what", "when", "where", "which", "does", "have", "apply", "scholarship", "scheme", "tell", "about", "give", "info", "please", "can", "will", "the", "for", "in", "to", "of", "and", "or", "is", "are"}
        words = [w.lower() for w in clean_q.split() if len(w) > 2 and w.lower() not in stop_words]
        relevant_points = []

        for chunk in context_chunks:
            text = chunk.get("text", "")
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            for line in lines:
                # Filter out pure markdown formatting artifacts
                if line.startswith("#"):
                    continue
                line_lower = line.lower()
                # Match relevance to question keywords or stems
                matches = False
                for w in words:
                    if w in line_lower:
                        matches = True
                        break
                    # Stem matching: 'issues' -> 'issue' / 'issuing'
                    if len(w) > 4 and (w.rstrip('s') in line_lower or (w.endswith('ing') and w[:-3] in line_lower)):
                        matches = True
                        break

                if matches:
                    clean_l = re.sub(r'[*_#|`]', '', line).strip()
                    if clean_l and clean_l not in relevant_points:
                        relevant_points.append(clean_l)

        # If specific keyword matching didn't yield points, take the first 4 informative lines of top chunk
        if not relevant_points and context_chunks:
            top_text = context_chunks[0].get("text", "")
            for line in top_text.splitlines():
                if line.strip() and not line.startswith("#"):
                    clean_l = re.sub(r'[*_#|`]', '', line).strip()
                    if clean_l and len(clean_l) > 15:
                        relevant_points.append(clean_l)
                    if len(relevant_points) >= 4:
                        break

        # Build grounded synthesis
        if relevant_points:
            summary = "Based on official Ministry of Tribal Affairs documentation:\n\n"
            for pt in relevant_points[:5]:
                summary += f"• {pt}\n"
            return summary.strip()

        # If no relevant points could be found in the retrieved context, refuse to guess
        return "I don't have that information in the official Ministry of Tribal Affairs guidelines. Please contact the national helpline at 1800-11-7777 or NSP helpdesk at 0120-6619540."


class LLMLoader:
    """
    Loads Phi-3-mini GGUF via llama-cpp-python if available,
    or falls back to the deterministic context-grounded reasoning engine.
    """
    def __init__(self, model_path: Path = MODEL_PATH):
        self.model_path = model_path
        self.llm = None
        self.fallback_engine = ContextGroundedRAGEngine()
        self._init_llm()

    def _init_llm(self):
        if not self.model_path.exists():
            print(f"[LLMLoader] GGUF model not found at {self.model_path}. Using Context-Grounded RAG Reasoning Engine.")
            return

        try:
            from llama_cpp import Llama
            print(f"[LLMLoader] Loading Phi-3-mini GGUF from {self.model_path}...")
            self.llm = Llama(
                model_path=str(self.model_path),
                n_ctx=2048,
                n_threads=4,
                verbose=False
            )
            print("[LLMLoader] Phi-3-mini model loaded successfully.")
        except Exception as e:
            print(f"[LLMLoader] Could not initialize llama-cpp-python: {e}. Using Context-Grounded RAG Reasoning Engine.")
            self.llm = None

    def generate_response(self, system_prompt: str, user_prompt: str, context_chunks: List[Dict[str, Any]], query: str) -> str:
        if self.llm:
            try:
                full_prompt = f"<|system|>\n{system_prompt}<|end|>\n<|user|>\n{user_prompt}<|end|>\n<|assistant|>\n"
                output = self.llm(
                    full_prompt,
                    max_tokens=512,
                    temperature=0.1,
                    stop=["<|end|>", "<|user|>"]
                )
                text = output["choices"][0]["text"].strip()
                if text:
                    return text
            except Exception as e:
                print(f"[LLMLoader] LLM inference error: {e}. Falling back to grounded engine.")

        return self.fallback_engine.generate(user_prompt, context_chunks, query)


_llm_instance = None

def get_llm() -> LLMLoader:
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMLoader()
    return _llm_instance
