"""Industry names and codes"""

TEMPLATE = {
    'name': 'industry_names_codes',
    'data': [{
        "name": {
            "name": "industry-name-code",
            "description": "Full industry name and NAICS code",
            "type": "array",
            "items": { "type": "string" },
        },
    }],
}
