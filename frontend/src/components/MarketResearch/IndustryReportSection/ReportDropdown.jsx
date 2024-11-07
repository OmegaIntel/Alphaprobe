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
  // Helper function to render the overview section
  const renderOverviewSection = (section) => {
    if (!section) return null;

    return (
      <div className="flex ">
        <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-4xl text-white">
              {section.report_title || "No Title Available"}
            </h1>
          </div>

          {section.industry_definition && (
            <div>
              <p className="text-lg text-gray-400">
                {section.industry_definition}
              </p>
            </div>
          )}
          <div className="space-y-6">
            {section.executive_summary && (
              <div>
                <p className="text-lg text-gray-400 mt-10">
                  {section.executive_summary}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="mx-5">
          {section.key_statistics && (
            <div>
              <KeyStatistics statistics={section.key_statistics} />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main render function with error handling
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="p-4 text-gray-400">No report data available.</div>;
  }
  return (
    <div className="flex">
      <div className="p-4">
        {data.map((section, index) => (
          <div key={index} className="space-y-8">
            {/* Overview Section - Grouped components */}
            {renderOverviewSection(section)}

            <div className="flex space-x-2 ">
              <div className="flex bg-[#171717] md:3/5 xl:w-4/5 border border-[#2e2e2e] justify-between">
                {section.industry_impact && (
                  <IndustryImpact industryImpact={section.industry_impact} />
                )}
                {section.metrics && (
                  <div className=" my-5 mx-10">
                    <RadarChartComponent  metrics={section.metrics}/>
                  </div>
                )}
              </div>
              <div>
                {section.metrics && (
                  <div className="">
                    <ScorecardComponent metrics={section.metrics} />
                  </div>
                )}
              </div>
            </div>

            {section.key_trends && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e]  rounded-xl">
                <p className="text-xl mx-10 my-5 font-semibold text-white">
                  Industry Trends
                </p>
                <div className="mx-20">
                  <KeyTrends keyTrends={section.key_trends} />
                </div>
              </div>
            )}

            <div className="p-4 bg-[#171717] border border-[#2e2e2e] rounded-xl">
              <p className="text-xl mx-10 my-5 font-semibold text-white">
                Insights & Future Outlook 
              </p>
              {section.current_performance && (
                <div>
                  <CurrentPerformanceComponent
                    currentPerformance={section.current_performance}
                  />
                </div>
              )}
              {section.future_outlook && (
                <div>
                  <FutureOutlookComponent
                    futureOutlook={section.future_outlook}
                  />
                </div>
              )}
            </div>

            {/* {section.products_and_services && (
            <div>
              <ProductsAndServices products={section.products_and_services} />
            </div>
          )} */}

            {section.demand_determinants && (
              <div className="bg-[#171717] border border-[#2e2e2e]  p-3 rounded-lg">
                <DemandDeterminants
                  demandDeterminants={section.demand_determinants}
                />
              </div>
            )}

            <div>
              {section.market_segmentation && (
                <div className="p-4 bg-[#171717] border border-[#2e2e2e]  rounded-xl">
                  <p className="text-xl mx-10 my-5 font-semibold text-white">
                    Market Segmentation
                  </p>
                  <MarketSegmentation
                    marketSegmentation={section.market_segmentation}
                  />
                </div>
              )}
            </div>

            {section.barriers_to_entry && (
              <div>
                <BarriersToEntryComponent
                  barriersToEntry={section.barriers_to_entry}
                />
              </div>
            )}
            {section.market_share_concentration && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e]  rounded-xl">
                <MarketShareConcentration
                  concentrationData={section.market_share_concentration}
                />
              </div>
            )}
            {section.supply_chain && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e]  rounded-xl">
                <p className="text-xl mx-10 my-5 font-semibold text-white">
                  Supply Chain
                </p>
                <SupplyChain supplyChain={section.supply_chain} />
              </div>
            )}

            {/* Trends and Other things */}
            <div>
              {section.external_drivers && (
                <div className="p-4 bg-[#171717] border border-[#2e2e2e]  rounded-xl">
                  <p className="text-xl mx-10 my-5 font-semibold text-white">
                    External Drivers
                  </p>
                  <div className="mx-20">
                    <ExternalDrivers drivers={section.external_drivers} />
                  </div>
                </div>
              )}

              {section.regulations_and_policies && (
                <div className="p-4 bg-[#171717] border border-[#2e2e2e]  rounded-xl">
                  <RegulationsAndPolicies
                    regulations={section.regulations_and_policies}
                  />
                </div>
              )}
              {section.industry_assistance && (
                <div className="p-4 bg-[#171717] border border-[#2e2e2e]  rounded-xl">
                  <IndustryAssistance
                    industryAssistance={section.industry_assistance}
                  />
                </div>
              )}
              {section.technological_change && (
                <div className="p-4 bg-[#171717] border border-[#2e2e2e]  rounded-xl">
                  <TechnologicalChange
                    technologicalChange={section.technological_change}
                  />
                </div>
              )}
              {section.revenue_volatility && (
                <div className="p-4 bg-[#171717] border border-[#2e2e2e]  rounded-xl">
                  <RevenueVolatility
                    revenueVolatility={section.revenue_volatility}
                  />
                </div>
              )}
              {section.capital_intensity && (
                <div className="p-4 bg-[#171717] border border-[#2e2e2e]  rounded-xl">
                  <CapitalIntensity
                    capitalIntensity={section.capital_intensity}
                  />
                </div>
              )}
            </div>
            {section.swot_analysis && (
              <SWOTAnalysis swotAnalysis={section.swot_analysis} />
            )}
            {section.FAQs && (
              <div className="p-4 bg-[#171717] border border-[#2e2e2e]  rounded-xl">
                <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
                  FAQs
                </p>
                <FAQsComponent faqs={section.FAQs} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportDropdown;

// import { useState } from "react";
// import FAQsComponent from "../../Faqs/FAQs";
// import KeyStatistics from "./ReportSectionComponents/KeyStatistics"; // Import KeyStatistics component
// import SimpleTextBox from "./ReportSectionComponents/SimpleTextBox";
// import ExternalDrivers from "./ReportSectionComponents/ExternalDrivers";
// import SupplyChain from "./ReportSectionComponents/SupplyChain";
// import SimpleList from "./ReportSectionComponents/SimpleList";
// import { ProductsAndServices } from "./ReportSectionComponents/SimpleAccordian";
// import RegulationsAndPolicies from "./ReportSectionComponents/RegulationNPolicies";
// import MarketSegmentation from "./ReportSectionComponents/MarketSegmentation";
// import MarketShareConcentration from "./ReportSectionComponents/MarketConcentration";

// // Utility function to format the headings
// const formatHeading = (heading) => {
//   return heading
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());
// };

// const ReportDropdown = ({ data }) => {
//   const [openSections, setOpenSections] = useState({});
//   const [openFAQs, setOpenFAQs] = useState(false);
//   const [showAllKeyTrends, setShowAllKeyTrends] = useState(false);
//   const [showAllCurr, setShowAllCurr] = useState(false);
//   const [openedPerformancePoints, setOpenedPerformancePoints] = useState([]);
//   const [showAllFut, setShowAllFut] = useState(false);
//   const [openedFut, setOpenedFut] = useState([]);

//   // Toggle section open/close state
//   const toggleSection = (key) => {
//     setOpenSections((prevState) => ({
//       ...prevState,
//       [key]: !prevState[key],
//     }));
//   };

//   // Toggle FAQs open/close state
//   const toggleFAQs = () => {
//     setOpenFAQs((prev) => !prev);
//   };

//   const renderContents = (contents, parentKey = "") => {
//     if (Array.isArray(contents)) {
//       return (
//         <ul className="ml-6 list-disc">
//           {contents.map((item, index) => {
//             const currentKey = `${parentKey}-${index}`;

//             if (typeof item === "object" && item !== null) {
//               const keys = Object.keys(item);
//               return (
//                 <li key={currentKey} className="py-2">
//                   {keys.map((key) => (
//                     <div key={`${currentKey}-${key}`}>
//                       {typeof item[key] === "object" && item[key] !== null ? (
//                         <>
//                           <button
//                             onClick={() =>
//                               toggleSection(`${currentKey}-${key}`)
//                             }
//                             className="text-lg font-semibold focus:outline-none"
//                           >
//                             {formatHeading(key)}{" "}
//                             {openSections[`${currentKey}-${key}`] ? "▲" : "▼"}
//                           </button>
//                           {openSections[`${currentKey}-${key}`] &&
//                             renderContents(item[key], `${currentKey}-${key}`)}
//                         </>
//                       ) : (
//                         <span className="block py-1">
//                           <strong>{formatHeading(key)}: </strong>
//                           {item[key]?.toString() || "No data"}
//                         </span>
//                       )}
//                     </div>
//                   ))}
//                 </li>
//               );
//             } else {
//               return (
//                 <li key={currentKey} className="py-2">
//                   <span>{item?.toString() || "No data"}</span>
//                 </li>
//               );
//             }
//           })}
//         </ul>
//       );
//     }

//     if (typeof contents === "object" && contents !== null) {
//       return (
//         <ul className="ml-6 list-disc">
//           {Object.keys(contents).map((key, index) => {
//             const currentKey = `${parentKey}-${index}`;
//             return (
//               <li key={currentKey} className="py-2">
//                 {typeof contents[key] === "object" && contents[key] !== null ? (
//                   <>
//                     <button
//                       onClick={() => toggleSection(currentKey)}
//                       className="text-lg font-semibold focus:outline-none"
//                     >
//                       {formatHeading(key)}{" "}
//                       {openSections[currentKey] ? "▲" : "▼"}
//                     </button>
//                     {openSections[currentKey] &&
//                       renderContents(contents[key], currentKey)}
//                   </>
//                 ) : (
//                   <span className="block py-1">
//                     <strong>{formatHeading(key)}: </strong>
//                     {contents[key]?.toString() || "No data"}
//                   </span>
//                 )}
//               </li>
//             );
//           })}
//         </ul>
//       );
//     }

//     return (
//       <span className="block py-1">{contents?.toString() || "No data"}</span>
//     );
//   };

//   return (
//     <div className="p-4 rounded-lg">
//       {data && data.length > 0 ? (
//         data.map((section, index) => {
//           const sectionKey = `section-${index}`;
//           const keys = Object.keys(section);
//           return (
//             <div key={sectionKey} className="my-4">
//               {keys.map((key) => {

//                 if (key === "FAQs") {
//                   return (
//                     <div key={sectionKey}>
//                       <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                       <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
//                         FAQs
//                       </p>
//                       <FAQsComponent faqs={section[key]} />
//                     </div>
//                     </div>
//                   );
//                 }
//                 if (key === "report_title" || key === "report_date") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="flex flex-row justify-between items-center"
//                     >
//                       {key === "report_title" && (
//                         <h1 className="text-4xl text-gray-300">
//                           {section[key]}
//                         </h1>
//                       )}
//                       {key === "report_date" && (
//                         <p className="text-xl text-gray-500 my-3">
//                           Date: {section[key]}
//                         </p>
//                       )}
//                     </div>
//                   );
//                 }
//                 if (key === "executive_summary") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                       <p className="text-2xl my-5 text-gray-400">
//                         Executive Summary
//                       </p>
//                       <h1 className="text-lg text-gray-400">{section[key]}</h1>
//                     </div>
//                   );
//                 }
//                 if (key === "industry_definition") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                       <p className="text-xl my-5 text-gray-400">
//                         Industry Defination
//                       </p>
//                       <h1 className="text-lg text-gray-400">{section[key]}</h1>
//                     </div>
//                   );
//                 }
//                 if (key === "key_statistics") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10 shadow-md"
//                     >
//                       <p className="text-2xl my-5 font-semibold text-gray-400">
//                         Key Statistics
//                       </p>
//                       <KeyStatistics statistics={section[key]}/>
//                     </div>
//                   );
//                 }
//                 if (key === "swot_analysis") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                       <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
//                         SWOT Analysis
//                       </p>
//                       <div className="space-y-4 grid gap-10 grid-cols-2 p-5 px-12 items-start justify-center mx-20">
//                         <div className="h-96 w-80">
//                           <h2 className="text-xl font-semibold mb-10 text-gray-400">
//                             Strengths
//                           </h2>
//                           <ul className=" text-gray-400">
//                             {section[key].strengths.map((strength, index) => (
//                               <div>
//                                 <div className="flex space-y-1">
//                                   <div className="w-1 mr-1 mb-1 bg-green-400"></div>
//                                   <li key={index} className="mt-1">
//                                     {strength}
//                                   </li>
//                                 </div>
//                                 <div className="h-[1px] w-full bg-gray-500"></div>
//                               </div>
//                             ))}
//                           </ul>
//                         </div>
//                         <div className="h-96 w-80">
//                           <h2 className="text-xl font-semibold mb-10 text-gray-400">
//                             Weaknesses
//                           </h2>
//                           <ul className=" text-gray-400">
//                             {section[key].weaknesses.map((weakness, index) => (
//                               <div>
//                                 <div className="flex space-y-1">
//                                   <div className="w-1 mr-1 mb-1 bg-orange-400"></div>
//                                   <li key={index} className="mt-1">
//                                     {weakness}
//                                   </li>
//                                 </div>
//                                 <div className="h-[1px] w-full bg-gray-500"></div>
//                               </div>
//                             ))}
//                           </ul>
//                         </div>
//                         <div className="h-96 w-80">
//                           <h2 className="text-xl font-semibold mb-10 text-gray-400">
//                             Opportunities
//                           </h2>
//                           <ul className=" text-gray-400">
//                             {section[key].opportunities.map(
//                               (opportunities, index) => (
//                                 <div>
//                                   <div className="flex space-y-1">
//                                     <div className="w-1 mr-1 mb-1 bg-blue-400"></div>
//                                     <li key={index} className="mt-1">
//                                       {opportunities}
//                                     </li>
//                                   </div>
//                                   <div className="h-[1px] w-full bg-gray-500"></div>
//                                 </div>
//                               )
//                             )}
//                           </ul>
//                         </div>
//                         <div className="h-96 w-80">
//                           <h2 className="text-xl font-semibold mb-10 text-gray-400">
//                             Threats
//                           </h2>
//                           <ul className=" text-gray-400">
//                             {section[key].threats.map((strength, index) => (
//                               <div>
//                                 <div className="flex space-y-1">
//                                   <div className="w-1 mr-1 mb-1 bg-pink-400"></div>
//                                   <li key={index} className="mt-1">
//                                     {strength}
//                                   </li>
//                                 </div>
//                                 <div className="h-[1px] w-full bg-gray-500"></div>
//                               </div>
//                             ))}
//                           </ul>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 }
//                 if (key === "current_performance") {

//                   const displayedPerformancePoints = showAllCurr
//                     ? section[key]
//                     : section[key].slice(0, 4);

//                   const remainingPerformancePointsCount = section[key].length > 4
//                     ? section[key].length - 4
//                     : 0;

//                   // Toggle individual performance point
//                   const togglePerformancePoint = (index) => {
//                     setOpenedPerformancePoints(prev =>
//                       prev.includes(index)
//                         ? prev.filter(item => item !== index)
//                         : [...prev, index]
//                     );
//                   };

//                   return (
//                     <div
//       key={sectionKey}
//       className="p-4 bg-gray-600/30 rounded-xl my-10"
//     >
//       <p className="text-xl text-gray-400 my-5 font-semibold">
//         Current Performance
//       </p>
//       <div className="space-y-2 grid gap-5 grid-cols-1 p-4 items-start">
//         {displayedPerformancePoints.map((performancePoint, index) => (
//           <div
//             key={index}
//             className=" p-2 rounded-lg bg-gray-700/30 cursor-pointer"
//             onClick={() => togglePerformancePoint(index)}
//           >
//             <h2 className="text-lg font-semibold text-gray-400">
//               {performancePoint.current_performance_point_title}
//             </h2>

//             {openedPerformancePoints.includes(index) && (
//               <p className="text-gray-400 mt-3 animate-fade-in">
//                 {performancePoint.current_performance_point_description}
//               </p>
//             )}
//           </div>
//         ))}

//         {!showAllCurr && remainingPerformancePointsCount > 0 && (
//           <button
//             onClick={() => setShowAllCurr(true)}
//             className="mt-4 w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md"
//           >
//             Show {remainingPerformancePointsCount} More Performance Point{remainingPerformancePointsCount !== 1 ? 's' : ''}
//           </button>
//         )}

//         {showAllCurr && (
//           <button
//             onClick={() => setShowAllCurr(false)}
//             className="mt-4 w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md"
//           >
//             Show Less
//           </button>
//         )}
//       </div>
//     </div>
//                   );
//                 }
//                 if (key === "future_outlook") {

//                   const displayedPerformancePoints = showAllFut
//                     ? section[key]
//                     : section[key].slice(0, 4);

//                   const remainingPerformancePointsCount = section[key].length > 4
//                     ? section[key].length - 4
//                     : 0;

//                   // Toggle individual performance point
//                   const togglePerformancePoint = (index) => {
//                     setOpenedFut(prev =>
//                       prev.includes(index)
//                         ? prev.filter(item => item !== index)
//                         : [...prev, index]
//                     );
//                   };

//                   return (
//                     <div
//       key={sectionKey}
//       className="p-4 bg-gray-600/30 rounded-xl my-10"
//     >
//       <p className="text-xl text-gray-400 my-5 font-semibold">
//         Future Impact
//       </p>
//       <div className="space-y-2 grid gap-5 grid-cols-1 p-4 items-start">
//         {displayedPerformancePoints.map((performancePoint, index) => (
//           <div
//             key={index}
//             className=" p-2 rounded-lg bg-gray-700/30 cursor-pointer"
//             onClick={() => togglePerformancePoint(index)}
//           >
//             <h2 className="text-lg font-semibold text-gray-400">
//               {performancePoint.future_outlook_point_title}
//             </h2>

//             {openedFut.includes(index) && (
//               <p className="text-gray-400 mt-3 animate-fade-in">
//                 {performancePoint.future_outlook_point_description}
//               </p>
//             )}
//           </div>
//         ))}

//         {!showAllFut && remainingPerformancePointsCount > 0 && (
//           <button
//             onClick={() => setShowAllFut(true)}
//             className="mt-4 w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md"
//           >
//             Show {remainingPerformancePointsCount} More Performance Point{remainingPerformancePointsCount !== 1 ? 's' : ''}
//           </button>
//         )}

//         {showAllFut && (
//           <button
//             onClick={() => setShowAllFut(false)}
//             className="mt-4 w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md"
//           >
//             Show Less
//           </button>
//         )}
//       </div>
//     </div>
//                   );
//                 }
//                 if (key === "industry_impact") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                       <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
//                         Industry Impact
//                       </p>
//                       <div className="space-y-4 grid gap-10 grid-cols-2 p-5 px-12 items-start justify-center mx-20">
//                         <div className="h-96 w-80">
//                           <h2 className="text-xl font-semibold mb-10 text-gray-400">
//                             Negative Impact Factor
//                           </h2>
//                           <ul className=" text-gray-400">
//                             {section[key].negative_impact_factors.map(
//                               (strength, index) => (
//                                 <div>
//                                   <div className="flex space-y-1">
//                                     <div className="w-1 mr-1 mb-1 bg-red-400"></div>
//                                     <li key={index} className="mt-1">
//                                       {strength}
//                                     </li>
//                                   </div>
//                                   <div className="h-[1px] w-full bg-gray-500"></div>
//                                 </div>
//                               )
//                             )}
//                           </ul>
//                         </div>
//                         <div className="h-96 w-80">
//                           <h2 className="text-xl font-semibold mb-10 text-gray-400">
//                             Positive Impact Factor
//                           </h2>
//                           <ul className=" text-gray-400">
//                             {section[key].positive_impact_factors.map(
//                               (weakness, index) => (
//                                 <div>
//                                   <div className="flex space-y-1">
//                                     <div className="w-1 mr-1 mb-1 bg-blue-400"></div>
//                                     <li key={index} className="mt-1">
//                                       {weakness}
//                                     </li>
//                                   </div>
//                                   <div className="h-[1px] w-full bg-gray-500"></div>
//                                 </div>
//                               )
//                             )}
//                           </ul>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 }
//                 if (key === "key_trends") {

//                   const displayedTrends = showAllKeyTrends ? section[key] : section[key].slice(0, 4);
//                   const remainingTrendsCount = section[key].length - 4;

//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                       <p className="text-xl text-gray-400 my-5 font-semibold">Key Trends</p>
//                       <div>
//                         <ul className="list-disc list-inside space-y-4 text-gray-400 p-5">
//                           {displayedTrends.map((strength, index) => (
//                             <li key={index}>{strength}</li>
//                           ))}
//                         </ul>

//                         {!showAllKeyTrends && remainingTrendsCount > 0 && (
//                           <button
//                             onClick={() => setShowAllKeyTrends(true)}
//                             className="mt-4 w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md"
//                           >
//                             Show {remainingTrendsCount} More Trend{remainingTrendsCount !== 1 ? 's' : ''}
//                           </button>
//                         )}

//                         {showAllKeyTrends && (
//                           <button
//                             onClick={() => setShowAllKeyTrends(false)}
//                             className="mt-4 w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md"
//                           >
//                             Show Less
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 }
//                 if (key === "external_drivers") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                       <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
//                         External Drivers
//                       </p>
//                       <div className="mx-20">
//                         <ExternalDrivers drivers={section[key]}/>
//                       </div>
//                     </div>
//                   );
//                 }
//                 if (key === "supply_chain") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                       <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
//                         Supply Chain
//                       </p>
//                      <SupplyChain  supplyChain={section[key]}/>
//                  </div>
//                   );
//                 }
//                 if (key === "similar_industries") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                       <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
//                        Similar Industries
//                       </p>
//                      <SimpleList industries={section[key]}/>
//                  </div>
//                   );
//                 }
//                 if (key === "related_international_industries") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                       <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
//                        Related International Industries
//                       </p>
//                      <SimpleList industries={section[key]}/>
//                  </div>
//                   );
//                 }
//                 if (key === "products_and_services") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                      <ProductsAndServices products={section[key]}/>
//                  </div>
//                   );
//                 }
//                 if (key === "regulations_and_policies") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                      <RegulationsAndPolicies regulations={section[key]}/>
//                  </div>
//                   );
//                 }
//                 if (key === "market_segmentation") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                      <MarketSegmentation marketSegmentation={section[key]}/>
//                  </div>
//                   );
//                 }
//                 if (key === "market_share_concentration") {
//                   return (
//                     <div
//                       key={sectionKey}
//                       className="p-4 bg-gray-600/30 rounded-xl my-10"
//                     >
//                      <MarketShareConcentration concentrationData={section[key]}/>
//                  </div>
//                   );
//                 }
//                 return (
//                   <div key={`${sectionKey}-${key}`}>
//                     {typeof section[key] === "object" &&
//                     section[key] !== null ? (
//                       <>
//                         <button
//                           onClick={() => toggleSection(`${sectionKey}-${key}`)}
//                           className="text-xl font-bold text-white bg-gray-900 hover:bg-gray-950 px-4 py-2 w-full text-left focus:outline-none my-1 rounded-md"
//                         >
//                           {formatHeading(key)}{" "}
//                           {openSections[`${sectionKey}-${key}`] ? "▲" : "▼"}
//                         </button>
//                         {openSections[`${sectionKey}-${key}`] &&
//                           renderContents(section[key], `${sectionKey}-${key}`)}
//                       </>
//                     ) : (
//                       <div className="py-5">
//                         <strong>{formatHeading(key)}: </strong>
//                         {section[key]?.toString() || "No data"}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           );
//         })
//       ) : (
//         <p className="text-gray-500">No data available.</p>
//       )}
//     </div>
//   );
// };

// export default ReportDropdown;
