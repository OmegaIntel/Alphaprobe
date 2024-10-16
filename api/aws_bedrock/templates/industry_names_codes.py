"""Industry names and codes"""

TEMPLATE = {
    'name': 'industry_names_codes',
    'data': [{
        "name": {
            "type": "string",
            "description": "Full industry name",
        },
        "code": {
            "type": "number",
            "description": "Industry NAICS code",
            "minimum": 0,
            "maximum": 100000,
            "multipleOf": 1,
        },
    }],
}
