import type { FC } from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import CompanyDetails from "~/components/Dashboard/CompanyInsights/CompanyLayout";
import { ThesisForm } from "~/components/Dashboard/InvestmentThesis/InvestmentThesis";
import NewsBar from "~/components/Newsbar/Newsbar";
import { categoryList } from "~/constant";
import DashboardLayout from "~/pages/dashboard/DashboardLayout";
import MarketResearchChatLayout from "~/components/Dashboard/MarketResearch/MarketResearchChatLayout";
import IndustryInsightsLayout from "~/components/Dashboard/IndustryInsights/IndustryInsightsLayout";
import { Button } from "~/components/ui/button";
import CustomReportLayout from "~/components/Dashboard/CustomReport/CustomReportLayout";
import {Sidebar} from "~/components/Sidebar/Sidebar";

const DashboardPage: FC = () => {
  const [activeCategory, setActiveCategory] = useState("Dashboard");
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Logout handler
  const handleLogout = () => {
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/login");
  };

  return (
    <div className="flex flex-col flex-grow">
      <div className="flex flex-row">
        {/* Sidebar */}
        <Sidebar activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

        {/* Main Content */}
        <div className="flex flex-col flex-grow">
          <Tabs
            value={activeCategory}
            onValueChange={(value) => setActiveCategory(value)}
          >
            <div className="flex items-center justify-between bg-zinc-800">
              <TabsList className="flex flex-wrap justify-start gap-2">
                {categoryList.map((category, index) => (
                  <TabsTrigger
                    key={index}
                    value={category}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              <Button variant="destructive" className="m-1" onClick={handleLogout}>
                Logout
              </Button>
            </div>

            {/* Dashboard */}
            <TabsContent value="Dashboard" className="flex-grow text-white">
              <DashboardLayout
                active={activeCategory}
                setActive={setActiveCategory}
              />
              <div className="h-[30rem] py-10 overflow-auto">
                <NewsBar />
              </div>
            </TabsContent>

            {/* Market Research */}
            <TabsContent value="Market Research" className="p-5">
              <MarketResearchChatLayout />
            </TabsContent>

            {/* Industry Insights */}
            <TabsContent value="Industry Insights" className="p-5">
              <IndustryInsightsLayout />
            </TabsContent>

            {/* Company Insights */}
            <TabsContent value="Company Insights">
              <CompanyDetails />
            </TabsContent>

            {/* Deal Room */}
            <TabsContent value="Deal Room">
              <CustomReportLayout />
            </TabsContent>

            {/* Investment Thesis */}
            <TabsContent
              value="Investment Thesis"
              className="p-5 bg-stone-950 text-white"
            >
              <ThesisForm
                questions={[
                  {
                    id: 1,
                    question: "What industries or sectors are you most interested in?",
                    type: "text",
                  },
                  {
                    id: 2,
                    question:
                      "Do you have expertise or experience in particular industries that you'd like to leverage?",
                    type: "text",
                  },
                  {
                    id: 3,
                    question: "What industry characteristics are most important to you?",
                    type: "select",
                    options: ["Growth Rate", "Fragmentation", "Recurring Revenue", "Other"],
                  },
                  {
                    id: 4,
                    question: "Are there any specific mega-trends you want to capitalize on?",
                    type: "select",
                    options: [
                      "Aging Population",
                      "Digital Transformation",
                      "Health and Wellness",
                      "Other",
                    ],
                  },
                  {
                    id: 5,
                    question: "Are you more interested in industries with?",
                    type: "select",
                    options: ["Rapid technological change", "Traditional business model"],
                  },
                  {
                    id: 6,
                    question:
                      "Anything else we should consider in coming up with investment thesis?",
                    type: "text",
                  },
                ]}
                setActiveIndustry={setActiveCategory}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
