import { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '~/components/ui/accordion';
import { categoryList } from '~/constant';
import { IndustrySidebar } from '../Dashboard/IndustryInsights/IndustrySidebar';
import CompanyInsightSidebar from '../Dashboard/CompanyInsights/CompanyInsightSidebar';
import { ChatSession } from '../Dashboard/MarketResearch/ChatSessions';

export function Sidebar({ activeCategory, setActiveCategory }) {
  // Use imported categoryList for the initial order.
  const [orderedCategories, setOrderedCategories] = useState(categoryList);

  const handleCategoryClick = (category) => {
    if (category !== activeCategory) {
      const newOrder = [
        category,
        ...orderedCategories.filter((cat) => cat !== category),
      ];
      setOrderedCategories(newOrder);
    }
    setActiveCategory(category);
  };

  const renderSidebarContent = (category) => {
    switch (category) {
      case 'Dashboard':
        return <div>Dashboard Sidebar Content</div>;
      case 'Market Research':
        return (
          <div>
            <ChatSession />
          </div>
        );
      case 'Industry Insights':
        return (
          <div>
            <IndustrySidebar />
          </div>
        );
      case 'Company Insights':
        return (
          <div>
            <CompanyInsightSidebar />
          </div>
        );
      case 'Deal Room':
        return <div>Deal Room Sidebar Content</div>;
      case 'Investment Thesis':
        return <div>Investment Thesis Sidebar Content</div>;
      default:
        return null;
    }
  };

  return (
    <div className="w-64 bg-zinc-800 text-white p-4">
      <Accordion type="single" collapsible value={activeCategory}>
        {orderedCategories.map((category) => (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger onClick={() => handleCategoryClick(category)}>
              {category}
            </AccordionTrigger>
            <AccordionContent>
              {renderSidebarContent(category)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
