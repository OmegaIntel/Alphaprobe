import { Suspense, lazy } from 'react';
import PageHeader from '../WorkflowPageHeader';
import ChecklistSelector from './DueDiligenceChecklist';

export default function DiligencePage() {
  return (
    <div className="p-4 overflow-x-auto">
      <Suspense fallback={<p>Loading...</p>}>
        <PageHeader heading='Due Diligence' description='Choose between an industry standard checklist or your own custom checklist'/>
        <ChecklistSelector />
      </Suspense>
    </div>
  );
}
