"""
PDF Parser using Llama Parse. Uses OpenAI for better parsing results.
"""

import nest_asyncio
nest_asyncio.apply()

import os
from dotenv import load_dotenv
load_dotenv()


from api.doc_parser.pdf_parser import PDFParser

from typing import List, Union
from llama_index.core.schema import TextNode
from llama_index.core.node_parser import SentenceSplitter
from llama_parse import LlamaParse


class LlamaParser(PDFParser):
    """Specific parser implementation"""

    # TODO: experiment with different splitters.

    def __init__(self, **kwargs):
        self.chunk_size = kwargs.get('chunk_size', 1024)
        self.splitter = kwargs.get('splitter', 'sentence')
        self.api_key = kwargs.get('llama_cloud_api_key', os.getenv('LLAMA_CLOUD_API_KEY'))
        self.gpt4o_api_key = kwargs.get('openai_api_key', os.getenv('OPENAI_API_KEY'))
        self.result_type = kwargs.get('result_type', 'markdown')

    def _parse_pdf(self, pdf: Union[str, bytes]) -> List[TextNode]:
        """Uses fixed splitter, for now"""
        parser = LlamaParse(
            result_type=self.result_type,
            api_key=self.api_key,
            gpt4o_api_key=self.gpt4o_api_key,
        )

        docs =  parser.load_data(pdf, extra_info={'file_name': 'temp.pdf'})

        nodes = []
        assert self.splitter == 'sentence'
        splitter = SentenceSplitter(chunk_size=self.chunk_size)
        for idx, doc in enumerate(docs):
            chunks = splitter.split_text(doc.text)
            # create nodes with metadata
            for chunk in chunks:
                node = TextNode(text=chunk, metadata={'page_number': idx+1})
                nodes.append(node)

        return nodes
