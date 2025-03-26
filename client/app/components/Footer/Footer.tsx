import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import FlashlightText from "./FlashlightText/FlashlightText";

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
    <div className="text-foreground px-8 py-16 md:px-32 md:py-24 border-t-[1px] bg-stone-950/80 border-stone-600">
      

      <div>
        <FlashlightText />
      </div>

      {/* Footer */}
      <div className="text-sm text-muted-foreground">
        © 2025 Omega Intelligence. All rights reserved.
      </div>
    </div>
  );
};

export default Footer;