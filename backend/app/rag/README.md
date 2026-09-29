# ST Seva RAG Knowledge Engine & Chatbot

Production-grade, offline Retrieval-Augmented Generation (RAG) assistant for the **ST Seva Scholarship Portal**, Ministry of Tribal Affairs (MoTA), Government of India.

Every answer is deterministically grounded in official government circulars, statutory eligibility criteria, scholarship codes, maintenance rates, and disbursement guidelines. Out-of-scope queries are explicitly refused with MoTA and NSP helpline escalation.

---

## 1. How to Add New Documents

The knowledge base consists of curated Markdown (`.md`) files in `backend/app/rag/documents/`.

1. **Drop your document**: Place the new `.md` document inside `backend/app/rag/documents/` (e.g., `special-coaching-scheme.md`).
2. **Formatting Best Practices**:
   - Use clear `H1` and `H2` headings (`# Scheme Name`, `## 1. Eligibility Criteria`, `## 2. Income Limit & Allowances`).
   - Use standard Markdown tables for allowances, maintenance rates, and deadlines.
   - Use bold numerical values (e.g., `**Rs. 2,50,000**`, `**30th November**`) for precise fact-checking by the Grounding Verifier.
3. **Restart the Backend**:
   - On startup, the indexer checks for changes or newly added documents and automatically chunks, embeds, and updates `./chroma_db/`.

---

## 2. How to Tune Retrieval

Configuration settings are located in `backend/app/rag/retriever.py` and `backend/app/rag/document_loader.py`.

- **Chunk Size & Overlap** (`backend/app/rag/document_loader.py`):
  - `chunk_size = 500`: Optimal size for government scheme sections. Large enough to retain statutory context and conditions, small enough to isolate specific numerical provisions.
  - `chunk_overlap = 80`: Ensures sentences and list items crossing chunk boundaries are not lost.
- **MMR Diversity Parameter (`lambda_mult`)** (`backend/app/rag/retriever.py`):
  - `lambda_mult = 0.5`: Balances semantic query relevance against result diversity, preventing redundant chunks from the same paragraph.
- **Retrieval Threshold (`min_similarity`)**:
  - `min_similarity = 0.40`: Minimum similarity threshold. If all retrieved candidates have similarity $< 0.40$, retrieval returns empty chunks and triggers refusal with the official helpline card.
- **Candidates Fetch Count (`k` and `fetch_k`)**:
  - `k = 4`: Returns top 4 diverse, high-confidence chunks to the grounded prompt.
  - `fetch_k = 20`: Considers top 20 semantic candidates before applying MMR selection.

---

## 3. How to Swap LLM or Embeddings

### Swapping LLM (`backend/app/rag/llm_loader.py`)
- **Default Offline GGUF**: Place your quantized GGUF weights (e.g., `Phi-3-mini-4k-instruct-q4.gguf` or `Qwen2.5-0.5B-Instruct-Q4.gguf`) in `backend/models/`.
- **llama-cpp-python**: Automatically detected and initialized if present.
- **Context-Grounded Fallback Engine**: If no GGUF model is present, the fallback engine uses deterministic rule-based synthesis that directly quotes verified facts from retrieved context without any external API calls.

### Swapping Embeddings (`backend/app/rag/embeddings.py`)
- **Sentence-Transformers**: Uses `sentence-transformers/all-MiniLM-L6-v2` (80 MB local footprint, 384 dimensions).
- **Offline Dense Embeddings**: High-performance normalized 384-dimensional hashed n-gram dense embedding generator that runs offline on any CPU with zero external weight dependencies.

---

## 4. How to Read Retrieval Quality Metrics

The RAG Engine logs all telemetry into an in-memory audit store accessible via `GET /chat/analytics`.

### Key Metrics
1. **Total User Queries**: Total conversational turns received.
2. **Refusal Rate**: Percentage of queries where context was insufficient or off-topic ($< 10\%$ target for valid scholarship questions).
3. **Average Response Latency**: End-to-end response time ($< 500\text{ms}$ first token, $< 3000\text{ms}$ full response on standard CPU).
4. **Top 20 Most-Asked Questions**: Identifies primary areas of student inquiry for FAQ enhancement.
5. **Queries with Lowest Retrieval Scores**: Flagged candidates for authoring new knowledge base circulars or revising section headers.
6. **User Helpfulness Ratio**: Thumbs up vs. thumbs down feedback from students.
