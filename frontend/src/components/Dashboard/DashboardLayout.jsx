import React from "react";
import Dashboard from "./DashboardComponents/Dashboard";
import NewsBar from "../NewsBar";

const DashboardLayout = ({active, setActive}) => {
  return (
    <div className="">
      <Dashboard active={active} setActive={setActive} />
      <div className="h-[30rem] py-10 ">
        <NewsBar />
      </div>
    </div>
  );
};

export default DashboardLayout;
