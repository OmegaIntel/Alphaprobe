import React, { Suspense } from 'react';
import PageHeader from '../WorkflowPageHeader';
import MarketResearchComponent from './MarketResearch';

const MarketResearchPage = () => {
  return (
    <div className="p-4 overflow-x-auto">
      <Suspense fallback={<p>Loading...</p>}>
        <PageHeader
          description="Get up to speed on new markets by understanding their size, contours, players, and trends."
          heading="Market Research"
        />
        {/* <MarketResearchPage /> */}
        <MarketResearchComponent />
      </Suspense>
    </div>
  );
};

export default MarketResearchPage;
