import CustomReportSearchForm from "./PreloadingScreen";
import DynamicContent from "./Report";
import data from "./reportdata.json"

export function CustomReportLayout() {
  return <div>
    <CustomReportSearchForm />
    <div className="flex justify-end">

    <div className="w-3/5">
    <DynamicContent data={data.data} />
    </div>
    </div>
  </div>;
}

export default CustomReportLayout;
