import React from "react";
import SummaryPointsCard from "./SummaryPoints/SummaryPointsCard";
import SummaryPointSearch from "./SummaryPoints/SummaryPointSearch";

const SummaryPoints = () => {
  return (
    <div className="w-2/5 px-3 py-2">
      <div>
        <SummaryPointSearch />
      </div>
      <SummaryPointsCard
        confidenceLevel={"1.2"}
        description={
          "lorem ipsum Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, "
        }
        sentiment={"Positive"}
      />
      <SummaryPointsCard
        confidenceLevel={"1.2"}
        description={
          "lorem ipsum Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, "
        }
        sentiment={"Negative"}
      />
    </div>
  );
};

export default SummaryPoints;
