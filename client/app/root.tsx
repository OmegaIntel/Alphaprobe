import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import React, { useEffect, useState } from "react";
import type { LinksFunction } from "@remix-run/node";
import { Auth0Provider } from "@auth0/auth0-react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import "./tailwind.css";
import { Provider } from "react-redux";
import store from "./store/store";

export const stripePromise = loadStripe(
  "pk_live_51QYEgCJNJeCsZb59HRFE6TkrDZNFtYFQY5MBeaIwcdVJzo4M7jYE8qT1ub7GiiqrYpC8OZjjf82zZ4J4wihFuV0g003Ap19PWz"
);

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Layout>
      <Provider store={store}>
        {mounted && (
          <Auth0Provider
            domain="dev-tenant-testing.us.auth0.com"
            clientId="KznvQTTUvG9V24gsUxFWGILHdk0I565L"
            authorizationParams={{
              redirect_uri: window.location.origin + "/dashboard",
              scope: "openid profile email",
            }}
            cacheLocation="localstorage"
          >
            <Elements stripe={stripePromise}>
              <Outlet />
            </Elements>
          </Auth0Provider>
        )}
      </Provider>
    </Layout>
  );
}
