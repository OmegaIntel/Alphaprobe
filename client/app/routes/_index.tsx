import { Suspense, lazy } from 'react';
import { NavLink } from '@remix-run/react';
import DocumentPage from '~/components/DocumentPage';
const ReportPage = lazy(() => import('~/components/Report/ReportPage'));
export default function Index() {
  return (
    <div className="p-4 overflow-x-auto">
      {/* <h1 className="text-3xl font-bold mb-4">Welcome to Your AI Application</h1>
      <p className="mb-4">
        This is the main dashboard. From here, you can navigate to different sections of your application using the sidebar.
      </p>
      <div className="flex space-x-4">
        <NavLink to="/profile" className="text-blue-500 hover:underline">Go to Profile</NavLink>
        <NavLink to="/settings" className="text-blue-500 hover:underline">Go to Settings</NavLink>
      </div> */}
      <Suspense fallback={<p>Loading...</p>}>
        <ReportPage />
      </Suspense>

      {/* <DocumentPage /> */}
    </div>
  );
}
