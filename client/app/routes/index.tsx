// import type { MetaFunction } from "@remix-run/node";

// export const meta: MetaFunction = () => {
//   return [
//     { title: "New Remix App" },
//     { name: "description", content: "Welcome to Remix!" },
//   ];
// };

// export default function Index() {
//   return (
//    <div>
//     Page
//    </div>
//   );
// }

import { redirect } from '@remix-run/node';
import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/node';
import { getSession } from '~/utils/session.server';

export const meta: MetaFunction = () => [
  { title: 'Welcome to Remix App' },
  { name: 'description', content: 'Welcome to Remix!' },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');

  // Redirect to the appropriate page based on authentication state
  return redirect(token ? '/dashboard' : '/login');
}

export default function Index() {
  // This component will not render as the loader will always redirect.
  return (
    <div>
      <p>If you see this, something went wrong with redirection.</p>
    </div>
  );
}
