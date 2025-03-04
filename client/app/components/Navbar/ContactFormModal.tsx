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

const ContactFormModal: FC<ContactFormModalProps> = ({ isOpen, onClose }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
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
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus({ ...status, loading: true });

    // Here you would normally send the form data to your backend
    // For now, we'll just simulate a successful submission
    setTimeout(() => {
      setStatus({
        submitted: true,
        loading: false,
        error: null,
      });
      
      // Show the calendly embed
      setShowCalendly(true);
    }, 800);
  };

  // Reset form and status
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
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
      <DialogContent className="sm:max-w-[425px] md:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
          <DialogDescription>
            Fill out the form below to get started with Omega Intelligence. We'll
            schedule a call to discuss your needs.
          </DialogDescription>
        </DialogHeader>

        {status.submitted ? (
          <>
            {showCalendly ? (
              <div className="calendly-container" style={{ height: "600px" }}>
                <iframe
                  src={`https://calendly.com/chetan-omegaintelligence?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}&a1=${encodeURIComponent(formData.message)}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                ></iframe>
              </div>
            ) : (
              <div className="text-center py-4">
                <h3 className="font-semibold text-lg mb-2">
                  Something went wrong with the calendar.
                </h3>
                <Button onClick={openCalendlyInNewTab} className="w-full mb-2">
                  Open Scheduler in New Tab
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="w-full"
                >
                  Send Another Message
                </Button>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message" className="text-right">
                  Message
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="col-span-3"
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={status.loading}
              >
                {status.loading ? "Submitting..." : "Submit & Schedule Call"}
              </Button>
            </DialogFooter>
            
            {status.error && (
              <div className="text-red-500 text-center mt-2">
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