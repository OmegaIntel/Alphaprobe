"""
The retrieval (R) part of RAG.
Define operations to store and retrieve supporting documents from a collection. 
"""

from weaviate.connect.v4 import UnexpectedStatusCodeError
import weaviate.classes as wvc
from weaviate.client import WeaviateClient
from filestore.s3_store import UserDocumentStore


class DocumentManager:
    
    PROPERTIES = {
        "doc_url":  wvc.config.DataType.TEXT,
        "doc_date": wvc.config.DataType.DATE,
        "content": wvc.config.DataType.TEXT,
        "doc_page": wvc.config.DataType.NUMBER,
        "tags": wvc.config.DataType.TEXT_ARRAY,
    }

    def __init__(self, coll_id: str, client: WeaviateClient):
        self._coll_id = coll_id
        self._client = client

    def store(self, doc_path: str):
        """Store document in S3 and in Weaviate."""
        udm = UserDocumentStore(self._coll_id)
        doc_url = udm.store_document(doc_path)

    def create_collection(self):

        try:
            self._client.collections.create(
                name=self._coll_id,
                properties=[
                    wvc.config.Property(
                        name=cname,
                        data_type=ctype,
                    ) for cname, ctype in self.PROPERTIES.items()
                ]
            )
        except UnexpectedStatusCodeError:
            pass    # the schema exists already
