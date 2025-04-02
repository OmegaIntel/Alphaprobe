import { useEffect, useState } from 'react';
import { remark } from 'remark';
import html from 'remark-html';
import { Compatible } from 'vfile';
import './styles/markdown.css';
import gfm from 'remark-gfm';
import { Copy } from 'lucide-react';
import CitationSidebar from './CitationSidebar';

type Section = {
  name: string;
  description: string;
  research: boolean;
  content: string;
  citations: any[];
};

export default function GeneratedResponse({ sections }: { sections: Section[] }) {
  // Process each section's markdown content into HTML
  const [htmlSections, setHtmlSections] = useState<(Section & { htmlContent: string })[]>([]);

  // Sidebar state: track if the sidebar is open and store the citations for the clicked section
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentCitations, setCurrentCitations] = useState<any[]>([]);

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
    async function processSections() {
      if (!sections || !Array.isArray(sections)) return;
      const processed = await Promise.all(
        sections.map(async (section) => {
          const htmlContent = await markdownToHtml(section.content);
          return {
            ...section,
            htmlContent,
          };
        })
      );
      setHtmlSections(processed);
    }
    processSections();
  }, [sections]);

  return (
    <div className="container flex h-auto w-full shrink-0 gap-4 rounded-lg border border-solid border-gray-200 p-5">
      <div className="w-full">
        <div className="flex items-center justify-between pb-3">
          {sections && (
            <div className="flex items-center gap-3">
              <button
                className="p-1 rounded bg-gray-200 text-sm font-medium items-center"
                onClick={() => {
                  // Join all the sections' content with two newlines between each
                  const joinedText = htmlSections
                    .map((section) => section.htmlContent)
                    .join("\n\n");
                  navigator.clipboard.writeText(joinedText);
                }}
              >
                <Copy className="w-4 h-4 text-indigo-600" />
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap content-center items-center gap-[15px] pl-10 pr-10">
          <div className="w-full whitespace-pre-wrap text-base font-light leading-[152.5%] text-gray-600 log-message">
            {htmlSections.length > 0 ? (
              htmlSections.map((section, index) => (
                <div key={index} className="section-wrapper mb-6">
                  {/* Render the converted markdown content */}
                  <div className="markdown-content" dangerouslySetInnerHTML={{ __html: section.htmlContent }} />
                  {/* Only show the "Click to view sources" link if there are citations */}
                  {section.citations && section.citations.length > 0 && (
                    <a
                      href="#"
                      className="source-link text-blue-500 text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentCitations(section.citations);
                        setIsSidebarOpen(true);
                      }}
                    >
                      Click to view sources
                    </a>
                  )}
                </div>
              ))
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
