import React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "~/components/ui/tooltip";
import { ExternalLink } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "~/components/ui/button";

interface Subheading {
  title: string;
  content: string;
}

interface Section {
  main_heading: string;
  subheadings: Subheading[];
}

interface DynamicContentProps {
  report: string;
}

const DynamicContent: React.FC<DynamicContentProps> = ({ report }) => {
  // Function to parse the report into sections and subheadings dynamically
  const parseReport = (report: string): Section[] => {
    return report
      .split("\n\n## ") // Split by sections
      .filter((section) => section.trim())
      .map((section) => {
        const [mainHeading, ...subsections] = section.split("\n### ");
        const subheadings = subsections.map((subsection) => {
          const [title, ...content] = subsection.split("\n");

          // Apply formatting rules for content
          const formattedContent = content
            .join("\n")
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold text between double asterisks
            .replace(/####(.*?)/g, "<br/><strong>$1</strong>"); // Add new line and bold for ####

          return { title: title.trim(), content: formattedContent };
        });
        return {
          main_heading: mainHeading.replace("## ", "").trim(),
          subheadings,
        };
      });
  };

  const data = parseReport(report);

  // Function to download PDF
  const handleDownloadPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    let y = 10;

    data.forEach((section) => {
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(section.main_heading, 10, y);
      y += 10;

      section.subheadings.forEach((subheading) => {
        if (y > 280) {
          pdf.addPage();
          y = 10;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 255);
        pdf.text(subheading.title, 10, y);
        y += 8;

        const contentLines = pdf.splitTextToSize(
          subheading.content.replace(/<[^>]*>?/gm, ""),
          190
        );
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        contentLines.forEach((line: string) => {
          if (y > 280) {
            pdf.addPage();
            y = 10;
          }
          pdf.text(line, 10, y);
          y += 7;
        });
      });
    });

    pdf.save("report.pdf");
  };

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
      <div className="flex justify-end mt-6">
        <Button
          className=""
          onClick={handleDownloadPDF}
        >
          Download PDF
        </Button>
      </div>
    </TooltipProvider>
  );
};

export default DynamicContent;
