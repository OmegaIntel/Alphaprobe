import { useEffect, useState, useRef } from 'react';
import { remark } from 'remark';
import html from 'remark-html';
import { Compatible } from 'vfile';
import './styles/markdown.css';
import gfm from 'remark-gfm';
import { Copy, FileUp } from 'lucide-react';
import CitationSidebar from './CitationSidebar';
import { generatePDF } from './reportUtils';

type Citation = {
  type: string;
  // Excel citations
  file_name?: string;
  sheet?: string;
  row?: number;
  col?: number;
  value?: string;
  // Kb citations
  chunk_text?: string;
  page?: number;
  url?: string;
  // Web citations
  title?: string;
  snippet?: string;
};

export default function GeneratedResponse({
  citations,
  response,
  researchType,
}: {
  citations: Citation[];
  response: string; 
  researchType: string;
}) {
  const [htmlContent, setHtmlContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentCitations, setCurrentCitations] = useState<any[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  async function markdownToHtml(markdown: Compatible | undefined) {
    try {
      const result = await remark().use(gfm).use(html).process(markdown);
      return result.toString();
    } catch (error) {
      console.error('Error converting Markdown to HTML:', error);
      return '';
    }
  }

  useEffect(() => {
    async function processContent() {
      // Convert the report text (from the response) to HTML.
      if (response) {
        const convertedHtml = await markdownToHtml(response);
        setHtmlContent(convertedHtml);
      }
      // Aggregate citation from the citations.
      let aggregatedCitations: Citation[] = [];
      if (citations && Array.isArray(citations)) {
        citations.forEach((citation) => {
          if (citation) {
            const formattedCitation: Citation = {
              type: citation.type,
              // Common fields
              file_name: citation.file_name || undefined,
              url: citation.url || undefined,
              // Knowledge base specific
              chunk_text: citation.chunk_text || undefined,
              page: citation.page || undefined,
              // Web specific
              title: citation.title || undefined,
              snippet: citation.snippet || undefined,
              // Excel specific
              sheet: citation.sheet || undefined,
              row: citation.row || undefined,
              col: citation.col || undefined,
              value: citation.value || undefined
            };
            aggregatedCitations.push(formattedCitation);
          }
        });
      }
      setCurrentCitations(aggregatedCitations);
    }
    processContent();
  }, [response, citations]);

  return (
    <div className="container flex h-auto w-full shrink-0 gap-4 rounded-lg border border-solid border-gray-200 p-5">
      <div className="w-full">
        <div className="flex items-center justify-between pb-3">
          {response && (
            <div className="flex items-center gap-3">
              <button
                className="p-1 rounded bg-gray-200 text-sm font-medium items-center"
                onClick={() => {
                  navigator.clipboard.writeText(htmlContent);
                }}
              >
                <Copy className="w-4 h-4 text-indigo-600" />
              </button>
              <button
                className="p-1 rounded bg-gray-200 text-sm font-medium items-center"
                onClick={async () => {
                  if (contentRef.current) {
                    await generatePDF('new_report', contentRef);
                  }
                }}
              >
                <FileUp className="w-4 h-4 text-indigo-600" />
              </button>
              {currentCitations.length > 0 && (
                <button
                  className="p-1 rounded bg-gray-200 text-sm font-medium items-center"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  View Sources
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap content-center items-center gap-[15px] pl-10 pr-10">
          <div
            ref={contentRef}
            className="w-full whitespace-pre-wrap text-base font-light leading-[152.5%] text-gray-600 log-message"
          >
            {htmlContent ? (
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            ) : (
              <div className="flex w-full flex-col gap-2">
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
                <div className="h-6 w-full animate-pulse rounded-md bg-gray-300" />
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <CitationSidebar
              citations={currentCitations}
              onClose={() => setIsSidebarOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
