import React, { useState, useEffect, FC } from "react";

// Add TypeScript declaration for Calendly
declare global {
  interface Window {
    Calendly?: any;
  }
}

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define API response type
interface ApiResponse {
  message: string;
  success: boolean;
  id?: string;
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { API_BASE_URL } from "~/constant";

const ContactFormModal: FC<ContactFormModalProps> = ({ isOpen, onClose }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    message: "",
  });

  // Form status state
  const [status, setStatus] = useState({
    submitted: false,
    loading: false,
    error: null as string | null,
  });

  // Flag to show Calendly after form submission
  const [showCalendly, setShowCalendly] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ ...status, loading: true });

    try {
      // Send form data to API
      const response = await fetch(`${API_BASE_URL}/api/contact-us`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit contact form');
      }

      const data = await response.json();
      
      console.log("API Response:", data);
      
      // First update status
      setStatus({
        submitted: true,
        loading: false,
        error: null,
      });
      
      // Then explicitly show Calendly in a separate state update
      setTimeout(() => {
        setShowCalendly(true);
      }, 100);
      
    } catch (error) {
      console.error("Submit error:", error);
      setStatus({
        submitted: false,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  // Reset form and status
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone_number: "",
      message: "",
    });
    setStatus({
      submitted: false,
      loading: false,
      error: null,
    });
    setShowCalendly(false);
  };

  // Close the dialog and reset if needed
  const handleClose = () => {
    if (status.submitted) {
      resetForm();
    }
    onClose();
  };

  // Directly open Calendly in a new tab
  const openCalendlyInNewTab = () => {
    window.open('https://calendly.com/chetan-omegaintelligence', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[425px] md:max-w-[650px] p-4 md:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl md:text-2xl text-center md:text-left">Contact Us</DialogTitle>
          <DialogDescription className="text-sm md:text-base text-center md:text-left">
            Fill out the form below to get started with Omega Intelligence. We'll
            schedule a call to discuss your needs.
          </DialogDescription>
        </DialogHeader>

        {status.submitted ? (
          <div className="w-full">
            {showCalendly ? (
              <div className="calendly-container w-full h-[50vh] md:h-[60vh] lg:h-[600px]">
                <iframe
                  src={`https://calendly.com/chetan-omegaintelligence?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}&a1=${encodeURIComponent(formData.message)}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                ></iframe>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <p className="text-green-600 text-sm md:text-base">Your message has been sent successfully!</p>
                <h3 className="font-semibold text-base md:text-lg mb-2">
                  Loading calendar...
                </h3>
                <div className="flex flex-col space-y-2">
                  <Button onClick={() => setShowCalendly(true)} className="w-full">
                    Show Scheduler
                  </Button>
                  <Button onClick={openCalendlyInNewTab} variant="outline" className="w-full">
                    Open Scheduler in New Tab
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full">
            <div className="grid gap-4 py-4">
              {/* Mobile-friendly layout - Stack on small screens, grid on larger */}
              <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                <Label htmlFor="name" className="md:text-right text-sm md:text-base">
                  Name
                </Label>
                <div className="md:col-span-3">
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                <Label htmlFor="email" className="md:text-right text-sm md:text-base">
                  Email
                </Label>
                <div className="md:col-span-3">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                <Label htmlFor="phone_number" className="md:text-right text-sm md:text-base">
                  Phone
                </Label>
                <div className="md:col-span-3">
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-2 md:gap-4">
                <Label htmlFor="message" className="md:text-right text-sm md:text-base pt-2">
                  Message
                </Label>
                <div className="md:col-span-3">
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
              <Button
                type="submit"
                disabled={status.loading}
                className="w-full sm:w-auto"
              >
                {status.loading ? "Submitting..." : "Submit & Schedule Call"}
              </Button>
            </DialogFooter>
            
            {status.error && (
              <div className="text-red-500 text-center mt-4 text-sm md:text-base">
                {status.error}
              </div>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormModal;