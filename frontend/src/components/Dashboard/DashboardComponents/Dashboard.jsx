import React from "react";
import StorageIcon from '@mui/icons-material/Storage';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import CellTowerIcon from '@mui/icons-material/CellTower';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';

const sections = [
  {
    name: "Generate an Investment Thesis",
    description:
      "Identify key investment opportunities by creating a personalized thesis based on your criteria.",
    icon: StorageIcon,
    route: "Investment Thesis",
  },
  {
    name: "Browse Companies",
    description:
      "Explore potential investment targets and learn more about their operations and offerings.",
    icon: CorporateFareIcon,
    route: "Company Insights" ,
  },
  {
    name: "Browse Industries",
    description: "Discover industries aligned with your investment strategy and analyze recent trends.",
    icon: CellTowerIcon,
    route: "Market Research",
  },
  {
    name: "Due Diligence Deal Room",
    description:
      "Organize, evaluate, and manage deals through each stage of the acquisition process.",
    icon: SpaceDashboardIcon,
    route: null,
  },
];

const Dashboard = ({active ,setActive}) => {
 console.log("actionValue", active);
  return (
    <div className="bg-[#151518] ml-1 p-4 overflow-y-auto">
      <div className="grid grid-cols-2 gap-6">
        {sections.map((section, index) => (
          <div
            key={index}
            className="bg-[#202020] p-4 rounded-lg shadow-lg text-white flex flex-col justify-between"
          >
            <div className="w-fit bg-[#3388ff]/10 p-2 rounded-xl my-5">
            {React.createElement(section.icon, {
                style: { fontSize: "2rem", color: "#3388ff" }, 
              })}
            </div>
            <h3 className="text-lg font-semibold">{section.name}</h3>
            <p className="text-sm text-[#A2A2A2] mt-2">{section.description}</p>
            <div className="flex justify-center my-10">
            <button
                className={`mt-4 px-4 py-2 rounded-full w-36 ${
                  section.route
                    ? "bg-[#1d2a41] hover:bg-blue-950 border border-[#404040]"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (section.route) {
                    setActive(section.route);  // Update the active state
                  }
                }}
                disabled={!section.route}
              >
                {section.route ? "Continue" : "Coming Soon"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
