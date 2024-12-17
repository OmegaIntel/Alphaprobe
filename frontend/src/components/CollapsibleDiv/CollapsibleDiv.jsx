import React, { useState } from "react";

const Collapsible = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div>
      <button onClick={toggleOpen} className="p-2 w-full text-left">
        {title}
      </button>
      {isOpen && (
        <div className="p-2 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default Collapsible;
