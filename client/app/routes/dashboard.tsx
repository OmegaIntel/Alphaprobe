
import type { FC } from 'react';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs';
import CompanyDetails from '~/components/Dashboard/CompanyInsights/CompanyLayout';
import { ThesisForm } from '~/components/Dashboard/InvestmentThesis/InvestmentThesis';
import NewsBar from '~/components/Newsbar/Newsbar';
import { categoryList } from '~/constant';
import DashboardLayout from '~/pages/dashboard/DashboardLayout';
import MarketResearchChatLayout from '~/components/Dashboard/MarketResearch/MarketResearchChatLayout';
import { MarketResearchPreload } from '~/components/Dashboard/IndustryInsights/PreloadingScreen';
import { IndustrySidebar } from '~/components/Dashboard/IndustryInsights/IndustrySidebar';
import FuzzySearch from '~/components/SearchBox/FuzzySearch';
import IndustryInsightsLayout from '~/components/Dashboard/IndustryInsights/IndustryInsightsLayout';


// Example question type
type Question = {
  id: number;
  question: string;
  type: 'text' | 'select';
  options?: string[];
};

// Example array of questions
const questions: Question[] = [
  {
    id: 1,
    question: 'What industries or sectors are you most interested in ?',
    type: 'text',
  },
  {
    id: 2,
    question:
      "Do you have expertise or experience in particular industries that you'd like to leverage?",
    type: 'text',
  },
  {
    id: 3,
    question: 'What industry characteristics are most important to you ?',
    type: 'select',
    options: ['Growth Rate', 'Fragmentation', 'Recurring Revenue', 'Other'],
  },
  {
    id: 4,
    question: 'Are there any specific mega-trends you want to capitalize on ?',
    type: 'select',
    options: [
      'Aging Population',
      'Digital Transformation',
      'Health and Wellness',
      'Other',
    ],
  },
  {
    id: 5,
    question: 'Are you more interested in industries with ?',
    type: 'select',
    options: ['Rapid technological change', 'Traditional business model'],
  },
  {
    id: 6,
    question:
      'Anything else we should consider in coming up with investment thesis ?',
    type: 'text',
  },
];

const DashboardPage: FC = () => {
  const [activeCategory, setActiveCategory] = useState('Dashboard');

  return (
    <div className="flex flex-col flex-grow">
      {/* Use shadcn Tabs to handle the categories */}
      <Tabs
        value={activeCategory}
        onValueChange={(value) => setActiveCategory(value)}
      >
        <TabsList className="flex flex-wrap justify-start p-2 gap-2">
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

        {/* Dashboard */}
        <TabsContent value="Dashboard" className="flex-grow  text-white">
          <DashboardLayout
            active={activeCategory}
            setActive={setActiveCategory}
          />
          <div className="h-[30rem]  py-10 overflow-auto">
            <NewsBar />
          </div>
        </TabsContent>

        {/* Market Research */}
        <TabsContent value="Market Research" className="p-5 ">
          <MarketResearchChatLayout />
        </TabsContent>

        {/* Industry Insights */}
        <TabsContent value="Industry Insights" className="p-5 ">
          {/* Insert your content here */}
          {/* <MarketResearchPreload />
          <IndustrySidebar /> */}
          <IndustryInsightsLayout />
          {/* <FuzzySearch />
          */}
        </TabsContent>

        {/* Company Insights */}
        <TabsContent value="Company Insights" className="">
          <CompanyDetails />
        </TabsContent>

        {/* Investment Thesis */}
        <TabsContent
          value="Investment Thesis"
          className="p-5 bg-stone-950 text-white"
        >
          <ThesisForm
            questions={questions}
            setActiveIndustry={setActiveCategory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
