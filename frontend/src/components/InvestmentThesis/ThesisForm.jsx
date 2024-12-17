import React, { useEffect, useState } from "react";
import { token } from "../../services";
import { useDispatch } from "react-redux";
import { setFormResponse } from "../../redux/formResponseSlice";
import { toast, ToastContainer } from "react-toastify";
import { API_BASE_URL } from "../../services";
import "react-toastify/dist/ReactToastify.css";
import EastIcon from "@mui/icons-material/East";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import TransformIcon from "@mui/icons-material/Transform";

export const ThesisForm = ({ questions, setActiveIndustry }) => {
  const [answers, setAnswers] = useState({});
  const [otherInputs, setOtherInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [resetNavigation, setResetNavigation] = useState(false);
  const [slideDirection, setSlideDirection] = useState("slide-in-right");
  const [randomIcon, setRandomIcon] = useState(null);
  const iconList = [
    <ShowChartIcon />,
    <CurrencyExchangeIcon />,
    <MonetizationOnIcon />,
    <AllInclusiveIcon />,
    <TransformIcon />,
  ];

  const dispatch = useDispatch();

  const getRandomIcon = () => {
    const randomIndex = Math.floor(Math.random() * iconList.length);
    return iconList[randomIndex];
  };

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
        toast.error("Please answer the current question", {
          position: "top-right",
        });
        return;
      }
    } else {
      // For all other cases, validate all questions up to current
      const missingFields = questions
        .slice(0, currentQuestion + 1)
        .filter((q) => {
          return (
            !answers[q.id] || (answers[q.id] === "Other" && !otherInputs[q.id])
          );
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
        setActiveIndustry("Market Research");
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
      setSlideDirection("slide-out-left");

      setTimeout(() => {
        setCurrentQuestion((prev) => prev + 1);
        setSlideDirection("slide-in-right");
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setSlideDirection("slide-out-right");

      setTimeout(() => {
        setCurrentQuestion((prev) => prev - 1);
        setSlideDirection("slide-in-left");
      }, 300);
    }
  };

  React.useEffect(() => {
    if (resetNavigation) {
      setCurrentQuestion(0);
    }
  }, [resetNavigation]);

  return (
    <div className="relative p-3 h-full w-full bg-cover bg-center">
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutLeft {
          to {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
        @keyframes slideOutRight {
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
        .slide-in-left {
          animation: slideInLeft 0.3s ease-out;
        }
        .slide-out-left {
          animation: slideOutLeft 0.3s ease-out;
        }
        .slide-out-right {
          animation: slideOutRight 0.3s ease-out;
        }
      `}</style>

      {/* <div className="absolute inset-0 bg-black opacity-75 pointer-events-none"></div> */}

      <ToastContainer />

      <div className="relative z-10 flex justify-center items-center h-full">
        <form
          onSubmit={handleSubmit}
          className="w-1/3 flex flex-col justify-between h-[610px] bg-black bg-opacity-10 p-6 rounded-lg shadow-2xl"
        >
          {/* Main Content */}
          <div className="flex flex-col flex-grow">
            <div
              key={questions[currentQuestion].id}
              className={`${slideDirection}`}
              style={{
                marginBottom: "20px",
                position: "relative",
                animationFillMode: "forwards",
              }}
            >
              <label className="h-full">
                <div className="flex">
                  <span className="font-bold">{currentQuestion + 1}. </span>
                  <p className="ml-3 text-lg font-semibold text-gray-300">
                    {questions[currentQuestion].question}
                  </p>
                </div>
                <br />
                <div className="min-h-full">
                  {questions[currentQuestion].type === "text" && (
                    <input
                      className="bg-[#151518] border-gray-500 bg-opacity-50 p-2 rounded-lg border w-full"
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
                      <div className="flex-col mx-4">
                        {questions[currentQuestion].options?.map((option) => (
                          <div
                            key={option}
                            className="flex items-center mb-2 bg-opacity-40 bg-black w-full h-16 px-3 border border-[#FFFFFF33]/30 py-1 rounded-lg"
                          >
                            <div>{getRandomIcon()}</div>
                            <div className="mx-5 flex justify-between w-full">
                              <label
                                htmlFor={`${questions[currentQuestion].id}-${option}`}
                                className="cursor-pointer bg-opacity-50"
                              >
                                {option}
                              </label>
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
                                  answers[questions[currentQuestion].id] ===
                                  option
                                    ? "bg-white"
                                    : "bg-[#151518] border-gray-500"
                                }`}
                                style={{
                                  appearance: "none",
                                  border: "2px solid #6b7280",
                                  outline: "none",
                                }}
                              />
                            </div>
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
          </div>

          {/* Buttons */}
          <div className="mt-auto flex justify-between bottom-0">
            <button
              type="button"
              disabled={currentQuestion === 0 || loading}
              onClick={handlePrevious}
              className="bg-gradient-to-b from-white/20 to-gray-800/30 border border-[#565656] text-white px-2 flex py-2 w-1/2 m-3 rounded"
            >
              <KeyboardBackspaceIcon className="mr-10" />
              Previous
            </button>
            {currentQuestion === questions.length - 1 ? (
              <button type="submit" disabled={loading} className="w-1/2">
                {loading ? (
                  <div className="flex items-center">
                    <div className="bg-white hover:bg-[#151518] font-semibold hover:border-white w-full hover:border hover:text-white transition-all ease-out duration-300 text-[#151518] px-2 py-2 rounded flex items-center justify-center">
                      Generating Thesis...
                      <div className="animate-spin rounded-full ml-4 h-5 w-5 border-b-2 border-gray-900 hover:border-white"></div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white hover:bg-[#151518] font-semibold hover:border-white w-full hover:border hover:text-white transition-all ease-out duration-300 text-[#151518] px-2 py-2 rounded flex items-center justify-center">
                    Generate Thesis
                  </div>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="bg-gradient-to-b from-white/20 to-gray-800/30 border border-[#565656] text-white w-1/2 px-2 py-2 m-3 rounded"
              >
                Next
                <EastIcon className="ml-10" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
