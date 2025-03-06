import { useState } from "react";
import { API_BASE_URL } from "~/constant";
import { useNavigate } from "@remix-run/react";

const Human: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [resumeInput, setResumeInput] = useState<string>("");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [threadId, setThreadId] = useState<string>(""); // Store thread ID
  const [generatedQueries, setGeneratedQueries] = useState<string>(""); // Store queries string
  const navigate = useNavigate();

  const getAuthToken = (): string | null => {
    if (typeof document === "undefined") return null;
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1] || null
    );
  };

  // Calls the /api/start-graph endpoint with the plain text topic.
  const handleSubmit = async () => {
    setLoading(true);
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // We send the topic as plain text.
      const response = await fetch(`${API_BASE_URL}/api/start-graph`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          Authorization: `Bearer ${token}`,
        },
        body: query,
      });
      const data = await response.json();
      console.log("start-graph response:", data);
      if (data.result) {
        // If a final result is returned.
        const output =
          typeof data.result === "object"
            ? JSON.stringify(data.result, null, 2)
            : data.result;
        setResult(output);
        setIsPaused(false);
      } else if (data.thread_id) {
        // Store the thread id and check if the interrupt includes generated queries.
        setThreadId(data.thread_id);
        setIsPaused(true);
        if (data.interrupt && data.interrupt.original_queries) {
          // Convert the array of queries to a semicolon-separated string.
          const queriesStr = data.interrupt.original_queries
            .map((q: any) => q.search_query)
            .join("; ");
          setGeneratedQueries(queriesStr);
          setResult("Generated queries: " + queriesStr);
          // Pre-fill resume input with the generated queries.
          setResumeInput(queriesStr);
        } else {
          // Fallback to display the interrupt prompt.
          setResult(
            typeof data.interrupt === "object"
              ? data.interrupt.prompt
              : data.interrupt
          );
        }
      } else {
        setResult("Unexpected response: " + JSON.stringify(data));
      }
    } catch (error: any) {
      setResult("Error: " + error.message);
    }
    setLoading(false);
  };

  // Calls the /api/resume-graph endpoint with the thread id and plain text resume input.
  const handleResume = async () => {
    setLoading(true);
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/resume-graph`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // using JSON here to include the thread id and resume text
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          thread_id: threadId,
          revised_text: resumeInput,
        }),
      });
      const data = await response.json();
      console.log("resume-graph response:", data);
      if (data.result) {
        const output =
          typeof data.result === "object"
            ? JSON.stringify(data.result, null, 2)
            : data.result;
        setResult(output);
        setIsPaused(false);
      } else if (data.status === "paused" && data.thread_id) {
        setThreadId(data.thread_id);
        setIsPaused(true);
        if (data.interrupt && data.interrupt.original_queries) {
          const queriesStr = data.interrupt.original_queries
            .map((q: any) => q.search_query)
            .join("; ");
          setGeneratedQueries(queriesStr);
          setResult("Generated queries: " + queriesStr);
          setResumeInput(queriesStr);
        } else {
          setResult("Report generation paused. Please provide resume input to continue.");
        }
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
          placeholder="Enter your topic"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "300px", marginRight: "10px", color: "black" }}
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
            color: "black",
          }}
        >
          {result}
        </pre>
      </div>
      {isPaused && (
        <div style={{ marginTop: "20px" }}>
          <h2>Resume Report Generation</h2>
          <p>
            Modify or add queries separated by a semicolon. For example: "query1; query2"
          </p>
          <textarea
            placeholder="Enter resume input"
            value={resumeInput}
            onChange={(e) => setResumeInput(e.target.value)}
            style={{
              width: "300px",
              height: "100px",
              marginRight: "10px",
              color: "black",
            }}
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
