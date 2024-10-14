import { useEffect, useState } from "react";
import KanbanBoard from ".";
import { useSelector } from "react-redux";

const DilligenceContainer = () => {
  const { dealId, deals } = useSelector((state) => state.deals);
  const [currentDeal, setCurrentDeal] = useState("");
  useEffect(() => {
    if (deals && dealId) {
      setCurrentDeal(deals.find((data) => data.id === dealId));
    }
  }, [dealId, deals]);
  return (
    <>
      <div className="bg-[#151518] flex flex-col w-full flex-grow overflow-auto border-l-4 border-[#1e1e1e]">
        <div className="text-4xl font-bold m-10">{currentDeal?.name || ""}</div>
        <KanbanBoard />
      </div>
    </>
  );
};

export default DilligenceContainer;
