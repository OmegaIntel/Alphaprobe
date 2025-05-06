
// app/routes/api-test.tsx
import { json, type MetaFunction, type ActionFunction } from "@remix-run/node";
import { 
  searchCompanies,
  getCompanyDetails,
  DEFAULT_API_KEY
} from "~/services/coresignal-api";
import CoreSignalMain from "~/components/CoreSignal/Main";import React, { useState } from "react";
import UploadSearch from "~/view/CompanyHouse/UploadSearch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Card, CardContent } from "~/components/ui/card";


export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const query = formData.get("query") as string;
    let apiKey = formData.get("apiKey") as string;
    const companyId = formData.get("companyId") as string;
    const page = parseInt(formData.get("page") as string || "1");
    
    // Always use the default API key if none is provided
    if (!apiKey) {
      apiKey = DEFAULT_API_KEY;
    }
    
    // If a specific company ID is provided, fetch company details
    if (companyId) {
      const result = await getCompanyDetails(companyId, apiKey);
      return json({
        ...result,
        lastQuery: query,
      });
    }
  
    // Regular search flow
    if (!query || query.length < 3) {
      return json({ 
        error: 'Search query must be at least 3 characters',
        apiKey: apiKey // Always pass the API key back
      });
    }
  
    // Search for companies
    const searchResult = await searchCompanies(query, apiKey, page);
    return json(searchResult);
  };

  
const MarketResearch: React.FC = () => {
  const [activeTab, setActiveTab] = useState("companyHouse");

  return (
    <div className="container mx-auto py-6">
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <Tabs
            defaultValue="companyHouse"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-center mb-6">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="companyHouse">Company House</TabsTrigger>
                <TabsTrigger value="uploadDocuments">Upload Documents</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="companyHouse" className="mt-0">
            <CoreSignalMain />
            </TabsContent>

            <TabsContent value="uploadDocuments" className="mt-0">
              <UploadSearch />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketResearch;

