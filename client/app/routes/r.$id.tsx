import { Suspense, lazy } from 'react';

const ReportPage = lazy(() => import('~/components/Report/ReportPage'));
export default function r() {
  return (
    <div className="p-4">
    
      <Suspense fallback={<p>Loading...</p>}>
        <ReportPage />
      </Suspense>

    </div>
  );
}
