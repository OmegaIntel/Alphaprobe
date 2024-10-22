"""Sections and subsections info template"""

TEMPLATE = {
    'name': 'sections_info',
    'data': [{
            "sections": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Section or subsection name."
                        },
                        "level": {
                            "type": "number",
                            "description": "The level of the section.",
                            "minimum": 1,
                            "maximum": 5,
                            "multipleOf": 1,
                        },
                        "page_number": {
                            "type": "number",
                            "description": "The page number of the section.",
                            "minimum": 1,
                            "maximum": 9999,
                            "multipleOf": 1,
                        },
                        "line_number": {
                            "type": "number",
                            "description": "The line number of the section.",
                            "minimum": 1,
                            "maximum": 100,
                            "multipleOf": 1,
                        },
                    }
                },
                "description": "Info about sections and subsections: name, level, page number, line number."
            }
        }],
}
