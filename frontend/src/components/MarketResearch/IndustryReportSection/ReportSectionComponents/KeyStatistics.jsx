// components/ReportSections/KeyStatistics.js

const KeyStatistics = ({ statistics }) => {
    return (
      <div className="key-statistics p-4 border rounded-lg bg-gray-50">
        <h2 className="text-2xl font-bold mb-4">Key Statistics</h2>
  
        <div className="mb-2">
          <strong>Profit:</strong> ${statistics.profit?.profit_dollars?.toLocaleString() || "No data"}
        </div>
        <div className="ml-4 text-sm">
          <p>
            Historical CAGR (2005-2024): {statistics.profit?.profit_cagr_historical?.profit_cagr_value || "No data"}%
          </p>
        </div>
  
        <div className="mb-2">
          <strong>Profit Margins:</strong> {statistics.profit_margins?.profit_margins_percentage || "No data"}%
        </div>
        <div className="ml-4 text-sm">
          <p>
            Historical CAGR (2005-2024): {statistics.profit_margins?.profit_margins_cagr_historical?.profit_margins_cagr_value || "No data"}%
          </p>
        </div>
  
        <div className="mb-2">
          <strong>Revenue:</strong> ${statistics.revenue?.revenue_dollars?.toLocaleString() || "No data"}
        </div>
        <div className="ml-4 text-sm">
          <p>
            Historical CAGR (2005-2024): {statistics.revenue?.revenue_cagr_historical?.revenue_cagr_value || "No data"}%
          </p>
          <p>
            Projected CAGR (2024-2030): {statistics.revenue?.revenue_cagr_projected?.revenue_cagr_value || "No data"}%
          </p>
        </div>
  
        <div className="mb-2">
          <strong>Enterprises:</strong> {statistics.enterprises || "No data"}
        </div>
        <div className="mb-2">
          <strong>Establishments:</strong> {statistics.establishments || "No data"}
        </div>
        <div className="mb-2">
          <strong>Employees:</strong> {statistics.employees || "No data"}
        </div>
        <div className="mb-2">
          <strong>Wages:</strong> ${statistics.wages?.toLocaleString() || "No data"}
        </div>
        <div className="mb-2">
          <strong>Industry Value Added:</strong> ${statistics.industry_value_added?.toLocaleString() || "No data"}
        </div>
        <div className="mb-2">
          <strong>Imports:</strong> ${statistics.imports?.toLocaleString() || "No data"}
        </div>
        <div className="mb-2">
          <strong>Exports:</strong> ${statistics.exports?.toLocaleString() || "No data"}
        </div>
      </div>
    );
  };
  
  export default KeyStatistics;
  