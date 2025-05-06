"""Bedrock wrapper for Anthropic Claude models (Haiku / Sonnet / Opus, 3 or 3.5).

▸ Works with **model IDs** *or* **inference‑profile ARNs**.
▸ Translates the first `system` message into the top‑level `system` field
  required by Bedrock’s Anthropic schema (only `user` and `assistant` are
  allowed inside the `messages` list).
▸ Exposes   sync `invoke()`   |   async `ainvoke()`   |   `with_structured_output()`.
▸ Prints token‑usage for debugging.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
from typing import Any, List, Mapping

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from utils.aws_utils import AwsUtlis

# ───────────────── AWS / Bedrock config ─────────────────
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
    raise EnvironmentError("AWS credentials are not set in ENV.")

DEFAULT_MODEL_ID = os.getenv(
    "BEDROCK_CLAUDE_MODEL_ID",
    "us.anthropic.claude-3-haiku-20240307-v1:0",  # default to Claude 3 Haiku (on‑demand)
)
DEFAULT_PROFILE_ARN = os.getenv("BEDROCK_CLAUDE_PROFILE_ID")  # optional for provisioned

bedrock = AwsUtlis.get_bedrock_runtime()

# ───────── helper cleaning ─────────


def unwrap_boxed(text: str) -> str:
    """Remove LaTeX \boxed{…} wrappers and stray quotes."""
    t = text.strip()
    if (t.startswith("'") and t.endswith("'")) or (
        t.startswith('"') and t.endswith('"')
    ):
        t = t[1:-1].strip()
    m = re.search(r"\\boxed\{([\s\S]*?)\}", t)
    return m.group(1).strip() if m else t


def trim_fenced(text: str) -> str:
    t = text.strip()
    if t.startswith("```") and t.endswith("```"):
        return "\n".join(t.splitlines()[1:-1]).strip()
    return t


# ───────── wrapper ─────────


class ClaudeWrapper:
    def __init__(
        self,
        model_id: str = DEFAULT_MODEL_ID,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        inference_profile_arn: str | None = DEFAULT_PROFILE_ARN,
    ) -> None:
        self.model_id = model_id
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.profile_arn = inference_profile_arn

    # ――― internal call ―――
    def _bedrock_call(self, payload: str):
        try:
            if self.profile_arn:
                return bedrock.invoke_model_with_response_stream(
                    inferenceId=self.profile_arn,
                    contentType="application/json",
                    accept="application/json",
                    body=payload,
                )
            return bedrock.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body=payload,
            )
        except ClientError as e:
            raise RuntimeError(f"Bedrock Claude invocation failed: {e}") from e

    # ――― sync ―――
    def invoke(self, messages: List[Mapping[str, str]]) -> str:
        # Extract optional system message
        system_msg = ""
        filtered: List[Mapping[str, str]] = []
        for m in messages:
            if m["role"] == "system" and not system_msg:
                system_msg = m["content"]
            else:
                # Bedrock Anthropic expects only user/assistant roles
                if m["role"] not in {"user", "assistant"}:
                    raise ValueError("Invalid role for Bedrock Claude: " + m["role"])
                filtered.append({"role": m["role"], "content": m["content"]})

        payload = json.dumps(
            {
                "anthropic_version": "bedrock-2023-05-31",
                "system": system_msg,
                "messages": filtered,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
            }
        )

        resp = self._bedrock_call(payload)

        body = resp.get("body") if isinstance(resp, dict) else resp
        if hasattr(body, "iter_lines"):
            chunks = [json.loads(chunk) for chunk in body.iter_lines()]
            data = chunks[-1]
        else:
            if isinstance(body, (bytes, bytearray)):
                body = body.decode("utf-8")
            data = json.loads(body)

        usage = data.get("usage")
        if usage and isinstance(usage, dict):
            print(
                f"[Claude] tokens ⇒ prompt={usage.get('prompt_tokens', 0)}  "
                f"completion={usage.get('completion_tokens', 0)}"
            )

        # Bedrock may return either the old "choices" schema *or* the new single-message schema
        if "choices" in data:
            content = data["choices"][0].get("message", {}).get("content")
        else:  # new schema (March‑2025)
            content = data.get("content")
            # ── normalize Bedrock 2025 block list format ──
        if isinstance(content, list):
            content = "".join(
                p.get("text", "") if isinstance(p, dict) else str(p) for p in content
            )
        if content is None:
            raise RuntimeError("Claude returned empty content.")
        return trim_fenced(unwrap_boxed(content))

    # ――― async ―――
    async def ainvoke(self, messages: List[Mapping[str, str]]) -> str:
        return await asyncio.to_thread(self.invoke, messages)

    # ――― structured output helper ―――
    def with_structured_output(self, output_schema, method: str = "function_calling"):
        class StructuredCaller:
            def __init__(self, parent):
                self._parent = parent

            def invoke(self, msgs):
                return self._parent.invoke(msgs)

            async def ainvoke(self, msgs):
                return await self._parent.ainvoke(msgs)

        return StructuredCaller(self)


# ═════════════════════════════════════════════════════════════════════════════
#  DeepSeek wrapper
# ═════════════════════════════════════════════════════════════════════════════

DEEPSEEK_MODEL_ID = os.getenv(
    "BEDROCK_DEEPSEEK_MODEL_ID",
    "us.deepseek.r1-v1:0",  # update to whatever ID you were given
)


class DeepSeekWrapper:
    def __init__(
        self,
        model: str = DEEPSEEK_MODEL_ID,  # e.g. "us.deepseek.r1-v1:0"
        temperature: float = 0.0,
        max_tokens: int = 4096,
        top_p: float = 1.0,
        stop: list[str] = None,
    ):
        self.model_id = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.top_p = top_p
        self.stop = stop or []

    def invoke(self, messages):
        # Build your prompt as before
        last_user = next(
            (m for m in reversed(messages) if m["role"] == "user"), messages[-1]
        )
        prompt_text = last_user["content"]

        payload = {
            "prompt": prompt_text,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "stop": self.stop,
        }

        try:
            resp = bedrock.invoke_model(
                modelId=self.model_id,
                body=json.dumps(payload),
                contentType="application/json",
                accept="application/json",
            )
        except ClientError as e:
            raise RuntimeError(f"Bedrock invocation failed: {e}")

        # ----- NEW: handle the StreamingBody -----
        stream = resp.get("body")  # a botocore.response.StreamingBody
        raw_bytes = stream.read()  # read all bytes from the stream
        text = raw_bytes.decode("utf-8")  # decode to string
        data = json.loads(text)  # parse JSON

        # -----------------------------------------

        choices = data.get("choices")
        if not choices or not isinstance(choices, list):
            raise RuntimeError(f"No choices returned from DeepSeek:\n{data!r}")

        # DeepSeek returns 'text' in each choice
        output = choices[0].get("text")
        if output is None:
            raise RuntimeError(f"Empty 'text' in choice[0]:\n{choices[0]!r}")

        return output

    async def ainvoke(self, messages):
        # Run invoke in a background thread
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
