import React, { useState } from "react";
import { 
  ArrowUpRight, 
  ChevronDown,
  BarChart3,
  PieChart,
  Calculator,
  User,
  Hand,
  Circle
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Card,
  CardContent,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";

interface SearchBarProps {
  className?: string;
}

interface SuggestionItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Industry {
  id: string;
  name: string;
}

const CompanyHouse: React.FC<SearchBarProps> = ({ className }) => {
  const [query, setQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  
  // Industries for dropdown
  const industries: Industry[] = [
    { id: "1", name: "Rightmove plc" },
    { id: "2", name: "Amazon Inc" },
    { id: "3", name: "Google LLC" },
    { id: "4", name: "Microsoft Corporation" },
    { id: "5", name: "Apple Inc" },
  ];
  
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>(industries[0]);

  // Dummy data for recent searches/suggestions
  const dummySuggestions: SuggestionItem[] = [
    {
      id: "1",
      icon: <BarChart3 className="h-5 w-5 text-gray-500" />,
      title: "What has been the free cash flow trend",
      description: "of Wise since going public in 2021?",
    },
    {
      id: "2",
      icon: <PieChart className="h-5 w-5 text-gray-500" />,
      title: "Provide a revenue breakdown for",
      description: "Unilever by product segment over the past 3 years?",
    },
    {
      id: "3",
      icon: <Calculator className="h-5 w-5 text-gray-500" />,
      title: "How did depreciation change for Jet2",
      description: "Plc from FY22 to FY24?",
    },
    {
      id: "4",
      icon: <User className="h-5 w-5 text-gray-500" />,
      title: "What was the compensation of the",
      description: "highest paid executive at Monzo Bank?",
    },
  ];

  return (
    <div className={cn("w-full max-w-4xl mx-auto px-4", className)}>
      <div className="relative">
        {/* Industry Selector */}
        <div className="flex items-center mb-4 text-blue-500">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                <div className="flex items-center">
                  <Circle className="h-4 w-4 mr-2 fill-blue-500 text-blue-500" />
                  <span className="text-sm font-medium text-blue-500">{selectedIndustry.name}</span>
                  <ChevronDown className="h-3 w-3 ml-1 text-blue-500" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {industries.map((industry) => (
                <DropdownMenuItem 
                  key={industry.id}
                  onClick={() => setSelectedIndustry(industry)}
                >
                  {industry.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Combined Search Bar with Dropdowns in two rows */}
        <div className="relative">
          <Card className="p-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col w-full">
                {/* First row: Input and Search Button */}
                <div className="flex items-center w-full">
                  {/* Hand Icon */}
                  {/* <div className="pl-3">
                    <Hand className="h-5 w-5 text-gray-400" />
                  </div> */}
                  
                  {/* Input */}
                  <Input
                    type="text"
                    placeholder="Search or ask any question..."
                    className="flex-grow border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  />
                  
                  {/* Search Button - Fixed with rounded-r-lg */}
                  <Button
                    size="icon"
                    className="h-12 aspect-square border-l text-black border-gray-200 rounded-none rounded-r-lg bg-red-600 hover:bg-red-700"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Second row: Dropdowns and Toggle */}
                <div className="flex items-center w-full border-t border-gray-200 px-2 py-1">
                  {/* Filings Dropdown */}
                  <div className="flex items-center mr-4">
                    <Select defaultValue="filings">
                      <SelectTrigger className="w-28 h-8 border-0 bg-transparent focus:ring-0">
                        <SelectValue placeholder="Filings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="filings">Filings</SelectItem>
                        <SelectItem value="annual">Annual Reports</SelectItem>
                        <SelectItem value="quarterly">Quarterly Reports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Earnings Calls Dropdown */}
                  <div className="flex items-center mr-4">
                    <Select defaultValue="earnings">
                      <SelectTrigger className="w-36 h-8 border-0 bg-transparent focus:ring-0">
                        <SelectValue placeholder="Earnings Calls" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="earnings">Earnings Calls</SelectItem>
                        <SelectItem value="q1">Q1 Earnings</SelectItem>
                        <SelectItem value="q2">Q2 Earnings</SelectItem>
                        <SelectItem value="q3">Q3 Earnings</SelectItem>
                        <SelectItem value="q4">Q4 Earnings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Web Search Toggle Button */}
                  <div className="flex items-center ml-auto">
                    <Button
                      onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                      variant={webSearchEnabled ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "rounded-full h-8", 
                        webSearchEnabled 
                          ? "bg-blue-500 hover:bg-blue-600" 
                          : "bg-transparent hover:bg-gray-100"
                      )}
                    >
                      Web Search
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "ml-2 w-2 h-2 p-0 rounded-full", 
                          webSearchEnabled ? "bg-white" : "bg-gray-400"
                        )} 
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions/History */}
        {isSearchFocused && (
          <Card className="absolute w-full mt-2 shadow-lg z-10">
            <CardContent className="p-2">
              <div className="text-xs text-gray-500 p-2">
                Try these example queries to explore Fira's capabilities
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {dummySuggestions.map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    variant="ghost"
                    className="flex items-start justify-start gap-3 p-3 h-auto"
                    onClick={() => setQuery(`${suggestion.title} ${suggestion.description}`)}
                  >
                    <div className="mt-1">{suggestion.icon}</div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{suggestion.title}</div>
                      <div className="text-sm text-gray-500">{suggestion.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompanyHouse;