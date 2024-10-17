"""
Gives examples on how to extract a few pieces of information from AWS hosted Claude,
with and without PDF file input.
"""

import boto3
import os
import json
from typing import List, Dict

from llm_models.aws_bedrock.templates.common import build_aws_template
from doc_parser.pdf_utils import extract_pages

from llm_models.aws_bedrock.templates.basic_info import TEMPLATE as BASIC_TEMPLATE
from llm_models.aws_bedrock.templates.industry_names_codes import TEMPLATE as INDUSTRIES_TEMPLATE

from llm_models.aws_bedrock.prompts.info_extraction import INFO_EXTRACTION_PROMPT
from llm_models.aws_bedrock.prompts.matching_qa_to_industries import MATCHING_QA_TO_INDUSTRIES_PROMPT


from dotenv import load_dotenv
load_dotenv()


AWS_REGION_NAME = 'us-west-2'
aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')

# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/bedrock-runtime.html
bedrock = boto3.client(
    service_name='bedrock-runtime',
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key,
    region_name=AWS_REGION_NAME
)


def get_raw_pdf_part(filename: str) -> dict:
    """Use raw PDF as input to the LLM."""
    with open(filename, 'rb') as f:
        content = f.read()
        return {
            "document": {
                "format": "pdf",
                "name": 'document',
                "source": {
                    "bytes": content
                }
            }
        }


def response_to_template_prompt(template: dict, prompt: str, filename: str=None, data: object=None) -> dict:
    """In addition to info extraction template and a prompt, you can submit PDF file and/or data."""
    # Note: data is assumed to be a JSON-serializable object that has essential info.

    if data:
        prompt += f"\n'''\n{json.dumps(data, indent=2)}\n'''\n"

    initial_message = {
        "role": "user",
        "content": [
            {
                "text": prompt,
            },
        ],
    }

    # TODO: process other file types
    if filename and filename.endswith('.pdf'):
        initial_message['content'].append(get_raw_pdf_part(filename))

    # for debugging purposes only
    # print("USING PROMPT")
    # print(prompt)

    tool_list = [{
        "toolSpec": template
    }]
    # TODO: replace with a newer version if available
    response = bedrock.converse(
        modelId="anthropic.claude-3-sonnet-20240229-v1:0",
        messages=[initial_message],
        inferenceConfig={
            "temperature": 0
        },
        toolConfig={
            "tools": tool_list,
            "toolChoice": {
                "tool": {
                    "name": "info_extract"
                }
            }
        }
    )
    core_response = response['output']['message']['content'][0]['toolUse']['input']

    # Fix JSON output that sometimes happens
    if 'properties' in core_response:
        core_response: dict = core_response['properties']
    for k, v in core_response.items():
        if isinstance(v, str) and v[0] in '{[' and v[-1] in ']}':
            try:
                core_response[k] = json.loads(v)
            except Exception:
                pass

    return core_response


def info_from_template_prompt(template: dict, prompt: str, filename: str=None, data: object=None) -> dict:
    """Populate the separate templates and merge the result."""

    template_parts = template['data']
    full_templates = build_aws_template(template_parts)
    results = []
    for part in full_templates:
        try:
            results.append(response_to_template_prompt(part, prompt, filename=filename, data=data))
        except Exception as e:
            print("EXCEPTION IN GETTING RESPONSE")
            print(str(e))

    total = {}
    for result in results:
        total.update(result)

    return total


def extract_basic_info(filename: str) -> dict:
    """Extract basic info based on the template and initial part of the file."""
    with extract_pages(filename, first_page=0, last_page=10) as pages_filename:
        result = info_from_template_prompt(template=BASIC_TEMPLATE, prompt=INFO_EXTRACTION_PROMPT, filename=pages_filename)
    return result


def matching_industry_names_codes_from_qa(qa: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Return list of matching industries with their NAICS codes."""
    return info_from_template_prompt(
        template=INDUSTRIES_TEMPLATE, prompt=MATCHING_QA_TO_INDUSTRIES_PROMPT, data=qa)
