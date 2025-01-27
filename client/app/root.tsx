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
import { useLocation } from '@remix-run/react';
import { useEffect } from 'react';

import React from 'react';
import { API_BASE_URL } from './constant';

// Function to get or generate a device ID
function getDeviceId() {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

// Custom function to send events to your backend with fallback to Amplitude Browser SDK
export async function sendAnalyticsEvent(eventType: string, eventProperties = {}) {
  // Retrieve the user_id (fallback to 'anonymous_user' if not logged in)
  const userId = localStorage.getItem('user_id') || 'anonymous_user';

  // Retrieve the device ID
  const deviceId = getDeviceId();

  try {
    // Attempt to send the event to the backend
    const response = await fetch(`${API_BASE_URL}/api/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        event_properties: eventProperties,
        user_id: userId, // Include user ID dynamically
        device_id: deviceId, // Always include device ID
      }),
    });

    if (!response.ok) {
      console.error(`Backend failed to send event: ${eventType}`, await response.text());
      throw new Error('Backend failed'); // Trigger fallback
    } else {
      console.log(`Event sent to backend: ${eventType}`, await response.json());
    }
  } catch (error) {
    console.error(`Error sending event to backend, falling back to Amplitude: ${eventType}`, error);
  }
}

// Loader function for Remix
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

// Links for Remix
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

// Layout Component
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

// Main App Component
export default function App() {
  const location = useLocation();

  // Track page views on route changes
  useEffect(() => {
    sendAnalyticsEvent('Page View', { path: location.pathname });
  }, [location]);

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
