import React, { useState, useEffect } from "react";
import { Worker } from "@react-pdf-viewer/core";
import { Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { searchPlugin } from "@react-pdf-viewer/search";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout"; // For scrolling and better layout
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const DocumentPDF = ({ pdfUrl, highlightText, heading }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rotation, setRotation] = useState(0); // For rotating pages

  // Initialize plugins
  const searchPluginInstance = searchPlugin();
  const { Search } = searchPluginInstance;

  const zoomPluginInstance = zoomPlugin();
  const { ZoomInButton, ZoomOutButton, CurrentScale } = zoomPluginInstance;

  const defaultLayoutPluginInstance = defaultLayoutPlugin(); // For enabling scrolling

  // Automatically highlight text if `highlightText` is provided
  useEffect(() => {
    if (highlightText) {
      setSearchTerm(highlightText);
    }
  }, [highlightText]);

  return (
    <div className="h-screen w-2/5 p-4">
      {/* Header with Controls */}
      <div className="flex justify-between items-center mb-4">
        {heading && <h2 className="text-xl font-bold">{heading}</h2>}
        {/* <div className="flex items-center space-x-2">
       
          <ZoomOutButton />
          <CurrentScale />
          <ZoomInButton />
        </div>
        <div className="flex items-center space-x-2">
        
          <button
            onClick={() => {
              const link = document.createElement("a");
              link.href = pdfUrl;
              link.download = "document.pdf";
              link.click();
            }}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download PDF
          </button>
        </div> */}
      </div>

      {/* Custom Search Control */}
      {/* <div className="mb-4">
        <Search>
          {({
            keyword,
            setKeyword,
            search,
            clearKeyword,
            currentMatch,
            jumpToNextMatch,
            jumpToPreviousMatch,
            matchCase,
            wholeWords,
            changeMatchCase,
            changeWholeWords,
          }) => (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search PDF"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="border p-2 rounded"
                />
                <button
                  onClick={search}
                  className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Search
                </button>
                <button
                  onClick={clearKeyword}
                  className="p-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={jumpToPreviousMatch}
                  className="p-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Previous
                </button>
                <span>
                  Match: {currentMatch ? currentMatch.matchIndex + 1 : 0}/
                  {currentMatch ? currentMatch.totalMatches : 0}
                </span>
                <button
                  onClick={jumpToNextMatch}
                  className="p-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Next
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <label>
                  <input
                    type="checkbox"
                    checked={matchCase}
                    onChange={(e) => changeMatchCase(e.target.checked)}
                  />
                  Match Case
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={wholeWords}
                    onChange={(e) => changeWholeWords(e.target.checked)}
                  />
                  Whole Words
                </label>
              </div>
            </div>
          )}
        </Search>
      </div> */}

      {/* PDF Viewer */}
      <div className="border h-full">
        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.9.179/build/pdf.worker.min.js`}>
          <Viewer
            fileUrl={pdfUrl}
            plugins={[
              searchPluginInstance,
              zoomPluginInstance,
              defaultLayoutPluginInstance,
            ]}
            defaultScale={SpecialZoomLevel.PageWidth}
            rotation={rotation}
          />
        </Worker>
      </div>
    </div>
  );
};

export default DocumentPDF;
