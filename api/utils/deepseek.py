import os
import re
import asyncio
from openai import OpenAI as ORouterClient
from dotenv import load_dotenv, find_dotenv

env_path = find_dotenv()  # walks up until it finds .env
loaded = load_dotenv(env_path)

# Validate API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is not set")

# Initialize OpenRouter client
client = ORouterClient(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    default_headers={
        "HTTP-Referer": "http://localhost:5173",  # your domain
        "X-Title": "Alphaprobe API",  # your app name
    },
)


def unwrap_boxed(text: str) -> str:
    """
    Remove any LaTeX \boxed{...} wrappers and surrounding quotes.
    """
    t = text.strip()
    # Strip surrounding single or double quotes
    if (t.startswith("'") and t.endswith("'")) or (
        t.startswith('"') and t.endswith('"')
    ):
        t = t[1:-1].strip()
    # Remove \boxed{...} wrapper
    pattern = r"\\boxed\{([\s\S]*?)\}"
    m = re.search(pattern, t)
    if m:
        return m.group(1).strip()
    return t


def trim_fenced(text: str) -> str:
    """
    Remove Markdown code fences (```...```).
    """
    t = text.strip()
    if t.startswith("```") and t.endswith("```"):
        lines = t.splitlines()
        return "\n".join(lines[1:-1]).strip()
    return t


class DeepSeekWrapper:
    def __init__(self, model: str, temperature: float, max_tokens: int = 40000):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    def invoke(self, messages):
        formatted = [{"role": m["role"], "content": m["content"]} for m in messages]
        resp = client.chat.completions.create(
            model=self.model,
            messages=formatted,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            stop=None,
        )

        # --- new validation block ---
        choices = getattr(resp, "choices", None)
        if not choices:
            raise RuntimeError(f"No choices returned from OpenRouter:\n{resp!r}")
        content = choices[0].message.content
        if content is None:
            raise RuntimeError(f"Empty content in choice[0]:\n{choices[0]!r}")
        # -----------------------------

        return trim_fenced(unwrap_boxed(content))

    async def ainvoke(self, messages):
        """
        Asynchronous version: runs invoke() in background thread.
        """
        return await asyncio.to_thread(self.invoke, messages)

    def with_structured_output(self, output_schema, method="function_calling"):
        class StructuredCaller:
            def __init__(self, schema, method, parent):
                self.schema = schema
                self.method = method
                self.parent = parent

            def invoke(self, messages):
                return self.parent.invoke(messages)

            async def ainvoke(self, messages):
                return await self.parent.ainvoke(messages)

        return StructuredCaller(output_schema, method, self)
