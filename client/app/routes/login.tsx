import { json, redirect } from '@remix-run/node';
import { useActionData } from '@remix-run/react';
import Login from '~/pages/auth/login';
import { loginUser } from '~/services/auth';
import { commitSession, getSession } from '~/utils/session.server';

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

    // Debugging the access_token type
    console.log('Access Token Type:', typeof access_token);
    if (typeof access_token !== 'string') {
      throw new Error('Access token is not a string');
    }

    const session = await getSession(request.headers.get('Cookie'));
    session.set('token', access_token); // This must be a string

    return redirect('/dashboard', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error.message);
    return json({ errorMessage: error.message }, { status: 401 });
  }
}

export default function LoginRoute() {
  const actionData = useActionData<{ errorMessage?: string }>();
  return <Login errorMessage={actionData?.errorMessage} />;
}
