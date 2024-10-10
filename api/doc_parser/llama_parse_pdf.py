"""
PDF Parser using Llama Parse. Uses OpenAI for better parsing results.
"""

CHUNK_SIZE = 1024
SPLITTER = "sentence"

import nest_asyncio
nest_asyncio.apply()

import os
from dotenv import load_dotenv
load_dotenv()

from typing import List, Union
from llama_index.core.schema import TextNode
from llama_index.core.node_parser import SentenceSplitter
from llama_parse import LlamaParse


def llama_parse_pdf(pdf: Union[str, bytes]) -> List[TextNode]:
    """
    Return a list of llama_index Text Nodes.
    Works with file names or their bytes. str -> local file name; bytes -> contents.
    Uses a fixed splitter, for now.
    """
    parser = LlamaParse(
        result_type="markdown",
        api_key = os.getenv('LLAMA_CLOUD_API_KEY'),
        gpt4o_api_key=os.getenv('OPENAI_API_KEY'),
        # fast_mode=True
    )

    docs =  parser.load_data(pdf, extra_info={'file_name': 'temp.pdf'})

    nodes = []
    if SPLITTER == "sentence":
        splitter = SentenceSplitter(chunk_size=CHUNK_SIZE)
        for idx, doc in enumerate(docs):
            chunks = splitter.split_text(doc.text)
            # create nodes with metadata
            for chunk in chunks:
                node = TextNode(text=chunk, metadata={'page_number': idx+1})
                nodes.append(node)

    return nodes
