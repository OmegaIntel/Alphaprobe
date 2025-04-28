#llm.py

# ------------------------------------------------------------------------

import os
import openai
from langchain_openai import ChatOpenAI

# ------------------------------------------------------------------------
# LLM Setup
# ------------------------------------------------------------------------
OPENAI_API_KEY= os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

print("[DEBUG] Initializing ChatOpenAI with model o4-mini")
gpt_4 = ChatOpenAI(model="gpt-4o-mini", temperature=0.0, api_key=OPENAI_API_KEY, model_kwargs={"parallel_tool_calls": False} )
