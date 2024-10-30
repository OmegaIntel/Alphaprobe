from copy import deepcopy
from typing import Dict, List


report_order = [
    {"Name": "Industry Overview", "Contents": [
        {"Name": "", "Key": "report_title"},
        {"Name": "Key Statistics", "Key": "key_statistics", "Contents": [
            {"Name": "Profit", "Key": "profit"},
            {"Name": "Profit Margins", "Key": "profit_margins"},
            {"Name": "Revenue", "Key": "revenue"},
            {"Name": "Enterprises", "Key": "enterprises"},
            {"Name": "Establishments", "Key": "establishments"},
            {"Name": "Employees", "Key": "employees"},
            {"Name": "Wages", "Key": "wages"},
            {"Name": "Industry Value Added (IVA)", "Key": "industry_value_added"},
            {"Name": "Imports", "Key": "imports"},
            {"Name": "Exports", "Key": "exports"}
        ]},
        {"Name": "Executive Summary", "Key": "executive_summary"},
        {"Name": "Current Performance", "Key": "current_performance"},
        {"Name": "Future Outlook", "Key": "future_outlook"},
        {"Name": "Industry Definition", "Key": "industry_definition"},
        {"Name": "Industry Impact", "Key": "industry_impact"},
        {"Name": "SWOT Analysis", "Key": "swot_analysis", "Contents": [
            {"Name": "Strengths", "Key": "strengths"},
            {"Name": "Weaknesses", "Key": "weaknesses"},
            {"Name": "Opportunities", "Key": "opportunities"},
            {"Name": "Threats", "Key": "threats"}
        ]},
        {"Name": "Key Trends", "Key": "key_trends"}
    ]},
    {"Name": "Supply Chain", "Contents": [
        {"Name": "External Drivers for Supply Chain", "Key": "external_drivers"},
        {"Name": "Supply Chain Related Industries", "Key": "supply_chain", "Contents": [
            {"Name": "Tier 1 Suppliers", "Key": "tier_1_suppliers"},
            {"Name": "Tier 2 Suppliers", "Key": "tier_2_suppliers"},
            {"Name": "Tier 1 Buyers", "Key": "tier_1_buyers"},
            {"Name": "Tier 2 Buyers", "Key": "tier_2_buyers"}
        ]},
        {"Name": "Similar Industries", "Key": "similar_industries"},
        {"Name": "Related International Industries", "Key": "related_international_industries"},
        {"Name": "Products & Services", "Key": "products_and_services"},
        {"Name": "Demand Determinants", "Key": "demand_determinants"},
        {"Name": "Market Segmentation", "Key": "market_segmentation"},
        {"Name": "International Trade", "Key": "international_trade"},
        {"Name": "Business Locations", "Key": "business_locations"}
    ]},
    {"Name": "Competitive Landscape", "Contents": [
        {"Name": "Basis of Competition", "Key": "basis_of_competition"},
        {"Name": "Barriers to Entry", "Key": "barriers_to_entry"},
        {"Name": "Market Share Concentration", "Key": "market_share_concentration"}
    ]},
    {"Name": "Cost & Operations", "Contents": [
        {"Name": "Cost Structure Breakdown", "Key": "cost_structure_breakdown"},
        {"Name": "Cost Factors", "Key": "cost_factors"},
        {"Name": "Capital Intensity", "Key": "capital_intensity"},
        {"Name": "Revenue Volatility", "Key": "revenue_volatility"},
        {"Name": "Technological Change", "Key": "technological_change"},
        {"Name": "Regulations & Policies", "Key": "regulations_and_policies"},
        {"Name": "Industry Assistance", "Key": "industry_assistance"}
    ]},  
]


def convert_dollars_to_readable(dollars: int) -> str:
    """Convert dollars to a readable format"""
    if dollars < 10**3:
        return f"${dollars}"
    elif dollars < 10**6:
        return f"${dollars/10**3}K"
    elif dollars < 10**9:
        return f"${dollars/10**6}M"
    elif dollars < 10**12:
        return f"${dollars/10**9}B"
    else:
        return f"${dollars/10**12}T"

def build_current_performance(current_performance: List) -> str:
    """Return a markdown report """
    report = ""
    if len(current_performance) == 0:
        return report
    for point in current_performance:
        report += f"""
        - **{point['current_performance_point_title']}**
            - {point['current_performance_point_description']}
        """
    return report

def build_future_outlook(future_outlook: List) -> str:
    """Return a markdown report """
    report = ""
    if len(future_outlook) == 0:
        return report
    for point in future_outlook:
        report += f"""
        - **{point['future_outlook_point_title']}**
            - {point['future_outlook_point_description']}
        """
    return report

def build_impact(industry_impact: Dict) -> str:
    """Return a markdown report """
    report = ""
    if len(industry_impact['positive_impact_factors']) > 0:
        report += f"""
    - **Positive Impact Factors**
    """
    for factor in industry_impact['positive_impact_factors']:
        report += f"""
        - {factor}
        """
    if len(industry_impact['negative_impact_factors']) > 0:
        report += f"""
        - **Negative Impact Factors**
        """
    for factor in industry_impact['negative_impact_factors']:
        report += f"""
        - {factor}
        """
    return report

def build_swot_analysis(swot_analysis: Dict) -> str:
    """Return a markdown report """
    report = ""
    if len(swot_analysis['strengths']) > 0:
        report += f"""
    - **Strengths**
    """
    for factor in swot_analysis['strengths']:
        report += f"""
        - {factor}
        """
    if len(swot_analysis['weaknesses']) > 0:
        report += f"""
    - **Weaknesses**
    """
    for factor in swot_analysis['weaknesses']:
        report += f"""
        - {factor}
        """
    if len(swot_analysis['opportunities']) > 0:
        report += f"""
    - **Opportunities**
    """
    for factor in swot_analysis['opportunities']:
        report += f"""
        - {factor}
        """
    if len(swot_analysis['threats']) > 0:
        report += f"""
    - **Threats**
    """
    for factor in swot_analysis['threats']:
        report += f"""
        - {factor}
        """
    return report

def build_key_trends(key_trends: List) -> str:
    """Return a markdown report """
    if len(key_trends) == 0:
        return ""
    report = ""
    for trend in key_trends:
        report += f"""
        - {trend}
        """
    return report

def build_external_drivers(external_drivers: List) -> str:
    """Return a markdown report """
    if len(external_drivers) == 0:
        return ""
    report = ""
    for driver in external_drivers:
        report += f"""
        - **{driver['external_drivers_point_title']}**
            - {driver['external_drivers_point_description']}
            - **Historical CAGR:** {driver['driver_cagr_historical']['driver_cagr_value']}% ({driver['driver_cagr_historical']['begin_year']} - {driver['driver_cagr_historical']['end_year']})
            - **Projected CAGR:** {driver['driver_cagr_projected']['driver_cagr_value']}% ({driver['driver_cagr_projected']['begin_year']} - {driver['driver_cagr_projected']['end_year']})
        """
    return report

def build_related_industries(supply_chain: Dict) -> str:
    """Return a markdown report """
    report = ""
    if len(supply_chain['tier_1_suppliers']) > 0:
        report += f"""
    - **Tier 1 Suppliers**
    """
    for supplier in supply_chain['tier_1_suppliers']:
        report += f"""
        - {supplier}
        """
    if len(supply_chain['tier_2_suppliers']) > 0:
        report += f"""
    - **Tier 2 Suppliers**
    """
    for supplier in supply_chain['tier_2_suppliers']:
        report += f"""
        - {supplier}
        """
    if len(supply_chain['tier_1_buyers']) > 0:
        report += f"""
    - **Tier 1 Buyers**
    """
    for buyer in supply_chain['tier_1_buyers']:
        report += f"""
        - {buyer}
        """
    if len(supply_chain['tier_2_buyers']) > 0:
        report += f"""
    - **Tier 2 Buyers**
    """
    for buyer in supply_chain['tier_2_buyers']:
        report += f"""
        - {buyer}
        """
    return report

def build_similar_industries(similar_industries: List) -> str:
    """Return a markdown report """
    if len(similar_industries) == 0:
        return ""
    report = ""
    for industry in similar_industries:
        report += f"""
        - {industry}
        """
    return report

def build_related_international_industries(related_international_industries: List) -> str:
    """Return a markdown report """
    if len(related_international_industries) == 0:
        return ""
    report = ""
    for industry in related_international_industries:
        report += f"""
        - {industry}
        """
    return report

def build_products_and_services(products_and_services: List) -> str:
    """Return a markdown report """
    if len(products_and_services) == 0:
        return ""
    report = ""
    for product in products_and_services:
        report += f"""
        - **{product['product_or_service']}**
            - **Percentage:** {product['product_percentage']}%
            - {product['product_description']}
        """
    return report

def build_demand_determinants(demand_determinants: List) -> str:
    """Return a markdown report """
    if len(demand_determinants) == 0:
        return ""
    report = ""
    for determinant in demand_determinants:
        report += f"""
        - **{determinant['determinant_title']}**
            - {determinant['determinant_description']}
        """
    return report

def build_market_segmentation(market_segmentation: List) -> str:
    """Return a markdown report """
    if len(market_segmentation) == 0:
        return ""
    report = ""
    for segment in market_segmentation:
        report += f"""
        - **{segment['segment']}**
            - **Percentage:** {segment['segment_percentage']}%
            - {segment['segment_description']}
        """
    return report

def build_international_trade(international_trade: Dict) -> str:
    """Return a markdown report """
    report = f"""
    - **Imports**
        - **Level:** {international_trade['import_level']}
        - **Trend:** {international_trade['import_trend']}
    - **Exports**
        - **Level:** {international_trade['export_level']}
        - **Trend:** {international_trade['export_trend']}
    """
    if len(international_trade['international_trade_points']) > 0:
        report += f"""
    - **Key Points**
    """
    for point in international_trade['international_trade_points']:
        report += f"""
        - **{point['trade_title']}**
            - {point['trade_description']}
        """
    return report

def build_business_locations(business_locations: List) -> str:
    """Return a markdown report """
    if len(business_locations) == 0:
        return ""
    report = ""
    for location in business_locations:
        report += f"""
        - **{location['location']}**
            - **Percentage Establishments:** {location['percentage_establishments']}%
            - **Percentage Population:** {location['percentage_population']}%
            - {location['location_description']}
        """
    return report

def build_basis_of_competition(basis_of_competition: Dict) -> str:
    """Return a markdown report """
    report = f"""
    - **Level:** {basis_of_competition['basis_level']}
    - **Trend:** {basis_of_competition['basis_trend']}
    """
    if len(basis_of_competition['basis_points']) > 0:
        report += f"""
    - **Key Points**
    """
    for point in basis_of_competition['basis_points']:
        report += f"""
        - **{point['basis_title']}**
            - {point['basis_description']}
        """
    return report

def build_barriers_to_entry(barriers_to_entry: Dict) -> str:
    """Return a markdown report """
    report = f"""
    - **Level:** {barriers_to_entry['barriers_level']}
    - **Trend:** {barriers_to_entry['barriers_trend']}
    """
    if len(barriers_to_entry['factors_increased_barrier']) > 0:
        report += f"""
    - **Factors Responsible for Increased Barriers**
    """
    for factor in barriers_to_entry['factors_increased_barrier']:
        report += f"""
        - {factor}
        """
    if len(barriers_to_entry['factors_decreased_barrier']) > 0:
        report += f"""
    - **Factors Responsible for Decreased Barriers**
    """
    for factor in barriers_to_entry['factors_decreased_barrier']:
        report += f"""
        - {factor}
        """
    if len(barriers_to_entry['barriers_points']) > 0:
        report += f"""
    - **Key Points**
    """
    for point in barriers_to_entry['barriers_points']:
        report += f"""
        - **{point['barrier_title']}**
            - {point['barrier_description']}
        """
    return report

def build_market_share_concentration(market_share_concentration: Dict) -> str:
    """Return a markdown report """
    report = f"""
    - **Level:** {market_share_concentration['concentration_level']}
    - **Trend:** {market_share_concentration['concentration_trend']}
    """
    if len(market_share_concentration['concentration_points']) > 0:
        report += f"""
    - **Key Points**
    """
    for point in market_share_concentration['concentration_points']:
        report += f"""
        - **{point['concentration_title']}**
            - {point['concentration_description']}
        """
    if len(market_share_concentration['top_companies']) > 0:
        report += f"""
    - **Top Companies**
    """
    for company in market_share_concentration['top_companies']:
        report += f"""
        - **{company['company_name']}**
            - **Percentage:** {company['company_percentage']}%
        """
    return report

def build_cost_structure_breakdown(cost_structure_breakdown: List) -> str:
    """Return a markdown report """
    if len(cost_structure_breakdown) == 0:
        return ""
    report = ""
    for cost in cost_structure_breakdown:
        report += f"""
        - **{cost['cost_type']}**
            - **Percentage:** {cost['cost_type_percentage']}%
        """
    return report

def build_cost_factors(cost_factors: List) -> str:
    """Return a markdown report """
    if len(cost_factors) == 0:
        return ""
    report = ""
    for factor in cost_factors:
        report += f"""
        - **{factor['cost_factor_title']}**
            - {factor['cost_factor_description']}
        """
    return report

def build_capital_intensity(capital_intensity: Dict) -> str:
    """Return a markdown report """
    report = f"""
    - **Level:** {capital_intensity['capital_intensity_level']}
    - **Trend:** {capital_intensity['capital_intensity_trend']}
    """
    if len(capital_intensity['capital_intensity_points']) > 0:
        report += f"""
    - **Key Points**
    """
    for point in capital_intensity['capital_intensity_points']:
        report += f"""
        - **{point['capital_intensity_title']}**
            - {point['capital_intensity_description']}
        """
    return report

def build_revenue_volatility(revenue_volatility: Dict) -> str:
    """Return a markdown report """
    report = f"""
    - **Level:** {revenue_volatility['volatility_level']}
    - **Trend:** {revenue_volatility['volatility_trend']}
    """
    if len(revenue_volatility['volatility_points']) > 0:
        report += f"""
    - **Key Points**
    """
    for point in revenue_volatility['volatility_points']:
        report += f"""
        - **{point['volatility_title']}**
            - {point['volatility_description']}
        """
    return report

def build_technological_change(technological_change: Dict) -> str:
    """Return a markdown report """
    report = f"""
    - **Level:** {technological_change['technological_change_level']}
    - **Trend:** {technological_change['technological_change_trend']}
    """
    if len(technological_change['technological_change_points']) > 0:
        report += f"""
    - **Key Points**
    """
    for point in technological_change['technological_change_points']:
        report += f"""
        - **{point['technological_change_title']}**
            - {point['technological_change_description']}
        """
    return report

def build_regulations_and_policies(regulations_and_policies: Dict) -> str:
    """Return a markdown report """
    report = f"""
    - **Level:** {regulations_and_policies['regulations_level']}
    - **Trend:** {regulations_and_policies['regulations_trend']}
    """
    if len(regulations_and_policies['regulations_points']) > 0:
        report += f"""
    - **Key Points**
    """
    for point in regulations_and_policies['regulations_points']:
        report += f"""
        - **{point['regulation_title']}**
            - {point['regulation_description']}
        """
    return report

def build_industry_assistance(industry_assistance: Dict) -> str:
    """Return a markdown report """
    report = f"""
    - **Level:** {industry_assistance['assistance_level']}
    - **Trend:** {industry_assistance['assistance_trend']}
    """
    if len(industry_assistance['assistance_points']) > 0:
        report += f"""
    - **Key Points**
    """
    for point in industry_assistance['assistance_points']:
        report += f"""
        - **{point['assistance_title']}**
            - {point['assistance_description']}
        """
    return report

def build_faqs(FAQs: List) -> str:
    """Return a markdown report """
    if len(FAQs) == 0:
        return ""
    report = ""
    for faq in FAQs:
        report += f"""
        - **Q:** {faq['question']}
            - **A:** {faq['answer']}
        """
    return report


def build_markdown_report_func(section_responses: List) -> str:
    """Return a markdown report """
    report = f"""
    # {section_responses[0]['report_title']}
    Last Updated: {section_responses[0]['report_date']}

    ## Industry Overview
    ### Key Statistics
    - **Profit**
        - **Annual Profit:** {convert_dollars_to_readable(section_responses[0]['key_statistics']['profit']['profit_dollars'])}
        - **Historical CAGR of Profit:** {section_responses[0]['key_statistics']['profit']['profit_cagr_historical']['profit_cagr_value']}% ({section_responses[0]['key_statistics']['profit']['profit_cagr_historical']['begin_year']} - {section_responses[0]['key_statistics']['profit']['profit_cagr_historical']['end_year']})
    - **Profit Margins**
        - **Profit Margins:** {section_responses[0]['key_statistics']['profit_margins']['profit_margins_percentage']}%
        - **Historical CAGR of Profit Margins:** {section_responses[0]['key_statistics']['profit_margins']['profit_margins_cagr_historical']['profit_margins_cagr_value']}% ({section_responses[0]['key_statistics']['profit_margins']['profit_margins_cagr_historical']['begin_year']} - {section_responses[0]['key_statistics']['profit_margins']['profit_margins_cagr_historical']['end_year']})
    - **Revenue**
        - **Annual Revenue:** {convert_dollars_to_readable(section_responses[0]['key_statistics']['revenue']['revenue_dollars'])}
        - **Historical CAGR of Revenue:** {section_responses[0]['key_statistics']['revenue']['revenue_cagr_historical']['revenue_cagr_value']}% ({section_responses[0]['key_statistics']['revenue']['revenue_cagr_historical']['begin_year']} - {section_responses[0]['key_statistics']['revenue']['revenue_cagr_historical']['end_year']})
        - **Projected CAGR of Revenue:** {section_responses[0]['key_statistics']['revenue']['revenue_cagr_projected']['revenue_cagr_value']}% ({section_responses[0]['key_statistics']['revenue']['revenue_cagr_projected']['begin_year']} - {section_responses[0]['key_statistics']['revenue']['revenue_cagr_projected']['end_year']})
    - **Enterprises:** {section_responses[0]['key_statistics']['enterprises']}
    - **Establishments:** {section_responses[0]['key_statistics']['establishments']}
    - **Employees:** {section_responses[0]['key_statistics']['employees']}
    - **Wages:** {convert_dollars_to_readable(section_responses[0]['key_statistics']['wages'])}
    - **Industry Value Added (IVA):** {convert_dollars_to_readable(section_responses[0]['key_statistics']['industry_value_added'])}
    - **Imports:** {convert_dollars_to_readable(section_responses[0]['key_statistics']['imports'])}
    - **Exports:** {convert_dollars_to_readable(section_responses[0]['key_statistics']['exports'])}

    ### Executive Summary
    {section_responses[0]['executive_summary']}
    
    ### Current Performance
    {build_current_performance(section_responses[0]['current_performance'])}

    ### Future Outlook
    {build_future_outlook(section_responses[0]['future_outlook'])}

    ### Industry Definition
    {section_responses[0]['industry_definition']}  

    ### Industry Impact
    {build_impact(section_responses[0]['industry_impact'])}

    ### SWOT Analysis
    {build_swot_analysis(section_responses[0]['swot_analysis'])}

    ### Key Trends
    {build_key_trends(section_responses[0]['key_trends'])}

    ## Supply Chain
    ### External Drivers for Supply Chain
    {build_external_drivers(section_responses[1]['external_drivers'])}

    ### Supply Chain Related Industries
    {build_related_industries(section_responses[1]['supply_chain'])}

    ### Similar Industries
    {build_similar_industries(section_responses[1]['similar_industries'])}

    ### Related International Industries
    {build_related_international_industries(section_responses[1]['related_international_industries'])}

    ### Products & Services
    {build_products_and_services(section_responses[1]['products_and_services'])}

    ### Demand Determinants
    {build_demand_determinants(section_responses[1]['demand_determinants'])}

    ### Market Segmentation
    {build_market_segmentation(section_responses[1]['market_segmentation'])}

    ### International Trade
    {build_international_trade(section_responses[1]['international_trade'])}

    ### Business Locations
    {build_business_locations(section_responses[1]['business_locations'])}

    ## Competitive Landscape
    
    ### Basis of Competition
    {build_basis_of_competition(section_responses[2]['basis_of_competition'])}

    ### Barriers to Entry
    {build_barriers_to_entry(section_responses[2]['barriers_to_entry'])}

    ### Market Share Concentration
    {build_market_share_concentration(section_responses[2]['market_share_concentration'])}

    ## Cost & Operations

    ### Cost Structure Breakdown
    {build_cost_structure_breakdown(section_responses[3]['cost_structure_breakdown'])}

    ### Cost Factors
    {build_cost_factors(section_responses[3]['cost_factors'])}

    ### Capital Intensity
    {build_capital_intensity(section_responses[3]['capital_intensity'])}

    ### Revenue Volatility
    {build_revenue_volatility(section_responses[3]['revenue_volatility'])}

    ### Technological Change
    {build_technological_change(section_responses[3]['technological_change'])}

    ### Regulations & Policies
    {build_regulations_and_policies(section_responses[3]['regulations_and_policies'])}

    ### Industry Assistance
    {build_industry_assistance(section_responses[3]['industry_assistance'])}

    ## FAQs
    {build_faqs(section_responses[4]['FAQs'])}
    """
    return report

    





