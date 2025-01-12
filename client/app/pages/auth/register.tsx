import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Link } from "@remix-run/react";

interface RegisterProps {
  errorMessage?: string;
}

export default function Register({ errorMessage }: RegisterProps) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/20">
      {/* Logo */}
      <img
        src="/images/company-logo.png"
        className="absolute top-4 right-4"
        alt="company-logo"
      />

      {/* Register Form */}
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Register
          </CardTitle>
          <CardDescription>
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline"
            >
              Login
            </Link>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form method="post" className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
            >
              Register
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
