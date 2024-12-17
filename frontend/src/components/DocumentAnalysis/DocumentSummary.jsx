import React from 'react'
import ListDocument from './DocumentSummary/ListDocument'
import SummaryPoints from './DocumentSummary/SummaryPoints'
import DocumentPDF from './DocumentSummary/DocumentPDF'


const DocumentSummary = () => {
  return (
    <div className='flex w-full justify-center space-x-2'>
        {/* <ListDocument  /> */}
        <SummaryPoints />
        {/* <DocumentPDF highlightText={"May"} pdfUrl={"/testPDF/test.pdf"} heading={"test"}/> */}
    </div>
  )
}

export default DocumentSummary