import React from "react";
import KeyStatistics from "./ReportSectionComponents/KeyStatistics";
import ExternalDrivers from "./ReportSectionComponents/ExternalDrivers";
import SupplyChain from "./ReportSectionComponents/SupplyChain";
import RegulationsAndPolicies from "./ReportSectionComponents/RegulationAndPolicies";
import MarketSegmentation from "./ReportSectionComponents/MarketSegmentation";
import MarketShareConcentration from "./ReportSectionComponents/MarketConcentration";
import SWOTAnalysis from "./ReportSectionComponents/SWOTAnalysis";
import DemandDeterminants from "./ReportSectionComponents/DemandDeterminant";
import IndustryAssistance from "./ReportSectionComponents/IndustryAssistance";
import TechnologicalChange from "./ReportSectionComponents/TechChange";
import RevenueVolatility from "./ReportSectionComponents/RevenureVolatile";
import CapitalIntensity from "./ReportSectionComponents/CapitalIntensity";
import KeyTrends from "./ReportSectionComponents/KeyTrends";
import FutureOutlookComponent from "./ReportSectionComponents/FutureOutlook";
import CurrentPerformanceComponent from "./ReportSectionComponents/CurrentPerformance";
import BarriersToEntryComponent from "./ReportSectionComponents/BarrierToEntry";
import ScorecardComponent from "./ReportSectionComponents/ScoreCard";
import IndustryImpact from "./ReportSectionComponents/IndustryImpact";
import RadarChartComponent from "./ReportSectionComponents/ScoreCardRadar";

// Define the data structure for the report section
interface KeyStatisticsData {
  [key: string]: any;
}

interface MetricsData {
  Aspect: string;
  Scores: {
    Category: string;
    Result: string;
    Score?: number;
  }[];
}

interface SectionData {
  report_title?: string;
  industry_definition?: string;
  executive_summary?: string;
  key_statistics?: KeyStatisticsData;
  industry_impact?: object;
  metrics?: MetricsData[];
  key_trends?: string[];
  current_performance?: object[];
  future_outlook?: object[];
  demand_determinants?: object[];
  market_segmentation?: object[];
  barriers_to_entry?: object[];
  market_share_concentration?: object;
  supply_chain?: object;
  external_drivers?: object[];
  regulations_and_policies?: object;
  industry_assistance?: object;
  technological_change?: object;
  revenue_volatility?: object;
  capital_intensity?: object;
  swot_analysis?: object;
  cost_factors?: object;
  [key: string]: any; // Catch-all for untyped fields
}

interface ReportLayoutProps {
  data: SectionData[] | SectionData;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({ data }) => {
  const reportData = Array.isArray(data) ? data : [data];

  const hasContent = (field: any): boolean => {
    return (
      field &&
      ((typeof field === "string" && field.trim() !== "") ||
        (Array.isArray(field) && field.length > 0) ||
        (typeof field === "object" && Object.keys(field).length > 0))
    );
  };

  const renderOverviewSection = (section: SectionData) => {
    if (!section) return null;

    return (
      <div className="flex flex-col md:flex-row md:gap-6">
        <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl p-6 w-11/12">
          <div className="flex flex-col mb-6">
            {hasContent(section.report_title) && (
              <h1 className="text-2xl font-semibold text-white">
                {section.report_title}
              </h1>
            )}
          </div>
          {hasContent(section.industry_definition) && (
            <p className="text-base md:text-xs xl:text-xl 2xl:text-lg text-gray-400">
              {section.industry_definition}
            </p>
          )}
          {hasContent(section.executive_summary) && (
            <p className="text-base md:text-xs xl:text-xl 2xl:text-lg text-gray-400 mt-10">
              {section.executive_summary}
            </p>
          )}
        </div>
        {hasContent(section.key_statistics) && (
          <div className="mx-2">
            <div className="md:p-6 xl:p-4 2xl:p-4 rounded-xl">
              <KeyStatistics statistics={section.key_statistics} />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="p-4 text-gray-400">
        No data available for this industry.
      </div>
    );
  }

  return (
    <div className="p-4">
      {reportData.map((section, index) => (
        <div key={index}>
          {renderOverviewSection(section)}
          {(hasContent(section.industry_impact) || hasContent(section.metrics)) && (
            <div className="flex flex-col md:flex-row gap-8 mt-4">
              <div className="flex bg-[#171717] border rounded-xl border-[#2e2e2e] justify-between gap-8">
                {hasContent(section.industry_impact) && (
                  <IndustryImpact industryImpact={section.industry_impact} />
                )}
                {hasContent(section.metrics) && (
                  <div className="mt-5 mx-10 -mb-10">
                    <RadarChartComponent metrics={section.metrics || []} />
                  </div>
                )}
              </div>
              {hasContent(section.metrics) && (
                <div className="h-full gap-8">
                  <ScorecardComponent metrics={section.metrics || []} />
                </div>
              )}
            </div>
          )}
          {hasContent(section.key_trends) && (
            <div className="p-4 bg-[#171717] border border-[#2e2e2e] rounded-xl gap-8 mt-4">
              <p className="text-2xl mx-10 my-5 font-semibold text-white">
                Industry Trends
              </p>
              <div className="mx-20">
                <KeyTrends keyTrends={section.key_trends || []} />
              </div>
            </div>
          )}
          {hasContent(section.current_performance) && (
            <CurrentPerformanceComponent
              currentPerformance={section.current_performance || []}
            />
          )}
          {hasContent(section.future_outlook) && (
            <FutureOutlookComponent
              futureOutlook={section.future_outlook || []}
            />
          )}
          {hasContent(section.demand_determinants) && (
            <DemandDeterminants
              demandDeterminants={section.demand_determinants || []}
            />
          )}
          {hasContent(section.market_segmentation) && (
            <MarketSegmentation
              marketSegmentation={section.market_segmentation || []}
            />
          )}
          {hasContent(section.barriers_to_entry) && (
            <BarriersToEntryComponent
              barriersToEntry={section.barriers_to_entry || {}}
            />
          )}
          {hasContent(section.market_share_concentration) && (
            <MarketShareConcentration
              concentrationData={section.market_share_concentration || {}}
            />
          )}
          {hasContent(section.supply_chain) && (
            <SupplyChain supplyChain={section.supply_chain || {}} />
          )}
          {hasContent(section.external_drivers) && (
            <ExternalDrivers drivers={section.external_drivers || []} />
          )}
          {hasContent(section.regulations_and_policies) && (
            <RegulationsAndPolicies
              regulations={section.regulations_and_policies || {}}
            />
          )}
          {hasContent(section.industry_assistance) && (
            <IndustryAssistance
              industryAssistance={section.industry_assistance || {}}
            />
          )}
          {hasContent(section.technological_change) && (
            <TechnologicalChange
              technologicalChange={section.technological_change || {}}
            />
          )}
          {hasContent(section.revenue_volatility) && (
            <RevenueVolatility
              revenueVolatility={section.revenue_volatility || {}}
            />
          )}
          {hasContent(section.capital_intensity) && (
            <CapitalIntensity
              capitalIntensity={section.capital_intensity || {}}
            />
          )}
          {hasContent(section.swot_analysis) && (
            <SWOTAnalysis swotAnalysis={section.swot_analysis || {}} />
          )}
        </div>
      ))}
    </div>
  );
};

export default ReportLayout;
