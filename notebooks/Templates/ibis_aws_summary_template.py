from copy import deepcopy


_PARTS = [
{
    "key_statistics": {
        "type": "object",
        "description": "Key Statistics",
        "properties": {
            "revenue_dollars": {
                "description": "The annual revenue.",
                "type": "number",
                "minimum": 0,
                "maximum": 10**15,
                "multipleOf": 1000,
            },
            "historical_revenue_growth_percentage": {
                "description": "Historical revenue growth precentage.",
                "type": "number",
                "minimum": -100,
                "maximum": 100,
                "multipleOf": 0.1,
            },
            "projected_revenue_growth_percentage": {
                "description": "Projected revenue growth percentage.",
                "type": "number",
                "minimum": -100,
                "maximum": 100,
                "multipleOf": 0.1,
            },
            "profit_margins_percentage": {
                "description": "Profit margines percentage.",
                "type": "string",
                "type": "number",
                "minimum": -100,
                "maximum": 100,
                "multipleOf": 0.1,
            },
        }
    },
    "executive_summary": {
        "type": "string",
        "description": "Executive summary."
    },
},

{
    "current_performance": {
        "type": "string",
        "description": "Current performance."
    },
    "future_outlook": {
        "type": "string",
        "description": "Future outlook."
    },
    "industry_definition": {
        "type": "string",
        "description": "Industry Definition and Impact."
    },
},

{
    "swot_analysis": {
        "type": "object",
        "description": "SWOT Analysis",
        "properties": {
            "strengths": {
                "type": "string",
                "description": "Strengths."
            },
            "weaknesses": {
                "type": "string",
                "description": "Weaknesses."
            },
            "opportunities": {
                "type": "string",
                "description": "Opportunities."
            },
            "threats": {
                "type": "string",
                "description": "Threats."
            },
        }
    },
},

{
    "supply_chain": {
        "type": "object",
        "description": "Supply Chain Related Industries",
        "properties": {
            "tier_1_suppliers": {
                "name": "Tier 1 suppliers",
                "type": "array",
                "items": { "type": "string" },
                "description": "Tier 1 suppliers: 2-3 industry names."
            },
            "tier_2_suppliers": {
                "name": "Tier 2 suppliers",
                "type": "array",
                "items": { "type": "string" },
                "description": "Tier 2 suppliers: 2-3 industry names."
            },
            "tier_1_buyers": {
                "name": "Tier 1 buyers",
                "type": "array",
                "items": { "type": "string" },
                "description": "Tier 2 buyers: 4-5 industry names."
            },
        }
    },
    "products_and_services": {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "product_or_service": {
                    "type": "string",
                    "description": "The name of product or service."
                },
                "percentage": {
                    "type": "number",
                    "description": "The percentage of the product or service.",
                    "minimum": 1,
                    "maximum": 99,
                    "multipleOf": 0.1,
                }
            }
        },
        "description": "Products & Services: names and percentages of contribution of product/service to industry."
    },
    "key_trends": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Key Trends."
    },
    "market_segmentation": {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "segment": {
                    "type": "string",
                    "description": "The market segment."
                },
                "percentage": {
                    "type": "number",
                    "description": "The percentage of the market segment.",
                    "minimum": 1,
                    "maximum": 99,
                    "multipleOf": 0.1,
                }
            }
        },
        "description": "Market Segmentation: customer segmentation by sector – names and percentages."
    },
},

{
    "related_international_industries": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Related International Industries."
    },
    "competitive_landscape": {
        "type": "string",
        "description": "Competitive Landscape."
    },
    "costs_and_operations": {
        "type": "string",
        "description": "Costs & Operations."
    },
    "major_players": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Major players."
    },
    "industry_name": {
        "type": "string",
        "description": "Industry name."
    },
    "country_name": {
        "type": "string",
        "description": "Full country name."
    },
    "last_updated": {
        "type": "string",
        "description": "Date when the document was Last updated."
    },
}
]


_ROOT = {
    "name": "summarize_document",
    "inputSchema": {
        "json": {
            "type": "object",
            "properties": {}
        }
    }
}


IBIS_SUMMARY_TEMPLATE = []

for part in _PARTS:
    part_template = deepcopy(_ROOT)
    part_template["inputSchema"]["json"]["properties"] = part
    part_template["inputSchema"]["json"]["required"] = list(part.keys())
    IBIS_SUMMARY_TEMPLATE.append(part_template)

# "escalate_complaint": {
#     "type": "boolean",
#     "description": "Indicates if this email is serious enough to be immediately escalated for further review."
# },
# "level_of_concern": {
#     "type": "integer",
#     "description": "Rate the level of concern for the above content on a scale from 1-10",
#     "minimum": 1,
#     "maximum": 10
# },
# "overall_sentiment": {
#     "type": "string",
#     "description": "The sender's overall sentiment.",
#     "enum": ["Positive", "Neutral", "Negative"]
# },
# "supporting_business_unit": {
#     "type": "string",
#     "description": "The internal business unit that this email should be routed to.",
#     "enum": ["Sales", "Operations", "Customer Service", "Fund Management"]
# },
# "customer_names": {
#     "type": "array",
#     "description": "An array of customer names mentioned in the email.",  
#     "items": { "type": "string" }
# },
# "sentiment": {
#     "type": "string",
#     "description": "The sender's sentiment towards the employee.",
#     "enum": ["Positive", "Neutral", "Negative"]
# }
