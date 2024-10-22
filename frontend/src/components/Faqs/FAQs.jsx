import { useState } from 'react';

const FAQsComponent = ({ faqs }) => {
  const [openFAQ, setOpenFAQ] = useState(null);

  // Toggle function to open/close FAQs
  const toggleFAQ = (index) => {
    if (openFAQ === index) {
      setOpenFAQ(null); // Close if already opened
    } else {
      setOpenFAQ(index); // Open the clicked FAQ
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {faqs.map((faq, index) => (
        <div key={index} className="border-b border-gray-200 pb-2 mb-2">
          <div
            onClick={() => toggleFAQ(index)}
            className="cursor-pointer text-lg font-semibold text-white flex justify-between items-center"
          >
            <span>{faq.question}</span>
            <span>{openFAQ === index ? "▲" : "▼"}</span>
          </div>
          {openFAQ === index && (
            <div className="pt-2 text-white">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FAQsComponent;
