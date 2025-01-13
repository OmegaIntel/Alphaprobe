import { json } from '@remix-run/node';
import { useActionData, useNavigate } from '@remix-run/react';
import { useEffect } from 'react';
import Login from '~/pages/auth/login';
import { loginUser } from '~/services/auth';

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

    // Return success and token instead of redirecting
    return json({
      success: true,
      access_token
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
    access_token?: string;
  }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData?.success && actionData.access_token) {
      // Set cookie client-side
      document.cookie = `authToken=${actionData.access_token}; path=/; max-age=7200; SameSite=Strict`;
      navigate('/dashboard');
    }
  }, [actionData, navigate]);

  return <Login errorMessage={actionData?.errorMessage} />;
}