"""Common functionality for all aws templates."""

from typing import List
from copy import deepcopy


def build_aws_template(template_parts: List[dict]) -> List[dict]:
    """Return a list of templates, each can be used for extracting appropriate info."""
    out = []
    _ROOT = {
        "name": 'info_extract',
        "inputSchema": {
            "json": {
                "type": "object",
                "properties": {}
            }
        }
    }

    for part in template_parts:
        part_template = deepcopy(_ROOT)
        part_template["inputSchema"]["json"]["properties"] = part
        part_template["inputSchema"]["json"]["required"] = list(part.keys())
        out.append(part_template)

    return out
