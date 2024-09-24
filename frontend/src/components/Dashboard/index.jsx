import React from "react";
import { dashboardData } from "../../constants";
import NewsBar from "../NewsBar";

const Card = ({ title, description, buttonText }) => {
  return (
    <div className="h-[100%] bg-[#1F1E23] text-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-xs mb-4">{description}</p>
      <button className="bg-[#303038] hover:bg-gray-500 text-[#DCDCDC] text-sm font-bold py-2 px-4 w-[120px] min-w-fit rounded">
        {buttonText}
      </button>
    </div>
  );
};
const Dashboard = () => {
  return (
    <div className="w-full flex">
      <div className="bg-[#151518] w-[70%] h-[90vh] rounded ml-1 p-8">
        <div className="grid grid-cols-2 gap-12 p-6 w-[90%]">
          {dashboardData.map((item, index) => (
            <div
              key={index}
              className={`${index === 0 ? "col-span-2" : "col-span-1"}`}
            >
              <Card
                key={index}
                title={item.title}
                description={item.description}
                buttonText={item.buttonText}
              />
            </div>
          ))}
        </div>
      </div>
      <NewsBar />
    </div>
  );
};

export default Dashboard;
