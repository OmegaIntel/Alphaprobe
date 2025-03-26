import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "~/components/ui/button";

const Navbar: FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for the authToken in cookies
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];

    // Set authentication state based on token existence
    setIsAuthenticated(!!token);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-background border-b px-10">
      <div className="container mx-auto flex justify-between items-center py-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          <img
            src="/images/omegalogo.png"
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
          {/* <Button
            variant="link"
            onClick={() =>
              window.open(
                "https://calendly.com/chetan-omegaintelligence",
                "_blank"
              )
            }
          >
            Schedule a demo
          </Button> */}

          {/* Conditional Rendering Based on Authentication */}
          {isAuthenticated ? (
            <Button onClick={() => navigate("/dashboard")} variant="default">
              Dashboard
            </Button>
          ) : (
            // Unauthenticated user buttons
            <div className="flex gap-2">
              <Button  variant="default"
            onClick={() =>
              window.open(
                "https://calendly.com/chetan-omegaintelligence",
                "_blank"
              )
            }>
                 Schedule a demo
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
