import { useSelector } from 'react-redux';
import CustomReportSearchForm from './PreloadingScreen';
import DynamicContent from './Report';
import { RootState } from '~/store/store';

interface UrlParams {
  companyName?: string;
}


export function CustomReportLayout({ companyName }: UrlParams) {
  const { data } = useSelector((state : RootState) => state.customReport);

  return (
    <div>
      {data && data.report && data.dealId ? (
        <div className="flex justify-center">
          <div className="w-3/5">
            <DynamicContent report={data.report} />
          </div>
        </div>
      ) : (
        <CustomReportSearchForm companyQuery={companyName} />
      )}
    </div>
  );
}

export default CustomReportLayout;
