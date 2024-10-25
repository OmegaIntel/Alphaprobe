import React from "react";
import ReportDropdown from "./ReportDropdown";

const IndustryReport = () => {
  const reportdata = [
    {
      report_title: "3D Printer Manufacturing in the US",
      report_date: "2024-08-17",
      key_statistics: {
        employees: 5481,
        enterprises: 165,
        establishments: 174,
        exports: 1313000000,
        imports: 3153000000,
        industry_value_added: 1275000000,
        profit: {
          profit_dollars: 742000000,
          profit_cagr_historical: {
            begin_year: 2005,
            end_year: 2024,
            profit_cagr_value: 19.6,
          },
        },
        profit_margins: {
          profit_margins_percentage: 16.2,
          profit_margins_cagr_historical: {
            begin_year: 2005,
            end_year: 2024,
            profit_margins_cagr_value: 2.3,
          },
        },
        revenue: {
          revenue_dollars: 4578000000,
          revenue_cagr_historical: {
            begin_year: 2005,
            end_year: 2024,
            revenue_cagr_value: 17.0,
          },
          revenue_cagr_projected: {
            begin_year: 2024,
            end_year: 2030,
            revenue_cagr_value: 18.5,
          },
        },
        wages: 459000000,
      },
      executive_summary:
        "The 3D printer manufacturing industry has seen significant advancements and cost reductions, making the technology more accessible. Commercial and desktop 3D printers are now available at various price points. Enhanced capabilities and user-friendly interfaces have lowered adoption barriers. The industry is estimated to grow at a CAGR of 12.6%, reaching $4.6 billion in 2024. Patents play a critical role, as evidenced by the recent Stratasys lawsuit against BambuLab.",
      current_performance: [
        {
          current_performance_point_title:
            "Affordability and Market Penetration",
          current_performance_point_description:
            "3D printers have become more affordable, leading to higher market penetration. Commercial printers range from $5,000 to $500,000, while desktop printers cost $200 to $1,000.",
        },
        {
          current_performance_point_title: "Technological Advancements",
          current_performance_point_description:
            "Significant technological improvements have enhanced 3D printer capabilities, including multi-material printing, higher resolution, and larger build volumes, expanding applications across industries.",
        },
        {
          current_performance_point_title: "Software Enhancements",
          current_performance_point_description:
            "Advancements in user-friendly software have enhanced user experience, leading to higher 3D printer adoption. Modern 3D modeling software has become more intuitive, lowering entry barriers.",
        },
        {
          current_performance_point_title: "Patent Lawsuit Impact",
          current_performance_point_description:
            "Stratasys' major patent lawsuit against BambuLab could impact the consumer 3D printer segment, potentially resulting in higher prices due to limited supply or additional licensing fees.",
        },
      ],
      future_outlook: [
        {
          future_outlook_point_title: "Continued Growth in Rapid Prototyping",
          future_outlook_point_description:
            "Demand for 3D printers will continue to grow as their use for rapid prototyping increases, particularly for creating complex geometries and optimized structures.",
        },
        {
          future_outlook_point_title: "New Materials Stimulating Adoption",
          future_outlook_point_description:
            "The introduction of new materials with superior properties will further stimulate the adoption of 3D printers across various industries.",
        },
        {
          future_outlook_point_title: "Price Decline and Increased Demand",
          future_outlook_point_description:
            "Prices are expected to decline, making 3D printers more affordable and driving increased demand across consumer and industrial segments.",
        },
        {
          future_outlook_point_title: "Limited Mass Manufacturing Use",
          future_outlook_point_description:
            "The use of 3D printers for mass manufacturing will remain limited due to challenges in production speed, material costs, and post-processing requirements.",
        },
      ],
      industry_definition:
        "The industry encompasses companies that manufacture 3D printing machines, also known as additive manufacturing systems. These machines create physical objects from digital designs through layer-by-layer material addition. The industry includes both commercial and desktop 3D printers, but excludes 3D printing and rapid prototyping services.",
      industry_impact: {
        positive_impact_factors: [
          "Growth Life Cycle Stage",
          "Low Concentration Level",
          "High Profit vs. Sector Average",
          "Low Customer Class Concentration",
          "Low Product/Service Concentration",
          "Low Capital Requirements",
        ],
        negative_impact_factors: [
          "High Technology Change Level",
          "High and Increasing Globalization Level",
          "High Imports",
        ],
      },
      swot_analysis: {
        strengths: [
          "Growth Life Cycle Stage",
          "High Profit vs. Sector Average",
          "Low Customer Class Concentration",
          "Low Product/Service Concentration",
          "Low Capital Requirements",
        ],
        weaknesses: ["High Imports"],
        opportunities: [
          "Very High Revenue Growth (2005-2024)",
          "High Revenue Growth (2019-2024)",
          "High Revenue Growth (2024-2029)",
          "High Performance Drivers",
          "Research and development expenditure",
        ],
        threats: [
          "Low Outlier Growth",
          "Private investment in industrial equipment and machinery",
        ],
      },
      key_trends: [
        "Intense competition between established companies and startups",
        "Importance of patent protection and IP portfolios",
        "Increasing affordability and market penetration",
        "Technological advancements improving efficacy",
        "Patent lawsuits impacting industry dynamics",
        "Introduction of new biocompatible materials",
        "Development of ultrafast 3D printing processes",
        "Low to medium level of industry regulation",
        "Pandemic-driven interest in 3D printing",
        "Profit increase due to expanding economies of scale",
        "Impact of commodity prices and transportation costs",
        "Emergence of 3D printing hubs in Silicon Valley and Boston",
        "Popularity of Fused Deposition Modeling technology",
        "Advancements in Stereolithography, Selective Laser Sintering, and Multi Jet Fusion technologies",
      ],
    },
    {
      external_drivers: [
        {
          external_drivers_point_title:
            "Private Investment in Industrial Equipment",
          external_drivers_point_description:
            "High tech change makes 3D printers attractive. Increased investment benefits manufacturers. Stagnation poses threat.",
          driver_cagr_historical: {
            begin_year: 1980,
            end_year: 2024,
            driver_cagr_value: 3.57,
          },
          driver_cagr_projected: {
            begin_year: 2024,
            end_year: 2030,
            driver_cagr_value: 2.92,
          },
        },
        {
          external_drivers_point_title: "Research and Development Expenditure",
          external_drivers_point_description:
            "R&D expenditure influences demand as 3D printers used for prototypes. Expansion positively affects industry.",
          driver_cagr_historical: {
            begin_year: 1980,
            end_year: 2024,
            driver_cagr_value: 3.2,
          },
          driver_cagr_projected: {
            begin_year: 2024,
            end_year: 2030,
            driver_cagr_value: 2.39,
          },
        },
        {
          external_drivers_point_title:
            "Demand from Medical Device Manufacturing",
          external_drivers_point_description:
            "Medical device manufacturers are large, fast-growing market for 3D printers. Used for customized devices.",
          driver_cagr_historical: {
            begin_year: 2004,
            end_year: 2024,
            driver_cagr_value: 1.52,
          },
          driver_cagr_projected: {
            begin_year: 2024,
            end_year: 2030,
            driver_cagr_value: 3.27,
          },
        },
        {
          external_drivers_point_title: "Import Penetration into Manufacturing",
          external_drivers_point_description:
            "Measures domestic demand captured by imports. Higher imports hurt 3D printer revenue.",
          driver_cagr_historical: {
            begin_year: 2002,
            end_year: 2024,
            driver_cagr_value: 1.64,
          },
          driver_cagr_projected: {
            begin_year: 2024,
            end_year: 2030,
            driver_cagr_value: 1.5,
          },
        },
        {
          external_drivers_point_title: "Trade-Weighted Index",
          external_drivers_point_description:
            "Measures USD strength vs trading partners. Stronger dollar makes imports cheaper, weaker makes exports more affordable.",
          driver_cagr_historical: {
            begin_year: 1980,
            end_year: 2024,
            driver_cagr_value: 0.52,
          },
          driver_cagr_projected: {
            begin_year: 2024,
            end_year: 2030,
            driver_cagr_value: -2.43,
          },
        },
      ],
      supply_chain: {
        tier_1_suppliers: [
          "Plastic & Resin Manufacturing in the US",
          "Copier & Optical Machinery Manufacturing in the US",
        ],
        tier_2_suppliers: ["Software Publishing in the US"],
        tier_1_buyers: [
          "Hobby & Toy Stores in the US",
          "Dentists in the US",
          "Engineering Services in the US",
          "Industrial Designers in the US",
          "Educational Services in the US",
        ],
        tier_2_buyers: [
          "Jewelry Manufacturing in the US",
          "Automobile & Light Duty Motor Vehicle Manufacturing in the US",
          "Aircraft, Engine & Parts Manufacturing in the US",
          "Space Vehicle & Missile Manufacturing in the US",
          "Retail Trade in the US",
          "Industrial Machinery & Equipment Wholesaling in the US",
        ],
      },
      similar_industries: [
        "Plastics & Rubber Machinery Manufacturing in the US",
        "Metalworking Machinery Manufacturing in the US",
        "Semiconductor Machinery Manufacturing in the US",
        "Circuit Board & Electronic Component Manufacturing in the US",
      ],
      related_international_industries: [
        "Global Computer Hardware Manufacturing",
        "Computer and Electronic Office Equipment Manufacturing in Australia",
        "Computer Peripheral Manufacturing in China",
        "Computer & Peripheral Equipment Manufacturing in the UK",
        "Computer Peripheral Manufacturing in Canada",
        "Computer & Peripheral Equipment Manufacturing in Ireland",
      ],
      products_and_services: [
        {
          product_or_service: "SLS 3D Printers",
          product_percentage: 14.8,
          product_description:
            "Uses laser to fuse powder materials. Support-free prints, high quality but expensive.",
        },
        {
          product_or_service: "FDM/FFF 3D Printers",
          product_percentage: 20.7,
          product_description:
            "Extrudes heated filament. Most affordable and popular, but lower resolution.",
        },
        {
          product_or_service: "SLA 3D Printers",
          product_percentage: 13.5,
          product_description:
            "Uses UV laser to cure resin. High resolution, affordable, wide material range.",
        },
        {
          product_or_service: "MJF 3D Printers",
          product_percentage: 9.6,
          product_description:
            "Uses inkjet array and IR light. Fast, high resolution, but expensive.",
        },
        {
          product_or_service: "DLP/LCD 3D Printers",
          product_percentage: 9.6,
          product_description:
            "Similar to SLA but cures entire layers. Faster than SLA but limited by pixel size.",
        },
        {
          product_or_service: "PolyJet 3D Printers",
          product_percentage: 8.3,
          product_description:
            "Deposits multiple materials. Enables multi-color printing but expensive and less durable.",
        },
        {
          product_or_service: "Other 3D Printers",
          product_percentage: 23.5,
          product_description:
            "Includes DMLS for metal parts and Binder Jetting for various materials.",
        },
      ],
      demand_determinants: [
        {
          determinant_title: "Technological Change",
          determinant_description:
            "High rate of tech change makes 3D printers more attractive for businesses and individuals.",
        },
        {
          determinant_title: "Private Investment",
          determinant_description:
            "Increased investment in industrial equipment benefits 3D printer manufacturers. Stagnation poses threat.",
        },
      ],
      market_segmentation: [
        {
          segment: "Industrial goods",
          segment_percentage: 13.0,
          segment_description:
            "Use 3D printers for designs and blueprints. Faced revenue volatility due to pandemic.",
        },
        {
          segment: "Services and education",
          segment_percentage: 21.0,
          segment_description:
            "Educational institutions use for teaching and testing models. Growth opportunity for industry.",
        },
        {
          segment: "Consumer goods",
          segment_percentage: 14.0,
          segment_description:
            "Use for rapid prototyping. Demand driven by consumer spending and economic factors.",
        },
        {
          segment: "Healthcare",
          segment_percentage: 6.0,
          segment_description:
            "Used for prosthetics, implants, and bioprinting. Advancing in artificial organs and implants.",
        },
        {
          segment: "High-tech",
          segment_percentage: 9.0,
          segment_description:
            "Use in R&D and product demonstration. Driven by integration with other technologies.",
        },
        {
          segment: "Jewelry, Fashion and Arts",
          segment_percentage: 10.0,
          segment_description:
            "Used for custom designs and prototypes in jewelry and fashion industries.",
        },
        {
          segment: "All other",
          segment_percentage: 27.0,
          segment_description:
            "Includes automotive, aerospace, military, and individual use for various applications.",
        },
      ],
      international_trade: {
        import_level: "High",
        import_trend: "Increasing",
        export_level: "High",
        export_trend: "Increasing",
        international_trade_points: [
          {
            trade_title: "Germany as Major Exporter",
            trade_description:
              "Germany is leading exporter of commercial 3D printers to US, known for advanced technology.",
          },
          {
            trade_title: "Chinese Imports",
            trade_description:
              "Significant number of desktop 3D printers imported from China, known for affordability.",
          },
          {
            trade_title: "US Exports",
            trade_description:
              "US manufacturers maintain competitiveness, fueling high demand for US-made 3D printers internationally.",
          },
          {
            trade_title: "Major US Export Destinations",
            trade_description:
              "Canada, Mexico, and China are biggest importers of US 3D printers, benefiting from proximity and trade agreements.",
          },
        ],
      },
      business_locations: [
        {
          location: "Great Lakes",
          location_description:
            "Historic hub for manufacturing. Michigan is largest state for 3D printer manufacturers.",
          percentage_establishments: 35.0,
          percentage_population: 20.0,
        },
        {
          location: "Southeast",
          location_description:
            "Expanding region with low costs of living attracting manufacturers.",
          percentage_establishments: 25.0,
          percentage_population: 25.0,
        },
        {
          location: "Mid-Atlantic",
          location_description:
            "Access to skilled labor and R&D funds. Home to leading universities and research institutions.",
          percentage_establishments: 17.0,
          percentage_population: 15.0,
        },
        {
          location: "West",
          location_description: "Home to tech hubs and innovative companies.",
          percentage_establishments: 15.0,
          percentage_population: 17.0,
        },
        {
          location: "Other regions",
          location_description:
            "Includes Plains, Southwest, New England, and Rocky Mountains.",
          percentage_establishments: 8.0,
          percentage_population: 23.0,
        },
      ],
    },
    {
      basis_of_competition: {
        basis_level: "Moderate",
        basis_trend: "Increasing",
        basis_points: [
          {
            basis_title: "Intense competition",
            basis_description:
              "Industry features intense competition between established companies and emerging startups, fueling continuous innovation and market differentiation.",
          },
          {
            basis_title: "Patent protection",
            basis_description:
              "Protecting innovations and designs through patents is crucial. Strong IP portfolios serve as significant competitive barriers.",
          },
        ],
      },
      barriers_to_entry: {
        barriers_level: "Moderate",
        barriers_trend: "Steady",
        factors_increased_barrier: [
          "High technology change level",
          "High and increasing globalization level",
        ],
        factors_decreased_barrier: [
          "Growth life cycle stage",
          "Low concentration level",
        ],
        barriers_points: [
          {
            barrier_title: "Legal barriers",
            barrier_description:
              "Intense patent activity and IP laws require careful navigation to avoid infringement while securing own patents.",
          },
          {
            barrier_title: "Start-up costs",
            barrier_description:
              "High initial capital expenditure for machinery, materials, R&D, and cutting-edge technology investments.",
          },
          {
            barrier_title: "Differentiation",
            barrier_description:
              "Strong brand recognition, established distribution networks, and technological advantages create barriers for new entrants.",
          },
          {
            barrier_title: "Labor expenses",
            barrier_description:
              "Specialized industry requiring skilled workers commanding higher wages, leading to increased human resource costs.",
          },
        ],
      },
      market_share_concentration: {
        concentration_level: "Low",
        concentration_trend: "Unknown",
        concentration_points: [
          {
            concentration_title: "Technological advancements",
            concentration_description:
              "Innovations create opportunities for new entrants, increasing competition and decreasing concentration.",
          },
          {
            concentration_title: "Patent protection",
            concentration_description:
              "Strong patents can limit entry, protect market share, and lead to higher industry concentration through licensing agreements.",
          },
          {
            concentration_title: "Regulations",
            concentration_description:
              "Can limit entry or provide advantages to certain players, potentially increasing industry concentration.",
          },
          {
            concentration_title: "Industry globalization",
            concentration_description:
              "High and increasing globalization level in the industry.",
          },
        ],
        top_companies: [
          {
            company_name: "OTHER COMPANIES",
            company_percentage: 100,
          },
        ],
      },
    },
    {
      capital_intensity: {
        capital_intensity_level: "Moderate",
        capital_intensity_points: [
          {
            capital_intensity_title: "Skilled labor requirement",
            capital_intensity_description:
              "3D printer manufacturing requires skilled workers commanding higher wages, leading to increased human resource costs.",
          },
          {
            capital_intensity_title: "Technology investment",
            capital_intensity_description:
              "Investments in robotics and manufacturing technology can reduce labor needs, balancing capital intensity.",
          },
        ],
        capital_intensity_trend: "Unknown",
      },
      cost_factors: [
        {
          cost_factor_title: "Demand changes",
          cost_factor_description:
            "Profit influenced by demand fluctuations, driven by capital expenditures and technological advancements.",
        },
        {
          cost_factor_title: "Commodity prices",
          cost_factor_description:
            "Purchase costs affected by prices of metals, plastics, and electronic components. Mitigated through contracts and sourcing.",
        },
        {
          cost_factor_title: "Labor market conditions",
          cost_factor_description:
            "Wage costs impacted by skilled labor availability and prevailing wage rates in the industry.",
        },
      ],
      cost_structure_breakdown: [
        {
          cost_type: "Purchases",
          cost_type_percentage: 37.0,
        },
        {
          cost_type: "Wages",
          cost_type_percentage: 28.5,
        },
        {
          cost_type: "Other",
          cost_type_percentage: 14.0,
        },
        {
          cost_type: "Profit",
          cost_type_percentage: 8.0,
        },
        {
          cost_type: "Rent",
          cost_type_percentage: 5.0,
        },
        {
          cost_type: "Depreciation",
          cost_type_percentage: 3.5,
        },
        {
          cost_type: "Marketing",
          cost_type_percentage: 2.0,
        },
        {
          cost_type: "Utilities",
          cost_type_percentage: 2.0,
        },
      ],
      industry_assistance: {
        assistance_level: "Unknown",
        assistance_points: [],
        assistance_trend: "Unknown",
      },
      regulations_and_policies: {
        regulations_level: "Low",
        regulations_points: [
          {
            regulation_title: "CPSC regulations",
            regulation_description:
              "Require safety standards for electrical and fire hazards, proper warnings, and reporting of safety defects.",
          },
          {
            regulation_title: "OSHA regulations",
            regulation_description:
              "Require prevention of workplace hazards, provision of protective equipment, and employee safety training.",
          },
          {
            regulation_title: "FTC regulations",
            regulation_description:
              "Require truthful claims about 3D printer performance and capabilities, avoiding false advertisements.",
          },
        ],
        regulations_trend: "Steady",
      },
      revenue_volatility: {
        volatility_level: "Moderate",
        volatility_points: [
          {
            volatility_title: "Market conditions",
            volatility_description:
              "Capital investments affected by market conditions impact demand for 3D printers.",
          },
          {
            volatility_title: "Varying adoption rates",
            volatility_description:
              "Uneven revenue streams due to varying adoption rates across industries.",
          },
          {
            volatility_title: "Patent expiration",
            volatility_description:
              "Expiration of key patents can lead to increased competition and price reduction.",
          },
        ],
        volatility_trend: "Unknown",
      },
      technological_change: {
        technological_change_level: "High",
        technological_change_points: [
          {
            technological_change_title: "Multi-material printing",
            technological_change_description:
              "Allows creation of stronger, more functional objects with greater design flexibility.",
          },
          {
            technological_change_title: "Large-scale printing",
            technological_change_description:
              "Emerging technology for producing large industrial parts and building components.",
          },
          {
            technological_change_title: "Research advancements",
            technological_change_description:
              "Ongoing research revolutionizing the industry, e.g., blurred tomography for high-quality optical goods.",
          },
        ],
        technological_change_trend: "Increasing",
      },
    },
    {
      FAQs: [
        {
          question:
            "How have declining prices for industry products affected sales?",
          answer:
            "Declining prices have led to more industries exploring 3D printing benefits, expanding market reach as additive manufacturing technology becomes more affordable.",
        },
        {
          question:
            "Does your company specialize in a niche or produce a diversified range of products?",
          answer:
            "Most operators currently produce printers for various uses, but companies are expected to focus on specializing in certain products for niche markets in the future.",
        },
        {
          question: "What level of industry assistance is received?",
          answer:
            "The industry receives MODERATE assistance, which has been STEADY. No direct support from the private sector. The 3D Printing Association provided support but has been inactive recently.",
        },
        {
          question: "Has your company been exposed to volatile input prices?",
          answer:
            "Yes, the world price of steel, a key input, is inherently volatile, leading to unstable profit figures for smaller operators.",
        },
        {
          question: "Has your company explored acquisition opportunities?",
          answer:
            "Larger operators like 3D Systems Co. and Stratasys have been increasing acquisition activity to capture a larger industry share.",
        },
        {
          question: "How is your company leveraging new technology?",
          answer:
            "Operators continually incorporate new technologies, including fused deposition modeling and selective laser sintering, as this is a burgeoning industry.",
        },
        {
          question: "Has your company reduced wage costs through automation?",
          answer:
            "No, operators have not been able to decrease wage costs through automation due to heavy investment in research and development requiring physical workers.",
        },
        {
          question:
            "Have regulatory expenses significantly impacted profitability?",
          answer:
            "This industry does not experience significant expenses as a result of new or changing regulations.",
        },
        {
          question:
            "How have international tariffs impacted import and export of products?",
          answer:
            "No official tariffs have been announced for industry products yet, but specific tariffs are likely to be implemented over the next five years.",
        },
        {
          question:
            "How do company profit margins compare to industry averages?",
          answer:
            "Company-specific profit levels above or below industry averages imply pricing power or weakness.",
        },
        {
          question: "How has pandemic volatility affected profit margins?",
          answer:
            "Revenue volatility is influenced by volatile input prices such as the world price of steel and technological development.",
        },
        {
          question:
            "Do you regularly introduce new products and invest in R&D?",
          answer:
            "Many operators devote significant resources to R&D, focusing on improving existing products and timely development of new products.",
        },
        {
          question:
            "Which outside suppliers do you use and how can you get more contracts?",
          answer:
            "Operators rely on outside suppliers for parts and raw materials to produce 3D printers and build materials.",
        },
        {
          question: "How do you attract and retain qualified staff?",
          answer:
            "Success depends on functional expertise, especially in product development with substantial R&D components. Highly skilled workforce is crucial.",
        },
        {
          question:
            "Do you monitor imports and adapt to high import penetration?",
          answer:
            "Medical device manufacturers, a fast-growing market, use 3D printers for customized devices like prosthetic limbs and teeth.",
        },
        {
          question:
            "What research are you performing and plans for R&D resources?",
          answer:
            "R&D expenditure influences demand as 3D printers are used for quick prototyping. Increased R&D expenditure positively affects the industry.",
        },
        {
          question:
            "Do you monitor technology trends and what has your company implemented?",
          answer:
            "High rate of technological change enables various applications. Increased private investment in industrial equipment benefits industry with demand for new products and technologies.",
        },
      ],
    },
  ];

  return (
    <>
      <div className="mb-20 pb-10">
        <div className="px-10 py-5">
          <ReportDropdown data={reportdata} />
        </div>
        <div className="mt-4">
          <button
            type="submit"
            className="bg-white hover:bg-[#151518] font-semibold hover:border-white my-10 mx-20 hover:border hover:text-white transition-all ease-out duration-300 text-[#151518] px-4 py-2 rounded"
            style={{ float: "right" }}
          >
            Download Report
          </button>
        </div>
      </div>
    </>
  );
};

export default IndustryReport;
