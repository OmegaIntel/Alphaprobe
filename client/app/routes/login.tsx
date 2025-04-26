import { json } from '@remix-run/node';
import { useActionData, useNavigate, redirect, useLocation } from '@remix-run/react';
import { useEffect } from 'react';
import Login from '~/view/auth/login';
import { loginUser } from '~/services/auth';
import * as amplitude from '@amplitude/analytics-browser';
//import { sendAnalyticsEvent } from '~/root';

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const username = formData.get('username')?.toString();
  const password = formData.get('password')?.toString();

  if (!username || !password) {
    return json(
      { errorMessage: 'Both username and password are required' },
      { status: 400 }
    );
  }

  try {
    const { access_token } = await loginUser(formData);

    if (typeof access_token !== 'string') {
      throw new Error('Invalid token received');
    }

    console.log('navigate-------------', access_token);
    
    // Return success and token (do not set amplitude here as it's client-side)
    return json({
      success: true,
      access_token,
      email: username, // Send the username back for setting user ID on the client
    });

  } catch (error: any) {
    console.error('Login Error:', error.message);
    return json({ 
      errorMessage: error.message 
    }, { status: 401 });
  }
}

export default function LoginRoute() {
  const actionData = useActionData<{ 
    errorMessage?: string;
    success?: boolean;
    access_token: string | null;
    email?: string; // Add email to action data
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (actionData?.success && actionData.access_token) {
      // Set cookie client-side
      document.cookie = `authToken=${actionData.access_token}; path=/; max-age=7200; SameSite=Strict`;
      localStorage.setItem('authToken', actionData.access_token);

      // Set Amplitude user ID
      if (actionData.email) {
        localStorage.setItem('user_id', actionData.email);
        amplitude.setUserId(actionData.email);
      }

      // Get the returnTo parameter from the URL or default to '/'
      const searchParams = new URLSearchParams(location.search);
      const returnTo = searchParams.get('returnTo') || '/';
      
      // Navigate to the return path
      // console.log('navigating to:', returnTo);
      navigate(returnTo);
    }
  }, [actionData?.access_token, location.search, navigate]);

  return <Login errorMessage={actionData?.errorMessage} />;
}