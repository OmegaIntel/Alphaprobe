import { FC } from 'react';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';

const Header: FC = () => {
  return (
    <div className="my-24 flex flex-col items-center justify-between space-y-10 lg:space-y-0">
      {/* Text content */}
      <div className="lg:w-2/3 space-y-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold  leading-tight bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
          Automated Research and Diligence for Private Markets
        </h1>
        <p className="text-muted-foreground text-lg ">
          Transforming the private market deal making process by automating research, modeling, and due diligence.
        </p>

        {/* Input field */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg mx-auto mt-8">
          <Input type="email" placeholder="Business Email" className="w-full" />
          <Button
            className="w-full sm:w-auto whitespace-nowrap"
            onClick={() =>
              window.open(
                'https://calendly.com/chetan-omegaintelligence',
                '_blank'
              )
            }
          >
            Schedule A Demo
          </Button>
        </div>
      </div>

      {/* Image */}
      <div className="w-full flex justify-center mt-10">
        <img
          src="images/omegalanding.png"
          alt="Dashboard Illustration"
          className="rounded-lg shadow-xl"
        />
      </div>
    </div>
  );
};

export default Header;