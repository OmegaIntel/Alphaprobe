import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useLoaderData,
} from '@remix-run/react';
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import './tailwind.css';
import { Provider } from 'react-redux';
import store from './store/store';
import './analytics.client';
import { useEffect, useState } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import React from 'react';

const AMPLITUDE_API_KEY = 'b07260e647c7c3cc3c25aac93aa17db8';

// Add proper typing for the loader data
type LoaderData = {
  ENV: {
    REMIX_API_BASE_URL: string;
  };
};

export async function loader({ request }: LoaderFunctionArgs) {
  return new Response(
    JSON.stringify({
      ENV: {
        REMIX_API_BASE_URL: process.env.REMIX_API_BASE_URL,
      },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
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
  const location = useLocation();
  const loaderData = useLoaderData<LoaderData>();
  const [isAmplitudeInitialized, setIsAmplitudeInitialized] = useState(false);

  // Initialize Amplitude
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAmplitudeInitialized) {
      try {
        amplitude.init(AMPLITUDE_API_KEY, {
          defaultTracking: {
            pageViews: true,
            sessions: true,
            formInteractions: true,
            fileDownloads: true,
          },
          logLevel: process.env.NODE_ENV === 'development' ? amplitude.Types.LogLevel.Debug : amplitude.Types.LogLevel.Error,
        });

        // Track the initial app load with more context
        amplitude.track('App Loaded', {
          environment: process.env.NODE_ENV,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        });

        setIsAmplitudeInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Amplitude:', error);
      }
    }
  }, [isAmplitudeInitialized]);

  // Track page views on route changes
  useEffect(() => {
    if (isAmplitudeInitialized) {
      try {
        amplitude.track('Page View', {
          path: location.pathname,
          search: location.search,
          hash: location.hash,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    }
  }, [location, isAmplitudeInitialized]);

  return (
    <Provider store={store}>
      <Layout>
        <Outlet />
      </Layout>
    </Provider>
  );
}

// Optional: Create a custom hook for tracking events
export function useAmplitudeTrack() {
  return React.useCallback((eventName: string, eventProperties?: Record<string, any>) => {
    try {
      amplitude.track(eventName, {
        ...eventProperties,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Failed to track event ${eventName}:`, error);
    }
  }, []);
}