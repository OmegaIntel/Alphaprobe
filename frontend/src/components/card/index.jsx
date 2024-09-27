import React from 'react';
import { Card } from 'antd';
import { ReactComponent as Database } from "../../icons/svgviewer-output_10.svg";

const DealDocumentsCard = ({ title, description, type, setRequestModal }) => {
    return (
        <Card
            className="text-center bg-[#1f1e23] shadow-lg rounded-lg border-none text-white"
        >
            <div className='flex flex-row items-center'>
                <Database />
                <div className="text-lg font-semibold ml-2 text-left">
                    {title}
                </div>
            </div>
            <div className="text-sm mt-3 text-white text-left">
                {description}
            </div>
            <button className="mt-6 flex items-start p-3 w-28 rounded-md bg-[#303038]" onClick={() => title === "Request Deal Documents" ? setRequestModal(true) : null}>
                <div className='text-center w-full'>
                    Get Started
                </div>
            </button>
        </Card>
    );
};

export default DealDocumentsCard;
