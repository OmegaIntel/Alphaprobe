import { useSelector } from "react-redux";
import { IndustrySidebar } from "./IndustrySidebar";
//import IndustryReport from "./IndustryReportSection/IndustryReport";
import { MarketResearchPreload } from "./PreloadingScreen";
import SummaryReport from "./IndustryReport/IndustryReport";

interface Industry {
  industry_name: string;
  industry_code: string;
}

interface FormResponseState {
  data: {
    result: Industry[];
  } | null;
  selectedIndustries: Industry[];
}

interface RootState {
  formResponse: FormResponseState;
}

export function IndustryInsightsLayout() {
  const formResponse = useSelector((state: RootState) => state.formResponse.data);

  return (
    <>
      {formResponse ? (
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar with fixed width and scrollable content */}
          <div className="w-60 flex-shrink-0 bg-[#09090A]">
            <IndustrySidebar />
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-y-auto bg-[#111111] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-950">
            <SummaryReport />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-300">
          <MarketResearchPreload />
        </div>
      )}
    </>
  );
}

export default IndustryInsightsLayout;