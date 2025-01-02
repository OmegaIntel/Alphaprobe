// authMiddleware.js
import { getAuth0UserAndToken } from "./authService";
import { loginSuccess } from "./authSlice";
export const authMiddleware = (store) => (next) => async (action) => {
  if (action.type === "AUTH0_LOGIN") {
    const { getAccessTokenSilently } = action.payload;
    try {
      const { user, token } = await getAuth0UserAndToken(getAccessTokenSilently);
      store.dispatch(loginSuccess(user, token));
    } catch (error) {
      console.error("Error during Auth0 login:", error);
    }
  }
  return next(action);
};