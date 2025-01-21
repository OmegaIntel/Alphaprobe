import { useSelector } from "react-redux";
import CustomReportSearchForm from "./PreloadingScreen";
import DynamicContent from "./Report";
import { RootState } from "~/store/store";
import { DealsSidebar } from "./CustomReportSidebar";

interface UrlParams {
  companyName?: string;
}

export function CustomReportLayout({ companyName }: UrlParams) {
  const { data } = useSelector((state: RootState) => state.customReport);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="">
        <DealsSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {data && data.report && data.dealId ? (
          <div className="max-w-4xl mx-auto">
            <DynamicContent report={data.report} />
          </div>
        ) : (
          <div className="flex justify-center ">
            <CustomReportSearchForm companyQuery={companyName} />
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomReportLayout;
