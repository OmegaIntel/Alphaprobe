import { Form } from "@remix-run/react";

interface LoginProps {
  errorMessage?: string;
}

export default function Login({ errorMessage }: LoginProps) {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Form method="post" className="p-8 rounded-lg w-[400px] bg-gray-800">
        <h2 className="text-xl font-bold mb-4 text-white">Login</h2>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        <label className="block text-sm text-gray-400">
          Username:
          <input
            type="text"
            name="username"
            className="w-full mt-1 mb-4 p-2 bg-gray-700 rounded"
          />
        </label>
        <label className="block text-sm text-gray-400">
          Password:
          <input
            type="password"
            name="password"
            className="w-full mt-1 mb-4 p-2 bg-gray-700 rounded"
          />
        </label>
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login
        </button>
      </Form>
    </div>
  );
}
