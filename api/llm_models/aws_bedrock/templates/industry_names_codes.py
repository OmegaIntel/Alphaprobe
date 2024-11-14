"""Industry names and codes"""
import json
import os

# Get the directory of the current script
script_dir = os.path.dirname(__file__)

# Construct the absolute path to the JSON file
json_file_path = os.path.join(script_dir, 'template_data', 'available_industry_codes.json')

# Load the JSON file
with open(json_file_path, 'r') as file:
    INDUSTRY_CODES_AVAILABLE = json.load(file)

TEMPLATE = {
    'name': 'industry_names_codes',
    'data': [{
        "industry_name_code": {
            # "name": "industry-name-code",
            "description": "Full industry name and NAICS code",
            "type": "array",
            # "items": {"type": "string"},
            "items": {
                "type": "object",
                "properties": {
                    "industry_name": {
                        "type": "string",
                        "description": "Detailed, full name of the industry."
                    },
                    "industry_code": {
                        "type": "string",
                        "description": "The corresponding NAICS code of the industry.",
                        "enum": INDUSTRY_CODES_AVAILABLE
                    }
                }
            },
        },
    }],
}
