"""Basic info template"""

TEMPLATE = {
    'name': 'section_to_page_number',
    'data': [
        {
            "industry_at_a_glance": {
                "type": "integer",
                "description": "Page number of the section Industry at a Glance.",
                "type": "number",
                "minimum": 0,
                "maximum": 1000,
                "multipleOf": 1,
            },

            "supply_chain": {
                "type": "integer",
                "description": "Page number of the section Supply Chain.",
                "type": "number",
                "minimum": 0,
                "maximum": 1000,
                "multipleOf": 1,
            },

            "competitive_landscape": {
                "type": "integer",
                "description": "Page number of the section Competitive Landscape.",
                "type": "number",
                "minimum": 0,
                "maximum": 1000,
                "multipleOf": 1,
            },

            "costs_operations": {
                "type": "integer",
                "description": "Page number of the section Costs & Operations.",
                "type": "number",
                "minimum": 0,
                "maximum": 1000,
                "multipleOf": 1,
            },

            "questions_for_owners": {
                "type": "integer",
                "description": "Page number of the section Questions for Owners.",
                "type": "number",
                "minimum": 0,
                "maximum": 1000,
                "multipleOf": 1,
            },

            "datatables_glossary": {
                "type": "integer",
                "description": "Page number of the section Datatables & Glossary.",
                "type": "number",
                "minimum": 0,
                "maximum": 1000,
                "multipleOf": 1,
            },
            
        },
    ],
}
