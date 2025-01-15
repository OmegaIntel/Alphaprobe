import React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "~/components/ui/tooltip";
import { ExternalLink } from "lucide-react";

interface DynamicContentProps {
  report: string;
}

const DynamicContent: React.FC<DynamicContentProps> = ({ report }) => {
  // Function to parse the report into sections and subheadings dynamically
  const parseReport = (report: string) => {
    const sections = report
      .split("\n\n## ") // Split by sections
      .filter((section) => section.trim())
      .map((section) => {
        const [mainHeading, ...subsections] = section.split("\n### ");
        const subheadings = subsections.map((subsection) => {
          const [title, ...content] = subsection.split("\n");

          // Apply formatting rules for content
          const formattedContent = content
            .join("\n")
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text between double asterisks
            .replace(/####(.*?)/g, '<br/><strong>$1</strong>'); // Add new line and bold for ####

          return { title: title.trim(), content: formattedContent };
        });
        return {
          main_heading: mainHeading.replace("## ", "").trim(),
          subheadings,
        };
      });
    return sections;
  };

  const data = parseReport(report);

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
                    <p
                      className="text-gray-200"
                      dangerouslySetInnerHTML={{ __html: subheading.content }} // Render HTML content
                    ></p>
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
