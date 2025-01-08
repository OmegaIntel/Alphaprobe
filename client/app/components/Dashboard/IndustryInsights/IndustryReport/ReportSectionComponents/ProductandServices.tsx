import React, { useState } from "react";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";

// Define types for props
interface ProductOrService {
  product_or_service: string;
  product_percentage: number;
  product_description?: string;
}

interface ProductsAndServicesProps {
  productsAndServices: ProductOrService[];
}

const ProductsAndServices: React.FC<ProductsAndServicesProps> = ({
  productsAndServices,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Check if productsAndServices is valid
  if (!productsAndServices || productsAndServices.length === 0) {
    return <div>No products available.</div>;
  }

  // Prepare data for the doughnut chart
  const chartData = {
    labels: productsAndServices.map((item) => item.product_or_service),
    datasets: [
      {
        data: productsAndServices.map((item) => item.product_percentage),
        backgroundColor: ["#4CAF50", "#FF9800", "#2196F3", "#9C27B0"],
        borderWidth: 0,
      },
    ],
  };

  // Toggle accordion for each item
  const toggleAccordion = (index: number) => {
    setExpandedIndex(index === expandedIndex ? null : index);
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-300">
      <div>
        {/* Product Details with Accordion */}
        <ul className="space-y-4 text-sm text-gray-300 flex-1">
          {productsAndServices.map((item, index) => (
            <li
              key={index}
              className="rounded-lg p-4 bg-gray-500/10 flex flex-col space-y-2 cursor-pointer"
              onClick={() => toggleAccordion(index)}
            >
              {/* Color Indicator */}
              <span
                className="w-4 h-6"
                style={{
                  backgroundColor: chartData.datasets[0].backgroundColor[
                    index % chartData.datasets[0].backgroundColor.length
                  ],
                }}
              ></span>
              {/* Product Title and Percentage */}
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">{item.product_or_service}</h4>
              </div>
              {/* Show description as accordion */}
              {expandedIndex === index && (
                <p className="mt-2 text-gray-200">{item.product_description}</p>
              )}
            </li>
          ))}
        </ul>

        {/* Doughnut Chart */}
        <div className="bg-red-400">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "70%",
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) =>
                      `${context.label}: ${(context.raw as number).toFixed(2)}%`,
                  },
                },
                legend: {
                  position: "bottom",
                  labels: {
                    color: "#fff",
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductsAndServices;
