// app/components/CoreSignal/CompanyDetails.tsx
import React, { useState } from "react";
import { 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ExternalLink, MapPin, Calendar, Users, Info, Building, Globe } from "lucide-react";
import { formatDate, formatCurrency } from "~/services/coresignal-api";
import type { CompanyWithEnrichedData } from "~/services/coresignal-api";

interface CompanyDetailsProps {
  company: CompanyWithEnrichedData | null;
}

export default function CompanyDetails({ company }: CompanyDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!company) {
    return (
      <DialogContent>
        <div className="py-8 text-center">
          <p>Loading company details...</p>
        </div>
      </DialogContent>
    );
  }

  // Prepare company data
  const companyName = company.name || "Company Details";
  const industry = company.industry || "No industry information available";
  const description = company.description || "No company description available";
  const employeeCount = company.employee_count ? `${company.employee_count.toLocaleString()} employees` : "Unknown";
  const foundedYear = company.founded || "Unknown";
  
  // Location details
  const locationParts = [
    company.headquarters_city,
    company.headquarters_region,
    company.headquarters_country_parsed || company.headquarters_country_restored || company.headquarters_country
  ].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(", ") : "Unknown";

  // Website
  const websiteDisplay = company.website || "Not available";
  const websiteUrl = company.website && (
    company.website.startsWith('http') ? company.website : `https://${company.website}`
  );

  // Company size
  const companySize = company.size || employeeCount;

  // Check if funding rounds exist and have values
  const hasFundingRounds = 
    company.company_funding_rounds_collection && 
    company.company_funding_rounds_collection.length > 0;

  // Get specialties
  const specialties = company.specialties || 
    (company.company_specialties_collection && company.company_specialties_collection.length > 0 
      ? company.company_specialties_collection
        .filter(item => !item.deleted)
        .map(item => item.specialty)
        .join(", ")
      : "No specialties listed");

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="text-xl">
            {companyName}
          </DialogTitle>
          {websiteUrl && (
            <a 
              href={websiteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-normal"
            >
              <span className="mr-1">Visit Website</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>
        <DialogDescription>
          {industry}
        </DialogDescription>
      </DialogHeader>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {company.enrichedData && <TabsTrigger value="additional">Additional Data</TabsTrigger>}
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start space-x-2">
              <MapPin className="mt-0.5 h-4 w-4 text-gray-500" />
              <div>
                <h4 className="font-medium text-sm">Location</h4>
                <p>{location}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Calendar className="mt-0.5 h-4 w-4 text-gray-500" />
              <div>
                <h4 className="font-medium text-sm">Founded</h4>
                <p>{foundedYear}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Users className="mt-0.5 h-4 w-4 text-gray-500" />
              <div>
                <h4 className="font-medium text-sm">Size</h4>
                <p>{companySize}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Globe className="mt-0.5 h-4 w-4 text-gray-500" />
              <div>
                <h4 className="font-medium text-sm">Website</h4>
                <p>{websiteDisplay}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2 col-span-2">
              <Building className="mt-0.5 h-4 w-4 text-gray-500" />
              <div>
                <h4 className="font-medium text-sm">Type</h4>
                <p>{company.type || "Unknown"}</p>
              </div>
            </div>
          </div>
          
          {description && (
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-1">Description</h4>
              <p className="text-sm whitespace-pre-line">{description}</p>
            </div>
          )}
          
          {specialties && specialties !== "No specialties listed" && (
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-1">Specialties</h4>
              <p>{specialties}</p>
            </div>
          )}
          
          {/* Funding Information */}
          {hasFundingRounds && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-medium text-base mb-3">Funding Information</h3>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Round</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.company_funding_rounds_collection && company.company_funding_rounds_collection.length > 0 && (
                    company.company_funding_rounds_collection
                      .filter(round => !round.deleted)
                      .map((round, index) => (
                        <TableRow key={index}>
                          <TableCell>{round.last_round_type || "Unknown"}</TableCell>
                          <TableCell>{formatDate(round.last_round_date)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(round.last_round_money_raised, round.last_round_money_raised_currency)}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        {company.enrichedData && (
          <TabsContent value="additional">
            <Card>
              <CardHeader>
                <CardTitle>Additional Company Data</CardTitle>
                <CardDescription>Data from multiple sources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {company.enrichedData?.revenue && typeof company.enrichedData.revenue === 'number' && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Annual Revenue</h4>
                      <p>${company.enrichedData.revenue.toLocaleString()}</p>
                    </div>
                  )}
                  
                  {company.enrichedData?.technologies && Array.isArray(company.enrichedData.technologies) && company.enrichedData.technologies.length > 0 && (
                    <div className="col-span-2">
                      <h4 className="font-medium text-sm mb-1">Technologies Used</h4>
                      <div className="flex flex-wrap gap-1">
                        {company.enrichedData.technologies.map((tech: string, i: number) => (
                          <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {company.enrichedData?.social_profiles && typeof company.enrichedData.social_profiles === 'object' && (
                    <div className="col-span-2">
                      <h4 className="font-medium text-sm mb-1">Social Profiles</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(company.enrichedData.social_profiles).map(([platform, url]) => (
                          url && typeof url === 'string' && (
                            <a 
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                            >
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                              <ExternalLink size={12} className="ml-1" />
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {company.enrichedData?.competitors && Array.isArray(company.enrichedData.competitors) && company.enrichedData.competitors.length > 0 && (
                    <div className="col-span-2">
                      <h4 className="font-medium text-sm mb-1">Competitors</h4>
                      <div className="flex flex-wrap gap-1">
                        {company.enrichedData.competitors.map((competitor: string, i: number) => (
                          <span key={i} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            {competitor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="raw">
          <div className="rounded-md bg-gray-50 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Raw JSON Data</h3>
            <div className="max-h-96 overflow-auto">
              <pre className="text-xs text-gray-700 p-2 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(company, null, 2)}
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-4 flex justify-end">
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </div>
    </DialogContent>
  );
}