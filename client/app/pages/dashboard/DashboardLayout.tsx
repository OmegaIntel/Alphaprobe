import React, { Suspense, lazy } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

const StorageIcon = lazy(() => import("@mui/icons-material/Storage"));
const CorporateFareIcon = lazy(() => import("@mui/icons-material/CorporateFare"));
const CellTowerIcon = lazy(() => import("@mui/icons-material/CellTower"));
const SpaceDashboardIcon = lazy(() => import("@mui/icons-material/SpaceDashboard"));

interface Section {
  name: string;
  description: string;
  icon: React.LazyExoticComponent<React.ComponentType<any>>;
  route: string | null;
}

interface DashboardProps {
  active: string;
  setActive: (route: string) => void;
}

const sections: Section[] = [
  {
    name: "Generate an Investment Thesis",
    description:
      "Identify key investment opportunities by creating a personalized thesis based on your criteria.",
    icon: StorageIcon,
    route: "Investment Thesis",
  },
  {
    name: "Browse Companies",
    description:
      "Explore potential investment targets and learn more about their operations and offerings.",
    icon: CorporateFareIcon,
    route: "Company Insights",
  },
  {
    name: "Browse Industries",
    description:
      "Discover industries aligned with your investment strategy and analyze recent trends.",
    icon: CellTowerIcon,
    route: "Industry Insights",
  },
  {
    name: "Market Research",
    description: "Comprehensive Market Research from Trusted Providers.",
    icon: SpaceDashboardIcon,
    route: "Market Research",
  },
];

const DashboardLayout: React.FC<DashboardProps> = ({ active, setActive }) => {
  return (
    <div className="container mx-auto py-8">
      {/* Use a responsive grid for your cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 px-20">
        {sections.map((section, index) => (
         <Card key={index} className="flex flex-col">
         <CardHeader>
           <Suspense fallback={<Skeleton className="mb-2 h-8 w-8 rounded-md bg-muted" />}>
             <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-accent text-accent-foreground">
               <section.icon className="h-6 w-6" />
             </div>
           </Suspense>
           <CardTitle>{section.name}</CardTitle>
           <CardDescription>{section.description}</CardDescription>
         </CardHeader>
       
         <CardContent />
       
         <CardFooter className="mt-auto">
           <Button
             onClick={() => section.route && setActive(section.route)}
             disabled={!section.route}
             className="w-full"
           >
             {section.route ? "Continue" : "Coming Soon"}
           </Button>
         </CardFooter>
       </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardLayout;
