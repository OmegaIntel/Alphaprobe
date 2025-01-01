import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';
import { getSession } from '~/utils/session.server';

export const meta: MetaFunction = () => [
  { title: 'Dashboard | MyApp' },
  { name: 'description', content: 'Your personalized dashboard.' },
];

// Loader to fetch data or check authentication
export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');

  if (!token) {
    return redirect('/login');
  }

  // Simulate fetching user data (replace with your actual API call)
  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
  };

  return json({ user: userData });
};

// Default view for `/dashboard`
export default function DashboardIndex() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
      <p className="text-gray-600 mt-2">Your email: {user.email}</p>
      <div className="mt-6">
        <a
          href="/dashboard/settings"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Settings
        </a>
      </div>
    </div>
  );
}
