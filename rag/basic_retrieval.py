"""
The retrieval (R) part of RAG.
Define operations to store and retrieve supporting documents from a collection. 
"""

from weaviate.connect.v4 import UnexpectedStatusCodeError
import weaviate.classes as wvc
from weaviate.client import WeaviateClient

from llmsherpa.readers import LayoutPDFReader, Paragraph

from filestore import s3_store

from typing import List

import hashlib
from os import getenv
from dotenv import load_dotenv

load_dotenv()


def file_id(filepath: str):
   """Returns the SHA-1 hash of the file passed into it"""

   # make a hash object
   h = hashlib.sha1()

   # open file for reading in binary mode
   with open(filepath,'rb') as file:

       # loop till the end of the file
       chunk = 0
       while chunk != b'':
           # read only 1024 bytes at a time
           chunk = file.read(1024)
           h.update(chunk)

   # return the hex representation of digest
   return h.hexdigest()


class DocumentManager:
    """Manages stuff related to docs: add/delete, chunks, summary, etc."""
    # TODO: maybe split it into different classes???

    CHUNK_PROPERTIES = {
        "doc_id":  wvc.config.DataType.TEXT,
        "last_updated": wvc.config.DataType.TEXT,
        # TODO: replace with true date.
        # "doc_last_updated": wvc.config.DataType.DATE,
        "tags": wvc.config.DataType.TEXT_ARRAY,
        "content": wvc.config.DataType.TEXT,
        "section": wvc.config.DataType.TEXT,
        "page_number": wvc.config.DataType.NUMBER,
    }

    def __init__(self, coll_id: str, weaviate_client: WeaviateClient, pdf_reader: LayoutPDFReader):
        self._coll_id = coll_id
        self._wclient = weaviate_client
        self._pdf_reader = pdf_reader


    def _file_storage_key(self, file_path: str) -> str:
        """Provides unique file ID."""
        return f'{self._coll_id}/{file_id(file_path)}'


    def add_file(self, file_path: str, last_updated: str, tags: List[str]) -> str:
        """Returns S3 location, for now."""
        doc_id = self._add_to_file_store(file_path)
        self._create_chunk_collection()
        is_successful = self._upload_chunks(file_path, doc_id, last_updated, tags)
        return doc_id if is_successful else ''


    def _add_to_file_store(self, file_path: str) -> str:
        """Store document in S3 and in Weaviate."""
        object_key = self._file_storage_key(file_path)
        return s3_store.upload_object(file_path, object_key)


    def _upload_chunks(self, file_path: str, doc_id: str, last_updated: str, doc_tags: List[str]) -> bool:
        """Upload chunks -- the best attempt, for now."""
        doc = self._pdf_reader.read_pdf(file_path)
        coll = self._wclient.collections.get(self._coll_id)
        to_insert = []
        page_count = 0
        for chunk in doc.chunks():
            chunk: Paragraph

            try:
                text = chunk.to_context_text()
            except Exception as e:
                print("GOT EXCEPTION IN TO_TEXT", e)
                text = chunk.to_text()

            try:
                section = chunk.parent_text()
            except Exception as e:
                print("GOT EXCEPTION IN PARENT", e)
                section = 'Unknown'

            try:
                page_number = chunk.page_idx
                page_count = max(page_count, page_number)
            except Exception as e:
                print("GOT EXCEPTION IN PAGE_IDX", e)
                page_number = -1

            try:
                values = {
                    "doc_id":  doc_id,
                    "doc_last_updated": last_updated,
                    "doc_tags": doc_tags,
                    "content": text,
                    "section": section,
                    "page_number": page_number,
                }
                # coll.data.insert(values)
                to_insert.append(values)
            except Exception as e:
                print("GOT EXCEPTION LOADING DOC", e)

        try:
            coll.data.insert_many(to_insert)
            print("PROCESSED DOC", file_path, page_count, "pages")
        except Exception as e:
            print("EXCEPTION LOADING MANY", e)

        return True


    def _create_chunk_collection(self):
        """Creates collection of fragments."""
        try:
            self._wclient.collections.create(
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
