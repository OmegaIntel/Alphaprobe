import {
  useState,
  useRef,
  type FormEvent,
  type ChangeEvent,
  useEffect,
} from 'react';
import { useDispatch } from 'react-redux';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';
import { API_BASE_URL } from '~/constant';
import {
  setSummaryData,
  setError,
  setLoading,
} from '~/store/slices/industrySlice';
import { setFormResponse } from '~/store/slices/formResponseSlice';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { useToast } from '~/hooks/use-toast';
import { AppDispatch } from '~/store/store';

interface Industry {
  industry_code: string;
  industry_name: string;
}

interface FuzzySearchProps {
  section: string;
  industry?: Industry[];
  setIndustry?: (industries: Industry[]) => void;
  styles?: {
    container?: string;
    input?: string;
    button?: string;
    suggestions?: string;
    suggestionItem?: string;
  };
}

interface SearchItem {
  name: string;
  code: string;
}

interface SummaryResponse {
  result: {
    content: string;
    [key: string]: any;
  }[];
  success?: boolean;
  error?: string;
}

export function FuzzySearch({
  section,
  industry,
  setIndustry,
  styles = {},
}: FuzzySearchProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const fuseRef = useRef<Fuse<SearchItem>>(
    new Fuse([], {
      keys: ['name'],
      threshold: 0.7,
    })
  );

  const queryRef = useRef('');
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [industryName, setIndustryName] = useState('');
  const [industryCode, setIndustryCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleSearch = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (typeof window === 'undefined' || !isMounted) return;
    if (!industryName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter an industry name',
      });
      return;
    }

    setIsSearching(true);
    dispatch(setLoading());

    try {
      const payload = {
        data: {
          source: 'IBIS',
          industry_name: industryName,
          industry_code: '0',
        },
      };

      if (industry && setIndustry) {
        const industryToAdd: Industry = {
          industry_code: payload.data.industry_code,
          industry_name: payload.data.industry_name,
        };
        setIndustry([...industry, industryToAdd]);
      } else {
        const PreloadPayload = {
          result: [
            {
              industry_code: payload.data.industry_code,
              industry_name: payload.data.industry_name,
            },
          ],
        };
        dispatch(setFormResponse(PreloadPayload));
      }

      const response = await fetch(`${API_BASE_URL}/api/industry-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch industry summary');
      }

      const result = (await response.json()) as SummaryResponse;

      if (!result.result || result.result.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid Industry',
          description: 'Please enter a valid industry name.',
        });
        return;
      }

      // Get the first result's content or a default message
      const summaryContent =
        result.result[0]?.content || 'No summary available for this industry';
      dispatch(setSummaryData(summaryContent));

      queryRef.current = '';
      setIndustryName('');
      setSuggestions([]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch industry data';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      dispatch(setError(errorMessage));
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = async (
    e: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (typeof window === 'undefined' || !isMounted) return;

    const value = e.target.value;
    queryRef.current = value;
    setIndustryName(value);

    try {
      if (!value.trim()) {
        setSuggestions([]);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/fuzzy-search?query=${encodeURIComponent(value)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = (await response.json()) as SearchItem[];
      fuseRef.current = new Fuse(data, {
        keys: ['name'],
        threshold: 0.7,
      });

      const results = fuseRef.current
        .search(value)
        .map((result) => result.item);
      setSuggestions(results);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch suggestions',
      });
      setSuggestions([]);
    }
  };

  const handleClickChange = (item: SearchItem): void => {
    if (!isMounted) return;
    selectSuggestion(item.name);
    setIndustryName(item.name);
    setIndustryCode(item.code);
  };

  const selectSuggestion = (item: string): void => {
    if (!isMounted) return;
    queryRef.current = item;
    setSuggestions([]);
  };

  if (typeof window === 'undefined' || !isMounted) {
    return null;
  }

  return (
    <div className={`relative mx-auto ${styles.container || ''}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="inline-flex">
          <Input
            type="text"
            name="fuzzySearch"
            value={queryRef.current}
            onChange={handleInputChange}
            placeholder={section}
            className={`w-40 ${styles.input || ''}`}
            disabled={isSearching}
          />
          <Button
            type="submit"
            variant="secondary"
            size="icon"
            className={`ml-2 ${styles.button || ''}`}
            disabled={isSearching}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div
            className={`absolute mt-1 max-h-48 w-full z-10 overflow-y-auto rounded-lg border bg-popover shadow-md ${styles.suggestions || ''}`}
          >
            {suggestions.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className={`w-full justify-start font-normal hover:bg-muted ${styles.suggestionItem || ''}`}
                onClick={() => handleClickChange(item)}
              >
                {item.name}
              </Button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}

export default FuzzySearch;
