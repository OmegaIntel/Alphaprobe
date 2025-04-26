import { json, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import Register from "~/view/auth/register";
import { registerUser } from "~/services/auth";

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!email || !password || !confirmPassword) {
    return json({ errorMessage: "All fields are required" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return json({ errorMessage: "Passwords do not match" }, { status: 400 });
  }

  try {
    await registerUser(formData);
    return redirect("/login");
  } catch (error: any) {
    return json({ errorMessage: error.message || "Registration failed" }, { status: 400 });
  }
}

export default function RegisterRoute() {
  const actionData = useActionData<{ errorMessage?: string }>();
  return <Register errorMessage={actionData?.errorMessage} />;
}
