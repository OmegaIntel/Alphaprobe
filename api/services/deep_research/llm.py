import os
import openai
from langchain_openai import ChatOpenAI

# ------------------------------------------------------------------------
# LLM Setup
# ------------------------------------------------------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

print("[DEBUG] Initializing ChatOpenAI with model o4-mini")
gpt_4 = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.0,
    api_key=OPENAI_API_KEY,
    model_kwargs={"parallel_tool_calls": False},
)

# Token trimming
try:
    import tiktoken
    enum_encoding = tiktoken.encoding_for_model("gpt-4o-mini")
except ImportError:
    enum_encoding = None

MAX_TOKENS = 40000

# ======================================================================= #
# -------------------------- Utility Functions -------------------------- #
# ======================================================================= #
def trim_to_tokens(text: str, max_tokens: int = MAX_TOKENS) -> str:
    if not enum_encoding:
        return text[:8000]
    tokens = enum_encoding.encode(text)
    if len(tokens) <= max_tokens:
        return text
    return enum_encoding.decode(tokens[:max_tokens])
