import React, { useEffect, useState } from "react";
import { activeItems, dashboardData } from "../../constants";
import NewsBar from "../NewsBar";
import { useNavigate } from "react-router-dom";
import { Button, Tag } from "antd";
import { getDeals } from "../../services/dealService";
const Card = ({ title, description, buttonText, onClick }) => {
  return (
    <div className="h-[100%] bg-[#1F1E23] text-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-xs mb-4">{description}</p>
      <button
        onClick={onClick}
        className="bg-[#303038] hover:bg-gray-500 text-[#DCDCDC] text-sm font-bold py-2 px-4 w-[120px] min-w-fit rounded"
      >
        {buttonText}
      </button>
    </div>
  );
};
const Dashboard = () => {
  const [deals, setDeals] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchDealsData = async () => {
      try {
        const data = await getDeals();
        if (data) setDeals(data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchDealsData();
  }, []);

  const handleNavigate = () => {
    navigate("/create-deal");
  };

  return (
    <div className="w-full flex">
      {deals.length > 0 ? (
        <div className="w-[70%] h-[90vh] rounded ml-1 p-4">
          <div className="flex justify-between h-full gap-4">
            <div className="flex-1 bg-[#151518] p-4 rounded">
              <h5 className="text-sm font-semibold mb-6">Recent Activity</h5>
              <div className="mb-6 bg-[#1F1E23] p-4 flex flex-col gap-4 rounded">
                <div className="flex items-center justify-between mb-2">
                  <Tag color="green-inverse">In Progress</Tag>
                </div>
                <span className="text-[#8A8A90] text-base font-semibold">
                  PROJECT ALPHA
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">Track Progress</span>
                  <Button className="bg-[#303038] border-none text-white font-semibold">
                    Open
                  </Button>
                </div>
              </div>
              <div className="bg-[#1F1E23] p-4 flex flex-col gap-4 rounded h-[70%]">
                <span className="mb-6 text-base font-bold">Action Items</span>
                {activeItems.map((item, index) => (
                  <span key={index} className="text-sm font-semibold">
                    {index + 1}. {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 bg-[#151518] p-4 rounded">
              <h5 className="text-sm font-semibold mb-6">Deal Pipeline</h5>
              {/* Project Beta */}
              <div className="mb-6 bg-[#1F1E23] p-4 flex flex-col gap-4 rounded">
                <div className="flex items-center justify-between mb-2">
                  <Tag color="gold-inverse">Planning</Tag>
                </div>
                <span className="text-[#8A8A90] text-base font-semibold">
                  PROJECT BETA
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">Track Progress</span>
                  <Button className="bg-[#303038] border-none text-white font-semibold">
                    Open
                  </Button>
                </div>
              </div>

              {/* Project Gamma */}
              <div className="bg-[#1F1E23] p-4 flex flex-col gap-4 rounded">
                <div className="flex items-center justify-between mb-2">
                  <Tag color="red-inverse">Not Started</Tag>
                </div>
                <span className="text-[#8A8A90] text-base font-semibold">
                  PROJECT GAMMA
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">Track Progress</span>
                  <Button className="bg-[#303038] border-none text-white font-semibold">
                    Open
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
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
                  onClick={index === 0 ? handleNavigate : null}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <NewsBar />
    </div>
  );
};

export default Dashboard;
