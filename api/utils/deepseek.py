# utils/deepseek.py
import os
import re
from openai import OpenAI as ORouterClient

# Add API key validation
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is not set")

# Initialize client with headers
client = ORouterClient(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    default_headers={
        "HTTP-Referer": "http://localhost:5173",  # Replace with your actual domain
        "X-Title": "Alphaprobe API"  # Your app's name
    }
)

def unwrap_boxed(text: str) -> str:
    t = text.strip()
    if t.startswith("\\boxed{") and t.endswith("}"):
        return t[len("\\boxed{"):-1].strip()
    return t


def trim_fenced(text: str) -> str:
    t = text.strip()
    if t.startswith("```") and t.endswith("```"):
        lines = t.splitlines()
        t = "\n".join(lines[1:-1])
    # Drop any leading prefix like 'role: '
    return re.sub(r'^[A-Za-z0-9_\-]+:\s*', "", t)


class DeepSeekWrapper:
    def __init__(self, model: str, temperature: float, max_tokens: int = 40000):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    def with_structured_output(self, output_schema, method="function_calling"):
        class StructuredCaller:
            def __init__(self, output_schema, method, parent):
                self.output_schema = output_schema
                self.method = method
                self.parent = parent

            def invoke(self, messages):
                formatted_messages = [
                    {"role": m["role"], "content": m["content"]} for m in messages
                ]
                response = client.chat.completions.create(
                    model=self.parent.model,
                    messages=formatted_messages,
                    temperature=self.parent.temperature,
                    max_tokens=self.parent.max_tokens,
                )
                content = response.choices[0].message.content
                return trim_fenced(unwrap_boxed(content))

            async def ainvoke(self, messages):
                return self.invoke(messages)

        return StructuredCaller(output_schema, method, self)

    def invoke(self, messages):
        formatted_messages = [
            {"role": m["role"], "content": m["content"]} for m in messages
        ]
        response = client.chat.completions.create(
            model=self.model,
            messages=formatted_messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )
        content = response.choices[0].message.content
        return trim_fenced(unwrap_boxed(content))

    async def ainvoke(self, messages):
        return self.invoke(messages)
