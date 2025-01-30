import { useState } from 'react';

interface AssistancePoint {
  assistance_title: string;
  assistance_description: string;
}

interface IndustryAssistanceData {
  assistance_level?: string;
  assistance_trend?: string;
  assistance_points?: AssistancePoint[];
}

interface IndustryAssistanceProps {
  industryAssistance: IndustryAssistanceData;
}

export function IndustryAssistance({
  industryAssistance,
}: IndustryAssistanceProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number): void => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const {
    assistance_level = 'N/A',
    assistance_trend = 'N/A',
    assistance_points = [],
  } = industryAssistance || {};

  return (
    <div className="p-4 bg-[#171717] border rounded-xl border-[#2e2e2e] shadow-md px-10 text-gray-400 mb-20">
      <h3 className="text-2xl font-semibold mb-4 mt-10 text-white">
        Industry Assistance
      </h3>

      <div className="mb-4 flex justify-between">
        <p className="text-lg">
          <span className="font-semibold text-[#e1e1e1]">
            Assistance Level:{' '}
          </span>
          {assistance_level}
        </p>
        <p className="text-lg">
          <span className="font-semibold text-[#e1e1e1]">Trend: </span>
          {assistance_trend}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-12">
        {assistance_points.length > 0 ? (
          assistance_points.map((point, index) => (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <div
                onClick={() => toggleAccordion(index)}
                className="flex justify-between items-center cursor-pointer"
              >
                <h4 className="text-lg text-[#b9bbbe] font-medium">
                  {point.assistance_title}
                </h4>
                <span className="text-lg">
                  {openIndex === index ? '-' : '+'}
                </span>
              </div>
              {openIndex === index && (
                <p className="mt-2 font-normal text-[#a8a8a8]">
                  {point.assistance_description}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-lg text-gray-500">
            No assistance points available.
          </p>
        )}
      </div>
    </div>
  );
}

export default IndustryAssistance;
