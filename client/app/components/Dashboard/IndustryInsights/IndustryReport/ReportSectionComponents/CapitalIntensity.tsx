import { useState } from "react";

interface CapitalIntensityPoint {
    capital_intensity_title?: string;
    capital_intensity_description?: string;
  }
  
  interface CapitalIntensityData {
    capital_intensity_level?: string;
    capital_intensity_trend?: string;
    capital_intensity_points?: CapitalIntensityPoint[];
  }
  
  interface CapitalIntensityProps {
    capitalIntensity: CapitalIntensityData;
  }
  
  export function CapitalIntensity({ 
    capitalIntensity = {} 
  }: CapitalIntensityProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
  
    const capitalIntensityLevel = capitalIntensity.capital_intensity_level || "N/A";
    const capitalIntensityTrend = capitalIntensity.capital_intensity_trend || "N/A";
    const capitalIntensityPoints: CapitalIntensityPoint[] = Array.isArray(
      capitalIntensity.capital_intensity_points
    ) 
      ? capitalIntensity.capital_intensity_points 
      : [];
  
    const toggleAccordion = (index: number): void => {
      setOpenIndex(openIndex === index ? null : index);
    };
  
    return (
      <div className="p-4 shadow-md px-10 text-gray-400 mb-20">
        <h3 className="text-2xl font-semibold my-10 text-white">Capital Intensity</h3>
  
        <div className="mb-4 flex justify-between">
          <p className="text-lg">
            <span className="font-semibold text-[#e1e1e1]">Capital Intensity Level: </span>
            {capitalIntensityLevel}
          </p>
          <p className="text-lg">
            <span className="font-semibold text-[#e1e1e1]">Trend: </span>
            {capitalIntensityTrend}
          </p>
        </div>
  
        <h4 className="font-semibold text-lg mb-2 text-[#e1e1e1]">Capital Intensity Points</h4>
        <div className="grid grid-cols-2 gap-12">
          {capitalIntensityPoints.map((point, index) => (
            <div
              key={index}
              className="border border-gray-600 bg-gradient-to-b from-[#ffffff]/10 to-[#999999]/10 rounded-2xl p-4 py-6 shadow-md hover:shadow-lg hover:border-gray-500 transition duration-200"
            >
              <div 
                onClick={() => toggleAccordion(index)} 
                className="flex justify-between items-center cursor-pointer"
              >
                <h4 className="text-lg text-[#b9bbbe] font-medium">
                  {point.capital_intensity_title || "Untitled Point"}
                </h4>
                <span className="text-lg">{openIndex === index ? "-" : "+"}</span>
              </div>
              {openIndex === index && (
                <p className="mt-2 font-normal text-[#a8a8a8]">
                  {point.capital_intensity_description || "No description available."}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  export default CapitalIntensity;