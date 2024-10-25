import { useState } from "react";
import FAQsComponent from "../../Faqs/FAQs"; // Adjust the path as necessary

// Utility function to format the headings
const formatHeading = (heading) => {
  return heading
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize the first letter of each word
};

const ReportDropdown = ({ data }) => {
  const [openSections, setOpenSections] = useState({});
  const [openFAQs, setOpenFAQs] = useState(false); // State for FAQs section

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

  // Dynamically render contents based on type (array, object, or primitive value)
  const renderContents = (contents, parentKey = "") => {
    if (Array.isArray(contents)) {
      return (
        <ul className="ml-6 list-disc">
          {contents.map((item, index) => {
            const currentKey = `${parentKey}-${index}`;

            // Check if the array contains objects or primitive values
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
              // Handle primitive values inside arrays
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
                      onClick={() => toggleSection(`${currentKey}-${key}`)}
                      className="text-lg font-semibold focus:outline-none"
                    >
                      {formatHeading(key)}{" "}
                      {openSections[`${currentKey}-${key}`] ? "▲" : "▼"}
                    </button>
                    {openSections[`${currentKey}-${key}`] &&
                      renderContents(contents[key], `${currentKey}-${key}`)}
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
