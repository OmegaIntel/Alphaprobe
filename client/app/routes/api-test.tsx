// app/routes/api-test.tsx
import { useState, useEffect } from "react";
import { json, type MetaFunction, type ActionFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation, useSearchParams } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "~/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "~/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "~/components/ui/dialog";
import { Search, ExternalLink, Info, ChevronLeft, ChevronRight } from "lucide-react";
import CoreSignalMain from "~/components/CoreSignal/Main";

export const meta: MetaFunction = () => {
  return [
    { title: "CoreSignal API Test" },
    { name: "description", content: "Test the CoreSignal API response" },
  ];
};

// Define types for Elasticsearch DSL query and API response data
interface ElasticsearchDSLQuery {
  query: {
    bool: {
      must: any[];
    }
  }
}

interface CompanyFundingRound {
  last_round_type?: string;
  last_round_date?: string;
  last_round_money_raised?: number;
}

interface EnrichedData {
  revenue?: number;
  technologies?: string[];
  competitors?: string[];
  social_profiles?: Record<string, string>;
}

interface CompanyData {
  id: number;
  name: string;
  industry?: string;
  description?: string;
  website?: string;
  headquarters_city?: string;
  headquarters_region?: string;
  headquarters_country?: string;
  headquarters_country_parsed?: string;
  founded?: string;
  employee_count?: number;
  specialties?: string;
  company_funding_rounds_collection?: CompanyFundingRound[];
}

interface CompanyWithEnrichedData extends CompanyData {
  enrichedData?: EnrichedData;
}

// Helper function to create Elasticsearch DSL query
const createElasticsearchQuery = (query: string): ElasticsearchDSLQuery => {
  // Basic query to search in name, description, and industry
  const dslQuery: ElasticsearchDSLQuery = {
    query: {
      bool: {
        must: []
      }
    }
  };

  // Add main query string search (searches across multiple fields)
  dslQuery.query.bool.must.push({
    query_string: {
      query: query,
      fields: ["name^3", "description", "industry"],
      default_operator: "and"
    }
  });

  // Check for special conditions in the query
  const queryLower = query.toLowerCase();

  // Handle location filters
  if (queryLower.includes("us") || 
      queryLower.includes("usa") || 
      queryLower.includes("united states")) {
    dslQuery.query.bool.must.push({
      query_string: {
        query: "United States",
        default_field: "headquarters_country_parsed",
        default_operator: "and"
      }
    });
  } else if (queryLower.includes("uk") || queryLower.includes("united kingdom")) {
    dslQuery.query.bool.must.push({
      query_string: {
        query: "United Kingdom",
        default_field: "headquarters_country_parsed",
        default_operator: "and"
      }
    });
  } else if (queryLower.includes("canada")) {
    dslQuery.query.bool.must.push({
      query_string: {
        query: "Canada",
        default_field: "headquarters_country_parsed",
        default_operator: "and"
      }
    });
  }

  // Check for industries
  const industryKeywords = [
    { keyword: "food", industry: "Food & Beverages" },
    { keyword: "tech", industry: "Information Technology" },
    { keyword: "software", industry: "Software Development" },
    { keyword: "finance", industry: "Financial Services" },
    { keyword: "healthcare", industry: "Healthcare" },
    { keyword: "retail", industry: "Retail" }
  ];

  for (const item of industryKeywords) {
    if (queryLower.includes(item.keyword)) {
      dslQuery.query.bool.must.push({
        query_string: {
          query: item.industry,
          default_field: "industry",
          default_operator: "and"
        }
      });
      break;
    }
  }

  // Check for year mentions (founding year)
  const yearPattern = /\b(20\d{2}|19\d{2})\b/;
  const yearMatch = query.match(yearPattern);
  if (yearMatch && yearMatch[1]) {
    const year = yearMatch[1];
    
    // If query contains "founded" or "established", search in founded field
    if (queryLower.includes("founded") || queryLower.includes("established")) {
      dslQuery.query.bool.must.push({
        query_string: {
          query: year,
          default_field: "founded",
          default_operator: "and"
        }
      });
    }
  }

  return dslQuery;
};

// This is a server-side action that will handle the API request
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const query = formData.get("query") as string;
  const apiKey = formData.get("apiKey") as string;
  const companyId = formData.get("companyId") as string;
  const page = parseInt(formData.get("page") as string || "1");
  const resultsPerPage = 10; // Number of results to fetch at once
  
  // If a specific company ID is provided, fetch detailed data for that company
  if (companyId) {
    try {
      // Fetch the basic company data
      const url = `https://api.coresignal.com/cdapi/v1/professional_network/company/collect/${companyId}`;
      
      console.log("Fetching company details:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return json({
          error: `API Error: ${response.status} ${response.statusText}`,
          errorDetails: errorText
        });
      }
      
      // Get the basic company data
      const companyData = await response.json();
      
      // If the company has a website, we can try to get enriched data from the Multi-source API
      let enrichedData = null;
      if (companyData.website) {
        try {
          const websiteUrl = companyData.website.startsWith('http') 
            ? companyData.website 
            : `https://${companyData.website}`;
            
          const enrichUrl = `https://api.coresignal.com/cdapi/v1/multi_source/company/enrich/?website=${encodeURIComponent(websiteUrl)}`;
          
          console.log("Fetching enriched company data:", enrichUrl);
          
          const enrichResponse = await fetch(enrichUrl, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${apiKey}`
            }
          });
          
          if (enrichResponse.ok) {
            enrichedData = await enrichResponse.json();
          }
        } catch (error) {
          console.error("Error fetching enriched data:", error);
          // Continue without enriched data
        }
      }
      
      return json({
        selectedCompany: companyData,
        enrichedData: enrichedData,
        lastQuery: query
      });
    } catch (err) {
      return json({
        error: err instanceof Error ? err.message : "Unknown error occurred"
      });
    }
  }
  
  // Regular search flow
  if (!query || query.length < 3) {
    return json({ error: "Search query must be at least 3 characters" });
  }
  
  if (!apiKey) {
    return json({ error: "API key is required" });
  }
  
  // Create Elasticsearch DSL query
  const dslQuery = createElasticsearchQuery(query);
  
  try {
    // Server-side API call using Elasticsearch DSL endpoint
    const url = "https://api.coresignal.com/cdapi/v1/professional_network/company/search/es_dsl";
    
    console.log("Server sending request to:", url);
    console.log("With DSL query:", JSON.stringify(dslQuery, null, 2));
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(dslQuery)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, response.statusText);
      console.error("Error details:", errorText);
      
      return json({
        error: `API Error: ${response.status} ${response.statusText}`,
        errorDetails: errorText,
        searchQuery: dslQuery
      });
    }
    
    const companyIds = await response.json();
    
    // Calculate pagination
    const totalResults = companyIds.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    const startIndex = (page - 1) * resultsPerPage;
    const endIndex = Math.min(startIndex + resultsPerPage, totalResults);
    
    // Get the IDs for the current page
    const pageCompanyIds = companyIds.slice(startIndex, endIndex);
    
    // Fetch details for companies on the current page
    let companiesData = [];
    for (const id of pageCompanyIds) {
      const detailUrl = `https://api.coresignal.com/cdapi/v1/professional_network/company/collect/${id}`;
      
      const detailResponse = await fetch(detailUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      });
      
      if (detailResponse.ok) {
        const detail = await detailResponse.json();
        companiesData.push(detail);
      }
    }
    
    return json({
      success: true,
      searchQuery: dslQuery,
      companies: companiesData,
      pagination: {
        totalResults,
        totalPages,
        currentPage: page,
        resultsPerPage,
        startIndex: startIndex + 1,
        endIndex
      },
      lastQuery: query
    });
  } catch (err) {
    console.error("Error calling CoreSignal API:", err);
    return json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
      searchQuery: dslQuery
    });
  }
};

export default function ApiTestPage() {  
  return (
    <div className="container mx-auto py-8">
      <CoreSignalMain />
    </div>
  );
}