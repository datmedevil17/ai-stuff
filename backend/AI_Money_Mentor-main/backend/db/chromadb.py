import chromadb
from chromadb.config import Settings as ChromaSettings
from config import settings
import os

class ChromaStore:
    def __init__(self):
        # Initialize persistent client
        os.makedirs(settings.chromadb_path, exist_ok=True)
        self.client = chromadb.PersistentClient(
            path=settings.chromadb_path,
            settings=ChromaSettings(allow_reset=True)
        )
        self.collection_name = "finpersona_knowledge"

    def get_collection(self):
        """Get or create the knowledge collection for RAG"""
        try:
            return self.client.get_collection(name=self.collection_name)
        except Exception:
            return self.client.create_collection(name=self.collection_name)

chroma_store = ChromaStore()
