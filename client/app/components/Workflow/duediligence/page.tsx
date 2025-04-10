import React from 'react'
import PageHeader from '../WorkflowPageHeader'
import ChecklistSelector from './DueDiligenceChecklist'

const DueDiligencePage = () => {
  return (
    <div>
        <PageHeader description='Get ready for rapid insights and comprehensive research' heading='Due Diligence'/>
        <div className='px-24'>

        <ChecklistSelector />
        </div>
    </div>
  )
}

export default DueDiligencePage