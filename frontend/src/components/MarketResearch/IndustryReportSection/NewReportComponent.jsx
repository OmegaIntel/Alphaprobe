import SwotAnalysis from "./ReportSectionComponents/SWOTAnalysis";
// import KeyStatistics from './KeyStatistics';
// import CurrentPerformance from './CurrentPerformance';
// import FutureOutlook from './FutureOutlook';

const componentMap = {
  swot_analysis: SwotAnalysis,
  // key_statistics: KeyStatistics,
  // current_performance: CurrentPerformance,
  // future_outlook: FutureOutlook,
  // Add more mappings as necessary
};

export default function IndustryReport({ report }) {
  console.log("This is new industry report component",report);
  return (
    <div>
      new industry report
      <h1 className="text-white">{report.report_title}</h1>
      <p>{report.report_date}</p>
      {Object.keys(report).map((key) => {
        const Component = componentMap[key];
        return Component ? <Component key={key} data={report[key]} /> : null;
      })}
    </div>
  );
}
