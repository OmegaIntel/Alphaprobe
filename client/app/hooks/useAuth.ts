// app/hooks/useAuth.ts
import { useNavigate } from '@remix-run/react';
import { getCookie, removeCookie } from '~/utils/cookies';

export const useAuth = () => {
  const navigate = useNavigate();

  return {
    isAuthenticated: () => !!getCookie('authToken'),
    getToken: () => getCookie('authToken'),
    logout: () => {
      removeCookie('authToken');
      navigate('/login');
    }
  };
};