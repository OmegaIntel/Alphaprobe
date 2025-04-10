import React, { useState, useRef } from 'react';
import DocumentPDF from '../PDFViewer/PDFViewer';
import { CircleX, EllipsisVertical, FileText, FileSpreadsheet, Link } from 'lucide-react';

export type Citation = {
  type: string;
  // Excel citations
  file_name?: string;
  sheet?: string;
  row?: number;
  col?: string; // Changed from number to string to match your Python code
  value?: string;
  // Kb citations
  chunk_text?: string;
  page?: number;
  url?: string;
  // Web citations
  title?: string;
  snippet?: string;
};

interface CitationSidebarProps {
  citations: Citation[];
  onClose: () => void;
}

const CitationSidebar: React.FC<CitationSidebarProps> = ({ citations, onClose }) => {
  const [expandedDocs, setExpandedDocs] = useState<{ [key: number]: boolean }>({});
  const [width, setWidth] = useState<number>(400);
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

  const renderCitation = (citation: Citation, index: number) => {
    switch (citation.type) {
      case 'web':
        return (
          <div className="flex items-start gap-2">
            <Link className="w-4 h-4 mt-1 text-blue-500" />
            <div>
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                {citation.title || 'Web Source'}
              </a>
              {citation.snippet && (
                <p className="text-sm text-gray-600 mt-1">{citation.snippet}</p>
              )}
            </div>
          </div>
        );

      case 'excel':
        return (
          <div className="flex items-start gap-2">
            <FileSpreadsheet className="w-4 h-4 mt-1 text-green-500" />
            <div>
              <div className="font-medium">
                {citation.file_name || 'Excel Data'}
                {citation.sheet && ` (Sheet: ${citation.sheet})`}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {citation.row && citation.col && (
                  <span>Cell: {citation.col.toUpperCase()}{citation.row}</span>
                )}
                {citation.value && (
                  <span className="ml-2">Value: {citation.value}</span>
                )}
              </div>
            </div>
          </div>
        );

      case 'kb':
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-1 text-purple-500" />
              <div>
                <div className="font-medium">
                  {citation.file_name || 'Document'}
                  {citation.page && ` (Page ${citation.page})`}
                </div>
                {citation.chunk_text && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {citation.chunk_text}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => toggleDocumentPreview(index)}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 ml-6"
            >
              {expandedDocs[index] ? 'Hide Document' : 'View Document'}
            </button>
            {expandedDocs[index] && citation.url && (
              <div className="mt-2 ml-6">
                <DocumentPDF
                  pdfUrl={citation.url}
                  heading={citation.file_name || 'Document'}
                  highlightText={citation.chunk_text}
                  pageNumber={citation.page}
                />
              </div>
            )}
          </div>
        );

      default:
        return <div className="text-sm text-gray-500">Unknown citation type</div>;
    }
  };

  return (
    <div
      ref={sidebarRef}
      style={{ width }}
      className="fixed top-0 right-0 h-full bg-white shadow-lg overflow-y-auto z-50 text-left border-l"
    >
      <div
        onMouseDown={handleMouseDown}
        className="fixed top-1/2 transform -translate-y-1/2 right-[400px] w-3 h-11 flex items-center justify-center cursor-ew-resize z-50"
        style={{ left: `calc(100vw - ${width}px)` }}
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
          <ul className="space-y-6">
            {citations.map((citation, index) => (
              <li key={index} className="border-b pb-4 last:border-b-0">
                {renderCitation(citation, index)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No citations available.</p>
        )}
      </div>
    </div>
  );
};

export default CitationSidebar;