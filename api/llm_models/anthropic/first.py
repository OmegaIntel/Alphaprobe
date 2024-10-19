"""This is a test of Anthropic raw functionality with the latest model. Currently unused."""

import anthropic
import dotenv
import os

import json
import pandas as pd

dotenv.load_dotenv()

client = anthropic.Anthropic(
    # defaults to os.environ.get("ANTHROPIC_API_KEY")
    api_key=os.getenv("ANTHROPIC_API_KEY"),
)

# qa = pd.read_csv('test-data/related-industries-1.csv')
qa = pd.read_csv('../test-data/related-industries-2.csv')
rows = qa.to_dict(orient='records')

TEXT = f"""
You are given in triple quotes a list of questions and answers that express a pereson's interest
in investing into various industries.

Come up with a list of 10 industries that match the person's investment interests.

Return the result in JSON format. Do not use non-JSON tags such as <property> or <UNKNOWN>.

Be mindful of the person's preferences and only choose industries that reflect those preferences.

Use standard NAICS codes and only include one industry per code. Return the codes in your JSON.

'''
{json.dumps(rows, indent=2)}
'''
"""

print("-"*20)
print(TEXT)
print("-"*20)


message = client.messages.create(
    model="claude-3-5-sonnet-20240620",
    max_tokens=1000,
    temperature=0.0,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": TEXT,
                }
            ]
        }
    ]
)

print(message.content[0].text)
