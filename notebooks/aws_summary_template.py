from copy import deepcopy


_PART1 = {
    "key_statistics": {
        "type": "object",
        "description": "Key Statistics",
        "properties": {
            "revenue": {
                "type": "string",
                "description": "The annual revenue."
            },
            "historical_revenue_growth": {
                "type": "string",
                "description": "Historical revenue growth."
            },
            "projected_revenue_growth": {
                "type": "string",
                "description": "Projected revenue growth."
            },
            "profit margins": {
                "type": "string",
                "description": "Profit margins."
            },
        }
    },
    "executive_summary": {
        "type": "string",
        "description": "Executive summary."
    },
    "current_performance": {
        "type": "string",
        "description": "Current Performance."
    },
    "future_outlook": {
        "type": "string",
        "description": "Future Outlook."
    },
    "industry_definition": {
        "type": "string",
        "description": "Industry Definition and Impact."
    },
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
}


_PART2 = {
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
    "related_international_industries": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Related International Industries."
    },
}


_ROOT = {
    "name": "summarize_document",
    "description": "Summarize document content.",
    "inputSchema": {
        "json": {
            "type": "object",
            "properties": {}
        }
    }
}


SUMMARY_TEMPLATE_1 = deepcopy(_ROOT)
SUMMARY_TEMPLATE_1["inputSchema"]["json"]["properties"] = _PART1

SUMMARY_TEMPLATE_2 = deepcopy(_ROOT)
SUMMARY_TEMPLATE_2["inputSchema"]["json"]["properties"] = _PART2


SUMMARY_TEMPLATE = {
    "name": "summarize_document",
    "description": "Summarize document content.",
    "inputSchema": {
        "json": {
            "type": "object",
            "properties": {
                "key_statistics": {
                    "type": "object",
                    "description": "Key Statistics",
                    "properties": {
                        "revenue": {
                            "type": "string",
                            "description": "The annual revenue."
                        },
                        "historical_revenue_growth": {
                            "type": "string",
                            "description": "Historical revenue growth."
                        },
                        "projected_revenue_growth": {
                            "type": "string",
                            "description": "Projected revenue growth."
                        },
                        "profit margins": {
                            "type": "string",
                            "description": "Profit margins."
                        },
                    }
                },
                "executive_summary": {
                    "type": "string",
                    "description": "Executive summary."
                },
                "current_performance": {
                    "type": "string",
                    "description": "Current Performance."
                },
                "future_outlook": {
                    "type": "string",
                    "description": "Future Outlook."
                },
                "industry_definition": {
                    "type": "string",
                    "description": "Industry Definition and Impact."
                },
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
                # -----------------
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
                "related_international_industries": {
                    "type": "array",
                    "items": { "type": "string" },
                    "description": "Related International Industries."
                },
            },
        }
    }
}


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
