import React, { useState } from 'react';
import DocumentPDF from '../PDFViewer/PDFViewer';

export type Citation = {
  query: string;
  title: string;
  sourceUri: string;  // For document citations, this is an S3 presigned link or a web URL
  chunk_text: string; // Used as the highlighted text for document citations
  pageNumber?: number; // If defined, indicates a document citation
};

interface CitationSidebarProps {
  citations: Citation[]; // List of citations from the section
  onClose: () => void;   // Callback to close the sidebar
}

const CitationSidebar: React.FC<CitationSidebarProps> = ({ citations, onClose }) => {
  // Track which document citations are expanded; key is citation index
  const [expandedDocs, setExpandedDocs] = useState<{ [key: number]: boolean }>({});

  const toggleDocumentPreview = (index: number) => {
    setExpandedDocs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg overflow-y-auto z-50 text-left">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-lg">Citations</h3>
        <button onClick={onClose} className="text-gray-600">
          Close
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
                      <span className="text-blue-500 font-semibold">
                        {citation.title}
                      </span>
                      <button
                        className="text-xs text-green-600 underline"
                        onClick={() => toggleDocumentPreview(index)}
                      >
                        {expandedDocs[index] ? 'Hide Document' : 'View Document'}
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
                    className="text-blue-500 underline block"
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
