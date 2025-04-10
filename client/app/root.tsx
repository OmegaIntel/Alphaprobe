import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  LiveReload,
  useMatches,
  useNavigate,
  useLocation,
} from '@remix-run/react';
import { useEffect } from 'react';
import type { LinksFunction } from '@remix-run/node';
import './tailwind.css';
import Layout from './Layout';
import { useAuth } from '~/hooks/useAuth';

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

// Main App Component
export default function App() {
  const matches = useMatches();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isAuthPage = matches.some(
    (match) => match.pathname === '/login' || match.pathname === '/register'
  );

  useEffect(() => {
    // Add a small delay to ensure routes are registered
    const checkAuthTimeout = setTimeout(() => {
      // Check if user is authenticated and not on an auth page
      if (!isAuthenticated() && !isAuthPage) {
        // Redirect to login with the return URL
        // console.log('Redirecting to login, pathname:', location.pathname);
        navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`, { replace: true });
      }
    }, 50); // A small delay of 50ms
    
    return () => clearTimeout(checkAuthTimeout);
  }, [isAuthenticated, isAuthPage, navigate, location.pathname]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Alphaprobe</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {isAuthPage ? (
          <Outlet />
        ) : (
          <Layout>
            <Outlet />
          </Layout>
        )}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}