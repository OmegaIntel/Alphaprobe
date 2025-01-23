import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import type { LinksFunction } from '@remix-run/node';

import './tailwind.css';
import { Provider } from 'react-redux';
import store from './store/store';
import type { LoaderFunctionArgs } from '@remix-run/node';
import amplitudeJs from 'amplitude-js'; // Correct import for CommonJS module

export async function loader({ request }: LoaderFunctionArgs) {
  return new Response(JSON.stringify({
    ENV: {
      REMIX_API_BASE_URL: process.env.REMIX_API_BASE_URL,
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

// Initialize Amplitude
const amplitude = amplitudeJs.getInstance();
amplitude.init('b07260e647c7c3cc3c25aac93aa17db8', undefined, {
  batchEvents: true,
  eventUploadPeriodMillis: 30000,
});

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <title>Alphaprobe</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <Provider store={store}>
        <Layout>
          <Outlet />
        </Layout>
      </Provider>
    </>
  );
}
