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
  
      const htmlContent = await response.text();
  
      // Create container for content
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '1600px';
      tempDiv.style.padding = '40px';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
  
      // Add the content
      tempDiv.innerHTML = htmlContent;
  
      // Function to load scripts with proper error handling
      const loadScript = (url) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = url;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };
  
      // Load all required scripts in parallel
      await Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/chart.js@3.7.0/dist/chart.min.js')
      ]);
  
      // Initialize chart after scripts are loaded
      const revenueCanvas = tempDiv.querySelector('#revenueChart');
      if (revenueCanvas) {
        revenueCanvas.style.width = '800px';
        revenueCanvas.style.height = '400px';
        revenueCanvas.style.margin = '20px auto';
        revenueCanvas.style.backgroundColor = '#ffffff';
        
        const ctx = revenueCanvas.getContext('2d');
        await new Promise((resolve) => {
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['2021', '2022', '2023'],
              datasets: [{
                label: 'Revenue',
                data: [1000000, 1200000, 1500000],
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgba(41, 128, 185, 1)',
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 0 // Disable animations for PDF
              },
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  labels: {
                    font: { size: 14, weight: 'bold' },
                    color: '#2C3E50',
                    padding: 20
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => '$' + value.toLocaleString(),
                    font: { size: 12, weight: 'bold' }
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                  }
                },
                x: {
                  ticks: {
                    font: { size: 12, weight: 'bold' }
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                  }
                }
              }
            }
          });
          // Wait for chart render
          setTimeout(resolve, 1000);
        });
      }
  
      // Function to remove empty space
      const removeEmptySpace = (element) => {
        const children = element.children;
        for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i];
          if (child.innerHTML === '' || child.innerHTML === '&nbsp;') {
            child.remove();
          } else {
            removeEmptySpace(child);
          }
        }
      };
  
      // Remove empty space
      removeEmptySpace(tempDiv);
  
      // Create PDF in landscape
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
  
      const contentWidth = tempDiv.offsetWidth;
      const contentHeight = tempDiv.offsetHeight;
      
      // Calculate page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      // Calculate content scaling
      const scale = (pageWidth - 2 * margin) / contentWidth;
      const scaledHeight = contentHeight * scale;
      
      // Calculate number of pages needed
      const totalPages = Math.ceil(scaledHeight / (pageHeight - 2 * margin));
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
  
        const yOffset = i * (pageHeight - 2 * margin) / scale;
        
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: contentWidth,
          height: Math.min(contentHeight - yOffset, (pageHeight - 2 * margin) / scale),
          y: yOffset,
          backgroundColor: '#ffffff',
          onclone: (document, element) => {
            removeEmptySpace(element);
          }
        });
  
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        pdf.addImage(
          imgData,
          'JPEG',
          margin,
          margin,
          pageWidth - 2 * margin,
          Math.min(scaledHeight - i * (pageHeight - 2 * margin), pageHeight - 2 * margin),
          '',
          'FAST'
        );
      }
  
      // Clean up
      document.body.removeChild(tempDiv);
  
      // Save PDF
      pdf.save(`${fileName}.pdf`);
  
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
      <table className="border-collapse  border-spacing-4 w-full" {...props}>
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
