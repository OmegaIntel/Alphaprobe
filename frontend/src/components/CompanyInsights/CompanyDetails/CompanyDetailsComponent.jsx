import React from "react";
import PersonIcon from "@mui/icons-material/Person";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LanguageIcon from "@mui/icons-material/Language";

const InfoItem = ({ label, value, className = "" }) => (
  <li>
    <div className={`mb-4 w-full mx-2 rounded-lg flex ${className}`}>
      <div className="px-3">
        <p className="text-gray-400 flex flex-col text-base">
          {label}:
          <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
            {value ?? "N/A"}
          </strong>
        </p>
      </div>
    </div>
  </li>
);

const CompanyDetailsComponent = ({ data }) => {
  return (
    <div>
      <div className="rounded-lg shadow-md p-6 w-full space-y-5">
        {/*First Section Company Information */}
        <div className="flex space-x-3">
          <div className="w-full p-4 px-10  border border-[#2e2e2e] rounded-xl">
            <div className="flex justify-between">
              <h2 className="text-3xl font-bold text-white mb-4">
                {data.result.company_name ?? "N/A"}
              </h2>
              <div className="flex space-x-3">
                <div>
                  <a
                    href={data.result.company_linkedin_url ?? "#"}
                    className="text-blue-500"
                  >
                    <LinkedInIcon />
                  </a>
                </div>
                <div>
                  <a href={data.result.company_website ?? "#"} className="">
                    <LanguageIcon />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-14 space-y-5 w-3/4">
              <p className="text-gray-400 text-xl font-semibold">About</p>
              <p className="text-gray-300/60 text-lg">
                {data.result.company_about_us ?? "N/A"}
              </p>
            </div>
            <div className="my-10 space-y-5 w-full">
              <p className="text-gray-400 text-xl font-semibold">Description</p>
              <p className="text-gray-300/60 text-lg">
                {data.result.company_description ?? "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full mt-10">
          <div className="p-4 px-10 bg-[#171717] border border-[#2e2e2e] rounded-xl">
            <h3 className="text-2xl text-white font-medium mb-6">Company Information</h3>
            <div className="p-10 ">
              <ul className="space-y-6">
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
                  label="CEO" 
                  value={data.result.company_ceo} 
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
                  label="Last Funding Date" 
                  value={data.result.company_last_funding_date} 
                />
                <InfoItem 
                  label="Future Projections" 
                  value={data.result.company_future_projections} 
                />
              </ul>
            </div>
          </div>
        </div>

        {/*Second Section Company Finances */}
        <div className="flex space-x-3">
          <div className="p-10  ">
            <ul className="space-y-6">
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex ">
                  {/* <div className="w-2 bg-blue-500"></div> */}
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Revenue:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_revenue ?? "N/A"}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex ">
               {/* <div className="w-2 bg-blue-500"></div> */}
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Gross Margin:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_gross_margin ?? "N/A"}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex ">
                  {/* <div className="w-2 bg-blue-500"></div> */}
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Total Funding:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_total_funding ?? "N/A"}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex ">
                {/* <div className="w-2 bg-blue-500"></div> */}
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Last Funding Date:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_last_funding_date ?? "N/A"}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex ">
                  {/* <div className="w-2 bg-blue-500"></div> */}
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Future Projections:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_future_projections ?? "N/A"}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>



          <div className="w-full mt-10">
            <div className="p-4 px-10 bg-[#171717] border border-[#2e2e2e] rounded-xl">
              <h3 className="text-2xl text-white font-medium mb-6">
                Investment Rationale
              </h3>
              <div>
                <ul className="space-y-5 mx-5">
                  <li>
                    <div>
                      <p className="text-lg text-gray-400">
                        Future Projectile:
                      </p>
                      <p className="text-base text-gray-500">
                        {data.result.company_future_projections ?? "N/A"}
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <p className="text-lg text-gray-400">Ownership Status:</p>
                      <p className="text-base text-gray-500">
                        {data.result.company_ownership_status ?? "N/A"}
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <p className="text-lg text-gray-400"> Investors:</p>
                      <p className="text-base text-gray-500">
                        {data.result.company_investors?.length > 0
                          ? data.result.company_investors.join(", ")
                          : "N/A"}
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <p className="text-lg text-gray-400"> Contact Email:</p>
                      <p className="text-base text-gray-500">
                        {data.result.company_contact_email ?? "N/A"}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full mt-10">
          <div className="p-4 px-10 bg-[#171717] border border-[#2e2e2e] rounded-xl">
            <h3 className="text-2xl text-white font-medium mb-6">Products</h3>
            <div className="grid grid-cols-1 gap-6">
              {Object.entries(data.result || {})
                .filter(
                  ([key, value]) =>
                    key.startsWith("company_product") &&
                    key.endsWith("_name") &&
                    value !== null
                )
                .map(([key]) => {
                  const productNum = key.match(/\d+/)[0];
                  const name = data.result[`company_product${productNum}_name`];
                  const description =
                    data.result[`company_product${productNum}_description`];

                  if (!name || !description) return null;

                  return (
                    <div
                      key={`product-${productNum}`}
                      className="mb-4 rounded-lg  p-4"
                    >
                      <div className="flex items-start">
                        <div className="w-2 h-full bg-blue-500 mr-3"></div>
                        <div className="flex-1">
                          <p className="text-gray-300 text-lg font-medium mb-2">
                            {name}
                          </p>
                          <p className="text-gray-400 text-sm sm:text-base">
                            {description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/*Comanyies Product*/}
        {/* <div className="bg-[#171717] border border-[#2e2e2e] p-5  rounded-xl">
          <div>
            <h3 className="text-2xl font-medium mb-10">Product Info</h3>
            <ul className="space-y-1 px-10">
              <li>
                <div className="p-3 bg-[#1b1b1b] border border-[#2e2e2e] rounded-xl space-y-2">
                  <p className="text-gray-300 font-medium">
                    {data.result.company_product_name ?? "N/A"}
                  </p>
                  <p className="text-gray-400">
                    {data.result.company_product_description ?? "N/A"}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default CompanyDetailsComponent;
