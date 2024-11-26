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
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [resetNavigation, setResetNavigation] = useState(false);
  const dispatch = useDispatch();

  const handleInputChange = (id, option) => {
    setAnswers({ ...answers, [id]: option });
  };

  const handleOtherInputChange = (id, value) => {
    setOtherInputs({ ...otherInputs, [id]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Only validate current question when on the last question
    if (currentQuestion === questions.length - 1) {
      const currentQ = questions[currentQuestion];
      const isCurrentQuestionIncomplete = 
        !answers[currentQ.id] || 
        (answers[currentQ.id] === "Other" && !otherInputs[currentQ.id]);

      if (isCurrentQuestionIncomplete) {
        toast.error("Please answer the current question", { position: "top-right" });
        return;
      }
    } else {
      // For all other cases, validate all questions up to current
      const missingFields = questions.slice(0, currentQuestion + 1).filter((q) => {
        return !answers[q.id] || (answers[q.id] === "Other" && !otherInputs[q.id]);
      });

      if (missingFields.length > 0) {
        toast.error("Fill all the form fields", { position: "top-right" });
        return;
      }
    }

    setLoading(true);
    setResetNavigation(false);

    const formattedData = {
      data: questions.map((q) => ({
        question: q.question,
        response:
          answers[q.id] === "Other"
            ? otherInputs[q.id] || ""
            : answers[q.id] || "",
      })),
    };

    fetch(`${API_BASE_URL}/api/industries-for-thesis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formattedData),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        console.log("Success:", data);
        dispatch(setFormResponse(data));
        toast.success(
          "Thesis generated successfully! Below is the list of suggested Industries",
          { position: "top-right" }
        );
        setResetNavigation(true);
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error("There was an issue generating the thesis.", {
          position: "top-right",
        });
      })
      .finally(() => {
        setLoading(false);
      });

    setAnswers({});
    setOtherInputs({});
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  React.useEffect(() => {
    if (resetNavigation) {
      setCurrentQuestion(0);
    }
  }, [resetNavigation]);

  return (
    <div className="relative p-3 h-full w-full bg-cover bg-center">
      <div className="absolute inset-0 bg-black opacity-75 pointer-events-none"></div>

      <ToastContainer />

      <div className="relative z-10 flex justify-center items-center h-full">
        <form
          onSubmit={handleSubmit}
          className="w-1/2 flex min-h-full flex-col justify-between bg-black bg-opacity-10 p-6 rounded-lg shadow-2xl"
        >
          <div className="flex-col justify-between w-full">
            <div
              key={questions[currentQuestion].id}
              style={{ marginBottom: "20px" }}
              className="h-2/3"
            >
              <label className="h-full">
                <div className="flex ">
                  <span className="font-bold">{currentQuestion + 1}. </span>
                  <p className="ml-3 text-lg font-semibold text-gray-300">
                    {questions[currentQuestion].question}
                  </p>
                </div>
                <br />
                <div className="min-h-full">
                  {questions[currentQuestion].type === "text" && (
                    <input
                      className="bg-[#151518] border-gray-500 bg-opacity-50 p-2 rounded-lg border h-[300px] w-full"
                      type="text"
                      value={answers[questions[currentQuestion].id] || ""}
                      onChange={(e) =>
                        handleInputChange(
                          questions[currentQuestion].id,
                          e.target.value
                        )
                      }
                    />
                  )}
                  {questions[currentQuestion].type === "select" && (
                    <div className="mt-2">
                      <div className="flex-col mx-4 ">
                        {questions[currentQuestion].options?.map((option) => (
                          <div
                            key={option}
                            className="flex items-center mb-2 bg-opacity-40 bg-gray-950 w-full h-16 px-2 py-1 rounded-lg"
                          >
                            <input
                              type="checkbox"
                              id={`${questions[currentQuestion].id}-${option}`}
                              checked={
                                answers[questions[currentQuestion].id] ===
                                option
                              }
                              onChange={() =>
                                handleInputChange(
                                  questions[currentQuestion].id,
                                  option
                                )
                              }
                              className={`mr-2 h-5 w-5 rounded-full transition-colors duration-300 ${
                                answers[questions[currentQuestion].id] === option
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
                              htmlFor={`${questions[currentQuestion].id}-${option}`}
                              className="cursor-pointer bg-opacity-50"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                      {answers[questions[currentQuestion].id] === "Other" && (
                        <div style={{ marginTop: "10px" }}>
                          <label className="ml-3 text-lg font-semibold text-gray-300">
                            Other:
                          </label>
                          <input
                            type="text"
                            value={
                              otherInputs[questions[currentQuestion].id] || ""
                            }
                            onChange={(e) =>
                              handleOtherInputChange(
                                questions[currentQuestion].id,
                                e.target.value
                              )
                            }
                            className="bg-[#151518] border-gray-500 bg-opacity-20 rounded-lg p-2 border w-full h-12 mt-1"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </label>
            </div>
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                disabled={currentQuestion === 0 || loading}
                onClick={handlePrevious}
                className="bg-gradient-to-b from-white/20 to-gray-800/30 border border-[#565656] text-white px-4 py-3 w-1/2 m-3 rounded"
              >
                Previous
              </button>
              {currentQuestion === questions.length - 1 ? (
                <button type="submit" disabled={loading} className="w-1/2">
                  {loading ? (
                    <div className="flex items-center">
                      <div className="bg-white hover:bg-[#151518] font-semibold hover:border-white w-full hover:border hover:text-white transition-all ease-out duration-300 text-[#151518] px-4 py-3 rounded flex items-center justify-center">
                        Generating Thesis...
                        <div className="animate-spin rounded-full ml-4 h-5 w-5 border-b-2 border-gray-900 hover:border-white"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white hover:bg-[#151518] font-semibold hover:border-white w-full hover:border hover:text-white transition-all ease-out duration-300 text-[#151518] px-4 py-3 rounded flex items-center justify-center">
                      Generate Thesis
                    </div>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-gradient-to-b from-white/20 to-gray-800/30 border border-[#565656] text-white w-1/2 px-4 py-3 m-3 rounded"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};