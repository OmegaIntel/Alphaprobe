import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import ContactFormModal from "./ContactFormModal";

const Navbar: FC = () => {
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background border-b px-4 md:px-10">
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

          {/* Desktop Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile Hamburger Menu - Visible only on mobile */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                <SheetHeader className="mb-6">
                  <SheetTitle className="flex items-center gap-2">
                    <img
                      src="/images/logoDark.png"
                      alt="Omega Intelligence Logo"
                      className="h-8 w-8"
                    />
                    <span>Omega Intelligence</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4">
                  <Button variant="ghost" className="justify-start" onClick={() => navigate("#")}>
                    How it works
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => navigate("#")}>
                    Solutions
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() =>
                      window.open(
                        "https://calendly.com/chetan-omegaintelligence",
                        "_blank"
                      )
                    }
                  >
                    Schedule a demo
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsContactModalOpen(true);
                      // Close the sheet menu
                      const closeButton = document.querySelector('[data-radix-collection-item]');
                      if (closeButton && closeButton instanceof HTMLElement) {
                        closeButton.click();
                      }
                    }} 
                    variant="default"
                    className="mt-2"
                  >
                    Get Started
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
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