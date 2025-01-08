import { useState } from "react";
import { useDispatch } from "react-redux";
import { Search, Loader2 } from "lucide-react";
import { API_BASE_URL } from "~/constant";
import { setFormResponse } from "~/store/slices/formResponseSlice";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/use-toast";

interface SearchResponse {
  // Add your specific response type fields
  [key: string]: any;
}

export function MarketResearchPreload() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const dispatch = useDispatch();
  const { toast } = useToast();

  const handleSearch = async (): Promise<void> => {
    if (!query.trim()) return;

    setIsSearching(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/industries-for-userquery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ search_query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json() as SearchResponse;
      dispatch(setFormResponse(data));
      setQuery("");
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to perform search",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-32 h-screen bg-background">
      <div className="inline-flex bg-background px-10 py-4 gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isSearching && handleSearch()}
          placeholder="Search for any industry or sector..."
          className="w-[30rem]"
          disabled={isSearching}
        />
        <Button
          type="button"
          onClick={handleSearch}
          size="icon"
          variant="secondary"
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}