import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import ReportLayout from "./ReportLayout";

// Matches your industry slice state
interface IndustryState {
  summaryData: ReportData | string; // Can be the report data or a string
  loading: boolean;
  error: string | null;
}

interface RootState {
  industry: IndustryState;
}

// Define the result type based on what ReportLayout expects
interface ReportData {
  report_title: string;
  report_date: string;
  key_statistics?: Record<string, any>;
  executive_summary?: string;
  current_performance?: Record<string, any>[];
  future_outlook?: Record<string, any>[];
  industry_definition?: string;
  industry_impact?: Record<string, any>;
  swot_analysis?: Record<string, any>;
  key_trends?: string[];
  market_segmentation?: Record<string, any>[];
  products_and_services?: Record<string, any>[];
  supply_chain?: Record<string, any>;
  demand_determinants?: Record<string, any>[];
  international_trade?: Record<string, any>;
  business_locations?: Record<string, any>[];
  regulations_and_policies?: Record<string, any>;
  barriers_to_entry?: Record<string, any>;
  basis_of_competition?: Record<string, any>;
  market_share_concentration?: Record<string, any>;
  cost_structure_breakdown?: Record<string, any>[];
  cost_factors?: Record<string, any>[];
  capital_intensity?: Record<string, any>;
  revenue_volatility?: Record<string, any>;
  technological_change?: Record<string, any>;
  FAQs?: Record<string, any>[];
  metrics?: Record<string, any>[];
}

const SummaryReport: React.FC = () => {
  const summaryData = useSelector(
    (state: RootState) => state.industry.summaryData
  );

  // Ensure `summaryData` is valid and contains the expected structure
  const isValidReportData = (data: any): data is ReportData => {
    return typeof data === "object" && data !== null && "report_title" in data;
  };

  console.log("Summarydata from store",summaryData)

  useEffect(() => {
    console.log("Redux Store State:", summaryData);
  }, [summaryData]);

  return (
    <div className="mb-20 pb-10 rounded-lg">
      <div className="px-10 py-5">
        {isValidReportData(summaryData) ? (
          <>
            <ReportLayout data={summaryData} />
            {/* <div className="text-center text-green-500">
              Data successfully retrieved and displayed.
            </div> */}
          </>
        ) : summaryData === "Select an industry to view report" ? (
          <div className="text-center text-gray-300">
            Please select an industry to view the report.
          </div>
        ) : (
          <div className="text-center animate-pulse text-gray-300">
            Generating data for the selected company...
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryReport;
