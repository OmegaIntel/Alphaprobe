"""A few utils helpful for loading."""

def new_lines_to_list(obj: object) -> object:
    """Replaces new lines with lists in strings"""
    assert type(obj) in (dict, list)

    if isinstance(obj, dict):
        key_vals = list(obj.items())
    else:
        key_vals = list(enumerate(obj))
    for k, v in key_vals:
        if isinstance(v, str):
            if '\n' in v:
                arr = v.split('\n')
                obj[k] = arr
        elif type(v) in (dict, list):
            obj[k] = new_lines_to_list(v)
    return obj


if __name__ == '__main__':
    dd = {
  "source": "IBIS",
  "type": "Industry research",
  "subtype": "Industry at a Glance",
  "industry_name": "Household Furniture Manufacturing",
  "last_updated": "2023-12-13T00:00:00+00:00",
  "industry_summary": {
    "executive_summary": "The household furniture manufacturing industry has faced significant challenges in recent years due to the COVID-19 pandemic, supply chain disruptions, and changing consumer preferences. The industry experienced a boom in sales during the early stages of the pandemic as consumers had higher disposable income and low interest rates supported the residential market. However, high inflation and rising interest rates have since caused the residential sector to slow down, negatively impacting furniture sales. Manufacturers also face intense competition from foreign producers with lower operating costs, leading to substantial price competition and import penetration.",
    "key_statistics": {
      "historical_revenue_growth_percentage": -2.54,
      "profit_margins_percentage": 3.1,
      "projected_revenue_growth_percentage": 0.42,
      "revenue_dollars": 23511000000
    },
    "current_performance": {
      "revenue_dollars_2023": 23511000000,
      "profit_percentage_2023": 3.1,
      "establishments_count_2023": 4092,
      "enterprises_count_2023": 3929,
      "employment_count_2023": 125805,
      "exports_dollars_2023": 3140000000,
      "imports_dollars_2023": 42219000000,
      "wages_dollars_2023": 5694000000,
      "domestic_demand_dollars_2023": 62590000000,
      "historical_revenue_growth_percentage_2005_2023": -2.54,
      "historical_profit_margin_growth_percentage_2005_2023": 0.98,
      "import_penetration_percentage_2023": 67
    },
    "future_outlook": {
      "projected_revenue_growth_percentage_2023_2029": 0.42,
      "projected_employment_growth_percentage_2023_2029": 0.25
    },
    "industry_definition": "The industry manufactures a range of furniture for personal, household and public use. Furniture may be made on a stock or custom basis and may be sold assembled or unassembled.",
    "swot_analysis": {
      "strengths": "Low customer class concentration. Low capital requirements.",
      "weaknesses": "Low & steady level of assistance. High competition. Decline life cycle stage. High imports. Low profit vs sector average. High product/service concentration. Low revenue per employee.",
      "opportunities": "High revenue growth (2023-2028). High performance drivers: Per capita disposable income.",
      "threats": "Very low revenue growth (2005-2023). Low revenue growth (2018-2023). Low outlier growth. Import penetration into the manufacturing sector."
    },
    "key_trends": "- Prominent import penetration harms domestic manufacturers as lower production costs overseas enable foreign producers to offer more affordable furniture.\n- Losses in the residential market amid elevated inflation and high interest rates result in falling revenue as consumers postpone large purchases.\n- The expected depreciation of the US dollar is likely to boost revenue growth by making domestic furniture more affordable, although growth will be slow due to unfavorable economic conditions.\n- Housing starts and existing home sales fall amid macroeconomic conditions, harming manufacturers as consumers tend to purchase new furniture when moving.\n- Manufacturers face various environmental regulations that increase operating costs.",
    "market_segmentation": [
      {
        "segment": "Home furnishing stores",
        "percentage": 42.8
      },
      {
        "segment": "Other retailers",
        "percentage": 19.0
      },
      {
        "segment": "Businesses",
        "percentage": 13.4
      },
      {
        "segment": "Other",
        "percentage": 9.8
      },
      {
        "segment": "Independent wholesalers",
        "percentage": 8.7
      },
      {
        "segment": "Department stores and warehouse clubs",
        "percentage": 5.8
      }
    ],
    "products_and_services": [
      {
        "product_or_service": "Upholstered household furniture",
        "percentage": 52.4
      },
      {
        "product_or_service": "Institutional furniture",
        "percentage": 17.9
      },
      {
        "product_or_service": "Non-upholstered wood household furniture",
        "percentage": 13.6
      },
      {
        "product_or_service": "Metal household furniture",
        "percentage": 10.8
      },
      {
        "product_or_service": "Other",
        "percentage": 5.3
      }
    ],
    "supply_chain": {
      "tier_2_suppliers": [
        "Sawmills & Wood Production in the US",
        "Wood Paneling Manufacturing in the US",
        "Hardware Manufacturing in the US",
        "Adhesive Manufacturing in the US"
      ],
      "tier_1_suppliers": [
        "Electric Power Transmission in the US",
        "Industrial Machinery & Equipment Wholesaling in the US"
      ],
      "tier_1_buyers": [
        "Furniture Stores in the US",
        "Furniture Wholesaling in the US"
      ],
      "tier_2_buyers": [
        "Home Improvement Stores in the US",
        "Warehouse Clubs & Supercenters in the US",
        "Home Furnishings Stores in the US",
        "Department Stores in the US"
      ]
    },
    "historical_revenue_dollars": 23511000000,
    "projected_revenue_growth_percentage": 0.42,
    "historical_revenue_growth_percentage": -3.27,
    "establishments_count": 4092,
    "enterprises_count": 3929,
    "employment_count": 125805,
    "exports_dollars": 3140000000,
    "imports_dollars": 42219000000,
    "wages_dollars": 5694000000,
    "domestic_demand_dollars": 62590000000,
    "profit_margin_percentage": 3.1,
    "country_name": "United States",
    "industry_name": "Household Furniture Manufacturing",
    "last_updated": "Dec 13, 2023",
    "major_players": [
      "Ashley Furniture Industries, Inc.",
      "La-Z-Boy Incorporated",
      "Ameriwood Home",
      "Brown Jordan International Inc.",
      "Sauder Woodworking Co.",
      "Apex Tool Group, Llc"
    ],
    "competitive_landscape": "The industry faces high competition and high import penetration. Domestic producers struggle to compete with lower production costs overseas, enabling foreign producers to capture a large portion of domestic demand. Major manufacturers have resorted to offshoring manufacturing capabilities, acquiring other producers, and focusing on high-end and value-added products to remain competitive.",
    "costs_and_operations": "The industry has low capital intensity and relies heavily on human labor. Purchase costs have been volatile due to fluctuations in input prices like lumber and steel. Wage costs are significant given the labor-intensive nature of production. Other major costs include research and development, freight, and trade expenses.",
    "related_international_industries": [
      "Wooden Furniture and Upholstered Seat Manufacturing in Australia",
      "Metal Furniture Manufacturing in Australia",
      "Wicker and Fibreglass Furniture Manufacturing in Australia",
      "Wood Furniture Manufacturing in China",
      "Metal Furniture Manufacturing in China",
      "Kitchen Furniture Manufacturing in the UK",
      "Household Furniture Manufacturing in Canada"
    ]
  }
}

    # new_lines_to_list
    print(dd['industry_summary']['key_trends'])
    res = new_lines_to_list(dd)
    print(res['industry_summary']['key_trends'])
