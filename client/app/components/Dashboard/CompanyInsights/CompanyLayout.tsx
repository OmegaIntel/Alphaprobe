// Remove Node.js specific imports
import { useDispatch, useSelector } from "react-redux";
import CompanyDetailsComponent from './CompanyDetails';
import PreloadingScreen from './Preloading';
import CompanyInsightSidebar from './CompanyInsightSidebar';
import { clearCompanyInsight } from '~/store/slices/companyInsightsSlice';
import { Card } from "~/components/ui/card";

interface CompanyInsightState {
  companyInsight: {
    data: any;
    loading: boolean;
    error: string | null;
  }
}

interface RootState {
  companyInsight: CompanyInsightState['companyInsight'];
}

// Remove the loader function since we're client-side only
export default function CompanyDetails() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state: RootState) => state.companyInsight);

  const handleClose = () => {
    dispatch(clearCompanyInsight());
  };

  return (
    <Card className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 border-r">
        <CompanyInsightSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {!data ? (
          <PreloadingScreen />
        ) : (
          <CompanyDetailsComponent data={data} />
        )}
      </div>
    </Card>
  );
}