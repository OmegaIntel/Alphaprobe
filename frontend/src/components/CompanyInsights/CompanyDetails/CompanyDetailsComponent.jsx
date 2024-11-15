import React from "react";
import PersonIcon from "@mui/icons-material/Person";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LanguageIcon from "@mui/icons-material/Language";

const CompanyDetailsComponent = ({ data }) => {
  return (
    <div>
      <div className="rounded-lg shadow-md p-6 w-full space-y-5">
        {/*First Section Company Information */}
        <div className="flex space-x-3">
          <div className="w-3/4 p-4 px-10 bg-[#171717] border border-[#2e2e2e] rounded-xl">
            <div className="flex justify-between">
              <h2 className="text-3xl font-bold text-white mb-4">
                {data.result.company_name}
              </h2>
              <div className="flex space-x-3">
                <div>
                  <a
                    href={data.result.company_linkedin_url}
                    className="text-blue-500"
                  >
                    <LinkedInIcon />
                  </a>
                </div>
                <div>
                  {" "}
                  <a href={data.result.company_website} className="">
                    <LanguageIcon />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-14 space-y-5 w-3/4">
              <p className="text-gray-400 text-xl font-semibold">About</p>
              <p className="text-gray-300/60 text-lg">
                {data.result.company_about_us}
              </p>
            </div>
            <div className="my-10 space-y-5 w-3/4">
              <p className="text-gray-400 text-xl font-semibold">Description</p>
              <p className="text-gray-300/60 text-lg">
                {data.result.company_description}
              </p>
            </div>
          </div>
          <div className="p-10 ">
            <ul className="space-y-6">
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
                  <div className="w-2 bg-blue-500"></div>
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Headquarters:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_headquareters ?? "N/A"}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
                  <div className="w-2 bg-blue-500"></div>
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Incorporation Date:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_incorporation_date ?? "N/A"}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
                  <div className="w-2 bg-blue-500"></div>
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Employees:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_employee_count ?? "N/A"}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
                  <div className="w-2 bg-blue-500"></div>
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Crunchbase Ranking:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_crunchbase_ranking ?? "N/A"}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
                  <div className="w-2 bg-blue-500"></div>
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      LinkedIn Followers:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_linkedin_followers_count.toLocaleString() ??
                          "N/A"}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/*Second Section Company Finances */}
        <div className="flex space-x-3">
          <div className="p-10  ">
            <ul className="space-y-6">
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
                  <div className="w-2 bg-blue-500"></div>
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Revenue:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_revenue}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
                  <div className="w-2 bg-blue-500"></div>
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Gross Margin:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_gross_margin || "N/A"}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
                  <div className="w-2 bg-blue-500"></div>
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Total Funding:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_total_funding}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
                  <div className="w-2 bg-blue-500"></div>
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Last Funding Date:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_last_funding_date}
                      </strong>
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="mb-4 w-full mx-2 rounded-lg flex bg-[#0D0D0D]">
                  <div className="w-2 bg-blue-500"></div>
                  <div className="px-3">
                    <p className="text-gray-400 flex flex-col text-base">
                      Future Projections:
                      <strong className="text-gray-300 text-sm sm:text-base md:text-lg">
                        {data.result.company_future_projections}
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
                  {/* <li>
                  Locations:{" "}
                  {data.result.company_location_identifiers.join(", ")}
                </li> */}
                  <li>
                    <div>
                      <p className="text-lg text-gray-400">
                        Future Projectile:
                      </p>
                      <p className="text-base text-gray-500">
                        {data.result.company_future_projections}
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <p className="text-lg text-gray-400">Ownership Status:</p>
                      <p className="text-base text-gray-500">
                        {data.result.company_ownership_status}
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <p className="text-lg text-gray-400"> Investors:</p>
                      <p className="text-base text-gray-500">
                        {data.result.company_investors.join(", ")}
                      </p>
                    </div>
                  </li>
                  {/* <li>Structure: {data.result.company_structure}</li> */}

                  <li>
                    <div>
                      <p className="text-lg text-gray-400"> Contact Email:</p>
                      <p className="text-base text-gray-500">
                        {data.result.company_contact_email}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/*Comanyies Product*/}
        <div className="bg-[#171717] border border-[#2e2e2e] p-5  rounded-xl">
          <div>
            <h3 className="text-2xl font-medium mb-10">Product Info</h3>
            <ul className="space-y-1 px-10">
              <li>
                <div className="p-3 bg-[#1b1b1b] border border-[#2e2e2e] rounded-xl space-y-2">
                  <p className="text-gray-300 font-medium">{data.result.company_product_name}</p>
                  <p className="text-gray-400">{data.result.company_product_description}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/*Company Management Section*/}
        <div className="bg-[#171717] border border-[#2e2e2e] p-5 w-fit">
          <h3 className="text-lg font-medium mb-2">Company Leadership</h3>
          <ul className="space-y-1">
            <li className="flex space-x-3">
              <div>
                <PersonIcon />
              </div>
              <p>CEO: {data.result.company_ceo}</p>
            </li>
            <li className="flex space-x-3">
              <div>
                <PersonIcon />
              </div>
              <p> Founders: {data.result.company_founder.join(", ")}</p>
            </li>
          </ul>
        </div>

        {/* <div>
          <h3 className="text-lg font-medium mb-2">Company Details</h3>
          <ul className="space-y-1">
            <li>
              Locations: {data.result.company_location_identifiers.join(", ")}
            </li>

            <li>Ownership Status: {data.result.company_ownership_status}</li>
            <li>Investors: {data.result.company_investors.join(", ")}</li>
            <li>Structure: {data.result.company_structure}</li>

            <li>Contact Email: {data.result.company_contact_email}</li>
          </ul>
        </div> */}
      </div>
    </div>
  );
};

export default CompanyDetailsComponent;
