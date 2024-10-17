"""Industry names and codes"""

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
                    }
                }
            },
        },
    }],
}
