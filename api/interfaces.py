"""Various interfaces."""

from abc import ABC, abstractmethod

class Retriever(ABC):
    """Absract agent class, to be revised later."""

    @abstractmethod
    def context(self, user_query: str, company_name: str, user_email: str) -> str:
        """Returns context for LLM."""

        return ''
