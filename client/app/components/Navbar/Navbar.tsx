import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "~/components/ui/button";
import ContactFormModal from "./ContactFormModal"; // Import the new component

const Navbar: FC = () => {
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background border-b px-10">
        <div className="container mx-auto flex justify-between items-center py-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <img
              src="/images/logoDark.png"
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
                window.open(
                  "https://calendly.com/chetan-omegaintelligence",
                  "_blank"
                )
              }
            >
              Schedule a demo
            </Button>

            {/* Get Started button now opens the contact form modal */}
            <Button 
              onClick={() => setIsContactModalOpen(true)} 
              variant="default"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Contact Form Modal */}
      <ContactFormModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </>
  );
};

export default Navbar;