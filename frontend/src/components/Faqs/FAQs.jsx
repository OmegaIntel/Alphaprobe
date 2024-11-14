import { useState } from "react";

const FAQsComponent = ({ faqs }) => {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [visibleFAQs, setVisibleFAQs] = useState(4);

  // Toggle function to open/close FAQs
  const toggleFAQ = (index) => {
    if (openFAQ === index) {
      setOpenFAQ(null); // Close if already opened
    } else {
      setOpenFAQ(index); // Open the clicked FAQ
    }
  };

  // Show more FAQs
  const showMoreFAQs = () => {
    setVisibleFAQs((prevVisible) => Math.min(prevVisible + 4, faqs.length));
  };

  return (
    <div className="mx-10">
      {faqs.slice(0, visibleFAQs).map((faq, index) => (
        <div key={index} className="border-b border-gray-400 py-4">
          <div
            onClick={() => toggleFAQ(index)}
            className="cursor-pointer text-lg font-semibold text-gray-400 flex justify-between items-center"
          >
            {faq.question}
            {/* {openFAQ === index ? "▲" : "▼"} */}
          </div>
          {openFAQ === index && (
            <div className="mt-2 text-gray-400">{faq.answer}</div>
          )}
        </div>
      ))}

      {visibleFAQs < faqs.length && (
        <div className="flex justify-center">
          <button
            onClick={showMoreFAQs}
            className="mt-12 mb-6 w-1/5 bg-[#1d2a41] text-white border-2 border-[#404040]  py-2 rounded-full font-medium hover:bg-gray-600 transition duration-200"
          >
            Show More FAQs
          </button>
        </div>
      )}
    </div>
  );
};

export default FAQsComponent;
