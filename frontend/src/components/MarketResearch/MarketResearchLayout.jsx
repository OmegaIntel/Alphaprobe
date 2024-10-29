import React from "react";
import IndustryHeader from "./MarketResearchHeader'/MarketResearchHeader";
import IndustryReport from "./IndustryReportSection/IndustryReport";
import SwotAnal from "./IndustryReportSection/ReportSectionComponents/swotAnal";

const MarketResearchLayout = () => {
  return (
    <div>
      <IndustryHeader />
      <IndustryReport />
      {/* <SwotAnal /> */}
    </div>
  );
};

export default MarketResearchLayout;
