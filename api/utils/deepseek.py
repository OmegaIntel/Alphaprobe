import os
from openai import OpenAI

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# ------------------------------------------------------------------------
# Define a wrapper to emulate our previous gpt_4 interface
#
# This class provides methods to make structured calls (with_structured_output)
# and synchronous/asynchronous completions via the OpenRouter DeepSeek R1 model.
# ------------------------------------------------------------------------
class DeepSeekWrapper:
    def __init__(self, model: str, temperature: float):
        self.model = model
        self.temperature = temperature

    def with_structured_output(self, output_schema, method="function_calling", **kwargs):
        """
        Returns an object with .invoke() and .ainvoke() methods that call our OpenRouter DeepSeek R1.
        The output_schema is not automatically enforced here – you must implement parsing as needed.
        """
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
                    extra_headers={
                        "HTTP-Referer": os.getenv("YOUR_SITE_URL", "https://example.com"),
                        "X-Title": os.getenv("YOUR_SITE_NAME", "MySite")
                    },
                    extra_body={},
                    model=self.parent.model,
                    messages=formatted_messages,
                )
                # Here you would normally parse the response into an instance of output_schema.
                # For demonstration we simply return the text content.
                return response["choices"][0]["message"]["content"]

            async def ainvoke(self, messages):
                # For simplicity, we are calling the synchronous invoke.
                # In a production system consider wrapping this in an executor.
                return self.invoke(messages)

        return StructuredCaller(output_schema, method, self)

    def invoke(self, messages):
        formatted_messages = [
            {"role": m["role"], "content": m["content"]} for m in messages
        ]
        response = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": os.getenv("YOUR_SITE_URL", "https://example.com"),
                "X-Title": os.getenv("YOUR_SITE_NAME", "MySite")
            },
            extra_body={},
            model=self.model,
            messages=formatted_messages,
        )
        return response["choices"][0]["message"]["content"]

    async def ainvoke(self, messages):
        return self.invoke(messages)