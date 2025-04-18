import React from 'react';
import CanvasPage from '~/components/Canvas/CanvasPage';
import SummaryPoints from '~/components/Dashboard/MarketResearch/MarketResearchChatLayout';
import MarketResearchPage from '~/components/Workflow/marketResearch/page';

const MarketResearch: React.FC = () => {
  return (
    <>
      <div>
        {/* <SummaryPoints /> */}
        <MarketResearchPage />
      </div>
    </>
  );
};

export default MarketResearch;
