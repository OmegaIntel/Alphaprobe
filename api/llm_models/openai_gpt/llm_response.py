"""Basic query to GPT"""

import json
import os

from dotenv import load_dotenv
load_dotenv()

from openai import OpenAI

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))


def respond_to_prompt(prompt: str, model='o4-mini', temperature=0) -> dict:
    """Responds to the prompt."""
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
        response_format={ "type": "json_object" },
        temperature=temperature,
    )

    result = json.loads(response.choices[0].message.content)
    return result
