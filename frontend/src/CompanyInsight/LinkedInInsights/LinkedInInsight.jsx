import React from 'react';

const CompanyCard = ({ company }) => {
  return (
    <div className="w-full p-6 rounded-lg shadow-md bg-gray-800 text-gray-100">
      {/* Company Logo and Name */}
      <div className="">
        <img
          src={company.company_logo_url}
          alt={`${company.company_name} Logo`}
          className=""
        />
        <h2 className="text-2xl font-semibold">{company.company_name}</h2>
      </div>

      {/* About Us */}
      <p className="text-gray-300 mb-4">{company.about_us}</p>

      {/* Company Details */}
      <div className="space-y-3 text-sm">
        <p>
          <strong>Industry:</strong> {company.industry}
        </p>
        <p>
          <strong>Headquarters:</strong> {company.headquarters}
        </p>
        <p>
          <strong>Company Size:</strong> {company.company_size_approx}
        </p>
        <p>
          <strong>Type:</strong> {company.type}
        </p>
        <p>
          <strong>Founded:</strong> {company.founded}
        </p>
        <p>
          <strong>Website:</strong>{' '}
          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
            {company.website}
          </a>
        </p>
        <p>
          <strong>LinkedIn Followers:</strong> {company.linkedin_followers_count}
        </p>
        <p>
          <strong>Employees:</strong> {company.num_of_employees}
        </p>
        <p>
          <strong>Specialties:</strong> {company.specialties}
        </p>

        {/* Funding Information */}
        <div>
          <h3 className="text-lg font-semibold mt-4">Funding</h3>
          <p>
            <strong>Total Funding Rounds:</strong> {company.funding_total_rounds}
          </p>
          <p>
            <strong>Funding Option:</strong> {company.funding_option}
          </p>
          <p>
            <strong>Last Funding Round:</strong> {company.last_funding_round}
          </p>
        </div>
      </div>
    </div>
  );
};

const CompanyList = () => {
  const LinkedInData = [
    {
      company_name: '10X Engineered Materials',
      linkedin_followers_count: 403,
      company_logo_url:
        'https://media.licdn.com/dms/image/v2/C560BAQFYxYvugXyVXw/company-logo_200_200/company-logo_200_200/0/1630621030965/10xengineeredmaterials_logo?e=2147483647&v=beta&t=fXBjK1qjX3TiZ9ClScK0kvktrEmQ7UGfFzDf5Ks1jvk',
      about_us:
        'We are a clean-tech science and engineering based manufacturing company that develops innovative material technologies and products.',
      num_of_employees: 'N/A',
      website: 'https://10XEM.com',
      industry: 'Abrasives and Nonmetallic Minerals Manufacturing',
      company_size_approx: '11-50',
      headquarters: 'Wabash, Indiana',
      type: 'Privately Held',
      founded: '2018',
      specialties: 'Abrasive Blasting Media',
      funding: 'N/A',
      funding_total_rounds: 'N/A',
      funding_option: 'N/A',
      last_funding_round: 'N/A',
    },
  ];

  return (
    <div className="">
      {LinkedInData.map((company, index) => (
        <CompanyCard key={index} company={company} />
      ))}
    </div>
  );
};

export default CompanyList;
