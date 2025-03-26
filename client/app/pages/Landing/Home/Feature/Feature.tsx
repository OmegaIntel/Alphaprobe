// import React, { FC, ReactNode } from "react";
// import { Laptop, Network, FileText, Database } from "lucide-react";
// import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "~/components/ui/card";

// // Define props for FeatureCard
// interface FeatureCardProps {
//   icon: ReactNode; // Accepts JSX elements
//   title: string;
//   description: string;
// }

// const FeatureCard: FC<FeatureCardProps> = ({ icon, title, description }) => {
//   return (
//     <Card className="bg-muted/20">
//       <CardHeader className="flex flex-col gap-2 items-start">
//         <div className="text-primary text-xl">{icon}</div>
//         <CardTitle>{title}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <CardDescription>{description}</CardDescription>
//       </CardContent>
//     </Card>
//   );
// };

// const Features: FC = () => {
//   const features = [
//     {
//       icon: <Laptop className="w-6 h-6" />,
//       title: "Investment Thesis & Market Research",
//       description:
//         "Build investment theses and perform market and company research leveraging public and private market data sources",
//     },
//     {
//       icon: <Network className="w-6 h-6" />,
//       title: "Diligence Workflow Automation",
//       description:
//         "Suite of specialized AI agents to perform tasks like deal sourcing, market research, financial diligence, valuation.",
//     },
//     {
//       icon: <Database className="w-6 h-6" />,
//       title: "Data Integration",
//       description:
//         "Centralize all transaction-related data and communications, and collaborate with different stakeholders from within the platform",
//     },
//     {
//       icon: <FileText className="w-6 h-6" />,
//       title: "Automated Document Analysis",
//       description:
//         "Leverage AI to parse, analyze, and summarize insights from financial reports, PDFs, and market research",
//     },
//   ];

//   return (
//     <div className="px-4 py-16">
//       <h2 className="text-3xl font-semibold mb-4">
//         Integrated Solution for Private Market Transactions
//       </h2>
//       <p className="text-muted-foreground mb-12 max-w-3xl">
//         Omega's platform eliminates the need to juggle multiple software tools and data sources, addressing the fragmentation and inefficiencies in the current private market landscape.
//       </p>
//       <div className="grid grid-rows-2 grid-cols-2 gap-6">
//         {features.map((feature, index) => (
//           <FeatureCard key={index} {...feature} />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Features;

import { FC } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { ArrowRight, Zap, Clock, Users } from 'lucide-react';

const Features: FC = () => {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Drive Diligence Efficiency",
      description: "Unify documentation into one intuitive tool."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Cut 25+ Manual Hours",
      description: "Accelerate timelines with automated workflows."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Eliminate Misalignment",
      description: "Collaborate with your team on an integrated platform."
    }
  ];

  return (
    <div className="py-16 text-center">
      {/* Header */}
      <h2 className="text-3xl font-semibold mb-4">
        The due diligence process is long and tedious.
      </h2>
      <p className="text-xl mb-12">
        Reduce your time spent by 50% using Omega.
      </p>

      {/* Features */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-4">
        <Card className="bg-stone-950 text-white p-6 w-full md:w-64 text-center">
          <div className="flex justify-center mb-4">
            {features[0].icon}
          </div>
          <h3 className="text-xl font-medium mb-3">{features[0].title}</h3>
          <CardContent className="p-0">
            <p>{features[0].description}</p>
          </CardContent>
        </Card>

        <ArrowRight className="hidden md:block w-10 h-10 mx-1" />

        <Card className="bg-stone-950 text-white p-6 w-full md:w-64 text-center">
          <div className="flex justify-center mb-4">
            {features[1].icon}
          </div>
          <h3 className="text-xl font-medium mb-3">{features[1].title}</h3>
          <CardContent className="p-0">
            <p>{features[1].description}</p>
          </CardContent>
        </Card>

        <ArrowRight className="hidden md:block w-10 h-10 mx-1" />

        <Card className="bg-stone-950 text-white p-6 w-full md:w-64 text-center">
          <div className="flex justify-center mb-4">
            {features[2].icon}
          </div>
          <h3 className="text-xl font-medium mb-3">{features[2].title}</h3>
          <CardContent className="p-0">
            <p>{features[2].description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Features;