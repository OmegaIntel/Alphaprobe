import React, { useState } from 'react';
import DocumentPDF from '../DocumentPDF'; // Correct path based on your project structure

const Sidebar = ({ isOpen, onClose, data }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [showPDF, setShowPDF] = useState(false);

  const toggleRow = (index) => {
    if (expandedRow === index) {
      setExpandedRow(null);
      setShowPDF(false);
    } else {
      setExpandedRow(index);
      setShowPDF(false);
    }
  };

  const handlePDFToggle = () => {
    setShowPDF(!showPDF);
  };

  return (
    <div className={`fixed right-0 top-0 w-[30%] h-full bg-stone-900 p-4 shadow-lg transform scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800 transition-transform duration-300 ${isOpen ? 'translate-x-0 ' : 'translate-x-full'}`}>
      <button onClick={onClose} className="text-red-500 absolute top-4 right-4">
        Close
      </button>
      <h2 className="text-xl font-bold mb-4">References</h2>
      <div className="overflow-auto h-[calc(100vh-100px)] scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800">
        <table className="w-full text-white">
          <thead>
            <tr>
              <th className="px-4 py-2">Page No.</th>
              <th className="px-4 py-2">Report</th>
              <th className="px-4 py-2">Expand</th>
            </tr>
          </thead>
          <tbody className='text-sm'>
            {data.map((item, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td className="border px-4 py-2">{item.metadata['x-amz-bedrock-kb-document-page-number']}</td>
                  <td className="border px-4 py-2 cursor-pointer" onClick={() => toggleRow(index)}>{item.metadata['x-amz-bedrock-kb-source-uri'].split('/').pop()}</td>
                  <td className="border px-4 py-2 text-center cursor-pointer" onClick={() => toggleRow(index)}>{expandedRow === index ? '-' : '+'}</td>
                </tr>
                {expandedRow === index && (
                  <tr>
                    <td className="border px-4 py-2" colSpan="3">
                      <div className="flex justify-between items-center text-sm text-gray-300">
                        <div>Page: {item.metadata['x-amz-bedrock-kb-document-page-number']}</div>
                        <button onClick={handlePDFToggle} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded">
                          {showPDF ? 'View Chunk' : 'Open in PDF'}
                        </button>
                      </div>
                      {showPDF ? (
                        <div className='mt-3 scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800'>
                          <DocumentPDF
                            pdfUrl={item.metadata.presigned_url}
                            highlightText="" // Any specific text to highlight
                            heading="View Document" // Or any dynamic heading
                          />
                        </div>
                      ) : (
                        <div className="mt-2 overflow-auto scrollbar-thin scrollbar-thumb-gray-950 scrollbar-track-gray-800" style={{ maxHeight: '310px' }}>{item.chunk_content}</div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sidebar;
