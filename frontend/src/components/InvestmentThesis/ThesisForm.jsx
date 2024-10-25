import React, { useState } from "react";
import { token } from "../../services";
import { useDispatch } from "react-redux";
import { setFormResponse } from "../../redux/formResponseSlice";
import { toast, ToastContainer } from "react-toastify";
import { API_BASE_URL } from "../../services";
import "react-toastify/dist/ReactToastify.css";

export const ThesisForm = ({ questions }) => {
  const [answers, setAnswers] = useState({});
  const [otherInputs, setOtherInputs] = useState({});
  const dispatch = useDispatch();

  const handleInputChange = (id, option) => {
    // Set the selected option as the only selected value
    setAnswers({ ...answers, [id]: option });
  };

  const handleOtherInputChange = (id, value) => {
    setOtherInputs({ ...otherInputs, [id]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation: Check if all fields are filled
    const missingFields = questions.filter((q) => {
      // Check if the answer is filled for both text and select types
      return (
        !answers[q.id] || (answers[q.id] === "Other" && !otherInputs[q.id]) // For "Other" input, also check for corresponding text
      );
    });

    if (missingFields.length > 0) {
      toast.error("Fill all the form field", {
        position: "top-right",
      });
      return;
    }

    const formattedData = {
      data: questions.map((q) => ({
        question: q.question,
        response:
          answers[q.id] === "Other"
            ? otherInputs[q.id] || ""
            : answers[q.id] || "",
      })),
    };

    console.log("Formatted data to submit:", formattedData);

    fetch(`${API_BASE_URL}/api/industries-for-thesis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formattedData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Success:", data); // Log the received data
        dispatch(setFormResponse(data)); // Dispatching data to update in store

        toast.success(
          "Thesis generated successfully! Move to Market Research tab",
          {
            position: "top-right",
          }
        );
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error("There was an issue generating the thesis.", {
          position: "top-right",
        });
      });

    setAnswers({});
    setOtherInputs({});
  };

  return (
    <div className="p-3">
      <ToastContainer />
      <form onSubmit={handleSubmit}>
        {questions.map((q, index) => (
          <div key={q.id} style={{ marginBottom: "20px" }}>
            <label>
              <div className="flex ">
                <span className="font-bold">{index + 1}. </span>{" "}
                {/* Numbering */}
                <p className="ml-3 text-lg font-semibold text-gray-300">
                  {q.question}
                </p>
              </div>
              <br />
              {q.type === "text" && (
                <input
                  className="bg-[#151518] border-gray-500 p-2 rounded-lg border w-full xl:w-3/4 h-12" // Increased height
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                />
              )}
              {q.type === "select" && (
                <div className="mt-2">
                  <div className="flex mx-4">
                    {q.options?.map((option) => (
                      <div
                        key={option}
                        className="flex items-center mb-2 mx-4 bg-gray-800 w-48 h-16 px-2 py-1 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          id={`${q.id}-${option}`}
                          checked={answers[q.id] === option}
                          onChange={() => handleInputChange(q.id, option)}
                          className={`mr-2 h-5 w-5 transition-colors duration-300 ${
                            answers[q.id] === option
                              ? "bg-white"
                              : "bg-[#151518] border-gray-500"
                          }`}
                          style={{
                            appearance: "none",
                            border: "2px solid #6b7280",
                            borderRadius: "4px",
                            outline: "none",
                          }}
                        />
                        <label
                          htmlFor={`${q.id}-${option}`}
                          className="cursor-pointer"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  {answers[q.id] === "Other" && (
                    <div style={{ marginTop: "10px" }}>
                      <label className="ml-3 text-lg font-semibold text-gray-300">Other:</label>
                      <input
                        type="text"
                        value={otherInputs[q.id] || ""}
                        onChange={(e) =>
                          handleOtherInputChange(q.id, e.target.value)
                        }
                        className="bg-[#151518] border-gray-500 rounded-lg p-2 border w-full h-12 mt-1" // Increased height
                      />
                    </div>
                  )}
                </div>
              )}
            </label>
          </div>
        ))}
        <div className="mt-4">
          <button
            type="submit"
            className="bg-white hover:bg-[#151518] font-semibold hover:border-white my-10 mx-20 hover:border hover:text-white transition-all ease-out duration-300 text-[#151518] px-4 py-2 rounded"
            style={{ float: "right" }}
          >
            Generate Thesis
          </button>
        </div>
      </form>
    </div>
  );
};
