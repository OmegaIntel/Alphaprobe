// app/components/CoreSignal/SearchForm.tsx
import React, { useState } from "react";
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";
import { DEFAULT_API_KEY } from "~/services/coresignal-api";

interface SearchFormProps {
  isSubmitting: boolean;
  defaultQuery?: string;
  onSubmit?: () => void;
  apiKey?: string;
}

export default function SearchForm({ 
  isSubmitting, 
  defaultQuery = "",
  onSubmit,
  apiKey = DEFAULT_API_KEY
}: SearchFormProps) {
  const [query, setQuery] = useState(defaultQuery);
  
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    }
  };
  
  return (
    <Form method="post" className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Query:</label>
        <div className="flex w-full items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              name="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., food companies in US, tech startups founded in 2020"
              className="pl-10"
              required
              minLength={3}
            />
            {/* Include hidden input fields for API key and page */}
            <input type="hidden" name="apiKey" value={apiKey} />
            <input type="hidden" name="page" value="1" />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Searching..." : "Search"}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Try queries like "tech startups in US", "food companies", or "healthcare companies"
        </p>
      </div>
    </Form>
  );
}