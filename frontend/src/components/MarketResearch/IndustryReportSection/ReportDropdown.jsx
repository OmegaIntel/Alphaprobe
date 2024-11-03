import { useState } from "react";
import FAQsComponent from "../../Faqs/FAQs";
import KeyStatistics from "./ReportSectionComponents/KeyStatistics"; // Import KeyStatistics component
import SimpleTextBox from "./ReportSectionComponents/SimpleTextBox";
import ExternalDrivers from "./ReportSectionComponents/ExternalDrivers";
import SupplyChain from "./ReportSectionComponents/SupplyChain";
import SimpleList from "./ReportSectionComponents/SimpleList";
import { ProductsAndServices } from "./ReportSectionComponents/SimpleAccordian";
import RegulationsAndPolicies from "./ReportSectionComponents/RegulationNPolicies";
import MarketSegmentation from "./ReportSectionComponents/MarketSegmentation";
import MarketShareConcentration from "./ReportSectionComponents/MarketConcentration";

// Utility function to format the headings
const formatHeading = (heading) => {
  return heading
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const ReportDropdown = ({ data }) => {
  const [openSections, setOpenSections] = useState({});
  const [openFAQs, setOpenFAQs] = useState(false);
  const [showAllKeyTrends, setShowAllKeyTrends] = useState(false);
  const [showAllCurr, setShowAllCurr] = useState(false);
  const [openedPerformancePoints, setOpenedPerformancePoints] = useState([]);
  const [showAllFut, setShowAllFut] = useState(false);
  const [openedFut, setOpenedFut] = useState([]);

  // Toggle section open/close state
  const toggleSection = (key) => {
    setOpenSections((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  // Toggle FAQs open/close state
  const toggleFAQs = () => {
    setOpenFAQs((prev) => !prev);
  };

  const renderContents = (contents, parentKey = "") => {
    if (Array.isArray(contents)) {
      return (
        <ul className="ml-6 list-disc">
          {contents.map((item, index) => {
            const currentKey = `${parentKey}-${index}`;

            if (typeof item === "object" && item !== null) {
              const keys = Object.keys(item);
              return (
                <li key={currentKey} className="py-2">
                  {keys.map((key) => (
                    <div key={`${currentKey}-${key}`}>
                      {typeof item[key] === "object" && item[key] !== null ? (
                        <>
                          <button
                            onClick={() =>
                              toggleSection(`${currentKey}-${key}`)
                            }
                            className="text-lg font-semibold focus:outline-none"
                          >
                            {formatHeading(key)}{" "}
                            {openSections[`${currentKey}-${key}`] ? "▲" : "▼"}
                          </button>
                          {openSections[`${currentKey}-${key}`] &&
                            renderContents(item[key], `${currentKey}-${key}`)}
                        </>
                      ) : (
                        <span className="block py-1">
                          <strong>{formatHeading(key)}: </strong>
                          {item[key]?.toString() || "No data"}
                        </span>
                      )}
                    </div>
                  ))}
                </li>
              );
            } else {
              return (
                <li key={currentKey} className="py-2">
                  <span>{item?.toString() || "No data"}</span>
                </li>
              );
            }
          })}
        </ul>
      );
    }

    if (typeof contents === "object" && contents !== null) {
      return (
        <ul className="ml-6 list-disc">
          {Object.keys(contents).map((key, index) => {
            const currentKey = `${parentKey}-${index}`;
            return (
              <li key={currentKey} className="py-2">
                {typeof contents[key] === "object" && contents[key] !== null ? (
                  <>
                    <button
                      onClick={() => toggleSection(currentKey)}
                      className="text-lg font-semibold focus:outline-none"
                    >
                      {formatHeading(key)}{" "}
                      {openSections[currentKey] ? "▲" : "▼"}
                    </button>
                    {openSections[currentKey] &&
                      renderContents(contents[key], currentKey)}
                  </>
                ) : (
                  <span className="block py-1">
                    <strong>{formatHeading(key)}: </strong>
                    {contents[key]?.toString() || "No data"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      );
    }

    return (
      <span className="block py-1">{contents?.toString() || "No data"}</span>
    );
  };

  return (
    <div className="p-4 rounded-lg">
      {data && data.length > 0 ? (
        data.map((section, index) => {
          const sectionKey = `section-${index}`;
          const keys = Object.keys(section);
          return (
            <div key={sectionKey} className="my-4">
              {keys.map((key) => {

                if (key === "FAQs") {
                  return (
                    <div key={sectionKey}>
                      <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
                        FAQs
                      </p>
                      <FAQsComponent faqs={section[key]} />
                    </div>
                    </div>
                  );
                }
                if (key === "report_title" || key === "report_date") {
                  return (
                    <div
                      key={sectionKey}
                      className="flex flex-row justify-between items-center"
                    >
                      {key === "report_title" && (
                        <h1 className="text-4xl text-gray-300">
                          {section[key]}
                        </h1>
                      )}
                      {key === "report_date" && (
                        <p className="text-xl text-gray-500 my-3">
                          Date: {section[key]}
                        </p>
                      )}
                    </div>
                  );
                }
                if (key === "executive_summary") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-2xl my-5 text-gray-400">
                        Executive Summary
                      </p>
                      <h1 className="text-lg text-gray-400">{section[key]}</h1>
                    </div>
                  );
                }
                if (key === "industry_definition") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-xl my-5 text-gray-400">
                        Industry Defination
                      </p>
                      <h1 className="text-lg text-gray-400">{section[key]}</h1>
                    </div>
                  );
                }
                if (key === "key_statistics") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10 shadow-md"
                    >
                      <p className="text-2xl my-5 font-semibold text-gray-400">
                        Key Statistics
                      </p>
                      <KeyStatistics statistics={section[key]}/>
                    </div>
                  );
                }
                if (key === "swot_analysis") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
                        SWOT Analysis
                      </p>
                      <div className="space-y-4 grid gap-10 grid-cols-2 p-5 px-12 items-start justify-center mx-20">
                        <div className="h-96 w-80">
                          <h2 className="text-xl font-semibold mb-10 text-gray-400">
                            Strengths
                          </h2>
                          <ul className=" text-gray-400">
                            {section[key].strengths.map((strength, index) => (
                              <div>
                                <div className="flex space-y-1">
                                  <div className="w-1 mr-1 mb-1 bg-green-400"></div>
                                  <li key={index} className="mt-1">
                                    {strength}
                                  </li>
                                </div>
                                <div className="h-[1px] w-full bg-gray-500"></div>
                              </div>
                            ))}
                          </ul>
                        </div>
                        <div className="h-96 w-80">
                          <h2 className="text-xl font-semibold mb-10 text-gray-400">
                            Weaknesses
                          </h2>
                          <ul className=" text-gray-400">
                            {section[key].weaknesses.map((weakness, index) => (
                              <div>
                                <div className="flex space-y-1">
                                  <div className="w-1 mr-1 mb-1 bg-orange-400"></div>
                                  <li key={index} className="mt-1">
                                    {weakness}
                                  </li>
                                </div>
                                <div className="h-[1px] w-full bg-gray-500"></div>
                              </div>
                            ))}
                          </ul>
                        </div>
                        <div className="h-96 w-80">
                          <h2 className="text-xl font-semibold mb-10 text-gray-400">
                            Opportunities
                          </h2>
                          <ul className=" text-gray-400">
                            {section[key].opportunities.map(
                              (opportunities, index) => (
                                <div>
                                  <div className="flex space-y-1">
                                    <div className="w-1 mr-1 mb-1 bg-blue-400"></div>
                                    <li key={index} className="mt-1">
                                      {opportunities}
                                    </li>
                                  </div>
                                  <div className="h-[1px] w-full bg-gray-500"></div>
                                </div>
                              )
                            )}
                          </ul>
                        </div>
                        <div className="h-96 w-80">
                          <h2 className="text-xl font-semibold mb-10 text-gray-400">
                            Threats
                          </h2>
                          <ul className=" text-gray-400">
                            {section[key].threats.map((strength, index) => (
                              <div>
                                <div className="flex space-y-1">
                                  <div className="w-1 mr-1 mb-1 bg-pink-400"></div>
                                  <li key={index} className="mt-1">
                                    {strength}
                                  </li>
                                </div>
                                <div className="h-[1px] w-full bg-gray-500"></div>
                              </div>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                }
                if (key === "current_performance") {

                  const displayedPerformancePoints = showAllCurr
                    ? section[key]
                    : section[key].slice(0, 4);

                  const remainingPerformancePointsCount = section[key].length > 4
                    ? section[key].length - 4
                    : 0;

                  // Toggle individual performance point
                  const togglePerformancePoint = (index) => {
                    setOpenedPerformancePoints(prev =>
                      prev.includes(index)
                        ? prev.filter(item => item !== index)
                        : [...prev, index]
                    );
                  };

                  return (
                    <div
      key={sectionKey}
      className="p-4 bg-gray-600/30 rounded-xl my-10"
    >
      <p className="text-xl text-gray-400 my-5 font-semibold">
        Current Performance
      </p>
      <div className="space-y-2 grid gap-5 grid-cols-1 p-4 items-start">
        {displayedPerformancePoints.map((performancePoint, index) => (
          <div
            key={index}
            className=" p-2 rounded-lg bg-gray-700/30 cursor-pointer"
            onClick={() => togglePerformancePoint(index)}
          >
            <h2 className="text-lg font-semibold text-gray-400">
              {performancePoint.current_performance_point_title}
            </h2>

            {openedPerformancePoints.includes(index) && (
              <p className="text-gray-400 mt-3 animate-fade-in">
                {performancePoint.current_performance_point_description}
              </p>
            )}
          </div>
        ))}

        {!showAllCurr && remainingPerformancePointsCount > 0 && (
          <button
            onClick={() => setShowAllCurr(true)}
            className="mt-4 w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md"
          >
            Show {remainingPerformancePointsCount} More Performance Point{remainingPerformancePointsCount !== 1 ? 's' : ''}
          </button>
        )}

        {showAllCurr && (
          <button
            onClick={() => setShowAllCurr(false)}
            className="mt-4 w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md"
          >
            Show Less
          </button>
        )}
      </div>
    </div>
                  );
                }
                if (key === "future_outlook") {

                  const displayedPerformancePoints = showAllFut
                    ? section[key]
                    : section[key].slice(0, 4);

                  const remainingPerformancePointsCount = section[key].length > 4
                    ? section[key].length - 4
                    : 0;

                  // Toggle individual performance point
                  const togglePerformancePoint = (index) => {
                    setOpenedFut(prev =>
                      prev.includes(index)
                        ? prev.filter(item => item !== index)
                        : [...prev, index]
                    );
                  };

                  return (
                    <div
      key={sectionKey}
      className="p-4 bg-gray-600/30 rounded-xl my-10"
    >
      <p className="text-xl text-gray-400 my-5 font-semibold">
        Future Impact
      </p>
      <div className="space-y-2 grid gap-5 grid-cols-1 p-4 items-start">
        {displayedPerformancePoints.map((performancePoint, index) => (
          <div
            key={index}
            className=" p-2 rounded-lg bg-gray-700/30 cursor-pointer"
            onClick={() => togglePerformancePoint(index)}
          >
            <h2 className="text-lg font-semibold text-gray-400">
              {performancePoint.future_outlook_point_title}
            </h2>

            {openedFut.includes(index) && (
              <p className="text-gray-400 mt-3 animate-fade-in">
                {performancePoint.future_outlook_point_description}
              </p>
            )}
          </div>
        ))}

        {!showAllFut && remainingPerformancePointsCount > 0 && (
          <button
            onClick={() => setShowAllFut(true)}
            className="mt-4 w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md"
          >
            Show {remainingPerformancePointsCount} More Performance Point{remainingPerformancePointsCount !== 1 ? 's' : ''}
          </button>
        )}

        {showAllFut && (
          <button
            onClick={() => setShowAllFut(false)}
            className="mt-4 w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md"
          >
            Show Less
          </button>
        )}
      </div>
    </div>
                  );
                }
                if (key === "industry_impact") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
                        Industry Impact
                      </p>
                      <div className="space-y-4 grid gap-10 grid-cols-2 p-5 px-12 items-start justify-center mx-20">
                        <div className="h-96 w-80">
                          <h2 className="text-xl font-semibold mb-10 text-gray-400">
                            Negative Impact Factor
                          </h2>
                          <ul className=" text-gray-400">
                            {section[key].negative_impact_factors.map(
                              (strength, index) => (
                                <div>
                                  <div className="flex space-y-1">
                                    <div className="w-1 mr-1 mb-1 bg-red-400"></div>
                                    <li key={index} className="mt-1">
                                      {strength}
                                    </li>
                                  </div>
                                  <div className="h-[1px] w-full bg-gray-500"></div>
                                </div>
                              )
                            )}
                          </ul>
                        </div>
                        <div className="h-96 w-80">
                          <h2 className="text-xl font-semibold mb-10 text-gray-400">
                            Positive Impact Factor
                          </h2>
                          <ul className=" text-gray-400">
                            {section[key].positive_impact_factors.map(
                              (weakness, index) => (
                                <div>
                                  <div className="flex space-y-1">
                                    <div className="w-1 mr-1 mb-1 bg-blue-400"></div>
                                    <li key={index} className="mt-1">
                                      {weakness}
                                    </li>
                                  </div>
                                  <div className="h-[1px] w-full bg-gray-500"></div>
                                </div>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                }
                if (key === "key_trends") {

                  const displayedTrends = showAllKeyTrends ? section[key] : section[key].slice(0, 4);
                  const remainingTrendsCount = section[key].length - 4;

                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-xl text-gray-400 my-5 font-semibold">Key Trends</p>
                      <div>
                        <ul className="list-disc list-inside space-y-4 text-gray-400 p-5">
                          {displayedTrends.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>

                        {!showAllKeyTrends && remainingTrendsCount > 0 && (
                          <button
                            onClick={() => setShowAllKeyTrends(true)}
                            className="mt-4 w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md"
                          >
                            Show {remainingTrendsCount} More Trend{remainingTrendsCount !== 1 ? 's' : ''}
                          </button>
                        )}

                        {showAllKeyTrends && (
                          <button
                            onClick={() => setShowAllKeyTrends(false)}
                            className="mt-4 w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md"
                          >
                            Show Less
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
                if (key === "external_drivers") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
                        External Drivers
                      </p>
                      <div className="mx-20">
                        <ExternalDrivers drivers={section[key]}/>
                      </div>
                    </div>
                  );
                }
                if (key === "supply_chain") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
                        Supply Chain
                      </p>
                     <SupplyChain  supplyChain={section[key]}/>
                 </div>
                  );
                }
                if (key === "similar_industries") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
                       Similar Industries
                      </p>
                     <SimpleList industries={section[key]}/>
                 </div>
                  );
                }
                if (key === "related_international_industries") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-xl mx-10 my-5 font-semibold text-gray-400">
                       Related International Industries
                      </p>
                     <SimpleList industries={section[key]}/>
                 </div>
                  );
                }
                if (key === "products_and_services") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                     <ProductsAndServices products={section[key]}/>
                 </div>
                  );
                }
                if (key === "regulations_and_policies") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                     <RegulationsAndPolicies regulations={section[key]}/>
                 </div>
                  );
                }
                if (key === "market_segmentation") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                     <MarketSegmentation marketSegmentation={section[key]}/>
                 </div>
                  );
                }
                if (key === "market_share_concentration") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                     <MarketShareConcentration concentrationData={section[key]}/>
                 </div>
                  );
                }
                return (
                  <div key={`${sectionKey}-${key}`}>
                    {typeof section[key] === "object" &&
                    section[key] !== null ? (
                      <>
                        <button
                          onClick={() => toggleSection(`${sectionKey}-${key}`)}
                          className="text-xl font-bold text-white bg-gray-900 hover:bg-gray-950 px-4 py-2 w-full text-left focus:outline-none my-1 rounded-md"
                        >
                          {formatHeading(key)}{" "}
                          {openSections[`${sectionKey}-${key}`] ? "▲" : "▼"}
                        </button>
                        {openSections[`${sectionKey}-${key}`] &&
                          renderContents(section[key], `${sectionKey}-${key}`)}
                      </>
                    ) : (
                      <div className="py-5">
                        <strong>{formatHeading(key)}: </strong>
                        {section[key]?.toString() || "No data"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      ) : (
        <p className="text-gray-500">No data available.</p>
      )}
    </div>
  );
};

export default ReportDropdown;
