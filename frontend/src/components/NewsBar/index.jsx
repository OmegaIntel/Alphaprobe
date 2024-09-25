import React from "react";
import { newsData } from "../../constants";

const NewsBar = () => {
  return (
    <div className="bg-[#151518] w-[30%] h-screen ml-1 p-2">
      <h5 className="text-sm font-semibold">Latest PE Markets Deals / News</h5>
      <div className="flex flex-col gap-4 mt-2  ">
        {newsData.map((data, index) => (
          <div key={index} className="flex flex-col gap-3 ">
            <a
              className="text-xs text-[#33BBFF] underline"
              href="/#"
              target="_blank"
            >
              {data.linkTitle}
            </a>
            <span className="text-xs text-[#A2A2A2] "> {data.date} </span>
            <hr className="w-full h-[1px] bg-[#303038] border-none" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsBar;
