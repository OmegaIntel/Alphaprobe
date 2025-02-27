import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  LiveReload,
  useMatches,
} from '@remix-run/react';
import type { LinksFunction } from '@remix-run/node';
import './tailwind.css';
import Layout from './Layout';

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
  const isAuthPage = matches.some(
    (match) => match.pathname === '/login' || match.pathname === '/register'
  );
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
