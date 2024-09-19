"""
The retrieval (R) part of RAG.
Define operations to store and retrieve supporting documents from a collection. 
"""

from weaviate.connect.v4 import UnexpectedStatusCodeError
import weaviate.classes as wvc
from weaviate.client import WeaviateClient

from llmsherpa.readers import LayoutPDFReader, Paragraph

from filestore.s3_store import UserDocumentStore

from typing import List

from os import getenv
from dotenv import load_dotenv

load_dotenv()


class DocumentManager:
    """Manages stuff related to docs: add/delete, chunks, summary, etc."""
    # TODO: maybe split it into different classes???

    CHUNK_PROPERTIES = {
        "doc_url":  wvc.config.DataType.TEXT,
        "doc_last_updated": wvc.config.DataType.TEXT,
        # TODO: replace with true date.
        # "doc_last_updated": wvc.config.DataType.DATE,
        "doc_tags": wvc.config.DataType.TEXT_ARRAY,
        "content": wvc.config.DataType.TEXT,
        "section": wvc.config.DataType.TEXT,
        "page_number": wvc.config.DataType.NUMBER,
    }

    def __init__(self, coll_id: str, client: WeaviateClient):
        self._coll_id = coll_id
        self._client = client

    def add_file(self, file_path: str, last_updated: str, tags: List[str]) -> str:
        """Returns S3 location, for now."""
        doc_url = self._add_to_file_store(file_path)
        self._create_chunk_collection()
        is_successful = self._upload_chunks(file_path, doc_url, last_updated, tags)
        return doc_url if is_successful else ''

    def _add_to_file_store(self, file_path: str) -> str:
        """Store document in S3 and in Weaviate."""
        udm = UserDocumentStore(self._coll_id)
        return udm.store_document(file_path)

    def _upload_chunks(self, file_path: str, doc_url: str, last_updated: str, doc_tags: List[str]) -> bool:
        """Upload chunks -- the best attempt, for now."""
        reader = LayoutPDFReader(getenv('LLMSHERPA_API_URL'))
        doc = reader.read_pdf(file_path)
        coll = self._client.collections.get(self._coll_id)
        try:
            for chunk in doc.chunks():
                chunk: Paragraph
                try:
                    text = chunk.to_context_text()
                except:
                    text = chunk.to_text()
                try:
                    section = chunk.parent_text()
                except:
                    section = 'Unknown'
                try:
                    page_number = chunk.page_idx()
                except:
                    page_number = -1

            to_insert = {
                "doc_url":  doc_url,
                "doc_last_updated": last_updated,
                "doc_tags": doc_tags,
                "content": text,
                "section": section,
                "page_number": page_number,
            }

            coll.data.insert(to_insert)
            return True
        except:
            return False

    def _create_chunk_collection(self):
        """Creates collection of fragments."""
        try:
            self._client.collections.create(
                name=self._coll_id,
                description=f"Documents for collection with ID {self._coll_id}",
                vectorizer_config=wvc.config.Configure.Vectorizer.text2vec_openai(),
                properties=[
                    wvc.config.Property(
                        name=cname,
                        data_type=ctype,
                    ) for cname, ctype in self.CHUNK_PROPERTIES.items()
                ]
            )
        except UnexpectedStatusCodeError:
            pass    # the schema exists already
