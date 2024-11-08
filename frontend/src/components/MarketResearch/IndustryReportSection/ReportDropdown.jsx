import React, { useRef, useState, useEffect } from "react";
import FAQsComponent from "../../Faqs/FAQs";
import KeyStatistics from "./ReportSectionComponents/KeyStatistics";
import ExternalDrivers from "./ReportSectionComponents/ExternalDrivers";
import SupplyChain from "./ReportSectionComponents/SupplyChain";
import RegulationsAndPolicies from "./ReportSectionComponents/RegulationNPolicies";
import MarketSegmentation from "./ReportSectionComponents/MarketSegmentation";
import MarketShareConcentration from "./ReportSectionComponents/MarketConcentration";
import SWOTAnalysis from "./ReportSectionComponents/SWOTAnalysis";
import DemandDeterminants from "./ReportSectionComponents/DemandDeterminants";
import IndustryAssistance from "./ReportSectionComponents/IndustryAssistance";
import TechnologicalChange from "./ReportSectionComponents/TechChange";
import RevenueVolatility from "./ReportSectionComponents/RevenueVolatility";
import CapitalIntensity from "./ReportSectionComponents/CapitalIntensitivity";
import CostFactors from "./ReportSectionComponents/CostFactor";
import KeyTrends from "./ReportSectionComponents/KeyTrends";
import FutureOutlookComponent from "./ReportSectionComponents/FutureOutlook";
import CurrentPerformanceComponent from "./ReportSectionComponents/CurrentPerformance";
import BarriersToEntryComponent from "./ReportSectionComponents/BarriersToEntry";
import ScorecardComponent from "./ReportSectionComponents/ScoreCard";
import IndustryImpact from "./ReportSectionComponents/IndustryImpact";
import RadarChartComponent from "./ReportSectionComponents/ScoreCardRadarChart";

const ReportDropdown = ({ data, sidebarSections }) => {
  const reportData = Array.isArray(data) ? data : [data];

  // Helper function to check if a field exists and has content
  const hasContent = (field) => {
    return field && (
      (typeof field === 'string' && field.trim() !== '') ||
      (Array.isArray(field) && field.length > 0) ||
      (typeof field === 'object' && Object.keys(field).length > 0)
    );
  };

  // Helper function to render the overview section
  const renderOverviewSection = (section) => {
    if (!section) return null;

    return (
      <div className="flex mt-10">
        <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            {hasContent(section.report_title) && (
              <h1 className="text-4xl text-white">
                {section.report_title}
              </h1>
            )}
          </div>

          {hasContent(section.industry_definition) && (
            <div>
              <p className="text-lg text-gray-400">
                {section.industry_definition}
              </p>
            </div>
          )}
          
          {hasContent(section.executive_summary) && (
            <div>
              <p className="text-lg text-gray-400 mt-10">
                {section.executive_summary}
              </p>
            </div>
          )}
        </div>
        {hasContent(section.key_statistics) && (
          <div className="mx-5">
            <KeyStatistics statistics={section.key_statistics} />
          </div>
        )}
      </div>
    );
  };

  // Main render function with error handling
  if (!data) {
    return <div className="p-4 text-gray-400">No report data available.</div>;
  }
  
  return (
    <div className="flex">
      <div className="p-4">
        {reportData.map((section, index) => (
          <div key={index} className="space-y-8">
            {renderOverviewSection(section)}

            {(hasContent(section.industry_impact) || hasContent(section.metrics)) && (
              <div className="flex space-x-2">
                <div className="flex bg-[#171717] md:3/5 xl:w-4/5 border rounded-xl border-[#2e2e2e] justify-between">
                  {hasContent(section.industry_impact) && (
                    <IndustryImpact industryImpact={section.industry_impact} />
                  )}
                  {hasContent(section.metrics) && (
                    <div className="mt-5 mx-10 -mb-10">
                      <RadarChartComponent metrics={section.metrics} />
                    </div>
                  )}
                </div>
                {hasContent(section.metrics) && (
                  <div className="h-full">
                    <ScorecardComponent metrics={section.metrics} />
                  </div>
                )}
              </div>
            )}

            {hasContent(section.key_trends) && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e] rounded-xl">
                <p className="text-2xl mx-10 my-5 font-semibold text-white">
                  Industry Trends
                </p>
                <div className="mx-20">
                  <KeyTrends keyTrends={section.key_trends} />
                </div>
              </div>
            )}

            {(hasContent(section.current_performance) || hasContent(section.future_outlook)) && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e] rounded-xl">
                <p className="text-2xl mx-10 my-5 font-semibold text-white">
                  Insights & Future Outlook 
                </p>
                {hasContent(section.current_performance) && (
                  <CurrentPerformanceComponent
                    currentPerformance={section.current_performance}
                  />
                )}
                {hasContent(section.future_outlook) && (
                  <FutureOutlookComponent
                    futureOutlook={section.future_outlook}
                  />
                )}
              </div>
            )}

            {hasContent(section.demand_determinants) && (
              <div className="bg-[#171717] border border-[#2e2e2e] p-3 rounded-lg">
                <DemandDeterminants
                  demandDeterminants={section.demand_determinants}
                />
              </div>
            )}

            {hasContent(section.market_segmentation) && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e] rounded-xl">
                <p className="text-2xl mx-10 my-5 font-semibold text-white">
                  Market Segmentation
                </p>
                <MarketSegmentation
                  marketSegmentation={section.market_segmentation}
                />
              </div>
            )}

            {hasContent(section.barriers_to_entry) && (
              <BarriersToEntryComponent
                barriersToEntry={section.barriers_to_entry}
              />
            )}

            {hasContent(section.market_share_concentration) && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e] rounded-xl">
                <MarketShareConcentration
                  concentrationData={section.market_share_concentration}
                />
              </div>
            )}

            {hasContent(section.supply_chain) && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e] rounded-xl">
                <p className="text-xl mx-10 my-5 font-semibold text-white">
                  Supply Chain
                </p>
                <SupplyChain supplyChain={section.supply_chain} />
              </div>
            )}

            {hasContent(section.external_drivers) && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e] rounded-xl">
                <p className="text-2xl mx-10 my-5 font-semibold text-white">
                  External Drivers
                </p>
                <div className="mx-20">
                  <ExternalDrivers drivers={section.external_drivers} />
                </div>
              </div>
            )}

            {hasContent(section.regulations_and_policies) && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e]">
                <RegulationsAndPolicies
                  regulations={section.regulations_and_policies}
                />
              </div>
            )}

            {hasContent(section.industry_assistance) && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e]">
                <IndustryAssistance
                  industryAssistance={section.industry_assistance}
                />
              </div>
            )}

            {hasContent(section.technological_change) && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e]">
                <TechnologicalChange
                  technologicalChange={section.technological_change}
                />
              </div>
            )}

            {hasContent(section.revenue_volatility) && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e]">
                <RevenueVolatility
                  revenueVolatility={section.revenue_volatility}
                />
              </div>
            )}

            {hasContent(section.capital_intensity) && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e] rounded-b-xl">
                <CapitalIntensity
                  capitalIntensity={section.capital_intensity}
                />
              </div>
            )}

            {hasContent(section.swot_analysis) && (
              <SWOTAnalysis swotAnalysis={section.swot_analysis} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportDropdown;