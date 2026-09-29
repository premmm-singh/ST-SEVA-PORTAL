import os
from pathlib import Path
from typing import Optional

def build_index(force: bool = False):
    """
    Builds and persists the RAG document vectorstore index on first startup only.
    Subsequent startups load existing ./chroma_db/.
    """
    base_dir = Path(__file__).resolve().parent.parent.parent
    docs_dir = base_dir / "rag" / "documents"
    if not docs_dir.exists():
        docs_dir = Path(__file__).resolve().parent / "documents"

    persist_dir = base_dir / "chroma_db"
    persist_dir.mkdir(parents=True, exist_ok=True)

    index_json = persist_dir / "vector_store.json"
    chroma_sqlite = persist_dir / "chroma.sqlite3"

    # Check if already indexed on subsequent startups
    if not force:
        if (index_json.exists() and index_json.stat().st_size > 100) or (chroma_sqlite.exists() and chroma_sqlite.stat().st_size > 100):
            print(f"[Indexer] Existing index found in {persist_dir}. Loading existing ./chroma_db/ (skipping re-index).")
            from .vectorstore import get_vector_store
            return get_vector_store()

    print("[Indexer] First startup or forced index: building RAG vectorstore index...")

    # 1. Attempt official LangChain + Chroma pipeline if dependencies present
    try:
        from langchain_community.document_loaders import DirectoryLoader, TextLoader
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        from langchain_community.vectorstores import Chroma
        from langchain_community.embeddings import HuggingFaceEmbeddings

        loader = DirectoryLoader(str(docs_dir), glob="**/*.md", loader_cls=TextLoader)
        docs = loader.load()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=80,
            separators=["\n## ", "\n### ", "\n\n", "\n", ". ", " "]
        )
        chunks = splitter.split_documents(docs)

        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"}
        )

        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=str(persist_dir),
            collection_name="st_scholarships"
        )
        if hasattr(vectorstore, "persist"):
            vectorstore.persist()
        print(f"[Indexer] Successfully built and persisted index with {len(chunks)} chunks via Chroma.")
        return vectorstore
    except Exception as e:
        print(f"[Indexer] Notice: LangChain Chroma native pipeline encountered: {e}. Utilizing persistent vector engine.")
        # Fallback to persistent vector engine
        from .vectorstore import get_vector_store
        store = get_vector_store()
        store.index_all_documents()
        return store

if __name__ == "__main__":
    build_index()
