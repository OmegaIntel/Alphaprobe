import os
from langchain import LanguageChain
from ollama import Ollama

class LLM:
    def __init__(self):
        self.model_name = os.getenv("OLLAMA_MODEL_NAME", "default_model")
        self.ollama_client = Ollama(model=self.model_name)
        self.lang_chain = LanguageChain(client=self.ollama_client)

    def summarize_content(self, content: str) -> str:
        summary = self.lang_chain.summarize(content)
        return summary
