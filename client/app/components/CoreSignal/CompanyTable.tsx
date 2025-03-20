// app/components/company-table.tsx
import React from "react";
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "~/components/ui/table";
import { Info, ChevronLeft, ChevronRight } from "lucide-react";
import type { CompanyData } from "~/services/coresignal-api";

interface PaginationInfo {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  resultsPerPage: number;
  startIndex: number;
  endIndex: number;
}

interface CompanyTableProps {
  companies: CompanyData[];
  pagination: PaginationInfo;
  apiKey: string;
  lastQuery: string;
  isSubmitting: boolean;
}

export default function CompanyTable({ 
  companies, 
  pagination, 
  apiKey, 
  lastQuery,
  isSubmitting
}: CompanyTableProps) {
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      // Submit form with new page
      document.getElementById("page-input")?.setAttribute("value", newPage.toString());
      const form = document.getElementById("pagination-form") as HTMLFormElement;
      form?.requestSubmit();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Search Results</h3>
        {pagination && (
          <p className="text-sm text-gray-600">
            Showing {pagination.startIndex}-{pagination.endIndex} of {pagination.totalResults} results
          </p>
        )}
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Founded</TableHead>
              <TableHead className="text-right">Employees</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company: CompanyData) => (
              <TableRow key={company.id}>
                <TableCell>
                  <Form method="post" className="inline">
                    <input type="hidden" name="apiKey" value={apiKey} />
                    <input type="hidden" name="query" value={lastQuery} />
                    <input type="hidden" name="companyId" value={company.id} />
                    <Button 
                      type="submit" 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                    >
                      <Info size={16} />
                    </Button>
                  </Form>
                </TableCell>
                <TableCell className="font-medium">
                  {company.name || "Unknown"}
                </TableCell>
                <TableCell>{company.industry || "—"}</TableCell>
                <TableCell>
                  {[
                    company.headquarters_city,
                    company.headquarters_country_parsed
                  ].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell>{company.founded || "—"}</TableCell>
                <TableCell className="text-right">
                  {company.employee_count ? company.employee_count.toLocaleString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between space-x-6 mt-4">
          <Form id="pagination-form" method="post" className="flex-1">
            <input type="hidden" name="apiKey" value={apiKey} />
            <input type="hidden" name="query" value={lastQuery} />
            <input 
              type="hidden" 
              id="page-input" 
              name="page" 
              value={pagination.currentPage} 
            />
            
            <div className="flex items-center justify-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1 || isSubmitting}
              >
                <ChevronLeft size={16} />
                <span className="sr-only">Previous Page</span>
              </Button>
              
              <span className="text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages || isSubmitting}
              >
                <ChevronRight size={16} />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}