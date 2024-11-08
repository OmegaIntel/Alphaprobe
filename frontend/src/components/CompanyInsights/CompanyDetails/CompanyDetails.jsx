import React from "react";
import CompanyDetailsComponent from "./CompanyDetailsComponent";

const data = {
  result: {
    company_name: "Vouched",
    company_about_us:
      "Expertly identify anyone, anywhere to unlock access to life\u2019s most critical services. We leverage our expertise in identity verification to remove barriers and ensure that everyone can effortlessly access the services they need. Our commitment is to create a world where equal opportunities are available to all, regardless of their background or circumstances.",
    company_description:
      "Vouched develops patent-pending visual ID verification for regulated and sensitive industries.",
    company_tag: null,
    company_headquareters: "SEATTLE, WA",
    company_location_identifiers: ["Seattle", "Washington", "United States"],
    company_incorporation_date: "2018",
    company_website: "https://www.vouched.id",
    company_employee_count: "N/A",
    company_linkedin_followers_count: 7388,
    company_ownership_status: "Privately Held",
    company_investors: ["SpringRock Ventures", "BHG VC"],
    company_structure: "Private",
    company_crunchbase_ranking: "90,180",
    company_contact_email: "friends@vouched.id",
    company_linkedin_url: "https://www.linkedin.com/company/woollylabs",
    company_product_name: "VOUCHEDFi",
    company_product_description:
      "A preconfigured identity verification workflow package designed for the financial services industry, ensuring KYC compliance and enhancing customer experience.",
    company_primary_industry: "Technology, Information and Internet",
    company_primary_industry_detailed: "Business/Productivity Software",
    company_ceo: "Peter Horadan",
    company_founder: ["John Baird", "John Cao"],
    company_revenue: "$5.0-25M",
    company_gross_margin: null,
    company_total_funding: "$21.4M",
    company_last_funding_date: "Feb 27, 2023",
    company_future_projections: "Growing",
  },
};

const CompanyDetails = () => {
  return (
    <div>
      <CompanyDetailsComponent data={data} />
    </div>
  );
};

export default CompanyDetails;
