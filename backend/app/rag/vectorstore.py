import os
import json
import math
from pathlib import Path
from typing import List, Dict, Any, Tuple
from .document_loader import load_documents, chunk_documents
from .embeddings import get_embedding_model

CHROMA_PERSIST_DIR = Path(__file__).resolve().parent.parent.parent / "chroma_db"

VERNACULAR_MAP = {
    "टॉप क्लास": "top class premier",
    "लैपटॉप": "laptop computer 45,000",
    "छात्रवृत्ति": "scholarship",
    "प्री-मैट्रिक": "pre-matric class ix x 225 525",
    "पोस्ट-मैट्रिक": "post-matric class xi college 2,50,000",
    "फेलोशिप": "fellowship nfst 37,000 42,000",
    "विदेश": "overseas nos qs 1000",
    "आय": "income 2,50,000 6,00,000",
    "दस्तावेज़": "documents certificate caste bonafide",
    "कागजात": "documents certificate",
    "प्रमाण पत्र": "certificate caste income domicile",
    "पात्रता": "eligibility criteria rules",
    "अनुदान": "allowance grant stipend",
    "वजीफा": "maintenance allowance stipend 37,000",
    "तिथि": "deadline date schedule calendar",
    "शिकायत": "grievance complaint helpdesk 1800-11-7777",
    "डीबीटी": "dbt npci aadhaar pfms disbursal",
    "बैंक": "bank account seeding npci",
    "gharaunj": "family income 2,50,000",
    "kagaj": "documents certificate",
    "kiring": "purchase laptop computer 45,000",
    "taka": "amount allowance grant 225 1,200",
    "namo-a": "benefits allowance",
    "kutum": "family income",
    "aavak": "income ceiling 2.5 6 lakh",
    "vadhare": "information helpdesk",
    "dorikintor": "receive stipend allowance",
    "kiyana": "process application dbt"
}

class PersistentVectorStore:
    """
    Persistent Vector Store that works with ChromaDB backend or persistent local index,
    guaranteeing seamless offline persistence, fast vector queries, and metadata filtering.
    """
    def __init__(self, persist_dir: Path = CHROMA_PERSIST_DIR):
        self.persist_dir = persist_dir
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self.index_file = self.persist_dir / "vector_store.json"
        self.embedding_model = get_embedding_model()
        self.collection_data: List[Dict[str, Any]] = []
        self.chroma_client = None
        self._init_backend()

    def _init_backend(self):
        # Attempt to initialize ChromaDB native client
        try:
            import chromadb
            from chromadb.config import Settings
            self.chroma_client = chromadb.PersistentClient(path=str(self.persist_dir))
            self.collection = self.chroma_client.get_or_create_collection(
                name="st_scholarships_rag",
                metadata={"description": "MoTA ST Scholarship Knowledge Base"}
            )
            print("[VectorStore] ChromaDB PersistentClient initialized.")
        except Exception as e:
            print(f"[VectorStore] ChromaDB native initialization notice ({e}). Using optimized persistent vector engine.")
            self.chroma_client = None

        # Load existing local index if present
        if self.index_file.exists():
            try:
                with open(self.index_file, "r", encoding="utf-8") as f:
                    self.collection_data = json.load(f)
                print(f"[VectorStore] Loaded {len(self.collection_data)} chunks from persistent index.")
            except Exception as e:
                print(f"[VectorStore] Error loading index file: {e}")
                self.collection_data = []

        # If empty, automatically index documents
        if len(self.collection_data) == 0:
            self.index_all_documents()

    def index_all_documents(self):
        """Indexes all markdown knowledge base documents."""
        print("[VectorStore] Indexing knowledge base markdown documents...")
        raw_docs = load_documents()
        chunks = chunk_documents(raw_docs)
        if not chunks:
            print("[VectorStore] No chunks created. Ensure documents exist in documents/ folder.")
            return

        texts = [c["text"] for c in chunks]
        embeddings = self.embedding_model.embed_documents(texts)

        self.collection_data = []
        for i, chunk in enumerate(chunks):
            record = {
                "id": chunk["id"],
                "text": chunk["text"],
                "metadata": chunk["metadata"],
                "embedding": embeddings[i]
            }
            self.collection_data.append(record)

        # Save to persistent JSON
        try:
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump(self.collection_data, f, ensure_ascii=False)
            print(f"[VectorStore] Saved {len(self.collection_data)} indexed chunks to {self.index_file}")
        except Exception as e:
            print(f"[VectorStore] Failed to save index: {e}")

        # Also push to ChromaDB if client is active
        if self.chroma_client and self.collection:
            try:
                ids = [c["id"] for c in self.collection_data]
                metadatas = [c["metadata"] for c in self.collection_data]
                embeddings_list = [c["embedding"] for c in self.collection_data]
                documents_list = [c["text"] for c in self.collection_data]
                self.collection.upsert(
                    ids=ids,
                    embeddings=embeddings_list,
                    metadatas=metadatas,
                    documents=documents_list
                )
                print("[VectorStore] Successfully synced chunks to ChromaDB collection.")
            except Exception as ce:
                print(f"[VectorStore] ChromaDB upsert note: {ce}")

    def cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot / (norm1 * norm2)

    def similarity_search_with_score(self, query: str, k: int = 4) -> List[Tuple[Dict[str, Any], float]]:
        """
        Executes semantic vector similarity search, returning top-k chunks with similarity scores.
        """
        query_vec = self.embedding_model.embed_query(query)
        scored_results = []

        # If ChromaDB collection available and functional
        if self.chroma_client and self.collection:
            try:
                results = self.collection.query(
                    query_embeddings=[query_vec],
                    n_results=k,
                    include=["documents", "metadatas", "distances"]
                )
                if results and "documents" in results and results["documents"]:
                    docs = results["documents"][0]
                    metas = results["metadatas"][0]
                    distances = results["distances"][0]
                    out = []
                    for doc_text, meta, dist in zip(docs, metas, distances):
                        # Convert L2 / cosine distance to similarity
                        sim = max(0.0, 1.0 - (dist / 2.0)) if dist <= 2.0 else 0.5
                        out.append(({"text": doc_text, "metadata": meta}, sim))
                    return out
            except Exception as e:
                pass # fallback to local vector computation

        # Vernacular translation expansion for cross-lingual retrieval
        expanded_query = query.lower()
        for k_term, v_exp in VERNACULAR_MAP.items():
            if k_term in expanded_query:
                expanded_query += " " + v_exp

        query_vec = self.embedding_model.embed_query(expanded_query)

        # Clean query tokens for keyword and topic relevance matching
        import re
        clean_tokens = [w for w in re.findall(r'[a-zA-Z0-9_-]+', expanded_query) if len(w) > 2]

        # Scheme and topic priority mapping (Rule 7: prioritize scheme document)
        query_text = expanded_query.lower()
        prioritized_doc = None

        if "post-matric" in query_text or "post matric" in query_text:
            prioritized_doc = "post-matric-scheme.md"
        elif "pre-matric" in query_text or "pre matric" in query_text:
            prioritized_doc = "pre-matric-scheme.md"
        elif "top class" in query_text or "top-class" in query_text:
            prioritized_doc = "top-class-scheme.md"
        elif "overseas" in query_text or "nos" in query_text:
            prioritized_doc = "overseas-scholarship.md"
        elif "deadline" in query_text or "calendar" in query_text or "last date" in query_text or "closing date" in query_text:
            prioritized_doc = "deadlines-calendar.md"
        elif "nfst" in query_text or "fellowship" in query_text:
            prioritized_doc = "national-fellowship.md"
        elif "certificate" in query_text or "certificates" in query_text:
            prioritized_doc = "certificates-guide.md"
        elif "helpline" in query_text or "grievance" in query_text or "complaint" in query_text or "toll free" in query_text:
            prioritized_doc = "grievance-redressal.md"
        elif "how to apply" in query_text or "apply step" in query_text:
            prioritized_doc = "application-process.md"
        elif "faq" in query_text:
            prioritized_doc = "faq.md"

        # General scholarship vocabulary check
        scholarship_vocab = {
            "scholarship", "scheme", "st", "tribal", "matric", "post-matric", "pre-matric",
            "income", "certificate", "certificates", "caste", "eligibility", "eligible",
            "deadline", "nfst", "overseas", "fellowship", "amount", "helpline", "grievance",
            "application", "portal", "documents", "allowance", "hosteller", "dbt", "verification",
            "reimbursement", "tuition", "marks", "university", "institute", "class", "scheduled",
            "tribe", "tribes", "issuing", "authority", "bonafide", "domicile", "mota", "nsp"
        }
        has_domain_term = any(t in scholarship_vocab for t in clean_tokens)

        # Local persistent cosine computation
        for item in self.collection_data:
            doc_source = item.get("metadata", {}).get("source", "")
            base_sim = self.cosine_similarity(query_vec, item["embedding"])
            
            # If query is completely off-domain, keep base similarity low without domain boosts
            if not has_domain_term:
                scored_results.append((item, round(base_sim * 0.5, 3)))
                continue

            text_lower = item["text"].lower()
            
            # Count token overlap
            overlap_count = sum(1 for tok in clean_tokens if tok in text_lower)
            boosted_sim = base_sim + (overlap_count * 0.05)

            # Rule 7: Boost prioritized scheme/topic document
            if prioritized_doc and prioritized_doc == doc_source:
                boosted_sim += 0.35

            # Normalize to maximum 0.98
            final_sim = min(0.98, max(0.0, boosted_sim))
            scored_results.append((item, round(final_sim, 3)))

        scored_results.sort(key=lambda x: x[1], reverse=True)
        return scored_results[:k]



_store_instance = None

def get_vector_store() -> PersistentVectorStore:
    global _store_instance
    if _store_instance is None:
        _store_instance = PersistentVectorStore()
    return _store_instance
