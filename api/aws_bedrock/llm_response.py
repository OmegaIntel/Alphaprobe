import boto3
import os
import json

from aws_bedrock.templates_common import build_aws_template


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
    """This works best and parses quickly."""
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


def response_to_template(filename: str, template: dict, prompt: str) -> dict:

    initial_message = {
        "role": "user",
        "content": [
            {
                "text": prompt,
            },
        ],
    }

    initial_message['content'].append(get_raw_pdf_part(filename))

    tool_list = [{
        "toolSpec": template
    }]
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
    if 'properties' in core_response:
        core_response: dict = core_response['properties']
    for k, v in core_response.items():
        if isinstance(v, str) and v[0] in '{[' and v[-1] in ']}':
            try:
                core_response[k] = json.loads(v)
            except Exception:
                pass

    return core_response


def info_from_doc_template(filename: str, template: dict, prompt: str) -> dict:
    """Populate the separate templates and merge the result."""

    template_parts = template['data']
    full_templates = build_aws_template(template_parts)
    results = []
    for part in full_templates:
        try:
            results.append(response_to_template(filename, part, prompt))
        except Exception as e:
            print("EXCEPTION IN GETTING RESPONSE")
            print(str(e))

    total = {}
    for result in results:
        total.update(result)

    return total
