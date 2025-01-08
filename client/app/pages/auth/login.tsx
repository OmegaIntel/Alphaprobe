import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Link } from "@remix-run/react";

interface LoginProps {
  errorMessage?: string;
}

export default function Login({ errorMessage }: LoginProps) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      {/* Logo */}
      <img
        src="/images/company-logo.png"
        className="absolute top-4 right-4"
        alt="company-logo"
      />
      
      {/* Login Form */}
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Login
          </CardTitle>
          <CardDescription>
            Don't have an account?{" "}
            <Link 
              to="/register" 
              className="text-primary hover:underline"
            >
              Register
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
              <Label htmlFor="username">Email</Label>
              <Input
                id="username"
                name="username"
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
            
            {/* Submit Button */}
            <Button 
              type="submit"
              className="w-full"
            >
              Login
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}