import React from "react";
import { Worker, Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { searchPlugin } from "@react-pdf-viewer/search";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { useSelector } from "react-redux";
import { RootState } from "~/store/store"; // Adjust the import based on your store setup

// Define props for the component
interface DocumentPDFProps {
  pdfUrl: string;
  highlightText?: string;
  heading?: string;
  pageNumber?: number;
}

const DocumentPDF: React.FC<DocumentPDFProps> = ({
  pdfUrl,
  highlightText,
  heading,
  pageNumber,
}) => {
  // Type the Redux selector
  const documentSummaryResponse = useSelector(
    (state: RootState) => state.documentSearchResults
  );

  console.log("DocumentSummaryResponse", documentSummaryResponse);
//   const agentResponse = documentSummaryResponse?.agent_response;
//   console.log("AgentResponse", agentResponse);

  // Initialize plugins
  const searchPluginInstance = searchPlugin();
  const zoomPluginInstance = zoomPlugin();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="h-screen overflow-auto p-4">
      <div className="flex justify-between items-center mb-4">
        {heading && <h2 className="text-xl font-bold">{heading}</h2>}
      </div>

      <div className="border h-full">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.9.179/build/pdf.worker.min.js">
          <Viewer
            fileUrl={pdfUrl}
            plugins={[
              searchPluginInstance,
              zoomPluginInstance,
              defaultLayoutPluginInstance,
            ]}
            defaultScale={SpecialZoomLevel.PageWidth}
            initialPage={pageNumber ? pageNumber - 1 : 0} // Subtract 1 because page numbers are zero-indexed in many PDF systems
          />
        </Worker>
      </div>
    </div>
  );
};

export default DocumentPDF;
