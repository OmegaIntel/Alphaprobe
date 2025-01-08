import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { useDispatch } from 'react-redux';
import { API_BASE_URL } from '~/constant';
import {
  fetchCompanyInsightStart,
  fetchCompanyInsightFailure,
  fetchCompanyInsightSuccess,
} from '~/store/slices/companyInsightsSlice';
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useToast } from '~/hooks/use-toast';
import { Loader2 } from "lucide-react";

export default function CompanyInsightSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedResults = localStorage.getItem('searchResults');
    if (savedResults) {
      setItems(JSON.parse(savedResults));
    }
  }, []);

  const handleSelectItem = async (companyName: string) => {
    setSelectedCompany(companyName);
    setIsLoading(true);
    dispatch(fetchCompanyInsightStart());

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('authToken='))
        ?.split('=')[1];

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/company-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: { company_name: companyName } }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error(await response.text());
      }

      const result = await response.json();
      dispatch(fetchCompanyInsightSuccess(result));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch(fetchCompanyInsightFailure(errorMessage));
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setSelectedCompany(null);
    }
  };

  return (
    <Card className="h-screen flex flex-col border-0 rounded-none">
      <CardHeader className="bg-background border-b">
        <div className="p-4">
          <img
            src="/images/LogoCompany.png"
            alt="Company Logo"
            className="my-4"
          />
          <CardTitle>Companies</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
            {items.map((item) => (
              <div
                key={item}
                className={`flex items-center justify-between p-3 rounded-md hover:bg-accent transition-colors cursor-pointer ${
                  selectedCompany === item ? 'bg-accent' : ''
                }`}
                onClick={() => !isLoading && handleSelectItem(item)}
              >
                <span className="text-sm font-medium truncate">
                  {item}
                </span>
                {isLoading && selectedCompany === item && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}