import React, { useState } from 'react';

const Accordion = ({ swotAnalysis }) => {
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    return (
        <div className="accordion p-9">
            {["strengths", "weaknesses", "opportunities", "threats"].map((section) => (
                <div key={section} className="accordion-item border-b border-gray-300">
                    <button
                        onClick={() => toggleSection(section)}
                        className="accordion-header text-lg font-semibold text-left w-full py-2 px-4 flex justify-between items-center focus:outline-none"
                    >
                        <span className="capitalize">{section}</span>
                        <span>{openSection === section ? '-' : '+'}</span>
                    </button>
                    {openSection === section && (
                        <div className="accordion-content px-6 py-2 text-white">
                            <ul className="list-disc pl-6">
                                {swotAnalysis[section]?.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Accordion;
