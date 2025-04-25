// app/services/coresignal-api.ts
import { json } from "@remix-run/node";
import { CORESIGNAL_API_KEY } from "~/constant";

// Define types for API response data
export interface CompanyFundingRound {
    id?: number;
    last_round_type?: string;
    last_round_date?: string;
    last_round_money_raised?: number;
    last_round_money_raised_currency?: string;
    deleted?: number;
  }
  
  export interface CompanySpecialty {
    id?: number;
    company_id?: number;
    specialty?: string;
    created?: string;
    last_updated?: string;
    deleted?: number;
  }
  
  export interface EnrichedData {
    revenue?: number;
    technologies?: string[];
    competitors?: string[];
    social_profiles?: Record<string, string>;
  }
  
  export interface CompanyData {
    id: number;
    name: string;
    industry?: string;
    description?: string;
    website?: string;
    headquarters_city?: string;
    headquarters_region?: string;
    headquarters_country?: string;
    headquarters_country_parsed?: string;
    headquarters_country_restored?: string;
    founded?: string | number;
    employee_count?: number;
    size?: string;
    type?: string;
    specialties?: string;
    company_funding_rounds_collection?: CompanyFundingRound[];
    company_specialties_collection?: CompanySpecialty[];
    company_affiliated_collection?: any[];
    company_also_viewed_collection?: any[];
    company_similar_collection?: any[];
    company_featured_employees_collection?: any[];
    deleted?: number;
  }
  
  export interface CompanyWithEnrichedData extends CompanyData {
    enrichedData?: EnrichedData;
  }
// Define types for Elasticsearch DSL query
export interface ElasticsearchDSLQuery {
  query: {
    bool: {
      must: any[];
    }
  }
}

// Default API key - this should always be available
export const DEFAULT_API_KEY = CORESIGNAL_API_KEY;

// Helper function to create Elasticsearch DSL query
export const createElasticsearchQuery = (query: string): ElasticsearchDSLQuery => {
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

// Format date from API into readable format
export const formatDate = (dateString?: string): string => {
  if (!dateString) return "Unknown";
  
  // Check if it's a timestamp format with hours/minutes
  if (dateString.includes("00:00:00")) {
    // Convert to readable date without time
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  return dateString;
};

// Format currency amount
export const formatCurrency = (amount?: number | string, currency?: string): string => {
  if (!amount) return "Unknown";
  
  // If it's already a string with currency designation
  if (typeof amount === 'string' && amount.includes('$')) {
    return amount;
  }
  
  let numericAmount: number;
  if (typeof amount === 'string') {
    // Try to parse numeric string
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ''));
    numericAmount = isNaN(parsed) ? 0 : parsed;
  } else {
    numericAmount = amount;
  }
  
  const currencySymbol = currency ? currency : 'US$';
  
  // Format with K/M/B for large numbers
  if (numericAmount >= 1000000000) {
    return `${currencySymbol} ${(numericAmount / 1000000000).toFixed(1)}B`;
  } else if (numericAmount >= 1000000) {
    return `${currencySymbol} ${(numericAmount / 1000000).toFixed(1)}M`;
  } else if (numericAmount >= 1000) {
    return `${currencySymbol} ${(numericAmount / 1000).toFixed(1)}K`;
  }
  
  return `${currencySymbol} ${numericAmount.toLocaleString()}`;
};

// Search companies function
export const searchCompanies = async (query: string, apiKey: string = DEFAULT_API_KEY, page: number = 1) => {
  const resultsPerPage = 10; // Number of results per page
  
  try {
    // Create Elasticsearch DSL query
    const dslQuery = createElasticsearchQuery(query);
    
    // Always use default API key if none provided, or use the provided one
    // This ensures we always have a key
    const effectiveApiKey = apiKey || DEFAULT_API_KEY;
    
    // Updated endpoint as per v2 API documentation
    const url = "https://api.coresignal.com/cdapi/v2/company_base/search/es_dsl";
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Updated authorization header format
        "apikey": effectiveApiKey
      },
      body: JSON.stringify(dslQuery)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, response.statusText);
      console.error("Error details:", errorText);
      
      return {
        error: `API Error: ${response.status} ${response.statusText}`,
        errorDetails: errorText,
        searchQuery: dslQuery,
        apiKey: effectiveApiKey // Pass the API key back to the client for future requests
      };
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
      // Updated endpoint as per v2 API documentation
      const detailUrl = `https://api.coresignal.com/cdapi/v2/company_base/collect/${id}`;
      
      const detailResponse = await fetch(detailUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          // Updated authorization header format
          "apikey": effectiveApiKey
        }
      });
      
      if (detailResponse.ok) {
        const detail = await detailResponse.json();
        companiesData.push(detail);
      }
    }
    
    return {
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
      lastQuery: query,
      apiKey: effectiveApiKey // Pass the API key back to the client for future requests
    };
  } catch (err) {
    console.error("Error calling CoreSignal API:", err);
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
      searchQuery: createElasticsearchQuery(query),
      apiKey: apiKey || DEFAULT_API_KEY // Pass the API key back even in error case
    };
  }
};

// Get company details by ID
export const getCompanyDetails = async (companyId: string, apiKey: string = DEFAULT_API_KEY) => {
  try {
    // Always use default API key if none provided, or use the provided one
    const effectiveApiKey = apiKey || DEFAULT_API_KEY;
    
    // Updated endpoint as per v2 API documentation
    const url = `https://api.coresignal.com/cdapi/v2/company_base/collect/${companyId}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        // Updated authorization header format
        "apikey": effectiveApiKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        error: `API Error: ${response.status} ${response.statusText}`,
        errorDetails: errorText,
        apiKey: effectiveApiKey // Return the API key for future requests
      };
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
          
        // Updated endpoint as per v2 API documentation
        const enrichUrl = `https://api.coresignal.com/cdapi/v2/company_multi_source/enrich/?website=${encodeURIComponent(websiteUrl)}`;
        
        const enrichResponse = await fetch(enrichUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            // Updated authorization header format
            "apikey": effectiveApiKey
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
    
    return {
      selectedCompany: companyData,
      enrichedData: enrichedData,
      apiKey: effectiveApiKey, // Return the API key for future requests
      lastQuery: "" // Initialize lastQuery
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
      apiKey: apiKey || DEFAULT_API_KEY // Return the API key even in case of error
    };
  }
};