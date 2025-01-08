import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "@remix-run/react";
import { Pencil, Check, Minus } from "lucide-react";
import { API_BASE_URL } from "~/constant";
import { setSummaryData } from "~/store/slices/industrySlice";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useToast } from "~/hooks/use-toast";
import {
  setFormResponse,
  updateSelectedIndustries,
} from "~/store/slices/formResponseSlice";
import FuzzySearch from "~/components/SearchBox/FuzzySearch";
import { AppDispatch } from "~/store/store";

interface Industry {
  industry_name: string;
  industry_code: string;
}

interface FormResponseState {
  data: {
    result: Industry[];
  } | null;
  selectedIndustries: Industry[];
}

interface RootState {
  formResponse: FormResponseState;
}

interface SummaryResponse {
  result: any[]; // Using `any[]` to accommodate dynamic structure
}

export function IndustrySidebar() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const formResponse = useSelector(
    (state: RootState) => state.formResponse.data
  );
  const selectedIndustries = useSelector(
    (state: RootState) => state.formResponse.selectedIndustries
  );

  const [isEditing, setIsEditing] = useState(false);
  const [industries, setIndustries] = useState<Industry[]>(
    formResponse?.result || []
  );

  const getAuthToken = (): string | null => {
    if (typeof document === "undefined") return null;
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1] || null
    );
  };

  useEffect(() => {
    setIndustries(formResponse?.result || []);
  }, [formResponse]);

  useEffect(() => {
    if (industries.length > 0) {
      handleIndustryToggle(industries[0]);
    }
  }, []);

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  const handleRemoveIndustry = (industryName: string) => {
    setIndustries((prev) =>
      prev.filter((industry) => industry.industry_name !== industryName)
    );

    const industryToRemove = industries.find(
      (industry) => industry.industry_name === industryName
    );

    if (industryToRemove) {
      dispatch(updateSelectedIndustries(industryToRemove));
    }
  };

  const formatIndustryName = (name: string): string => {
    return name
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const fetchIndustrySummary = async (industry: Industry): Promise<void> => {
    if (typeof window === "undefined") return;

    try {
      const token = getAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const payload = {
        data: {
          source: "IBIS",
          industry_name: industry.industry_name,
          industry_code: "0",
        },
      };

      const response = await fetch(`${API_BASE_URL}/api/industry-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch industry summary");
      }

      const result = (await response.json()) as SummaryResponse;

      if (!result.result || result.result.length === 0) {
        toast({
          variant: "destructive",
          title: "Invalid Industry",
          description:
            "There was an error fetching your request. Please enter a valid industry.",
        });
        return;
      }

      const summaryContent = result.result[0]; // Use the first item in the result array
      dispatch(setSummaryData(summaryContent));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch industry summary",
      });
    }
  };

  const handleIndustryToggle = (industry: Industry): void => {
    dispatch(updateSelectedIndustries(industry));

    const isAlreadySelected = selectedIndustries.some(
      (i) => i.industry_code === industry.industry_code
    );

    if (!isAlreadySelected) {
      fetchIndustrySummary(industry);
    }
  };

  useEffect(() => {
    dispatch(setFormResponse({ result: industries }));
  }, [industries, dispatch]);

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-background border-b">
        <div>
          <img
            src="/images/LogoCompany.png"
            alt="Company Logo"
            className="my-4 h-8"
          />
        </div>

        <div className="flex justify-between items-center my-2">
          <h1 className="text-xl font-bold">Industries</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEditToggle}
            title={isEditing ? "Done" : "Edit"}
          >
            {isEditing ? (
              <Check className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isEditing && (
          <div className="my-5">
            <FuzzySearch
              section="Search Industry"
              industry={industries}
              setIndustry={setIndustries}
            />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 flex flex-col space-y-4">
          {industries.map((industry) => (
            <div
              key={industry.industry_code}
              className={`flex items-center space-x-3 rounded-md transition-colors duration-300 
                ${
                  selectedIndustries.some(
                    (i) => i.industry_name === industry.industry_name
                  )
                    ? "bg-secondary"
                    : "bg-background hover:bg-secondary"
                } 
                h-12`}
            >
              <Button
                variant="ghost"
                className="flex-1 justify-start text-left px-3 text-xs h-full font-normal"
                title={`${industry.industry_code} - ${industry.industry_name}`}
                onClick={() => handleIndustryToggle(industry)}
              >
                {formatIndustryName(industry.industry_name)}
              </Button>

              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive/90"
                  onClick={() => handleRemoveIndustry(industry.industry_name)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
