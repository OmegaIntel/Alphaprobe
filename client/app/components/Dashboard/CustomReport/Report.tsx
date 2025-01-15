import React from 'react';
import { Card, CardContent } from "~/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "~/components/ui/tooltip";

import { ExternalLink } from "lucide-react";

interface Subheading {
  title: string;
  content: string;
  source?: string;
  sources?: string[];
}

interface Section {
  main_heading: string;
  subheadings: Subheading[];
}

interface DynamicContentProps {
  data: Section[];
}

const DynamicContent: React.FC<DynamicContentProps> = ({ data }) => {
  return (
    <TooltipProvider>
      <div className="space-y-8">
        {data.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="space-y-4">
            <CardContent>
              <h2 className="text-xl font-bold mb-4">{section.main_heading}</h2>
              <div className="space-y-4">
                {section.subheadings.map((subheading, subheadingIndex) => (
                  <div key={subheadingIndex} className="space-y-2">
                    <h3 className="text-lg font-semibold">{subheading.title}</h3>
                    <p className="text-gray-200">
                      {subheading.content}
                      {subheading.source && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={subheading.source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 flex items-center gap-1 text-blue-500 hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{subheading.source}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {subheading.sources && (
                        <div className="mt-2">
                          {subheading.sources.map((src, srcIndex) => (
                            <Tooltip key={srcIndex}>
                              <TooltipTrigger asChild>
                                <a
                                  href={src}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 flex items-center gap-1 text-blue-500 hover:underline"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {srcIndex + 1}
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{src}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default DynamicContent;
