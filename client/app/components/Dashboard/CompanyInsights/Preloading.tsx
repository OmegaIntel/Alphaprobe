import { useState, useEffect } from 'react';
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
}

export default function PreloadingScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    const savedResults = localStorage.getItem('searchResults');
    if (savedResults) {
      setResults(JSON.parse(savedResults));
      setIsFirstVisit(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setIsFirstVisit(false);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/companies?query=${encodeURIComponent(query.trim())}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${document.cookie.split('authToken=')[1]?.split(';')[0] || ''}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error(await response.text());
      }

      const data = await response.json();
      setResults(data.companies);
      localStorage.setItem('searchResults', JSON.stringify(data.companies));
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

  const handleCompanySelection = async (company: string) => {
    dispatch(fetchCompanyInsightStart());
    setGenerating(true);

    try {
      const response = await fetch(
        `https://omegaintelligence.ai/api/api/company-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: { company_name: company } }),
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
      <div className="w-full max-w-2xl space-y-8">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for companies within any industry or sector..."
            className="flex-1"
          />
          {/* <Button 
            onClick={handleSearch}
            disabled={loading}
            variant="secondary"
            size="icon"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button> */}
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
                  Generating data for the selected company...
                </p>
              </div>
            ) : isFirstVisit ? (
              <p className="text-center text-muted-foreground">
                Search for a company to begin.
              </p>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {results.map((company, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    className="h-auto py-2 px-4 text-sm"
                    onClick={() => handleCompanySelection(company)}
                  >
                    {company}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No companies found. Try searching for other domains or niches.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}