import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { useDispatch } from 'react-redux';
import { API_BASE_URL } from '~/constant';
import {
  fetchCompanyInsightSuccess,
  fetchCompanyInsightFailure,
  fetchCompanyInsightStart,
} from '~/store/slices/companyInsightsSlice';
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import { useToast } from '~/hooks/use-toast';

interface CompanySearchResults {
  companies: string[];
  industries?: string[];
}

export default function CompanySearch() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [screen, setScreen] = useState<'initial' | 'search'>('initial');
  const [searchType, setSearchType] = useState<'company' | 'industry'>('company');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Handle initial card selection
  const handleCardSelection = (type: 'company' | 'industry') => {
    setSearchType(type);
    setScreen('search');
  };

  // Handle search functionality
  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const token = document.cookie.split('authToken=')[1]?.split(';')[0] || '';
      let response: Response;

      if (searchType === 'company') {
        response = await fetch(
          `${API_BASE_URL}/api/company-profile`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ data: { company_name: query.trim() } }),
          }
        );
      } else {
        response = await fetch(
          `${API_BASE_URL}/api/companies?query=${encodeURIComponent(query.trim())}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
      }

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error(await response.text());
      }

      const data: CompanySearchResults = await response.json();
      setResults(data.companies || data.industries || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred while searching'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle company/industry selection and API call
  const handleSelection = async (selectedItem: string) => {
    dispatch(fetchCompanyInsightStart());
    setGenerating(true);

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('authToken='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/company-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ data: { company_name: selectedItem } }),
        }
      );

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
        description: errorMessage
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      {screen === 'initial' ? (
        // Initial Screen
        <div className="w-full max-w-2xl space-y-8">
          <Card className="w-full cursor-pointer" onClick={() => handleCardSelection('company')}>
            <CardHeader>
              <h3 className="text-lg font-semibold text-center">
                Search by Company
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Find specific companies by name.
              </p>
            </CardContent>
          </Card>

          <Card className="w-full cursor-pointer" onClick={() => handleCardSelection('industry')}>
            <CardHeader>
              <h3 className="text-lg font-semibold text-center">
                Search by Industry
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Find companies within a specific industry.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Search Screen
        <div className="w-full max-w-2xl space-y-8">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={`Search for ${searchType === 'company' ? 'companies' : 'industries'}...`}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Results Card */}
          <Card className="w-full">
            <CardHeader>
              <h3 className="text-lg font-semibold text-center">
                Search Results
              </h3>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="text-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-muted-foreground">
                    Generating data for the selected {searchType}...
                  </p>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {results.map((item, index) => (
                    <Button
                      key={index}
                      variant="secondary"
                      className="h-auto py-2 px-4 text-sm"
                      onClick={() => handleSelection(item)}
                      disabled={generating}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  No {searchType === 'company' ? 'companies' : 'industries'} found. Try another search.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}