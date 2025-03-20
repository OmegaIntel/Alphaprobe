// app/components/CoreSignal/Main.tsx
import { useState, useEffect } from 'react';
import { useActionData, useNavigation } from '@remix-run/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Dialog } from '~/components/ui/dialog';
import { CORESIGNAL_API_KEY } from '~/constant';

// Import components and types
import SearchForm from './SearchForm';
import CompanyTable from './CompanyTable';
import CompanyDetails from './CompanyDetails';
import { CompanyWithEnrichedData, DEFAULT_API_KEY } from '~/services/coresignal-api';

export default function CoreSignalMain() {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyWithEnrichedData | null>(null);
  
  const actionData = useActionData<any>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  
  // Get the API key from action data or use the default
  const apiKey = CORESIGNAL_API_KEY;

  // Update selected company when action data changes
  useEffect(() => {
    if (actionData?.selectedCompany) {
      const companyWithEnriched = {
        ...actionData.selectedCompany,
        enrichedData: actionData.enrichedData,
      };
      
      // Log the company data that will be displayed in the UI
    //   console.log("🔍 Selected company data (client-side):", companyWithEnriched);
      
      setSelectedCompany(companyWithEnriched);
      setShowDetailsDialog(true);
    }
  }, [actionData]);

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>CoreSignal Company Search</CardTitle>
        <CardDescription>
          Enter a natural language query to search companies
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Add a hidden API key input that will be included in all forms */}
        <input type="hidden" name="apiKey" value={apiKey} />
        
        <SearchForm
          isSubmitting={isSubmitting}
          defaultQuery={actionData?.lastQuery || ''}
          apiKey={apiKey}
        />

        {actionData?.error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700">{actionData.error}</p>
            {actionData.errorDetails && (
              <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 overflow-auto max-h-40">
                {actionData.errorDetails}
              </pre>
            )}
          </div>
        )}


        {actionData?.companies &&
          actionData.companies.length > 0 &&
          actionData.pagination && (
            <div className="mt-6">
              <CompanyTable
                companies={actionData.companies}
                pagination={actionData.pagination}
                lastQuery={actionData.lastQuery || ''}
                isSubmitting={isSubmitting}
                apiKey={apiKey}
              />
            </div>
          )}
      </CardContent>
      
      {/* Company Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <CompanyDetails company={selectedCompany} />
      </Dialog>
    </Card>
  );
}