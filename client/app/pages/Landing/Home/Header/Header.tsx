import { FC, useState } from 'react';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { toast } from '~/hooks/use-toast';
import { API_BASE_URL } from '~/constant';

const Header: FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid business email address.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Send email to your contact form API
      const response = await fetch(`${API_BASE_URL}/api/contact-us`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: "Email subscriber",
          email: email,
          phone_number: "",
          message: "Requested access via homepage email form"
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit email');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setEmail('');
        toast({
          title: "Success!",
          description: "Thank you for your interest. We'll be in touch soon.",
        });
        window.open('https://calendly.com/chetan-omegaintelligence', '_blank');
      } else {
        throw new Error(data.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full px-4 sm:px-6 py-8 sm:py-12 md:py-16 lg:py-24">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Text content */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-semibold text-center lg:text-left mb-4 sm:mb-6">
            Automated Research and Diligence for Private Markets
          </h1>
          <p className="text-base text-muted-foreground text-center lg:text-left mb-6 sm:mb-8 max-w-2xl lg:max-w-none">
            Our platform transforms the private market deal process by automating
            research, modeling, and due diligence - ingesting fragmented data from
            thousands of sources and turning it into actionable investment
            intelligence.
          </p>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="flex flex-col sm:flex-row w-full gap-3">
              <Input 
                type="email" 
                placeholder="Business email" 
                className="w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                className="w-full sm:w-auto whitespace-nowrap"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Request Access"}
                <span className="ml-2">&rarr;</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Image */}
        <div className="w-full lg:w-1/2 mt-8 lg:mt-0">
          <img
            src="images/dashboard.png"
            alt="Dashboard Illustration"
            className="w-full rounded-lg shadow-xl"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
};

export default Header;