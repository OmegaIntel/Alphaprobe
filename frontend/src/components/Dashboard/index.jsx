import React, { useEffect, useState } from "react";
import { dashboardData } from "../../constants";
import NewsBar from "../NewsBar";
import { useNavigate } from "react-router-dom";
import { Button, Tag } from "antd";
import { useModal } from "../UploadFilesModal/ModalContext";
import { getTasks } from "../../services/taskService";

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
  const { deals } = useModal();
  const [recentDeal, setRecentDeal] = useState();
  const [otherDeals, setOtherDeals] = useState([]);
  const [activeItems, setActiveItems] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (deals.length > 0) {
      const sortedDeals = deals.sort(
        (a, b) => new Date(b.start_date) - new Date(a.start_date)
      );
      const [firstDeal, ...remainingDeals] = sortedDeals;
      getTasks(firstDeal.id)
        .then((data) => setActiveItems(data))
        .catch((e) => {
          if (e.response.status === 404) {
            setActiveItems([]);
          } else {
            console.log(e);
          }
        });
      setRecentDeal(firstDeal);
      setOtherDeals(remainingDeals);
    }
  }, [deals]);

  const handleNavigate = (index) => {
    if (index === 0) {
      navigate("/create-deal");
    }
  };

  const tags = (status) => {
    return status === "Completed" ? (
      <Tag color="#e8883a">Completed</Tag>
    ) : status === "In Progress" ? (
      <Tag color="green-inverse">In Progress</Tag>
    ) : (
      <Tag color="red-inverse">Not Started</Tag>
    );
  };

  return (
    <div className="w-full flex">
      {deals.length > 0 ? (
        <div className="w-[70%] laptop:h-screen desktop:h-[90vh] x-[90vh] overflow-y-auto rounded ml-1 p-4">
          <div className="flex justify-between h-full gap-4">
            <div className="flex-1 bg-[#151518] p-4 rounded">
              <h5 className="text-sm font-semibold mb-6">Recent Activity</h5>
              <div className="mb-6 bg-[#1F1E23] p-4 flex flex-col gap-4 rounded">
                <div className="flex items-center justify-between mb-2">
                  {tags(recentDeal?.status)}
                </div>
                <span className="text-[#8A8A90] text-base font-semibold">
                  {recentDeal?.name}
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">Track Progress</span>
                  <Button className="bg-[#303038] border-none text-white font-semibold">
                    <a href={`/projects/${recentDeal?.id}`}>Open</a>
                  </Button>
                </div>
              </div>
              <div className="bg-[#1F1E23] p-4 flex flex-col gap-4 rounded h-[65%]">
                <span className="mb-6 text-base font-bold">Action Items</span>
                {activeItems.length === 0 ? (
                  <div>No Items Found</div>
                ) : (
                  activeItems.map((item, index) => (
                    <span key={index} className="text-sm font-semibold">
                      {index + 1}.{item.task}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="flex-1 bg-[#151518] p-4 rounded overflow-auto">
              <h5 className="text-sm font-semibold mb-6">Deal Pipeline</h5>
              {otherDeals?.map((data, index) => {
                return (
                  <div
                    className="mb-6 bg-[#1F1E23] p-4 flex flex-col gap-4 rounded"
                    key={index}
                  >
                    <div className="flex items-center justify-between mb-2">
                      {tags(data.status)}
                    </div>
                    <span className="text-[#8A8A90] text-base font-semibold">
                      {data.name}
                    </span>
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold">
                        Track Progress
                      </span>
                      <Button className="bg-[#303038] border-none text-white font-semibold">
                        <a href={`/projects/${data.id}`}>Open</a>
                      </Button>
                    </div>
                  </div>
                );
              })}
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
                  onClick={() => handleNavigate(index)}
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
