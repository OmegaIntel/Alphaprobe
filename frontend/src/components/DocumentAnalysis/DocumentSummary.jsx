import React from 'react'
import ListDocument from './DocumentSummary/ListDocument'
import SummaryPoints from './DocumentSummary/SummaryPoints'
import DocumentPDF from './DocumentSummary/DocumentPDF'

const DocumentSummary = () => {
  return (
    <div className='flex w-full space-x-2'>
        <ListDocument heading={"something"} date={"12/14/2000"} score={"2"} type={"Financial"} />
        <SummaryPoints />
        <DocumentPDF highlightText={"Dummy"} pdfUrl={""} heading={"Dummy"}/>
    </div>
  )
}

export default DocumentSummary