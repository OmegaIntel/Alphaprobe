// authService.js
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
const auth0_domain = process.env.REACT_APP_AUTH0_DOMAIN;
export const getAuth0UserAndToken = async (getAccessTokenSilently) => {
  try {
    const token = await getAccessTokenSilently();
    const response = await fetch(`https://${auth0_domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const user = await response.json();
    return { user, token };
  } catch (error) {
    console.error("Error fetching Auth0 user or token:", error);
    throw error;
  }
};