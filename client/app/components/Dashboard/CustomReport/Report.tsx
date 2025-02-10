import React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { TooltipProvider } from "~/components/ui/tooltip";
import jsPDF from "jspdf";
import { Button } from "~/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Subheading {
  title: string;
  content: string; // raw (sanitized) markdown
}

interface Section {
  main_heading: string;
  subheadings: Subheading[];
}

interface DynamicContentProps {
  report: string;
}

// 1. A basic cleanup for triple asterisks and extra blank lines
const sanitizeReport = (report: string): string => {
  let sanitized = report.replace(/\r/g, "");
  sanitized = sanitized.replace(/\*{3,}/g, "**");
  sanitized = sanitized.replace(/\n\s*\n\s*\n+/g, "\n\n");
  return sanitized.trim();
};

const DynamicContent: React.FC<DynamicContentProps> = ({ report }) => {
  // 2. Split into sections based on "##" and "###" headings
  const parseReport = (rawReport: string): Section[] => {
    const cleanedReport = sanitizeReport(rawReport);

    if (!cleanedReport.includes("## ")) {
      // If no "##" headings found, just put entire content in a single subheading
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
        // Remove leading "##" from the heading
        const normalizedSection = section.replace(/^##\s*/, "");
        // Now split by "###" to get subheadings
        const [mainHeading, ...subsections] = normalizedSection.split("\n### ");

        const subheadings = subsections.map((subsection) => {
          const [title, ...contentLines] = subsection.split("\n");
          return {
            title: title.trim(),
            content: contentLines.join("\n"),
          };
        });

        if (subheadings.length === 0) {
          // If no subheadings, treat the entire section as content under "Details"
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

  // 3. Convert each subheading to plain text when exporting PDF (same as before)
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

        const plainText = subheading.content.replace(/<[^>]*>/g, "");
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        const contentLines = pdf.splitTextToSize(plainText, 190);

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

  // 4. Custom ReactMarkdown renderers for tables, code, etc.
  const customComponents = {
    table: ({ node, children, ...props }: any) => (
      <table
        className="border-collapse border-separate border-spacing-4 w-full"
        {...props}
      >
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
      // If there's a language indicated, we can parse it from className
      const match = /language-(\w+)/.exec(className || "");
      return !inline ? (
        <pre
          className={`rounded bg-gray-800 p-4 overflow-x-auto ${
            match ? `language-${match[1]}` : ""
          }`}
          {...props}
        >
          <code>{children}</code>
        </pre>
      ) : (
        <code className="bg-gray-200 p-1 rounded" {...props}>
          {children}
        </code>
      );
    },
  };

  // 5. Render the subheading content with ReactMarkdown + remarkGfm
  const renderSubheadingContent = (content: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={customComponents}
    >
      {content}
    </ReactMarkdown>
  );

  return (
    <TooltipProvider>
      {/* Container for the entire report */}
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

      {/* Download PDF button */}
      <div className="flex justify-end mt-6">
        <Button onClick={handleDownloadPDF}>
          Download PDF
        </Button>
      </div>
    </TooltipProvider>
  );
};

export default DynamicContent;
