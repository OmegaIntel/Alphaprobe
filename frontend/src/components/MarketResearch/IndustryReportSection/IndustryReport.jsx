import React from "react";
import { useSelector } from "react-redux";
import ReportDropdown from "./ReportDropdown"; // Adjust the import path if necessary


const YourComponent = () => {
  const industryState = useSelector((state) => state);
  const summaryData = useSelector((state) => state.industry.summaryData);

  const data = {
    "result": [
      {
        "report_title": "ATV Manufacturing in the US",
        "report_date": "Aug 02, 2024",
        "key_statistics": {
          "profit": {
            "profit_dollars": 284000000,
            "profit_cagr_historical": {
              "begin_year": 2005,
              "end_year": 2024,
              "profit_cagr_value": 1.36
            }
          },
          "profit_margins": {
            "profit_margins_percentage": 5.6,
            "profit_margins_cagr_historical": {
              "begin_year": 2005,
              "end_year": 2024,
              "profit_margins_cagr_value": 3.34
            }
          },
          "revenue": {
            "revenue_dollars": 5078000000,
            "revenue_cagr_historical": {
              "begin_year": 2005,
              "end_year": 2024,
              "revenue_cagr_value": -1.91
            },
            "revenue_cagr_projected": {
              "begin_year": 2024,
              "end_year": 2030,
              "revenue_cagr_value": -0.71
            }
          },
          "enterprises": 31,
          "establishments": 31,
          "employees": 1058,
          "wages": 69000000,
          "industry_value_added": 436000000,
          "imports": 2515000000,
          "exports": 155000000
        },
        "executive_summary": "The ATV manufacturing industry has faced notable volatility in the current period. Revenue contracted at an expected CAGR of 2.7% to $5.1 billion through 2024, despite a 0.1% increase in 2024 where profit reached 5.6%. Manufacturers dealt with soaring input costs, supply chain disruptions, and surging import penetration following the pandemic and Russia's invasion of Ukraine. Demand will recover in the outlook period driven by stronger economic conditions and innovation in electric vehicles.",
        "current_performance": [
          {
            "current_performance_point_title": "Economic Uncertainty Has Caused Revenue to Contract",
            "current_performance_point_description": "Severe economic uncertainty and climbing interest rates have threatened ATV manufacturers through most of the current period, limiting demand for new ATVs. Companies supplemented lackluster sales with demand for parts and repairs."
          },
          {
            "current_performance_point_title": "ATV Manufacturers Performed Well at the End of the Pandemic",
            "current_performance_point_description": "The pandemic created growth opportunities in 2021 as consumers had stimulus money, leisure time, and interest in outdoor activities like off-roading, leading to first-time ATV buyers that manufacturers must convert to repeat customers."
          },
          {
            "current_performance_point_title": "Supply Chain Disruptions Pose a Major Threat",
            "current_performance_point_description": "Manufacturers endured severe supply chain disruptions with skyrocketing input costs that larger companies could pass to buyers but smaller companies absorbed, reducing profit. Disruptions also influenced demand for electric ATVs."
          },
          {
            "current_performance_point_title": "Manufacturers Have Faced Uneven Trade Markets",
            "current_performance_point_description": "Low-cost imports from Mexico and China have dominated generic ATV and parts markets, forcing many US manufacturers to shift to custom-built products. Unfavorable exchange rates exacerbated the trade imbalance."
          }
        ],
        "future_outlook": [
          {
            "future_outlook_point_title": "Positive Economic Conditions Will Support Growth",
            "future_outlook_point_description": "Normalizing interest rates, climbing consumer confidence, and greater access to credit will drive demand for discretionary ATV purchases and trade-ups to more expensive models in the outlook period."
          },
          {
            "future_outlook_point_title": "Tightening Regulations Will Spur Innovation",
            "future_outlook_point_description": "Tightening safety and emissions regulations will force manufacturers to design more electric/hybrid ATVs with better safety features, leveraging government incentives to fund research and reduce costs."
          },
          {
            "future_outlook_point_title": "Commercial Uses for ATVs Will Increase",
            "future_outlook_point_description": "While consumers have historically been the primary market, commercial and government demand is increasing, especially for agricultural and landscaping uses, encouraging more specialized ATV fleets."
          },
          {
            "future_outlook_point_title": "Manufacturers Will Take Steps to Reduce Supply Chain Volatility",
            "future_outlook_point_description": "To mitigate risks and delays, manufacturers will consider nearshoring, local sourcing, and monitoring supply chains more closely to adhere to ESG initiatives, making resilient supply chains crucial for competitive advantage."
          }
        ],
        "industry_definition": "This industry manufactures all-terrain vehicles (ATVs) and their associated parts. ATVs are four-wheeled vehicles typically equipped with wide tires that...",
        "industry_impact": {
          "negative_impact_factors": [
            "Low & Steady Level of Assistance",
            "Medium Imports",
            "Low Profit vs. Sector Average",
            "High Capital Requirements"
          ],
          "positive_impact_factors": [
            "Low Customer Class Concentration",
            "Low Product/Service Concentration"
          ]
        },
        "swot_analysis": {
          "strengths": [
            "Low Customer Class Concentration",
            "Low Product/Service Concentration"
          ],
          "weaknesses": [
            "Low & Steady Level of Assistance",
            "Medium Imports",
            "Low Profit vs. Sector Average",
            "High Capital Requirements"
          ],
          "opportunities": [
            "High Revenue Growth (2019-2024)",
            "High Revenue Growth (2024-2029)"
          ],
          "threats": [
            "Very Low Revenue Growth (2005-2024)",
            "Low Outlier Growth"
          ]
        },
        "key_trends": [
          "ATV manufacturers face stiff internal competition and import penetration. Price, design, quality and brand loyalty contribute to considerable competition among producers.",
          "Manufacturers have dealt with significant competition from other leisure activities. While the pandemic limited most alternatives, lifting lockdown restrictions has enabled buyers to choose other entertainment options, like movies, travel and dining out.",
          "Many companies have struggled to compete with imports from Mexico and China. Foreign manufacturers have leveraged lower wage costs, forcing domestic manufacturers to cut costs or specialize in various niches to differentiate.",
          "ATV manufacturers dealt with severe economic uncertainty. Climbing interest rates, supply chain disruptions, low consumer confidence and high unemployment contributed to weak revenue through the current period.",
          "Innovation will create new opportunities for manufacturers. Many buyers will adopt higher-end, electric-powered ATVs, revitalizing demand. Regulations will also encourage manufacturers to create safer and lower-emission ATVs."
        ],
        "external_drivers": [
          {
            "driver_cagr_historical": {
              "begin_year": 1980,
              "driver_cagr_value": 1.83,
              "end_year": 2024
            },
            "driver_cagr_projected": {
              "begin_year": 2024,
              "driver_cagr_value": 4.03,
              "end_year": 2030
            },
            "external_drivers_point_description": "Disposable income influences demand for new ATVs. Greater disposable income encourages consumers to purchase nondiscretionary recreation items, like ATVs, and trade up to more expensive brands. However, low disposable income may push consumers to shift to other, less expensive entertainment options.",
            "external_drivers_point_title": "Per Capita Disposable Income"
          },
          {
            "driver_cagr_historical": {
              "begin_year": 1980,
              "driver_cagr_value": 0.81,
              "end_year": 2024
            },
            "driver_cagr_projected": {
              "begin_year": 2024,
              "driver_cagr_value": 3.22,
              "end_year": 2030
            },
            "external_drivers_point_description": "When consumer confidence is low, buyers generally postpone big-ticket purchases, including new vehicles. When consumer sentiment is high, individuals and businesses spend more and maintain lower savings. Higher economic confidence increases vehicle demand, encouraging leisure time and boosting all-terrain vehicle (ATV) demand. Strong consumer confidence creates opportunities for ATV manufacturers.",
            "external_drivers_point_title": "Consumer Confidence Index"
          },
          {
            "driver_cagr_historical": {
              "begin_year": 2003,
              "driver_cagr_value": 0.1,
              "end_year": 2024
            },
            "driver_cagr_projected": {
              "begin_year": 2024,
              "driver_cagr_value": 0.28,
              "end_year": 2030
            },
            "external_drivers_point_description": "The number of hours consumers devote to leisure in a given year impacts ATV manufacturer performance. Falling leisure time hinders demand for ATVs, as consumers allocate less time to recreational activities. However, unemployment-related leisure time diminishes demand for ATVs since unemployed consumers are less willing to spend on recreation.",
            "external_drivers_point_title": "Time Spent on Leisure and Sports"
          },
          {
            "driver_cagr_historical": {
              "begin_year": 1980,
              "driver_cagr_value": -2.33,
              "end_year": 2024
            },
            "driver_cagr_projected": {
              "begin_year": 2024,
              "driver_cagr_value": -0.58,
              "end_year": 2030
            },
            "external_drivers_point_description": "Treasury yields represent borrowing rates for consumers and businesses. Higher rates make borrowing more expensive, diminishing demand for big-ticket and discretionary purchases, like ATVs. Conversely, lower rates can convince consumers to purchase more expensive goods. Heightened demand at the retail level bolsters demand at the manufacturing level. Climbing yields pose a threat to the industry.",
            "external_drivers_point_title": "Yield on 10-Year Treasury Note"
          },
          {
            "driver_cagr_historical": {
              "begin_year": 1980,
              "driver_cagr_value": 0.52,
              "end_year": 2024
            },
            "driver_cagr_projected": {
              "begin_year": 2024,
              "driver_cagr_value": -2.43,
              "end_year": 2030
            },
            "external_drivers_point_description": "The trade-weighted index measures the strength of the US dollar relative to the currencies of its trading partners. Since international trade remains an integral component of the industry, fluctuations in the value of the US dollar impact performance. As the US dollar depreciates relative to other currencies, exports become more affordable and desirable abroad.",
            "external_drivers_point_title": "Trade-Weighted Index"
          }
        ],
        "supply_chain": {
          "tier_1_buyers": [
            "Motorcycle Dealership and Repair in the US",
            "Recreational Vehicle Dealers in the US",
            "Bicycle Dealership and Repair in the US"
          ],
          "tier_1_suppliers": [
            "Engine & Turbine Manufacturing in the US",
            "Metal Stamping & Forging in the US",
            "Structural Metal Product Manufacturing in the US"
          ],
          "tier_2_buyers": [],
          "tier_2_suppliers": []
        },
        "similar_industries": [
          "Sporting Goods Stores in the US",
          "Department Stores in the US",
          "Sporting Goods Wholesaling in the US"
        ],
        "related_international_industries": [
          "Car & Automobile Manufacturing in the US",
          "Motorcycle, Bike & Parts Manufacturing in the US",
          "ATV Rentals & Tour Services in the US",
          "ATV, Golf Cart & Snowmobile Manufacturing in the US",
          "Motorcycle Dealership and Repair in the US"
        ],
        "products_and_services": [
          {
            "product_description": "General-use/utility ATVs, or UTVs, commonly have a large motor and short travel suspension. Buyers can customize these vehicles with a wide array of available accessories for work or labor-intensive recreational activities like hunting.",
            "product_or_service": "General Use/Utility ATVs",
            "product_percentage": 40.8
          },
          {
            "product_description": "Commonly referred to as SxS or Rhinos, SxS ATVs are multifunctional off-roading vehicles with multiple seating options. Many small, rural areas enable consumers to register their SxS as an on-highway vehicle, granting owners a multifunctional work and recreation vehicle.",
            "product_or_service": "Side-by-Side (SxS) ATVs",
            "product_percentage": 25.3
          },
          {
            "product_description": "The segment comprises vehicles with engines ranging from 250 cubic centimeters (cc) to 700cc. Sport/high-performance ATVs are lightweight and have increased suspensions to effectively handle large jumps, quick turns and rough terrain.",
            "product_or_service": "Sport/High-Performance ATV",
            "product_percentage": 25.5
          },
          {
            "product_description": "This segment comprises individual parts and accessories produced by manufacturers for their large selection of models. Many ATV owners also customize their vehicles using compatible parts and accessories",
            "product_or_service": "Parts and Accessories",
            "product_percentage": 8.4
          }
        ],
        "demand_determinants": [
          {
            "determinant_description": "Disposable income influences demand for new ATVs. Greater disposable income encourages consumers to purchase nondiscretionary recreation items, like ATVs, and trade up to more expensive brands. However, low disposable income may push consumers to shift to other, less expensive entertainment options.",
            "determinant_title": "Disposable Income"
          }
        ],
        "market_segmentation": [
          {
            "segment": "Recreational Activities",
            "segment_description": "This market comprises consumers using ATVs for general recreation activities, like sports, off-roading or recreational hunting. This market also includes rental companies that purchase ATVs for recreational activities.",
            "segment_percentage": 40.6
          },
          {
            "segment": "Agricultural work activities",
            "segment_description": "ATVs for farm activities have superior load-bearing capabilities, making them more practical and able to cope better with various strenuous tasks. Downstream markets often use ATV attachments to cut grass, spread fertilizer, spray pesticides and other farm functions.",
            "segment_percentage": 24.7
          },
          {
            "segment": "Other work activities",
            "segment_description": "Other markets primarily comprise ad hoc work that requires site transportation, ranging from checking different gas pipelines to maintaining an estate. Landscaping businesses also require ATVs and UTVs.",
            "segment_percentage": 2.2
          },
          {
            "segment": "Recreational hunting",
            "segment_description": "Recreational hunting markets display more stable demand and stronger returns; these buyers often prefer higher-quality and more specialized products, generating robust revenue and mitigating volatility.",
            "segment_percentage": 32.5
          }
        ],
        "international_trade": {
          "export_level": "Low",
          "export_trend": "Increasing",
          "import_level": "Moderate",
          "import_trend": "Increasing",
          "international_trade_points": [
            {
              "trade_description": "Mexican and Chinese manufacturers account for nearly 100.0% of all imported ATVs. These manufacturers have leveraged low production and wage costs to undercut domestic producers, contributing to rising import penetration.",
              "trade_title": "Low-cost manufacturers have strong positions in domestic markets"
            },
            {
              "trade_description": "The trade-weighted index (TWI) has increased through most of the current period, causing the US dollar to appreciate relative to key trading partners. A strong TWI gives domestic buyers more purchasing power abroad, making imports more appealing and affordable.",
              "trade_title": "The dollar's appreciation has enabled import growth"
            },
            {
              "trade_description": "Purchases of US-produced ATVs by Israel skyrocketed more than 13,000.0% in 2024 following the onset of the latest Israel-Hamas War. Armed forces often use ATVs as fast response vehicles to attacks.",
              "trade_title": "Exports to Israel surge in 2024"
            },
            {
              "trade_description": "Exports account for less than 5.0% of total revenue for domestic ATV manufacturers, with exporters primarily supplementing Canadian markets. In general, proximity enables companies to leverage reduced shipping costs and quicker delivery times, making trade more efficient.",
              "trade_title": "Exports represent a small share of revenue"
            }
          ]
        },
        "business_locations": [
          {
            "location": "Southeast",
            "location_description": "The Southeast boasts a favorable climate for year-round outdoor activities, boosting local demand for ATVs. The region is also one of the largest consumers of outdoor recreational activities, creating a robust consumer market. The Southeast also benefits from a well-established network of suppliers and a skilled workforce, both of which are critical for maintaining efficient production processes and reducing operational costs for ATV manufacturers.",
            "percentage_establishments": 10.5,
            "percentage_population": 19.1
          },
          {
            "location": "Great Lakes",
            "location_description": "The Great Lakes boasts a well-developed supply chain infrastructure, including access to raw materials, advanced manufacturing facilities and established logistics networks, which streamline the production process for ATV manufacturers. Being centrally located, the Great Lakes region offers ATV manufacturers easy access to major US and Canadian markets, reducing transportation costs and increasing distribution efficiency.",
            "percentage_establishments": 31.6,
            "percentage_population": 15.4
          },
          {
            "location": "West Plains",
            "location_description": 101,
            "percentage_establishments": 10.5,
            "percentage_population": 17.6
          },
          {
            "location": "Mid-Atlantic",
            "location_description": 101,
            "percentage_establishments": 15.8,
            "percentage_population": 13.1
          },
          {
            "location": "Southwest",
            "location_description": 101,
            "percentage_establishments": 10.5,
            "percentage_population": 11.5
          },
          {
            "location": "Rocky Mountains",
            "location_description": 101,
            "percentage_establishments": 5.3,
            "percentage_population": 6.8
          },
          {
            "location": "New England",
            "location_description": 101,
            "percentage_establishments": 15.8,
            "percentage_population": 16.5
          }
        ],
        "barriers_to_entry": {
          "barriers_level": "Moderate",
          "barriers_trend": "Steady",
          "barriers_points": [
            {
              "barrier_title": "Life Cycle Stage",
              "barrier_description": "The ATV manufacturing industry is in a mature life cycle stage."
            },
            {
              "barrier_title": "Revenue Volatility Level",
              "barrier_description": "The industry experiences high revenue volatility."
            },
            {
              "barrier_title": "Capital Intensity Level",
              "barrier_description": "ATV manufacturing requires high capital intensity."
            },
            {
              "barrier_title": "Industry Assistance Level",
              "barrier_description": "The industry receives low to steady levels of assistance."
            }
          ],
          "factors_increased_barrier": [
            "Life Cycle Stage: mature",
            "Revenue Volatility Level: high",
            "Capital Intensity Level: high"
          ],
          "factors_decreased_barrier": [
            "Manufacturers must comply with all federal motor vehicle safety standards from the NHTSA alongside emissions and noise standards set by the EPA.",
            "Companies must also secure patents and ensure fair labor standards.",
            "Manufacturers must invest significant capital on land, labor and machinery to compete on scale with larger, established manufacturers and invest in marketing campaigns to establish their brand."
          ]
        },
        "basis_of_competition": {
          "basis_level": "Moderate",
          "basis_trend": "Increasing",
          "basis_points": [
            {
              "basis_title": "Internal Competition",
              "basis_description": "ATV manufacturers face stiff internal competition."
            },
            {
              "basis_title": "Import Penetration",
              "basis_description": "ATV manufacturers face competition from import penetration."
            },
            {
              "basis_title": "Competitive Factors",
              "basis_description": "Price, design, quality and brand loyalty contribute to considerable competition among producers."
            }
          ]
        },
        "market_share_concentration": {
          "concentration_level": "Moderate",
          "concentration_trend": "Steady",
          "concentration_points": [
            {
              "concentration_title": "Leading Manufacturers",
              "concentration_description": "Companies like Polaris, Honda, Deere and Textron have developed strong, stable positions in ATV manufacturing."
            },
            {
              "concentration_title": "Advantages of Leading Manufacturers",
              "concentration_description": "These companies can leverage economies of scale, connections with buyers and suppliers and strong reputations to outcompete adversaries and generate market share."
            },
            {
              "concentration_title": "Niche Manufacturers",
              "concentration_description": "Smaller, niche ATV manufacturers have carved out essential roles, often acting as subcontractors or producing parts and accessories."
            }
          ],
          "top_companies": [
            {
              "company_name": "Polaris Inc.",
              "company_percentage": 28.2
            },
            {
              "company_name": "Deere & Co",
              "company_percentage": 9.4
            },
            {
              "company_name": "Honda Motor Co Ltd",
              "company_percentage": 6.3
            },
            {
              "company_name": "Textron Inc.",
              "company_percentage": 5.3
            },
            {
              "company_name": "OTHERS",
              "company_percentage": 50.8
            }
          ]
        },
        "cost_structure_breakdown": [
          {
            "cost_type": "Profit",
            "cost_type_percentage": 101
          },
          {
            "cost_type": "Wages",
            "cost_type_percentage": 101
          },
          {
            "cost_type": "Purchases",
            "cost_type_percentage": 101
          },
          {
            "cost_type": "Depreciation",
            "cost_type_percentage": 101
          },
          {
            "cost_type": "Marketing",
            "cost_type_percentage": 101
          },
          {
            "cost_type": "Rent",
            "cost_type_percentage": 101
          },
          {
            "cost_type": "Utilities",
            "cost_type_percentage": 101
          },
          {
            "cost_type": "Other",
            "cost_type_percentage": 101
          }
        ],
        "cost_factors": [
          {
            "cost_factor_title": "Manufacturers Endure Supply Chain Disruptions",
            "cost_factor_description": "Surging input prices following the pandemic and the Russian invasion of Ukraine have posed a major threat to purchasing costs for ATV manufacturers. For instance, surging crude oil prices have translated into elevated metal costs while semiconductor shortages have exacerbated long lead times and production shortfalls."
          }
        ],
        "capital_intensity": {
          "capital_intensity_level": "High",
          "capital_intensity_points": [
            {
              "capital_intensity_title": "CAPITAL EXPENSES",
              "capital_intensity_description": "ATV manufacturing requires substantial capital resources for machinery and a highly skilled workforce to maintain production quality and efficiency. Companies regularly invest in research and development, contributing to higher capital and labor expenses."
            }
          ],
          "capital_intensity_trend": "Unknown"
        },
        "revenue_volatility": {
          "volatility_level": "High",
          "volatility_points": [
            {
              "volatility_title": "SUPPLY CHAIN DISRUPTIONS HAVE CREATED VOLATILITY",
              "volatility_description": "ATV manufacturers have endured severe supply chain volatility following the pandemic and the Russian invasion of Ukraine. Crude oil prices have skyrocketed, contributing to elevated ferrous and nonferrous metal prices, higher plastic and rubber costs and major semiconductor shortages."
            },
            {
              "volatility_title": "CONSUMER SPENDING AND DISPOSABLE INCOME LEVELS CAN CREATE FLUCTUATIONS",
              "volatility_description": "Given the recreational nature of ATVs and their sizeable price tags, consumer spending, interest rates and disposable income levels impact volatility. Consumers will shift to less expensive recreation options when disposable incomes fall and interest rates rise."
            },
            {
              "volatility_title": "OVERALL TRENDS IN SPORTS AND RECREATION IMPACT VOLATILITY",
              "volatility_description": "Since ATVs are recreational vehicles for activities like hunting and racing, various factors like leisure time, population demographics and preferences for particular recreational activities impact volatility."
            }
          ],
          "volatility_trend": "Unknown"
        },
        "technological_change": {
          "technological_change_level": "Moderate",
          "technological_change_points": [
            {
              "technological_change_title": "ELECTRIC AND HYBRID ATVs",
              "technological_change_description": "Electric ATVs offer the benefits of lower noise pollution and emissions. Hybrid ATVs provide consumers with a greater range of travel and less carbon emissions without relying entirely on charging availability."
            },
            {
              "technological_change_title": "IMPROVEMENTS IN SAFETY",
              "technological_change_description": "ATV manufacturers constantly invest in research and development to improve the safety of their products. New safety features include systems to aid drivers in avoiding collisions and better braking and rollover protection systems."
            }
          ],
          "technological_change_trend": "Unknown"
        },
        "regulations_and_policies": {
          "regulations_level": "Moderate",
          "regulations_points": [
            {
              "regulation_title": "REGISTRATION AND PERMITS",
              "regulation_description": "Off-highway vehicles OHVs are regulated uniformly nationwide, but minor policy variances depend on the state. ATVs require appropriate registration and permits on public roads (35 states permit some form of public road use). In 2008, the Consumer Product Safety Improvement Act 2008 organized and federally mandated the labeling of ATVs as inappropriate for use on public roads."
            },
            {
              "regulation_title": "ENVIRONMENTAL PROTECTION POLICIES",
              "regulation_description": "ATVs are subject to certification by the EPA for compliance with applicable emissions and noise standards and by the State of California Air Resources Board (CARB) concerning CARB's more stringent emissions standards. ATVs have restricted access to national park areas because of concerns about pollution, damage to local flora and fauna and noise emissions. The EPA regulates the discharge, treatment, storage, disposal, investigation and remediation of certain materials, substances and wastes during manufacturing."
            },
            {
              "regulation_title": "THE NATIONAL HIGHWAY TRAFFIC SAFETY ADMINISTRATION (NHTSA) AND THE CONSUMER PRODUCT SAFETY COMMISSION (CPSC)",
              "regulation_description": "All transportation machinery and equipment must comply with federal safety, fuel consumption and pollution control regulations. The NHTSA enforces these regulations, while the CPSC has federal oversight over product safety issues regarding ATVs, snowmobiles and off-road side-by-side vehicles. Since 1988, the CPSC has regulated safety standards for the industry. ATV manufacturers have become less profitable because of compliance costs."
            },
            {
              "regulation_title": "AMERICAN NATIONAL STANDARDS INSTITUTE (ANSI) GUIDELINES",
              "regulation_description": "ANSI guidelines provide voluntary but widely-accepted safety standards for ATV design and performance. These cover aspects like stability, braking, and controls. While not legally binding, adherence to ANSI guidelines demonstrates a commitment to safety and helps in avoiding legal liabilities and enhancing consumer trust."
            }
          ],
          "regulations_trend": "Steady"
        },
        "industry_assistance": {
          "assistance_level": "Low",
          "assistance_points": [
            {
              "assistance_title": "NATIONAL TRADE ASSOCIATIONS",
              "assistance_description": "Organizations like the Specialty Vehicle Institute of America (SVIA) and the Specialty Equipment Market Association offer valuable resources, including market research, advocacy and networking opportunities. By partnering with such groups, ATV manufacturers can stay updated on industry trends, regulatory changes and best practices, helping them remain competitive."
            },
            {
              "assistance_title": "LOCAL ASSOCIATIONS",
              "assistance_description": "Local associations like the Wisconsin ATV Association, the North Country ATV Association and the Upstate ATV Association promote recreational activities"
            }
          ],
          "assistance_trend": "Steady"
        },
        "FAQs": [
          {
            "question": "How is your company impacted by rising imports from abroad?",
            "answer": "Rising imports have threatened revenue. Mexico is a prime external competitor."
          },
          {
            "question": "Does your company specialize in one corner of the market or produce a diversified range of products?",
            "answer": "Most companies produce a variety of types of ATVs, like side-by-side, general and sport vehicles, alongside corresponding parts."
          },
          {
            "question": "Has your company been exposed to volatile input prices over the past few years?",
            "answer": "Large increases in steel prices can slash profitability. Successful companies often pass costs onto buyers to limit fluctuations."
          },
          {
            "question": "Is your company investing heavily in R&D to meet changing consumer preferences?",
            "answer": "Major companies work on tailoring their products to shifting consumer preferences. This trend includes customization and design."
          },
          {
            "question": "How is your company leveraging new technology in its operations?",
            "answer": "Recent technological advancements have been in the areas of computer-aided design, computer-aided manufacturing and numerically controlled machine tools. The new generation of computer-based technologies is much more accurate than manually controlled techniques."
          },
          {
            "question": "Have you been able to reduce wage costs by automating operations over the past five years?",
            "answer": "Labor unions have limited a company's ability to reduce wage costs. Labor unions fight against increased automation."
          },
          {
            "question": "What effect have international tariffs had on your ability to import and export products?",
            "answer": "International tariffs on steel have increased purchasing costs, threatening long-term profit."
          },
          {
            "question": "How does your company stay ahead of regulations such as energy-efficiency standards?",
            "answer": "ATVs are subject to certification by the US Environmental Protection Agency (EPA) for compliance with applicable emissions and noise standards and by the State of California Air Resources Board concerning the board's more stringent emissions standards."
          },
          {
            "question": "How has input price volatility of inputs altered profit?",
            "answer": "Increases in the price of steel have hurt profit. Companies that successfully pass costs onto buyers have stronger returns."
          },
          {
            "question": "How does your company compensate for seasonality of cash flow?",
            "answer": "ATV sales perform better in fair weather environments and seasons. Companies increase sales in winter times to countries and states experiencing warm weather. However, ATVs mitigate this to an extent due to their vehicles' off-road and all-terrain nature."
          },
          {
            "question": "How do you ensure compliance with federal, state and local regulations?",
            "answer": "Must comply with government regulations. Manufacturers must be able to design and develop products that comply with legal standards. Products that fail to meet these criteria are barred from sale in the United States."
          },
          {
            "question": "What are some ways that your company provides after sales service?",
            "answer": "Given the level of industry consolidation, manufacturers must be able to provide superior before and after-sales services. This practice promotes brand loyalty and encourages repeat customers."
          },
          {
            "question": "How does your company keep track of market trends?",
            "answer": "Understanding market trends is necessary to maintain stable revenue and profit streams. This research can identify new products that consumers demand and satisfy emerging trends before competitors."
          },
          {
            "question": "How do you track the trends in the yield of the 10-year treasury note? How do you mitigate changes in the value of the US dollar?",
            "answer": "As interest rates fall, demand for ATVs trends upward as consumers can afford big-ticket purchases. Lower rates make borrowing easier."
          },
          {
            "question": "Does your company keep a close eye on fluctuations in consumer confidence? How do you mitigate changes in consumer confidence?",
            "answer": "People will postpone big-ticket purchases when consumer confidence is low. When consumer sentiment is high, individuals and businesses tend to spend more. This trend increases demand for vehicles, encourages leisure time and boosts ATV demand."
          },
          {
            "question": "How closely do you monitor trends in per capita disposable income? How are you able to capitalize on increasing disposable income?",
            "answer": "Disposable income significantly influences the purchase of new all-terrain vehicles (ATVs). An increase or decrease in disposable household income alters the ability of households to purchase ATVs. Higher disposable income makes consumers more likely to purchase discretionary items."
          }
        ],
        "metrics": [
          {
            "Aspect": "Market",
            "Scores": [
              {
                "Category": "Exports",
                "Weight": 10,
                "Result": "Low",
                "Score": 1,
                "Total": 2
              },
              {
                "Category": "Imports",
                "Weight": 15,
                "Result": "Moderate",
                "Score": 3,
                "Total": 9
              },
              {
                "Category": "Basis of Competition",
                "Weight": 20,
                "Result": "Moderate",
                "Score": 3,
                "Total": 12
              },
              {
                "Category": "Barriers to Entry",
                "Weight": 20,
                "Result": "Moderate",
                "Score": 3,
                "Total": 12
              },
              {
                "Category": "Industry Assistance",
                "Weight": 15,
                "Result": "Low",
                "Score": 1,
                "Total": 3
              },
              {
                "Category": "Market Share Concentration",
                "Weight": 20,
                "Result": "Moderate",
                "Score": 3,
                "Total": 12
              }
            ],
            "Total": 50
          },
          {
            "Aspect": "Investments",
            "Scores": [
              {
                "Category": "Revenue Volatility",
                "Weight": 30,
                "Result": "High",
                "Score": 1,
                "Total": 6
              },
              {
                "Category": "Regulation and Policy",
                "Weight": 20,
                "Result": "Moderate",
                "Score": 3,
                "Total": 12
              },
              {
                "Category": "Capital Intensity",
                "Weight": 30,
                "Result": "High",
                "Score": 1,
                "Total": 6
              },
              {
                "Category": "Technological Change Level",
                "Weight": 20,
                "Result": "Moderate",
                "Score": 3,
                "Total": 12
              }
            ],
            "Total": 36
          }
        ]
      }
    ]
  }

  const sidebarSections = [
    { id: 0, name: 'Market Segmentation' },
    { id: 1, name: 'Key Statistics' },
    { id: 2, name: 'External Drivers' },
    // Add more sections as needed
  ];
  
 
  console.log("Summary state:", summaryData.result);

  return (
    <div className="mb-20 pb-10 rounded-lg">
      <div className="px-10 py-5">
        {summaryData && summaryData !== "Select an industry to view report" ? (
          <>
            <ReportDropdown data={data.result} sidebarSections={sidebarSections} />
          </>
        ) : (
          <p>Loading data... Please select an industry.</p>
        )}
      </div>
      <div className="mt-4">
        {/* <button
          type="submit"
          className="bg-white hover:bg-[#151518] font-semibold hover:border-white my-10 mx-20 hover:border hover:text-white transition-all ease-out duration-300 text-[#151518] px-4 py-2 rounded"
          style={{ float: "right" }}
          disabled={
            !summaryData || summaryData === "Select an industry to view report"
          }
        >
          Download Report
        </button> */}
        {/* <DownloadReport /> */}
      </div>
    </div>
  );
};

export default YourComponent;

