import React, { useState, useRef } from 'react';
import DocumentPDF from '../PDFViewer/PDFViewer';
import { CircleX, EllipsisVertical } from 'lucide-react';

export type Citation = {
  query: string;
  title: string;
  sourceUri: string; // For document citations, this is an S3 presigned link or a web URL
  chunk_text: string; // Used as the highlighted text for document citations
  pageNumber?: number; // If defined, indicates a document citation
};

interface CitationSidebarProps {
  citations: Citation[]; // List of citations from the section
  onClose: () => void; // Callback to close the sidebar
}

const CitationSidebar: React.FC<CitationSidebarProps> = ({
  citations,
  onClose,
}) => {
  // Track which document citations are expanded; key is citation index
  const [expandedDocs, setExpandedDocs] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [width, setWidth] = useState<number>(400); // Initial width
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const toggleDocumentPreview = (index: number) => {
    setExpandedDocs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 280 && newWidth < 800) {
      setWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={sidebarRef}
      style={{ width }}
      className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-lg overflow-y-auto z-50 text-left border-l"
    >
      <div
        onMouseDown={handleMouseDown}
        className="fixed top-1/2 transform -translate-y-1/2 right-[400px] w-3 h-11 flex items-center justify-center cursor-ew-resize z-50"
        style={{ left: `calc(100vw - ${width}px)` }} // dynamically places it
      >
        <div className="w-2 h-full bg-gray-50 rounded-md flex flex-col justify-center items-center hover:bg-gray-400 text-gray-400 hover:text-gray-800">
         <EllipsisVertical />
        </div>
      </div>
      {/* Header */}
      <div className="bg-white z-auto top-0 p-4 h-12 border-b flex justify-between items-center sticky">
        <h3 className="font-semibold text-lg">Citations</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-200 text-sm font-medium space-x-2 items-center flex"
        >
          <CircleX className="w-5 h-5" />
        </button>
      </div>

      {/* Citation List */}
      <div className="p-4">
        {citations.length > 0 ? (
          <ul className="space-y-4">
            {citations.map((citation, index) => (
              <li key={index} className="border-b pb-2">
                {citation.pageNumber ? (
                  // Document citation: show title with a toggle button for inline PDF preview.
                  <div>
                    <div className="flex items-center">
                      <span className="text-indigo-500 font-semibold">
                        {citation.title}
                      </span>
                      <button
                        className="text-xs text-green-600 underline"
                        onClick={() => toggleDocumentPreview(index)}
                      >
                        {expandedDocs[index]
                          ? 'Hide Document'
                          : 'View Document'}
                      </button>
                    </div>
                    {expandedDocs[index] && (
                      <div className="mt-2">
                        <DocumentPDF
                          pdfUrl={citation.sourceUri}
                          heading={citation.title}
                          highlightText={citation.chunk_text}
                          pageNumber={citation.pageNumber}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Web citation: simply render as a clickable link.
                  <a
                    href={citation.sourceUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 underline block"
                  >
                    {citation.title}
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No citations available.</p>
        )}
      </div>
    </div>
  );
};

export default CitationSidebar;
