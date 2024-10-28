import { useState } from "react";
import FAQsComponent from "../../Faqs/FAQs";
import KeyStatistics from "./ReportSectionComponents/KeyStatistics"; // Import KeyStatistics component

// Utility function to format the headings
const formatHeading = (heading) => {
  return heading
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const ReportDropdown = ({ data }) => {
  const [openSections, setOpenSections] = useState({});
  const [openFAQs, setOpenFAQs] = useState(false);

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

            // Check if the key is "key_statistics" to render the KeyStatistics component
            if (key === "key_statistics") {
              return (
                <div key={currentKey} className="bg-red-500">
                  <button
                    onClick={() => toggleSection(currentKey)}
                    className="text-lg font-semibold text-white bg-gray-900 hover:bg-gray-950 px-4 py-2 w-full text-left focus:outline-none rounded-md"
                  >
                    {formatHeading(key)} {openSections[currentKey] ? "▲" : "▼"}
                  </button>
                  {openSections[currentKey] && (
                    <KeyStatistics statistics={contents[key]} />
                  )}
                </div>
              );
            }

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
                      <button
                        onClick={toggleFAQs}
                        className="text-xl font-semibold text-white bg-gray-900 hover:bg-gray-950 px-4 py-2 w-full text-left focus:outline-none rounded-md"
                      >
                        {formatHeading(key)} {openFAQs ? "▲" : "▼"}
                      </button>
                      {openFAQs && <FAQsComponent faqs={section[key]} />}
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
                      <p className="text-2xl my-5">Executive Summary</p>
                      <h1 className="text-lg text-gray-300">{section[key]}</h1>
                    </div>
                  );
                }

                if (key === "industry_definition") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-2xl my-5">Industry Defination</p>
                      <h1 className="text-lg text-gray-300">{section[key]}</h1>
                    </div>
                  );
                }

                if (key === "key_statistics") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10 shadow-md"
                    >
                      <p className="text-2xl my-5 font-semibold text-gray-100">
                        Key Statistics
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-gray-300">
                        {Object.entries(section[key]).map(
                          ([statKey, statValue]) => {
                            // Function to format values based on their key
                            const formatValue = (value, key) => {
                              if (typeof value === "number") {
                                // Format as currency with suffix for specific keywords
                                if (
                                  [
                                    "wages",
                                    "industry_value_added",
                                    "imports",
                                    "exports",
                                  ].includes(key)
                                ) {
                                  return `$${formatWithSuffix(value)}`;
                                } else if (key.toLowerCase().includes("cagr")) {
                                  return `${(value * 100).toFixed(2)}%`; // Format as percentage
                                } else if (
                                  key.toLowerCase().includes("year") ||
                                  key.toLowerCase().includes("date")
                                ) {
                                  return value.toString(); // Return the year as a string
                                } else {
                                  return value.toLocaleString(); // Format as number
                                }
                              }
                              return value; // Return non-number values as-is
                            };

                            // Function to format numbers with suffixes
                            const formatWithSuffix = (num) => {
                              if (num >= 1e12)
                                return (num / 1e12).toFixed(1) + "T"; // Trillion
                              if (num >= 1e9)
                                return (num / 1e9).toFixed(1) + "B"; // Billion
                              if (num >= 1e6)
                                return (num / 1e6).toFixed(1) + "M"; // Million
                              if (num >= 1e3)
                                return (num / 1e3).toFixed(1) + "K"; // Thousand
                              return num.toString(); // Return as is for smaller numbers
                            };

                            const isNestedObject =
                              typeof statValue === "object" &&
                              statValue !== null &&
                              !Array.isArray(statValue);

                            return (
                              <div
                                key={statKey}
                                className="border border-gray-500 p-4 rounded-lg bg-gray-700 shadow-lg transition-transform transform "
                              >
                                <h2 className="text-xl font-semibold capitalize text-gray-200">
                                  {statKey.replace(/_/g, " ")}
                                </h2>
                                {isNestedObject ? (
                                  <div className="space-y-2 mt-2">
                                    {Object.entries(statValue).map(
                                      ([nestedKey, nestedValue]) => {
                                        if (
                                          typeof nestedValue === "object" &&
                                          nestedValue !== null
                                        ) {
                                          return (
                                            <div
                                              key={nestedKey}
                                              className="ml-4"
                                            >
                                              <h3 className="font-semibold capitalize mb-3 text-gray-300">
                                                {nestedKey.replace(/_/g, " ")}
                                              </h3>
                                              <div className="flex flex-col space-y-2">
                                                {Object.entries(
                                                  nestedValue
                                                ).map(
                                                  ([innerKey, innerValue]) => (
                                                    <button
                                                      key={innerKey}
                                                      className="w-full text-left bg-gray-600  text-gray-200 py-2 px-4 rounded-lg transition"
                                                    >
                                                      {innerKey.replace(
                                                        /_/g,
                                                        " "
                                                      )}
                                                      :{" "}
                                                      <span className="font-medium text-gray-100">
                                                        {formatValue(
                                                          innerValue,
                                                          innerKey
                                                        )}
                                                      </span>
                                                    </button>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          );
                                        } else {
                                          return (
                                            <button
                                              key={nestedKey}
                                              className="w-full text-left bg-gray-600  text-gray-200 py-2 px-4 rounded-lg transition"
                                            >
                                              {nestedKey.replace(/_/g, " ")}:{" "}
                                              <span className="font-medium text-gray-100">
                                                {formatValue(
                                                  nestedValue,
                                                  nestedKey
                                                )}
                                              </span>
                                            </button>
                                          );
                                        }
                                      }
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-gray-400">
                                    {formatValue(statValue, statKey)}
                                  </p>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                }
                // Handle Array Types
                if (key === "swot_analysis") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-2xl my-5 font-semibold">
                        SWOT Analysis
                      </p>
                      <div className="space-y-4 grid gap-10 grid-cols-2 p-5 items-start">
                        <div>
                          <h2 className="text-xl font-semibold">Strengths</h2>
                          <ul className="list-disc list-inside text-gray-300">
                            {section[key].strengths.map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">Weaknesses</h2>
                          <ul className="list-disc list-inside text-gray-300">
                            {section[key].weaknesses.map((weakness, index) => (
                              <li key={index}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">
                            Opportunities
                          </h2>
                          <ul className="list-disc list-inside text-gray-300">
                            {section[key].opportunities.map(
                              (opportunity, index) => (
                                <li key={index}>{opportunity}</li>
                              )
                            )}
                          </ul>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">Threats</h2>
                          <ul className="list-disc list-inside text-gray-300">
                            {section[key].threats.map((threat, index) => (
                              <li key={index}>{threat}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (key === "current_performance") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-2xl my-5 font-semibold">
                        Current Performance
                      </p>
                      <div className="space-y-4 grid gap-10 grid-cols-1 p-5 items-start">
                        {section[key].map((performancePoint, index) => (
                          <div
                            key={index}
                            className="border p-4 rounded-lg bg-gray-700"
                          >
                            <h2 className="text-xl font-semibold">
                              {performancePoint.current_performance_point_title}
                            </h2>
                            <p className="text-gray-300 mt-3">
                              {
                                performancePoint.current_performance_point_description
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (key === "future_outlook") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-2xl my-5 font-semibold">
                        Current Performance
                      </p>
                      <div className="space-y-4 grid gap-10 grid-cols-1 p-5 items-start">
                        {section[key].map((performancePoint, index) => (
                          <div
                            key={index}
                            className="border p-4 rounded-lg bg-gray-700"
                          >
                            <h2 className="text-xl font-semibold">
                              {performancePoint.future_outlook_point_title}
                            </h2>
                            <p className="text-gray-300 mt-3">
                              {
                                performancePoint.future_outlook_point_description
                              }
                            </p>
                          </div>
                        ))}
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
                      <p className="text-2xl my-5 font-semibold">
                        Industry Impact
                      </p>
                      <div className="space-y-4 grid gap-10 grid-cols-2 p-5 items-start">
                        <div>
                          <h2 className="text-xl font-semibold">
                            Negative Impact Factor
                          </h2>
                          <ul className="list-disc list-inside text-gray-300">
                            {section[key].negative_impact_factors.map(
                              (strength, index) => (
                                <li key={index}>{strength}</li>
                              )
                            )}
                          </ul>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">
                            Positive Impact Factor
                          </h2>
                          <ul className="list-disc list-inside text-gray-300">
                            {section[key].positive_impact_factors.map(
                              (weakness, index) => (
                                <li key={index}>{weakness}</li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (key === "key_trends") {
                  return (
                    <div
                      key={sectionKey}
                      className="p-4 bg-gray-600/30 rounded-xl my-10"
                    >
                      <p className="text-2xl my-5 font-semibold">Key Trends</p>
                      <div className="">
                        <div>
                          <ul className="list-disc list-inside space-y-4 text-gray-300">
                            {section[key].map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
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
