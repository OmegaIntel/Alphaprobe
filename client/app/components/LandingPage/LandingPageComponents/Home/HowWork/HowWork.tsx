import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";

const HowWork: FC = () => {
  return (
    <div className=" bg-muted/20 rounded-lg  py-16 px-8">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold">How it works</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Select your sources, define analysis, and you're presented with a refined output like magic
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center">
        {/* Center Column - Omega Terminal */}
        <div className="flex flex-col items-center text-center">
          <img
            src="images/network.svg"
            alt="Omega AI"
            className="mb-4 h-auto"
          />
        </div>

        {/* Feature Cards Below the Image */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full max-w-4xl">
          {/* Card 1 */}
          <Card className="bg-gray-700 bg-opacity-30">
            <CardHeader>
              <CardTitle className="text-lg">Connect with Market Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Access rich datasets from diverse markets.</CardDescription>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="bg-gray-700 bg-opacity-30">
            <CardHeader>
              <CardTitle className="text-lg">High Fidelity Proprietary Models</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Generate insights with proprietary models.</CardDescription>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="bg-gray-700 bg-opacity-30">
            <CardHeader>
              <CardTitle className="text-lg">Executive Ready Presentations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create polished, ready-to-deliver presentations.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HowWork;
