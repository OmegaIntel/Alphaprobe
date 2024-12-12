import React, { useState } from "react";
import { useSelector } from "react-redux";
import SearchBar from "./DocumentSummary/DocumentAnalysis/SearchBar";

const DocumentAnalysis = () => {
  const searchResults = useSelector(state => state.documentSearchResults);
  const [openReferenceIndex, setOpenReferenceIndex] = useState(null);
  const [openChunkIndices, setOpenChunkIndices] = useState({});

  const toggleReference = (index) => {
    if (openReferenceIndex === index) {
      setOpenReferenceIndex(null);
      setOpenChunkIndices({});
    } else {
      setOpenReferenceIndex(index);
      setOpenChunkIndices({});
    }
  };

  const toggleChunk = (referenceIndex, chunkIndex) => {
    const currentChunks = openChunkIndices[referenceIndex] || {};
    const newChunks = {
      ...currentChunks,
      [chunkIndex]: !currentChunks[chunkIndex]
    };
    setOpenChunkIndices({
      ...openChunkIndices,
      [referenceIndex]: newChunks
    });
  };

  return (
    <div className="flex flex-col justify-center items-center w-full py-5 px-10" style={{ maxHeight: '100vh', overflow: 'auto' }}>
      <SearchBar />
      <div className="w-full flex mt-4">
        {searchResults.length > 0 &&
          searchResults.map((searchResult, resultIndex) => (
            <div key={resultIndex} className="bg-stone-800  scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800 rounded-xl p-4 mb-4" style={{ overflowY: 'auto', maxHeight: '80vh' }}>
              <div>
                <div>{searchResult.agent_response}</div>
                <button
                  onClick={() => toggleReference(resultIndex)}
                  className="text-blue-500 hover:underline mt-2"
                >
                  {openReferenceIndex === resultIndex ? "Hide Reference" : "See Reference"}
                </button>
              </div>
              {openReferenceIndex === resultIndex && (
                <div className="bg-stone-900 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800" style={{ maxHeight: '60vh' }}>
                  <ul>
                    {searchResult.metadata_content_pairs.map((item, index) => (
                      <li key={index} className="mb-2 text-white">
                        <div className="font-bold">
                          PDF Name: {item.metadata["x-amz-bedrock-kb-source-uri"].split("/").pop()}
                          <div>Page Number: {item.metadata["x-amz-bedrock-kb-document-page-number"]}</div>
                          <button
                            onClick={() => toggleChunk(resultIndex, index)}
                            className="text-blue-500 hover:underline mt-1"
                          >
                            {openChunkIndices[resultIndex] && openChunkIndices[resultIndex][index] ? "Hide Chunk" : "View Chunk"}
                          </button>
                        </div>
                        {openChunkIndices[resultIndex] && openChunkIndices[resultIndex][index] && (
                          <div className="mt-1">
                            <strong>Chunk Content:</strong>
                            <p>{item.chunk_content}</p>
                          </div>
                        )}
                        <a
                          href={item.metadata.presigned_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View PDF
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default DocumentAnalysis;
