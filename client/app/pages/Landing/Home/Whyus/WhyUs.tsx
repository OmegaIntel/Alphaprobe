import React from "react";
import { Building2, Briefcase, FileSearch, BarChart3 } from "lucide-react";

interface PlatformUserProps {
  icon: React.ReactNode;
  text: string;
}

const SecurityBanner: React.FC = () => (
  <div className="bg-slate-800 text-white p-12 rounded-lg mb-24">
    <h2 className="text-3xl mb-4">Built with Enterprise-Grade Security and Compliance</h2>
    <p className="text-gray-300 max-w-3xl">
      Omega's platform is built with industry-standard security architecture. We regularly update and test our systems to ensure our user data and business objectives are always in safe hands.
    </p>
  </div>
);

const PlatformUser: React.FC<PlatformUserProps> = ({ icon, text }) => (
  <div className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-lg">
    {icon}
    <span className="text-sm">{text}</span>
  </div>
);

const WhyUs: React.FC = () => {
  const users: PlatformUserProps[] = [
    { icon: <Building2 className="w-5 h-5 text-orange-400" />, text: "Investment Banking" },
    { icon: <Briefcase className="w-5 h-5 text-orange-400" />, text: "Private Equity" },
    { icon: <FileSearch className="w-5 h-5 text-orange-400" />, text: "M&A Advisors" },
    { icon: <BarChart3 className="w-5 h-5 text-orange-400" />, text: "Corporate Strategy" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <SecurityBanner />

      <div className="grid grid-cols-2 gap-24 mb-24">
        <h2 className="text-3xl font-semibold">
          Omega's Platform is used by professionals across private market investment teams
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {users.map((user, index) => (
            <PlatformUser key={index} {...user} />
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-12 rounded-lg">
        <h2 className="text-3xl mb-4">Meet the newest member of your Deal team</h2>
        <p className="mb-8 text-gray-300">
          Your AI deal intelligence partner that automates months of research, modeling, and diligence into days.
        </p>
        <button className="bg-white text-slate-800 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors">
          Schedule a demo
        </button>
      </div>
    </div>
  );
};

export default WhyUs;
