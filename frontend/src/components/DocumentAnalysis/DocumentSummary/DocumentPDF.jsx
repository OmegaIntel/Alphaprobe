import React, { useEffect, useState } from "react";
import { Document, Page } from "@react-pdf/renderer";
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Search, ZoomIn, ZoomOut, Download, Type } from "lucide-react";

const DocumentPDF = ({ pdfUrl, highlightText, heading }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
//   const [pdfData, setPdfData] = useState(null)


//   useEffect(() => {
//     const fetchPDF = async () => {
//         try {
//             const response = await fetch(pdfUrl);
//             const blob = await response.blob();
//             const url = URL.createObjectURL(blob);
//             setPdfData(url); // Assume setPdfData sets state that holds this Blob URL
//         } catch (error) {
//             console.error("Error fetching PDF:", error);
//             setError("Failed to load PDF");
//         }
//     };

//     fetchPDF();
// }, [pdfUrl]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error("PDF load error:", error);
    setError("Failed to load PDF. Please check the URL and try again.");
  };

  const zoomIn = () => setScale(Math.min(scale + 0.25, 2));
  const zoomOut = () => setScale(Math.max(scale - 0.25, 0.5));

  const downloadPDF = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "document.pdf";
    link.click();
  };

  return (
    <div className="bg-red-300 max-w-2/5 mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        {heading && (
          <div className="flex items-center mb-4">
            <Type className="mr-2" />
            <h2 className="text-xl font-bold">{heading}</h2>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <button onClick={zoomOut} className="p-2 hover:bg-gray-100 rounded">
            <ZoomOut />
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-2 hover:bg-gray-100 rounded">
            <ZoomIn />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search PDF"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded text-stone-900"
          />
          <button onClick={() => {}} className="p-2 hover:bg-gray-100 rounded">
            <Search />
          </button>
        </div>

        <button onClick={downloadPDF} className="p-2 hover:bg-gray-100 rounded">
          <Download />
        </button>
      </div>

      {error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <Document
          file={"/dd12-13_0.pdf"}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          options={{
            workerSrc: "/pdf.worker.min.js",
          }}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderAnnotationLayer={false}
            renderTextLayer={true}
          />
        </Document>
      )}

      {numPages && (
        <div className="flex justify-center mt-4 space-x-2">
          <button
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(pageNumber - 1)}
            className="p-2 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {pageNumber} of {numPages}
          </span>
          <button
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber(pageNumber + 1)}
            className="p-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentPDF;
