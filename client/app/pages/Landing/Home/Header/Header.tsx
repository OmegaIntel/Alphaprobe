import { FC, useState, useEffect } from 'react';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { toast } from '~/hooks/use-toast';
import { API_BASE_URL } from '~/constant';

const Header: FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation effect on component mount
  useEffect(() => {
    // Short delay before starting animation for better effect
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
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
    <div className="py-12 md:py-16 lg:py-24 px-4 sm:px-6 w-full flex flex-col items-center justify-between space-y-8 md:space-y-10 lg:space-y-12">
      {/* Text content with fade-in animation */}
      <div 
        className={`w-full md:w-5/6 lg:w-2/3 space-y-6 sm:space-y-8 md:space-y-10 text-center transition-opacity duration-1000 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-normal md:leading-tight bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent pb-2">
          Automated Research and Diligence for Private Markets
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
          Transforming the private market deal making process by automating research, modeling, and due diligence.
        </p>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto mt-6 sm:mt-8">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
            <Input 
              type="email" 
              placeholder="Business Email" 
              className="w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              className="w-full sm:w-auto whitespace-nowrap mt-3 sm:mt-0"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Schedule A Demo"}
            </Button>
          </div>
        </form>
      </div>

      {/* Image with fade-in and slight slide-up animation */}
      <div 
        className={`w-full flex justify-center mt-6 sm:mt-8 lg:mt-10 transition-all duration-1000 ease-in-out ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}
        style={{ transitionDelay: '300ms' }}
      >
        <img
          src="images/omegalanding.png"
          alt="Dashboard Illustration"
          className="w-full max-w-6xl mx-auto rounded-lg shadow-xl"
          loading="eager"
        />
      </div>
    </div>
  );
};

export default Header;