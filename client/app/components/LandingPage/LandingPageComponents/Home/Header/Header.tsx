import { FC } from 'react';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';

const Header: FC = () => {
  return (
    <div className="my-24 flex flex-col lg:flex-row items-center justify-between space-y-10 lg:space-y-0">
      {/* Text content */}
      <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
        <h1 className="text-3xl font-semibold">
          Automated Research and Diligence for Private Markets
        </h1>
        <p className="text-muted-foreground">
          Our platform transforms the private market deal process by automating
          research, modeling, and due diligence - ingesting fragmented data from
          thousands of sources and turning it into actionable investment
          intelligence.
        </p>

        {/* Input field */}
        <div className="flex items-center space-x-2 w-full max-w-lg mx-auto lg:mx-0">
          <Input type="email" placeholder="Business email" />
          <Button
            onClick={() =>
              window.open(
                'https://calendly.com/chetan-omegaintelligence',
                '_blank'
              )
            }
          >
            Request Access
            <span className="ml-2">&rarr;</span>
          </Button>
        </div>
      </div>

      {/* Image */}
      <div className="lg:w-1/2 flex justify-center">
        <img
          src="images/dashboard.png"
          alt="Dashboard Illustration"
          className="rounded-lg shadow-xl"
        />
      </div>
    </div>
  );
};

export default Header;
