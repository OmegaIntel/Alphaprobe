import React, { FC, ReactNode } from "react";
import { Laptop, Network, FileText, Database } from "lucide-react";

// Define props for FeatureCard
interface FeatureCardProps {
  icon: ReactNode; // Accepts JSX elements
  title: string;
  description: string;
  darkBg?: boolean; // Optional prop with a default value
}

const FeatureCard: FC<FeatureCardProps> = ({ icon, title, description, darkBg = false }) => {
  return (
    <div className={`p-8 rounded-lg ${darkBg ? "bg-slate-700" : "bg-blue-50"}`}>
      <div className={`mb-4 ${darkBg ? "text-white" : "text-black"}`}>{icon}</div>
      <h3 className={`text-xl font-medium mb-2 ${darkBg ? "text-white" : "text-black"}`}>{title}</h3>
      <p className={`text-sm ${darkBg ? "text-gray-300" : "text-gray-600"}`}>{description}</p>
    </div>
  );
};

// Define the structure of each feature
interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  darkBg?: boolean;
}

const Features: FC = () => {
  const features: Feature[] = [
    {
      icon: <Laptop className="w-6 h-6" />,
      title: "Investment Thesis & Market Research",
      description:
        "Build investment theses and perform market and company research leveraging public and private market data sources",
      darkBg: true,
    },
    {
      icon: <Network className="w-6 h-6" />,
      title: "Diligence Workflow Automation",
      description:
        "Suite of specialized AI agents to perform tasks like deal sourcing, market research, financial diligence, valuation.",
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Data Integration",
      description:
        "Centralize all transaction-related data and communications, and collaborate with different stakeholders from within the platform",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Automated Document Analysis",
      description:
        "Leverage AI to parse, analyze, and summarize insights from financial reports, PDFs, and market research",
    },
  ];

  return (
    <div className="px-4 py-16">
      <h2 className="text-3xl font-semibold mb-4">
        Integrated Solution for Private Market Transactions
      </h2>
      <p className="text-gray-600 mb-12 max-w-3xl">
        Omega's platform eliminates the need to juggle multiple software tools and data sources, addressing the fragmentation and inefficiencies in the current private market landscape.
      </p>
      <div className="grid grid-rows-2 grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>
    </div>
  );
};

export default Features;
