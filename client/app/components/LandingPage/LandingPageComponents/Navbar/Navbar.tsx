import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";

const Navbar: FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, loginWithRedirect } = useAuth0();

  return (
    <nav className="sticky top-0 z-50 bg-background border-b px-10">
      <div className="container mx-auto flex justify-between items-center py-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          <img
            src="/images/logo.svg"
            alt="Omega Intelligence Logo"
            className="h-8 w-8"
          />
          <span className="text-lg font-semibold">Omega Intelligence</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          <Button variant="link" onClick={() => navigate("#")}>
            How it works
          </Button>
          <Button variant="link" onClick={() => navigate("#")}>
            Solutions
          </Button>
          <Button
            variant="link"
            onClick={() =>
              window.open("https://calendly.com/chetan-omegaintelligence", "_blank")
            }
          >
            Schedule a demo
          </Button>

          {isAuthenticated ? (
            // Authenticated user dropdown
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button >Profile</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout({ returnTo: window.location.origin })}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Unauthenticated user buttons
            <div className="flex gap-2">
              {/* <Button variant="outline" onClick={loginWithRedirect}>
                Login
              </Button> */}
              <Button
                onClick={() => navigate("/register")}
                variant="default"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
