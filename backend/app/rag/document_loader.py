import os
import re
from pathlib import Path
from typing import List, Dict, Any

DOCUMENTS_DIR = Path(__file__).parent / "documents"

def load_documents(docs_dir: Path = DOCUMENTS_DIR) -> List[Dict[str, Any]]:
    """Loads all Markdown documents from the documents directory."""
    raw_docs = []
    if not docs_dir.exists():
        docs_dir.mkdir(parents=True, exist_ok=True)
        return raw_docs

    for file_path in docs_dir.glob("*.md"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            raw_docs.append({
                "source": file_path.name,
                "path": str(file_path),
                "content": content
            })
        except Exception as e:
            print(f"[RAG Loader] Error loading {file_path.name}: {e}")
    return raw_docs

def chunk_documents(documents: List[Dict[str, Any]], chunk_size: int = 500, chunk_overlap: int = 80) -> List[Dict[str, Any]]:
    """
    Chunks documents by sections (headers ## and ###) and token/character length
    preserving semantic context and official source attribution.
    """
    chunks = []
    chunk_idx = 0

    for doc in documents:
        content = doc["content"]
        source_name = doc["source"]
        
        # Split on markdown headers (#, ##, ###)
        sections = re.split(r'\n(?=#{1,3}\s)', content)
        
        for sec in sections:
            sec_text = sec.strip()
            if not sec_text:
                continue
            
            # Extract section heading
            lines = sec_text.splitlines()
            header_line = lines[0] if lines[0].startswith("#") else ""
            header_clean = header_line.lstrip("#").strip() if header_line else "General Guidelines"
            
            # If section fits within chunk_size, keep as a whole chunk
            if len(sec_text) <= chunk_size * 2:
                chunk_idx += 1
                chunks.append({
                    "id": f"{source_name}#chunk_{chunk_idx}",
                    "text": sec_text,
                    "metadata": {
                        "source": source_name,
                        "section": header_clean,
                        "length": len(sec_text)
                    }
                })
            else:
                # Sub-chunk by paragraphs or sentences
                paragraphs = sec_text.split("\n\n")
                current_chunk = header_line + "\n" if header_line else ""
                
                for p in paragraphs:
                    if len(current_chunk) + len(p) < chunk_size * 2:
                        current_chunk += p + "\n\n"
                    else:
                        if current_chunk.strip():
                            chunk_idx += 1
                            chunks.append({
                                "id": f"{source_name}#chunk_{chunk_idx}",
                                "text": current_chunk.strip(),
                                "metadata": {
                                    "source": source_name,
                                    "section": header_clean,
                                    "length": len(current_chunk)
                                }
                            })
                        current_chunk = f"[{header_clean}]\n" + p + "\n\n"
                
                if current_chunk.strip():
                    chunk_idx += 1
                    chunks.append({
                        "id": f"{source_name}#chunk_{chunk_idx}",
                        "text": current_chunk.strip(),
                        "metadata": {
                            "source": source_name,
                            "section": header_clean,
                            "length": len(current_chunk)
                        }
                    })

    return chunks
