import React, { useEffect, useState, lazy, Suspense } from "react"
import { useDispatch } from "react-redux"
import { parse } from "cookie"
import { toast, ToastContainer } from "react-toastify"
import { setFormResponse } from "~/store/slices/formResponseSlice"
import { API_BASE_URL } from "~/constant"
import { Question } from "~/types/thesis"
import "react-toastify/dist/ReactToastify.css"

// shadcn components
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "~/components/ui/card"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"

// For loading states
import { Loader2 } from "lucide-react"

// ----- LAZY-LOADED MUI ICONS -----
const EastIcon = lazy(() => import("@mui/icons-material/East"))
const KeyboardBackspaceIcon = lazy(() =>
  import("@mui/icons-material/KeyboardBackspace")
)
const ShowChartIcon = lazy(() => import("@mui/icons-material/ShowChart"))
const CurrencyExchangeIcon = lazy(() =>
  import("@mui/icons-material/CurrencyExchange")
)
const MonetizationOnIcon = lazy(() =>
  import("@mui/icons-material/MonetizationOn")
)
const AllInclusiveIcon = lazy(() =>
  import("@mui/icons-material/AllInclusive")
)
const TransformIcon = lazy(() => import("@mui/icons-material/Transform"))
// ----------------------------------

interface ThesisFormProps {
  questions: Question[]
  setActiveIndustry: (industry: string) => void
}

export const ThesisForm: React.FC<ThesisFormProps> = ({
  questions,
  setActiveIndustry,
}) => {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [otherInputs, setOtherInputs] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [slideDirection, setSlideDirection] = useState("slide-in-right")
  const dispatch = useDispatch()

  // If you still need a token from cookies:
  const getTokenFromCookies = (): string | null => {
    if (typeof document === "undefined") return null
    const cookies = parse(document.cookie)
    return cookies.token || null
  }

  const handleInputChange = (id: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleOtherInputChange = (id: number, value: string) => {
    setOtherInputs((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formattedData = {
      data: questions.map((q) => ({
        question: q.question,
        response:
          answers[q.id] === "Other"
            ? otherInputs[q.id] || ""
            : answers[q.id] || "",
      })),
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/industries-for-thesis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      })

      if (!response.ok) {
        throw new Error("Failed to generate thesis")
      }

      const data = await response.json()
      console.log("Thesis Data:", data)
      dispatch(setFormResponse(data))
      toast.success("Thesis generated successfully!")
      setActiveIndustry("Industry Insights")
    } catch (error: any) {
      console.error("Error:", error)
      toast.error("There was an issue generating the thesis.")
    } finally {
      setLoading(false)
      setAnswers({})
      setOtherInputs({})
      setCurrentQuestion(0)
    }
  }

  const handleNavigation = (direction: "next" | "previous") => {
    const newQuestion =
      direction === "next" ? currentQuestion + 1 : currentQuestion - 1

    if (newQuestion >= 0 && newQuestion < questions.length) {
      // trigger slide-out animation
      setSlideDirection(
        direction === "next" ? "slide-out-left" : "slide-out-right"
      )

      // after animation, change question & trigger slide-in
      setTimeout(() => {
        setCurrentQuestion(newQuestion)
        setSlideDirection(
          direction === "next" ? "slide-in-right" : "slide-in-left"
        )
      }, 300)
    }
  }

  useEffect(() => {
    // Reset navigation on mount
    setCurrentQuestion(0)
  }, [])

  // Lazy-loaded icons for select options, used in a cycle.
  const iconList = [
    ShowChartIcon,
    CurrencyExchangeIcon,
    MonetizationOnIcon,
    AllInclusiveIcon,
    TransformIcon,
  ]

  return (
    <div className="dark min-h-screen bg-background p-6">
      <ToastContainer />
      <div className="mx-auto flex max-w-3xl items-center justify-center">
        <Card className="w-full p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex h-[600px] flex-col">
            <CardHeader className="pb-4">
              <Label
                htmlFor={`question-${currentQuestion}`}
                className="text-lg font-semibold"
              >
                {currentQuestion + 1}. {questions[currentQuestion].question}
              </Label>
            </CardHeader>

            <CardContent
              key={questions[currentQuestion].id}
              className={`${slideDirection} animate-slide flex flex-col gap-4`}
              style={{ animationFillMode: "forwards" }}
            >
              {/* Text Input Question */}
              {questions[currentQuestion].type === "text" ? (
                <Input
                  id={`question-${currentQuestion}`}
                  value={answers[questions[currentQuestion].id] || ""}
                  onChange={(e) =>
                    handleInputChange(questions[currentQuestion].id, e.target.value)
                  }
                  placeholder="Enter your answer..."
                />
              ) : (
                // Select (radio) Question
                <>
                  {questions[currentQuestion].options?.map((option, index) => {
                    const IconComponent = iconList[index % iconList.length]
                    return (
                      <div key={option} className="flex items-center gap-2">
                        {/* Lazy-load each icon with Suspense */}
                        <Suspense
                          fallback={
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          }
                        >
                          {/* <IconComponent className="h-4 w-4" /> */}
                        </Suspense>

                        <input
                          type="radio"
                          id={`${questions[currentQuestion].id}-${option}`}
                          name={`question-${questions[currentQuestion].id}`}
                          className="accent-primary"
                          checked={answers[questions[currentQuestion].id] === option}
                          onChange={() =>
                            handleInputChange(questions[currentQuestion].id, option)
                          }
                        />
                        <Label
                          htmlFor={`${questions[currentQuestion].id}-${option}`}
                          className="cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    )
                  })}
                </>
              )}

              {/* Render "Other" input if user selected "Other" */}
              {answers[questions[currentQuestion].id] === "Other" && (
                <Input
                  className="mt-2"
                  placeholder="Specify your 'Other' response..."
                  value={otherInputs[questions[currentQuestion].id] || ""}
                  onChange={(e) =>
                    handleOtherInputChange(
                      questions[currentQuestion].id,
                      e.target.value
                    )
                  }
                />
              )}
            </CardContent>

            <CardFooter className="mt-auto flex items-center justify-between space-x-2">
              {/* Previous Button */}
              <Button
                variant="outline"
                type="button"
                disabled={currentQuestion === 0 || loading}
                onClick={() => handleNavigation("previous")}
                className="flex-1"
              >
                {/* Lazy-load Back Icon */}
                <Suspense
                  fallback={<Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                >
                  <KeyboardBackspaceIcon className="mr-2 h-4 w-4" />
                </Suspense>
                Previous
              </Button>

              {/* Next or Submit Button */}
              {currentQuestion === questions.length - 1 ? (
                <Button
                  variant="default"
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Thesis
                      <Suspense
                        fallback={<Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      >
                        <EastIcon className="ml-2 h-4 w-4" />
                      </Suspense>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="default"
                  type="button"
                  onClick={() => handleNavigation("next")}
                  disabled={loading}
                  className="flex-1"
                >
                  Next
                  <Suspense
                    fallback={<Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  >
                    <EastIcon className="ml-2 h-4 w-4" />
                  </Suspense>
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Slide Animations */}
      <style>
        {`
          @keyframes slide-in-right {
            0% { transform: translateX(100%); }
            100% { transform: translateX(0); }
          }
          @keyframes slide-in-left {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(0); }
          }
          @keyframes slide-out-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
          @keyframes slide-out-right {
            0% { transform: translateX(0); }
            100% { transform: translateX(100%); }
          }
          .animate-slide {
            animation-duration: 300ms;
            animation-timing-function: ease-out;
          }
          .slide-in-right {
            animation-name: slide-in-right;
          }
          .slide-in-left {
            animation-name: slide-in-left;
          }
          .slide-out-left {
            animation-name: slide-out-left;
          }
          .slide-out-right {
            animation-name: slide-out-right;
          }
        `}
      </style>
    </div>
  )
}
