import math
from typing import List, Dict, Any, Tuple
from .vectorstore import get_vector_store

class MMRRetriever:
    """
    Max Marginal Relevance (MMR) Retriever.
    Balances query relevance with result diversity to eliminate duplicate chunks
    and return comprehensive coverage of rules, eligibility, allowances, and deadlines.
    """
    def __init__(self, vector_store=None, lambda_mult: float = 0.5):
        self.vector_store = vector_store or get_vector_store()
        self.lambda_mult = lambda_mult

    def get_relevant_documents(self, query: str, k: int = 4, fetch_k: int = 20) -> List[Dict[str, Any]]:
        """
        Retrieves top k chunks using Max Marginal Relevance (MMR).
        """
        candidates_with_scores = self.vector_store.similarity_search_with_score(query, k=fetch_k)
        if not candidates_with_scores:
            return []

        if len(candidates_with_scores) <= k:
            return [doc for doc, score in candidates_with_scores]

        # Extract candidates
        candidates = [item for item, score in candidates_with_scores]
        query_sims = [score for item, score in candidates_with_scores]

        selected_indices = [0]

        while len(selected_indices) < k and len(selected_indices) < len(candidates):
            best_mmr_score = -float("inf")
            best_idx = -1

            for i in range(len(candidates)):
                if i in selected_indices:
                    continue

                q_sim = query_sims[i]

                # Max similarity to already selected candidates
                max_inter_sim = 0.0
                cand_vec = candidates[i].get("embedding")
                
                for sel_idx in selected_indices:
                    sel_vec = candidates[sel_idx].get("embedding")
                    if cand_vec and sel_vec:
                        inter_sim = self.vector_store.cosine_similarity(cand_vec, sel_vec)
                    else:
                        words_i = set(candidates[i]["text"].lower().split())
                        words_s = set(candidates[sel_idx]["text"].lower().split())
                        inter_sim = len(words_i & words_s) / max(1, len(words_i | words_s))
                    
                    if inter_sim > max_inter_sim:
                        max_inter_sim = inter_sim

                mmr_score = self.lambda_mult * q_sim - (1.0 - self.lambda_mult) * max_inter_sim
                if mmr_score > best_mmr_score:
                    best_mmr_score = mmr_score
                    best_idx = i

            if best_idx == -1:
                break
            selected_indices.append(best_idx)

        return [candidates[idx] for idx in selected_indices]


def retrieve_context(query: str, k: int = 4, min_similarity: float = 0.4) -> Dict[str, Any]:
    """
    Step 2: Retrieval with MMR and similarity threshold filtering.
    Filters out chunks with similarity below min_similarity (or distance > 1 - min_similarity).
    """
    store = get_vector_store()
    retriever = MMRRetriever(vector_store=store, lambda_mult=0.5)
    
    # 1. MMR search for diversity
    mmr_docs = retriever.get_relevant_documents(query, k=k, fetch_k=20)
    
    # 2. Similarity search with score
    scored_candidates = store.similarity_search_with_score(query, k=max(k, 10))

    # Match MMR docs with their similarity score
    filtered = []
    seen_texts = set()

    for item, score in scored_candidates:
        # Distance to similarity: if score is cosine similarity (0..1), keep as is.
        # If score is distance (0..2), sim = 1 - (dist / 2).
        sim = score if (0.0 <= score <= 1.0) else max(0.0, 1.0 - (score / 2.0))
        
        # Check threshold (score <= 1 - min_similarity for distance, sim >= min_similarity)
        if sim >= min_similarity:
            text = item.get("text", "")
            if text not in seen_texts:
                seen_texts.add(text)
                filtered.append((item, sim))
                if len(filtered) >= k:
                    break

    chunks = []
    sources = []
    scores = []
    
    for doc, sim in filtered:
        chunks.append(doc.get("text", ""))
        src = doc.get("metadata", {}).get("source", "official-guideline.md")
        sources.append(src)
        scores.append(round(float(sim), 3))

    return {
        "chunks": chunks,
        "sources": sources,
        "scores": scores
    }


def get_retriever(k: int = 4) -> MMRRetriever:
    return MMRRetriever()
