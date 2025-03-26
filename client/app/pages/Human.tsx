// ReportGenerator.tsx
import React, { useState } from "react";
import { API_BASE_URL } from "~/constant";

const Human: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [resumeInput, setResumeInput] = useState<string>("");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Calls the /api/final-report endpoint with the user query.
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/final-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      // If a final report is returned, display it and hide resume options.
      if (data.final_report) {
        setResult(data.final_report);
        setIsPaused(false);
      } else if (data.thread_id) {
        // Otherwise, show a message and display the resume input.
        setResult("Report generation paused. Please provide resume input to continue.");
        setIsPaused(true);
      } else {
        setResult("Unexpected response: " + JSON.stringify(data));
      }
    } catch (error: any) {
      setResult("Error: " + error.message);
    }
    setLoading(false);
  };

  // Calls the /api/resume endpoint with the resume input.
  const handleResume = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: resumeInput }),
      });
      const data = await response.json();
      if (data.resumed_state && data.resumed_state.final_report) {
        setResult(data.resumed_state.final_report);
        setIsPaused(false);
      } else if (data.resumed_state) {
        setResult("Report generation paused. Please provide resume input to continue.");
        setIsPaused(true);
      } else {
        setResult("Unexpected response: " + JSON.stringify(data));
      }
    } catch (error: any) {
      setResult("Error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ margin: "20px", fontFamily: "sans-serif" }}>
      <h1>Industry Report Generator</h1>
      <div>
        <input
          type="text"
          placeholder="Enter your query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "300px", marginRight: "10px" }}
        />
        <button onClick={handleSubmit} disabled={loading}>
          Submit
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>Result:</h2>
        <pre
          style={{
            background: "#f4f4f4",
            padding: "10px",
            borderRadius: "4px",
            whiteSpace: "pre-wrap",
          }}
        >
          {result}
        </pre>
      </div>

      {isPaused && (
        <div style={{ marginTop: "20px" }}>
          <h2>Resume Report Generation</h2>
          <input
            type="text"
            placeholder="Enter resume input"
            value={resumeInput}
            onChange={(e) => setResumeInput(e.target.value)}
            style={{ width: "300px", marginRight: "10px" }}
          />
          <button onClick={handleResume} disabled={loading}>
            Resume
          </button>
        </div>
      )}

      {loading && <p>Loading...</p>}
    </div>
  );
};

export default Human;
