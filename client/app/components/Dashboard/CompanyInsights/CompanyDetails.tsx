import React, { useEffect, useState } from "react";

// shadcn/ui card components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";

// Badge component for competitors and others
import { Badge } from "~/components/ui/badge";

// -------------- TYPES --------------
interface InfoItemProps {
  label: string;
  value: string | number | null | undefined;
  className?: string;
}

interface CompetitorListProps {
  competitors: string[];
}

interface CompanyData {
  result: {
    company_name: string | null;
    company_linkedin_url: string | null;
    company_website: string | null;
    company_description: string | null;
    company_headquareters: string | null;
    company_incorporation_date: string | null;
    company_employee_count: string | null;
    company_ownership_status: string | null;
    company_structure: string | null;
    company_primary_industry: string | null;
    company_last_funding_date: string | null;
    company_gross_margin: string | null;
    company_revenue: string | null;
    company_total_funding: string | null;
    company_future_projections: string | null;
    company_contact_email: string | null;
    company_competitors: string[];
    company_industry_verticals: string[];
    company_investors: string[];
    company_founder: string[];
    [key: string]: any; // For handling dynamic product fields
  };
}

// -------------- SUBCOMPONENTS --------------

// InfoItem component
const InfoItem: React.FC<InfoItemProps> = ({
  label,
  value,
  className = "",
}) => {
  return (
    <li className={`flex flex-col space-y-1 ${className}`}>
      <span className="text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-base text-foreground">{value ?? "N/A"}</span>
    </li>
  );
};

// CompetitorList component
const CompetitorList: React.FC<CompetitorListProps> = ({ competitors }) => {
  if (!Array.isArray(competitors) || competitors.length === 0) {
    return <p className="text-base text-muted-foreground">N/A</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {competitors.map((competitor, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="font-semibold text-muted-foreground bg-muted"
        >
          {competitor}
        </Badge>
      ))}
    </div>
  );
};

// -------------- MAIN COMPONENT --------------
const CompanyDetailsComponent: React.FC<{ data: CompanyData }> = ({ data }) => {
  const [icons, setIcons] = useState<React.ElementType[]>([]);

  useEffect(() => {
    const loadIcons = async () => {
      const [
        { default: PersonIcon },
        { default: LinkedInIcon },
        { default: LanguageIcon },
      ] = await Promise.all([
        import("@mui/icons-material/Person"),
        import("@mui/icons-material/LinkedIn"),
        import("@mui/icons-material/Language"),
      ]);
      setIcons([PersonIcon, LinkedInIcon, LanguageIcon]);
    };

    loadIcons();
  }, []);

  return (
    <div className="my-6 space-y-6">
      {/* 1. Basic Company Info */}
      <Card className="bg-card text-card-foreground">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{data.result.company_name ?? "N/A"}</CardTitle>
            <CardDescription>
              {icons.length > 0 && (
                <div className="flex space-x-3 mt-2">
                  {data.result.company_linkedin_url && (
                    <a
                      href={data.result.company_linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {React.createElement(icons[1])}
                    </a>
                  )}
                  {data.result.company_website && (
                    <a
                      href={data.result.company_website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {React.createElement(icons[2])}
                    </a>
                  )}
                </div>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">
            Description
          </p>
          <p className="text-base text-foreground w-2/3">
            {data.result.company_description ?? "N/A"}
          </p>
        </CardContent>
      </Card>

      {/* 2. Company Information */}
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Headquarters"
              value={data.result.company_headquareters}
            />
            <InfoItem
              label="Founded"
              value={data.result.company_incorporation_date}
            />
            <InfoItem
              label="Employees"
              value={data.result.company_employee_count}
            />
            <InfoItem
              label="Ownership"
              value={data.result.company_ownership_status}
            />
            <InfoItem
              label="Structure"
              value={data.result.company_structure}
            />
            <InfoItem
              label="Primary Industry"
              value={data.result.company_primary_industry}
            />
          </ul>
        </CardContent>
      </Card>

      {/* 3. Financial Overview */}
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Last Funding Date"
              value={data.result.company_last_funding_date}
            />
            <InfoItem
              label="Gross Margin"
              value={data.result.company_gross_margin ?? "N/A"}
            />
            <InfoItem
              label="Revenue"
              value={data.result.company_revenue}
            />
            <InfoItem
              label="Total Funding"
              value={data.result.company_total_funding}
            />
            <InfoItem
              label="Future Projections"
              value={data.result.company_future_projections}
            />
            <InfoItem
              label="Contact Email"
              value={data.result.company_contact_email ?? "N/A"}
            />
          </ul>
        </CardContent>
      </Card>

      {/* 4. Products */}
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.result || {})
              .filter(
                ([key, value]) =>
                  key.startsWith("company_product") &&
                  key.endsWith("_name") &&
                  value !== null
              )
              .map(([key]) => {
                const productNumMatch = key.match(/\d+/);
                if (!productNumMatch) return null;

                const productNum = productNumMatch[0];
                const name = data.result[`company_product${productNum}_name`];
                const description =
                  data.result[`company_product${productNum}_description`];

                if (!name || !description) return null;

                return (
                  <div key={`product-${productNum}`} className="border-l pl-3">
                    <p className="text-base font-medium text-foreground">
                      {name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* 5. Market Position */}
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Market Position</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Competitors
            </p>
            <CompetitorList
              competitors={data.result.company_competitors}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Market Vertical
            </p>
            <CompetitorList
              competitors={data.result.company_industry_verticals}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Investors
            </p>
            <CompetitorList
              competitors={data.result.company_investors}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Founders
            </p>
            <CompetitorList
              competitors={data.result.company_founder}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDetailsComponent;
