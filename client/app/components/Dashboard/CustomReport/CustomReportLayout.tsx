import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight, X } from 'lucide-react'; 
import CustomReportSearchForm from './PreloadingScreen';
import DynamicContent from './Report';
import { RootState } from '~/store/store';
import { DealsSidebar } from './CustomReportSidebar';
import { Button } from '~/components/ui/button';
import { setData } from '~/store/slices/customReport'; 

interface UrlParams {
  companyName?: string;
}

export function CustomReportLayout({ companyName }: UrlParams) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { data } = useSelector((state: RootState) => state.customReport);
  const dispatch = useDispatch();

  // Handler to clear the current report from Redux,
  // so that <CustomReportSearchForm> is shown again.
  const handleCloseReport = () => {
    dispatch(setData({ report: null, dealId: null }));
  };

  return (
    <div className="flex h-screen">
      {/* Only render the sidebar if a companyName is provided */}
      {companyName ? (
        <aside
          className={`relative transition-all duration-300 ease-in-out border-r ${
            isSidebarCollapsed ? 'w-2' : 'w-64'
          }`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-4 z-10 rounded-full border shadow-sm"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-3 w-3 " />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
          <div
            className={`overflow-hidden ${
              isSidebarCollapsed ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <DealsSidebar />
          </div>
        </aside>
      ) : null}

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div
          className={`transition-all duration-300 ${
            data?.report ? 'max-w-4xl mx-auto relative' : 'flex justify-center'
          }`}
        >
          {data?.report && data?.dealId ? (
            <>
              {/* Cross button to close the report */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 m-2"
                onClick={handleCloseReport}
              >
                <X className="h-5 w-5" />
              </Button>
              <DynamicContent report={data.report} />
            </>
          ) : (
            <CustomReportSearchForm companyQuery={companyName} />
          )}
        </div>
      </main>
    </div>
  );
}

export default CustomReportLayout;
