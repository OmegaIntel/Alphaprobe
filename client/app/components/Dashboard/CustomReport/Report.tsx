import React, { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { TooltipProvider } from "~/components/ui/tooltip";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "~/hooks/use-toast";
import { API_BASE_URL } from "~/constant";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  defaultFileName?: string;
}

const sanitizeReport = (report: string): string => {
  let sanitized = report.replace(/\r/g, "");
  sanitized = sanitized.replace(/\*{3,}/g, "**");
  sanitized = sanitized.replace(/\n\s*\n\s*\n+/g, "\n\n");
  return sanitized.trim();
};

const DynamicContent: React.FC<DynamicContentProps> = ({ 
  report, 
  defaultFileName = "Report" 
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileName, setFileName] = useState(defaultFileName);

  const parseReport = (rawReport: string): Section[] => {
    const cleanedReport = sanitizeReport(rawReport);

    if (!cleanedReport.includes("## ")) {
      return [
        {
          main_heading: "Report",
          subheadings: [
            {
              title: "Details",
              content: cleanedReport,
            },
          ],
        },
      ];
    }

    return cleanedReport
      .split("\n\n## ")
      .filter((section) => section.trim())
      .map((section) => {
        const normalizedSection = section.replace(/^##\s*/, "");
        const [mainHeading, ...subsections] = normalizedSection.split("\n### ");

        const subheadings = subsections.map((subsection) => {
          const [title, ...contentLines] = subsection.split("\n");
          return {
            title: title.trim(),
            content: contentLines.join("\n"),
          };
        });

        if (subheadings.length === 0) {
          return {
            main_heading: mainHeading.trim(),
            subheadings: [
              {
                title: "Details",
                content: mainHeading,
              },
            ],
          };
        }

        return {
          main_heading: mainHeading.trim(),
          subheadings,
        };
      });
  };

  const data = parseReport(report);

  const getReportMetadata = () => {
    const firstSection = data[0];
    return {
      title: firstSection?.main_heading || "Generated Report",
      sub_title: firstSection?.subheadings[0]?.title || "Analysis Details"
    };
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const { title, sub_title } = getReportMetadata();
      
      const response = await fetch(`${API_BASE_URL}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: report,
          title,
          sub_title,
          theme: "professional"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the HTML content from the backend
      const htmlContent = await response.text();

      // Open a new window and write the HTML content into it.
      const newWindow = window.open("", "_blank");
      if (!newWindow) {
        throw new Error("Could not open new window");
      }
      newWindow.document.open();
      newWindow.document.write(htmlContent);
      newWindow.document.close();

      // Wait until the new window is fully loaded and allow extra time for external scripts/charts.
      await new Promise((resolve) => {
        newWindow.onload = () => {
          // Wait an extra 2000ms for Chart.js and other scripts to finish rendering
          setTimeout(resolve, 2000);
        };
      });

      // Use html2canvas on the new window's body with a scale of 10.
      const canvas = await html2canvas(newWindow.document.body, { scale: 10 });
      const imgData = canvas.toDataURL("image/png");

      // Create a new PDF document using jsPDF.
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Add a 10mm margin on all sides.
      const margin = 10; // 10 mm margin
      const contentWidth = pdfWidth - 2 * margin;
      
      // Get image properties to calculate the aspect ratio and dimensions.
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = contentWidth;
      const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

      // Add the image to the PDF document with margins.
      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);

      // Trigger the download of the PDF file.
      pdf.save(`${fileName}.pdf`);

      // Close the temporary window.
      newWindow.close();

      toast({
        title: "Success",
        description: "PDF generated and downloaded successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const customComponents = {
    table: ({ node, children, ...props }: any) => (
      <table className="border-collapse border-separate border-spacing-4 w-full" {...props}>
        {children}
      </table>
    ),
    th: ({ node, children, ...props }: any) => (
      <th className="border px-2 py-1 bg-gray-800 text-gray-100" {...props}>
        {children}
      </th>
    ),
    td: ({ node, children, ...props }: any) => (
      <td className="border px-2 py-1" {...props}>
        {children}
      </td>
    ),
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline ? (
        <pre className={`rounded bg-gray-800 p-4 overflow-x-auto ${match ? `language-${match[1]}` : ""}`} {...props}>
          <code>{children}</code>
        </pre>
      ) : (
        <code className="bg-gray-200 p-1 rounded" {...props}>
          {children}
        </code>
      );
    },
  };

  const renderSubheadingContent = (content: string) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
      {content}
    </ReactMarkdown>
  );

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {data.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="space-y-4">
            <CardContent>
              <h2 className="text-xl font-bold mb-4">
                {section.main_heading}
              </h2>
              <div className="space-y-4">
                {section.subheadings.map((subheading, subheadingIndex) => (
                  <div key={subheadingIndex} className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {subheading.title}
                    </h3>
                    <div className="text-gray-200">
                      {renderSubheadingContent(subheading.content)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isGenerating && (
        <div className="mt-4 flex justify-center items-center space-x-2">
          <span className="animate-spin text-2xl">⚪</span>
          <span className="text-lg font-medium">Your PDF is being generated. Please wait...</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-4 mt-6">
        <div className="flex-1 max-w-xs">
          <Label htmlFor="filename" className="text-sm text-gray-500">
            Filename (optional)
          </Label>
          <Input
            id="filename"
            type="text"
            placeholder="Enter filename"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <Button 
          onClick={handleGeneratePDF} 
          disabled={isGenerating}
          className="relative"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin mr-2">⚪</span>
              Generating PDF...
            </>
          ) : (
            'Generate PDF'
          )}
        </Button>
      </div>
    </TooltipProvider>
  );
};

export default DynamicContent;
