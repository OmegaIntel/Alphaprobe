"""Interface for PDF parsers."""

from abc import ABC, abstractmethod
from typing import List, Union

from llama_index.core.schema import TextNode


class PDFParser(ABC):
    """Superclass for PDF parsers"""

    # Only basic metadata associated with the PDF structure.
    METADATA = {
        'page_number',
        'line_number',
        'level',
    }

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
                assert k in text_node.metadata
        return result
