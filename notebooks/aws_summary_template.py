SUMMARY_TEMPLATE = {
    "name": "summarize_document",
    "description": "Summarize document content.",
    "inputSchema": {
        "json": {
            "type": "object",
            "properties": {
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
                "key_statistics": {
                    "type": "object",
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
                        # "sentiment": {
                        #     "type": "string",
                        #     "description": "The sender's sentiment towards the employee.",
                        #     "enum": ["Positive", "Neutral", "Negative"]
                        # }
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
            },
            "required": [
                # "summary",
                "key_statistics",
                "executive_summary",
                "current_performance",
                "future_outlook",
                "industry_definition",
            ]
        }
    }
}
