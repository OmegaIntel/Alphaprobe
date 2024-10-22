from copy import deepcopy


TEMPLATE = {
    'name': 'basic_info',
    'data': [
        {
            "report_title": {
                "type": "string",
                "description": "The title of the report."
            },
            "report_date": {
                "type": "string",
                "description": "The date of the report."
            },
            "key_statistics": {
                "type": "object",
                "description": "Key Statistics",
                "properties": {
                    "profit": {
                        "description": "The annual profit.",
                        "type": "object",
                        "properties": {
                            "profit_dollars": {
                                "description": "The annual profit in dollars.",
                                "type": "number",
                                "minimum": 0,
                                "maximum": 10**15,
                                "multipleOf": 1000,
                            },
                            "profit_cagr_historical": {
                                "description": "The historical compound annual growth rate of profit.",
                                "type": "object",
                                "properties": {
                                    "profit_cagr_value": {
                                        "description": "The historical compound annual growth rate of profit.",
                                        "type": "number",
                                        "minimum": -100,
                                        "maximum": 101,
                                        "multipleOf": 0.1,
                                    },
                                    "begin_year": {
                                        "description": "The beginning year of the historical CAGR of profit.",
                                        "type": "number",
                                        "minimum": 0,
                                        "maximum": 2100,
                                    },
                                    "end_year": {
                                        "description": "The ending year of the historical CAGR of profit.",
                                        "type": "number",
                                        "minimum": 0,
                                        "maximum": 2100,
                                    },
                                },
                            },
                        }
                    },
                    "profit_margins": {
                        "description": "Profit margins.",
                        "type": "object",
                        "properties": {
                            "profit_margins_percentage": {
                                "description": "Profit margines percentage.",
                                "type": "string",
                                "type": "number",
                                "minimum": -100,
                                "maximum": 101,
                                "multipleOf": 0.1,
                            },
                            "profit_margins_cagr_historical": {
                                "description": "The historical compound annual growth rate of profit margins.",
                                "type": "object",
                                "properties": {
                                    "profit_margins_cagr_value": {
                                        "description": "The historical compound annual growth rate of profit margins.",
                                        "type": "number",
                                        "minimum": -100,
                                        "maximum": 101,
                                        "multipleOf": 0.1,
                                    },
                                    "begin_year": {
                                        "description": "The beginning year of the historical CAGR of profit margins.",
                                        "type": "number",
                                        "minimum": 0,
                                        "maximum": 2100,
                                    },
                                    "end_year": {
                                        "description": "The ending year of the historical CAGR of profit margins.",
                                        "type": "number",
                                        "minimum": 0,
                                        "maximum": 2100,
                                    },
                                },
                            },
                        }      
                    },
                    "revenue": {
                        "description": "The annual revenue.",
                        "type": "object",
                        "properties": {
                            "revenue_dollars": {
                                "description": "The annual revenue in dollars.",
                                "type": "number",
                                "minimum": 0,
                                "maximum": 10**15,
                                "multipleOf": 1000,
                            },
                            "revenue_cagr_historical": {
                                "description": "The historical compound annual growth rate of revenue.",
                                "type": "object",
                                "properties": {
                                    "revenue_cagr_value": {
                                        "description": "The historical compound annual growth rate of revenue.",
                                        "type": "number",
                                        "minimum": -100,
                                        "maximum": 101,
                                        "multipleOf": 0.1,
                                    },
                                    "begin_year": {
                                        "description": "The beginning year of the historical CAGR of revenue.",
                                        "type": "number",
                                        "minimum": 0,
                                        "maximum": 2100,
                                    },
                                    "end_year": {
                                        "description": "The ending year of the historical CAGR of revenue.",
                                        "type": "number",
                                        "minimum": 0,
                                        "maximum": 2100,
                                    },
                                },
                            },
                            "revenue_cagr_projected": {
                                "description": "The projected compound annual growth rate of revenue.",
                                "type": "object",
                                "properties": {
                                    "revenue_cagr_value": {
                                        "description": "The projected compound annual growth rate of revenue.",
                                        "type": "number",
                                        "minimum": -100,
                                        "maximum": 101,
                                        "multipleOf": 0.1,
                                    },
                                    "begin_year": {
                                        "description": "The beginning year of the projected CAGR of revenue.",
                                        "type": "number",
                                        "minimum": 0,
                                        "maximum": 2100,
                                    },
                                    "end_year": {
                                        "description": "The ending year of the projected CAGR of revenue.",
                                        "type": "number",
                                        "minimum": 0,
                                        "maximum": 2100,
                                    },
                                },
                            },
                        }

                    },
                    "enterprises": {
                        "description": "The number of enterprise units.",
                        "type": "number",
                        "minimum": 0,
                        "maximum": 10**15,  
                    },
                    "establishments": {
                        "description": "The number of establishment units.",
                        "type": "number",
                        "minimum": 0,
                        "maximum": 10**15,  
                    },
                    "employees": {
                        "description": "The number of employee units.",
                        "type": "number",
                        "minimum": 0,
                        "maximum": 10**15,  
                    },
                    "wages": {
                        "description": "The total annual wages in dollars.",
                        "type": "number",
                        "minimum": 0,
                        "maximum": 10**15,
                    },
                    "industry_value_added": {
                        "description": "The total annual industry value added (IVA) in dollars.",
                        "type": "number",
                        "minimum": 0,
                        "maximum": 10**15,                    
                    },
                    "imports": {
                        "description": "The total annual imports in dollars.",
                        "type": "number",
                        "minimum": 0,
                        "maximum": 10**15,
                    },
                    "exports": {
                        "description": "The total annual exports in dollars.",
                        "type": "number",
                        "minimum": 0,
                        "maximum": 10**15,
                    },
                }
            },
            "executive_summary": {
                "type": "string",
                "description": "Short and concise executive summary (max 500 words)."
            },
            "current_performance": {
                "description": "Current Performance",
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "current_performance_point_title": {
                            "type": "string",
                            "description": "The title of the key point."
                        },
                        "current_performance_point_description": {
                            "type": "string",
                            "description": "The description of the key point."
                        },
                    }

                }

            },
            "future_outlook": {
                "description": "Future Outlook",
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "future_outlook_point_title": {
                            "type": "string",
                            "description": "The title of the key point."
                        },
                        "future_outlook_point_description": {
                            "type": "string",
                            "description": "The description of the key point."
                        },
                    }

                }

            },
            "industry_definition": {
                "type": "string",
                "description": "The definition of the industry."
            },
            "industry_impact": {
                "type": "object",
                "properties": {
                    "positive_impact_factors": {
                        "name": "Positive impact factors.",
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Factors with positive impact on the industry."
                    },
                    "negative_impact_factors": {
                        "name": "Negative impact factors.",
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Factors with negative impact on the industry."
                    },
                },
                "description": "Factors with impact on the industry."
            },
            "swot_analysis": {
                "type": "object",
                "description": "SWOT Analysis",
                "properties": {
                    "strengths": {
                        "name": "Strengths.",
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Strengths.",
                    },
                    "weaknesses": {
                        "name": "Weaknesses.",
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Weaknesses.",
                    },
                    "opportunities": {
                        "name": "Opportunities.",
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Opportunities.",
                    },
                    "threats": {
                        "name": "Threats.",
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Threats.",
                    },
                }
            },
            "key_trends": {
                "type": "array",
                "items": { "type": "string" },
                "description": "List of descriptions of key trends."
            },
        },
        {
            "external_drivers": {
                "type": "array",
                "name": "External drivers for supply chain",
                "items": {
                    "external_drivers_point_title": {
                        "type": "string",
                        "description": "The title of the external driver."
                    },
                    "external_drivers_point_description": {
                        "type": "string",
                        "description": "The description of the external driver."
                    },
                    "driver_cagr_historical": {
                        "type": "object",
                        "properties": {
                            "driver_cagr_value": {
                                "type": "number",
                                "description": "The historical compound annual growth rate of the external driver.",
                                "minimum": -100,
                                "maximum": 101,
                                "multipleOf": 0.1,
                            },
                            "begin_year": {
                                "type": "number",
                                "description": "The beginning year of the historical CAGR of the external driver.",
                                "minimum": 0,
                                "maximum": 2100,
                            },
                            "end_year": {
                                "type": "number",
                                "description": "The ending year of the historical CAGR of the external driver.",
                                "minimum": 0,
                                "maximum": 2100,
                            },
                        },
                    },
                    "driver_cagr_projected": {
                        "type": "object",
                        "properties": {
                            "driver_cagr_value": {
                                "type": "number",
                                "description": "The projected compound annual growth rate of the external driver.",
                                "minimum": -100,
                                "maximum": 101,
                                "multipleOf": 0.1,
                            },
                            "begin_year": {
                                "type": "number",
                                "description": "The beginning year of the projected CAGR of the external driver.",
                                "minimum": 0,
                                "maximum": 2100,
                            },
                            "end_year": {
                                "type": "number",
                                "description": "The ending year of the projected CAGR of the external driver.",
                                "minimum": 0,
                                "maximum": 2100,
                            },
                        },
                    },
                }
            },
            "supply_chain": {
                "type": "object",
                "description": "Supply Chain Related Industries",
                "properties": {
                    "tier_1_suppliers": {
                        "name": "Tier 1 suppliers",
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Tier 1 suppliers: 0-10 industry names."
                    },
                    "tier_2_suppliers": {
                        "name": "Tier 2 suppliers",
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Tier 2 suppliers: 0-10 industry names."
                    },
                    "tier_1_buyers": {
                        "name": "Tier 1 buyers",
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Tier 1 buyers: 0-10 industry names."
                    },
                    "tier_2_buyers": {
                        "name": "Tier 1 buyers",
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Tier 2 buyers: 0-10 industry names."
                    },
                }
            },
            "similar_industries": {
                "type": "array",
                "items": { "type": "string" },
                "description": "Similar Industries: 0-10 industry names."
            },
            "related_international_industries": {
                "type": "array",
                "items": { "type": "string" },
                "description": "Related International Industries: 0-10 industry names."
            },
            "products_and_services": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "product_or_service": {
                            "type": "string",
                            "description": "The full name of product or service."
                        },
                        "product_percentage": {
                            "type": "number",
                            "description": "The percentage share of the product or service.",
                            "minimum": 0,
                            "maximum": 101,
                            "multipleOf": 0.1,
                        },
                        "product_description": {
                            "type": "string",
                            "description": "Short description of product or service."
                        },
                    }
                },
                "description": "Products & Services: names and percentages of contribution of product/service to industry."
            },
            "demand_determinants": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "determinant_title": {
                            "type": "string",
                            "description": "The title of the demand determinant."
                        },
                        "determinant_description": {
                            "type": "string",
                            "description": "The description of the demand determinant."
                        },
                    }
                },
                "description": "Demand Determinants: key points related to demand determinants."
            },
            "market_segmentation": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "segment": {
                            "type": "string",
                            "description": "The name of the market segment."
                        },
                        "segment_percentage": {
                            "type": "number",
                            "description": "The percentage share of the market segment in the industry.",
                            "minimum": 0,
                            "maximum": 101,
                            "multipleOf": 0.1,
                        },
                        "segment_description": {
                            "type": "string",
                            "description": "Description of market segment and role in industry."
                        },
                    }
                },
                "description": "Market Segmentation: customer segmentation by sector – names and percentages."
            },
            "international_trade": {
                "type": "object",
                "properties": {
                    "import_level": {
                        "type": "string",
                        "enum": ["Low", "Moderate", "High", "Unknown"],
                        "description": "Imports level described in single word: Low/ Moderate/ High/ Unknown."
                    },
                    "import_trend": {
                        "type": "string",
                        "enum": ["Increasing", "Decreasing", "Steady", "Unknown"],
                        "description": "Imports trend described in single word: Increasing/ Decreasing/ Steady/ Unknown."
                    },
                    "export_level": {
                        "type": "string",
                        "enum": ["Low", "Moderate", "High", "Unknown"],
                        "description": "Exports level described in single word: Low/ Moderate/ High/ Unknown."
                    },
                     "export_trend": {
                        "type": "string",
                        "enum": ["Increasing", "Decreasing", "Steady", "Unknown"],
                        "description": "Exports trend described in single word: Increasing/ Decreasing/ Steady/ Unknown."
                    },
                    
                    "international_trade_points": {
                        "type": "array",
                        "items": {
                            "trade_title": {
                                "type": "string",
                                "description": "The title of the key point for international trade."
                            },
                            "trade_description": {
                                "type": "string",
                                "description": "The description of the key point for international trade."
                            },
                        },
                        "description": "Key points related to international trade."
                    },
                },
                "description": "Imports & Exports: Trend and short description of imports and exports."
            },
            "business_locations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The name of the business location."
                        },
                        "percentage_establishments": {
                            "type": "number",
                            "description": "The percentage share of the business location in the industry by establishments.",
                            "minimum": 0,
                            "maximum": 101,
                            "multipleOf": 0.1,
                        },
                        "percentage_population": {
                            "type": "number",
                            "description": "The percentage share of the business location in the industry by population.",
                            "minimum": 0,
                            "maximum": 101,
                            "multipleOf": 0.1,
                        },
                        "location_description": {
                            "type": "string",
                            "description": "Description of business location."
                        },
                    }
                }, 
            }
        },
        {
            "basis_of_competition": {
                "type": "object",
                "properties": {
                    "basis_level": {
                        "type": "string",
                        "enum": ["Low", "Moderate", "High", "Unknown"],
                        "description": "Basis of competition level described in single word: Low/ Moderate/ High/ Unknown."
                    },
                    "basis_trend": {
                        "type": "string",
                        "enum": ["Increasing", "Decreasing", "Steady", "Unknown"],
                        "description": "Basis of competition trend described in single word: Increasing/ Decreasing/ Steady/ Unknown."
                    },
                    "basis_points": {
                        "type": "array",
                        "items": {
                            "basis_title": {
                                "type": "string",
                                "description": "The title of the key point for basis of competition."
                            },
                            "basis_description": {
                                "type": "string",
                                "description": "The description of the key point for basis of competition."
                            },
                        },
                        "description": "Key points related to basis of competition."
                    },
                },
                "description": "Basis of Competition: Trend and key points related to basis of competition."
            },
            "barriers_to_entry": {
                "type": "object",
                "properties": {
                    "barriers_level": {
                        "type": "string",
                        "enum": ["Low", "Moderate", "High", "Unknown"],
                        "description": "Barriers to entry level described in single word: Low/ Moderate/ High/ Unknown."
                    },
                     "barriers_trend": {
                        "type": "string",
                        "enum": ["Increasing", "Decreasing", "Steady", "Unknown"],
                        "description": "Barriers to entry trend described in single word: Increasing/ Decreasing/ Steady/ Unknown."
                    },
                    "factors_increased_barrier": {
                        "name": "Factors responsible for increased barriers to entry.",
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Short descriptions of factors responsible for increased barriers to entry."
                    },
                    "factors_decreased_barrier": {
                        "name": "Factors responsible for decreased barriers to entry.",
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "Short descriptions of factors responsible for decreased barriers to entry."
                    },
                    "barriers_points": {
                        "name": "Key points related to barriers to entry.",
                        "type": "array",
                        "items": {
                            "barrier_title": {
                                "type": "string",
                                "description": "The title of the key point for barrier to entry."
                            },
                            "barrier_description": {
                                "type": "string",
                                "description": "The description of the key point for barrier to entry."
                            },
                        },
                        "description": "Key points related to barriers to entry."
                    },
                },
                "description": "Barriers to entry: Trend and short description of factors for increased/ decreased barriers to entry."
            },
            "market_share_concentration": {
                "type": "object",
                "properties": {
                    "concentration_level": {
                        "type": "string",
                        "enum": ["Low", "Moderate", "High", "Unknown"],
                        "description": "Market share concentration level described in single word: Low/ Moderate/ High/ Unknown."
                    },
                    "concentration_trend": {
                        "type": "string",
                        "enum": ["Increasing", "Decreasing", "Steady", "Unknown"],
                        "description": "Market share concentration trend described in single word: Increasing/ Decreasing/ Steady/ Unknown."
                    },
                    "concentration_points": {
                        "type": "array",
                        "items": {
                            "concentration_title": {
                                "type": "string",
                                "description": "The title of the market share concentration key point."
                            },
                            "concentration_description": {
                                "type": "string",
                                "description": "The description of the market share concentration key point."
                            },
                        },
                        "description": "Key points related to market share concentration."
                    },
                    "top_companies": {
                        "name": "Top companies.",
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "company_name": {
                                    "type": "string",
                                    "description": "The full name of the company."
                                },
                                "company_percentage": {
                                    "type": "number",
                                    "description": "The percentage of the company share.",
                                    "minimum": 0,
                                    "maximum": 101,
                                    "multipleOf": 0.1,
                                },
                            }

                        },
                        "description": "Top companies and their shares."
                    },
                },
                "description": "Market Share Concentration: Level and top companies."
            },
            
        },
        {
            "cost_structure_breakdown": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "cost_type": {
                            "type": "string",
                            "description": "The type of cost."
                        },
                        "cost_type_percentage": {
                            "type": "number",
                            "description": "The percentage of the cost in total costs.",
                            "minimum": 0,
                            "maximum": 101,
                            "multipleOf": 0.1,
                        },
                    }
                },
                "description": "Cost Structure Breakdown: names and percentages of cost types."
            },
            "cost_factors": {
                "type": "array",
                "items": {
                    "cost_factor_title": {
                        "type": "string",
                        "description": "The title of the cost factor."
                    },
                    "cost_factor_description": {
                        "type": "string",
                        "description": "The description of the cost factor."
                    },
                },
                "description": "Cost Factors: key points related to cost factors."
            },
            "capital_intensity": {
                "type": "object",
                "properties": {
                    "capital_intensity_level": {
                        "type": "string",
                        "enum": ["Low", "Moderate", "High", "Unknown"],
                        "description": "Capital intensity level described in single word: Low/ Moderate/ High/ Unknown."
                    },
                    "capital_intensity_trend": {
                        "type": "string",
                        "enum": ["Increasing", "Decreasing", "Steady", "Unknown"],
                        "description": "Capital intensity trend described in single word: Increasing/ Decreasing/ Steady/ Unknown."
                    },
                    "capital_intensity_points": {
                        "type": "array",
                        "items": { 
                            "capital_intensity_title": {
                                "type": "string",
                                "description": "The title of the capital intensity key point."
                            },
                            "capital_intensity_description": {
                                "type": "string",
                                "description": "The description of the capital intensity key point."
                            },
                        },
                        "description": "Key points related to capital intensity."
                    },
                },
                "description": "Capital Intensity: Level and key points related to capital intensity."
            },
            "revenue_volatility": {
                "type": "object",
                "properties": {
                    "volatility_level": {
                        "type": "string",
                        "enum": ["Low", "Moderate", "High", "Unknown"],
                        "description": "Revenue volatility level described in single word: Low/ Moderate/ High/ Unknown."
                    },
                    "volatility_trend": {
                        "type": "string",
                        "enum": ["Increasing", "Decreasing", "Steady", "Unknown"],
                        "description": "Revenue volatility trend described in single word: Increasing/ Decreasing/ Steady/ Unknown."
                    },
                    "volatility_points": {
                        "type": "array",
                        "items": { 
                            "volatility_title": {
                                "type": "string",
                                "description": "The title of the revenue volatility key point."
                            },
                            "volatility_description": {
                                "type": "string",
                                "description": "The description of the revenue volatility key point."
                            },
                        },
                        "description": "Key points related to revenue volatility."
                    },
                },
                "description": "Revenue Volatility: Level and key points related to revenue volatility."
            },
            "technological_change": {
                "type": "object",
                "properties": {
                    "technological_change_level": {
                        "type": "string",
                        "enum": ["Low", "Moderate", "High", "Unknown"],
                        "description": "Technological change level described in single word: Low/ Moderate/ High/ Unknown."
                    },
                    "technological_change_trend": {
                        "type": "string",
                        "enum": ["Increasing", "Decreasing", "Steady", "Unknown"],
                        "description": "Technological change trend described in single word: Increasing/ Decreasing/ Steady/ Unknown."
                    },
                    "technological_change_points": {
                        "type": "array",
                        "items": { 
                            "technological_change_title": {
                                "type": "string",
                                "description": "The title of the technological change key point."
                            },
                            "technological_change_description": {
                                "type": "string",
                                "description": "The description of the technological change key point."
                            },
                        },
                        "description": "Key points related to technological change."
                    },
                },
                "description": "Technological Change: Level and key points related to technological change."
            },
            "regulations_and_policies": {
                "type": "object",
                "properties": {
                    "regulations_level": {
                        "type": "string",
                        "enum": ["Low", "Moderate", "High", "Unknown"],
                        "description": "Regulations level described in single word: Low/ Moderate/ High/ Unknown."
                    },
                    "regulations_trend": {
                        "type": "string",
                        "enum": ["Increasing", "Decreasing", "Steady", "Unknown"],
                        "description": "Regulations trend described in single word: Increasing/ Decreasing/ Steady/ Unknown."
                    },
                    "regulations_points": {
                        "type": "array",
                        "items": {
                            "regulation_title": {
                                "type": "string",
                                "description": "The title of the regulation."
                            },
                            "regulation_description": {
                                "type": "string",
                                "description": "The description of the regulation."
                            },
                        },
                        "description": "Key points related to regulations."
                    },
                },
                "description": "Regulations: Level and key points related to regulations."
            },
            "industry_assistance": {
                "type": "object",
                "properties": {
                    "assistance_level": {
                        "type": "string",
                        "enum": ["Low", "Moderate", "High", "Unknown"],
                        "description": "Industry assistance level described in single word: Low/ Moderate/ High/ Unknown."
                    },
                    "assistance_trend": {
                        "type": "string",
                        "enum": ["Increasing", "Decreasing", "Steady", "Unknown"],
                        "description": "Industry assistance trend described in single word: Increasing/ Decreasing/ Steady/ Unknown."
                    },
                    "assistance_points": {
                        "type": "array",
                        "items": {
                            "assistance_title": {
                                "type": "string",
                                "description": "The title of the industry assistance."
                            },
                            "assistance_description": {
                                "type": "string",
                                "description": "The description of the industry assistance."
                            },
                        },
                        "description": "Key points related to industry assistance."
                    },
                },
                "description": "Industry Assistance: Level and key points related to industry assistance."
            }           
        },
        {
            "FAQs": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {
                            "type": "string",
                            "description": "The question."
                        },
                        "answer": {
                            "type": "string",
                            "description": "The answer."
                        },
                    }
                },
                "description": "FAQs: Frequently asked questions and answers about the industry."
            },
        }
    ]
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
