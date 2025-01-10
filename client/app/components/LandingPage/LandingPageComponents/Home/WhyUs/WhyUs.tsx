import React, { FC, ReactNode } from 'react';
import { Building2, Briefcase, FileSearch, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

// Define the props for PlatformUser component
interface PlatformUserProps {
  icon: ReactNode; // Allows any JSX element
  text: string;
}

const PlatformUser: FC<PlatformUserProps> = ({ icon, text }) => (
  <Card className="flex items-center gap-3 bg-muted/20 p-4">
    <div className="text-orange-400">{icon}</div>
    <span className="text-sm">{text}</span>
  </Card>
);

const SecurityBanner: FC = () => (
  <Card className="bg-muted/20 p-12 mb-24">
    <CardHeader>
      <CardTitle className="text-3xl mb-4">
        Built with Enterprise-Grade Security and Compliance
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Omega's platform is built with industry-standard security architecture.
        We regularly update and test our systems to ensure our user data and
        business objectives are always in safe hands.
      </p>
    </CardContent>
  </Card>
);

const WhyUs: FC = () => {
  // Define the users array with explicit typing
  const users: PlatformUserProps[] = [
    { icon: <Building2 className="w-5 h-5" />, text: 'Investment Banking' },
    { icon: <Briefcase className="w-5 h-5" />, text: 'Private Equity' },
    { icon: <FileSearch className="w-5 h-5" />, text: 'M&A Advisors' },
    { icon: <BarChart3 className="w-5 h-5" />, text: 'Corporate Strategy' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Security Banner */}
      <SecurityBanner />

      {/* Platform Users Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-24 mb-24">
        <h2 className="text-3xl font-semibold">
          Omega's Platform is used by professionals across private market
          investment teams
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {users.map((user, index) => (
            <PlatformUser key={index} {...user} />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <Card className="bg-muted/20 p-12">
        <CardHeader>
          <CardTitle className="text-3xl mb-4">
            Meet the newest member of your Deal team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-8">
            Your AI deal intelligence partner that automates months of research,
            modeling, and diligence into days.
          </p>
          <Button
            className="bg-white text-slate-800 hover:bg-muted"
            onClick={() =>
              window.open(
                'https://calendly.com/chetan-omegaintelligence',
                '_blank'
              )
            }
          >
            Schedule a demo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhyUs;
