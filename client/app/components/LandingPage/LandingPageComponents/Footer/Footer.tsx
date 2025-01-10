import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

// Define a type for a feature
interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
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

const Footer: FC = () => {
  return (
    <div className="text-foreground px-8 py-16 md:px-32 md:py-24 border-t-[1px] bg-muted/20 border-stone-600">
      {/* Header */}
      <h2 className="text-3xl font-semibold mb-12 max-w-xl">
        Reduce your due diligence time by 50% by centralizing your diligence process
      </h2>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {features.map((feature, index) => (
          <Card key={index} className="shadow-md hover:shadow-lg">
            <CardHeader className="flex flex-col items-start">
              <div className="text-blue-500 text-2xl">{feature.icon}</div>
              <CardTitle className="mt-4">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="text-sm text-muted-foreground">
        © 2025 Omega Intelligence. All rights reserved.
      </div>
    </div>
  );
};

export default Footer;
