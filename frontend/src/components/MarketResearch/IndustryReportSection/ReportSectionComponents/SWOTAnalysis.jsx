import React from "react";

const SwotAnalysis = ({ data }) => {
  // Guard clause for when data is not yet loaded
  if (!data) {
    return <p>No SWOT analysis data available.</p>; // Handle case where data is undefined
  }

  return (
    <div>
      <h2>SWOT Analysis</h2>

      {data.strengths ? (
        <>
          <h3>Strengths</h3>
          <ul>
            {data.strengths.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>No strengths data available.</p>
      )}

      {data.weaknesses ? (
        <>
          <h3>Weaknesses</h3>
          <ul>
            {data.weaknesses.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>No weaknesses data available.</p>
      )}

      {data.opportunities ? (
        <>
          <h3>Opportunities</h3>
          <ul>
            {data.opportunities.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>No opportunities data available.</p>
      )}

      {data.threats ? (
        <>
          <h3>Threats</h3>
          <ul>
            {data.threats.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>No threats data available.</p>
      )}
    </div>
  );
};

export default SwotAnalysis;
