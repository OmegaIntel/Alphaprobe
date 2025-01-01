import React from "react";

const features = [
  {
    icon: "⚡",
    title: "Drive diligence efficiency",
    description:
      "Unify all requests and documents into one intuitive tool, eliminating the errors of disparate systems.",
  },
  {
    icon: "⏱",
    title: "Cut 25+ manual hours",
    description:
      "Accelerate your due diligence timelines with automated workflows and streamlined communication.",
  },
  {
    icon: "📋",
    title: "Eliminate misalignment",
    description:
      "Foster collaboration between buyers & sellers with integrated communication channels.",
  },
];

const FooterCard = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-blue-500 text-2xl">{icon}</div>
      <div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <div className="bg-slate-800 text-white px-32 py-24">
      <h2 className="text-3xl font-semibold mb-16 max-w-xl">
        Reduce your due diligence time by 50% by centralizing your diligence
        process
      </h2>

      <div className="grid grid-cols-3 gap-8 mb-16">
        {features.map((feature, index) => (
          <FooterCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>

      <div className="text-sm text-gray-400">
        © 2024 Omega Intelligence. All rights reserved.
      </div>
    </div>
  );
};

export default Footer;
