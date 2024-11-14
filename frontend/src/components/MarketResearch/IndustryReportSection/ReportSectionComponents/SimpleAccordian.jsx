import React, { useState } from "react";

// Component to display products and services with accordion
export const ProductsAndServices = ({ products }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-lg p-4 shadow-md text-gray-400">
      <h3 className="text-xl font-semibold mb-2">Products and Services</h3>
      {products.map((product, index) => (
        <div key={index}>
          <div
            className="flex justify-between items-center cursor-pointer p-2 border-b border-gray-500"
            onClick={() => toggleAccordion(index)}
          >
            <h4 className="font-semibold">{product.product_or_service}</h4>
            <span className="text-gray-500">{product.product_percentage}%</span>
          </div>
          {openIndex === index && (
            <div className="p-2 text-gray-500">
              <p>{product.product_description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};