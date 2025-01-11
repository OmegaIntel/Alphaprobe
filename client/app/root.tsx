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

const stripe_pb_key: string = import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!;
const auth0_domain: string = import.meta.env.REACT_APP_AUTH0_DOMAIN!;
const auth0_client_id: string = import.meta.env.REACT_APP_AUTH0_CLIENT_ID!;
const frontendUrl = import.meta.env.REACT_APP_FRONTEND_URL || window.location.origin;

export const stripePromise = loadStripe(stripe_pb_key);

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
            domain={auth0_domain}
            clientId={auth0_client_id}
            authorizationParams={{
              redirect_uri: `${frontendUrl}/dashboard`,
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
