import { Suspense, lazy } from 'react';
const ChecklistSelector = lazy(() => import('./DueDiligenceChecklist'));

export default function DiligencePage() {
  return (
    <div className="p-4 overflow-x-auto">
      <Suspense fallback={<p>Loading...</p>}>
        <ChecklistSelector />
      </Suspense>
    </div>
  );
}