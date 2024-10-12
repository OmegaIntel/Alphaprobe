"""Interface for PDF parsers."""

from abc import ABC, abstractmethod
from typing import List, Union

from llama_index.core.schema import TextNode

PAGE_NUMBER = 'page_number'
LINE_NUMBER = 'line_number'
LEVEL = 'level'


class PDFParser(ABC):
    """Superclass for PDF parsers"""

    # Only basic metadata associated with the PDF structure.
    METADATA = [PAGE_NUMBER, LINE_NUMBER, LEVEL]

    def __init__(self, **kwargs):
        self.kwargs = kwargs

    @abstractmethod
    def _parse_pdf(self, pdf: Union[str, bytes]) -> List[TextNode]:
        """
        Return a list of llama_index Text Nodes.
        Works with file names or their bytes. str -> local file name; bytes -> contents.
        """
        return []

    def parse_pdf(self, pdf: Union[str, bytes]) -> List[TextNode]:
        result = self._parse_pdf(pdf)
        for text_node in result:
            for k in self.METADATA:
                assert k in text_node.metadata, f'{k} not in text node metadata'
        return result
