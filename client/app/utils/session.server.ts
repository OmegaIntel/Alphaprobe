import { createCookieSessionStorage, redirect } from "@remix-run/node";

const sessionSecret = process.env.SESSION_SECRET || "default_secret";

const storage = createCookieSessionStorage({
  cookie: {
    name: "session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/", // Makes cookie available across the whole app
    httpOnly: true, // Prevents client-side JS from accessing the cookie
  },
});

// Fetch session from the Cookie header
export async function getSession(cookieHeader: string | null) {
  return storage.getSession(cookieHeader);
}

// Commit session changes to include in response headers
export async function commitSession(session: any) {
  return storage.commitSession(session);
}

// Destroy session for logging out users
export async function destroySession(session: any) {
  return storage.destroySession(session);
}

// Check if a user session exists, otherwise redirect to login
export async function requireUserSession(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  const session = await getSession(cookieHeader);
  const token = session.get("token");

  if (!token) {
    throw redirect("/login");
  }

  return token; // Return the token for use in the loader or elsewhere
}
