import React from 'react';

interface HeaderProps {
  heading: string;
  description: string;
}

const PageHeader: React.FC<HeaderProps> = ({ heading, description }) => {
  return (
    <div className="w-full py-4 border-b border-gray-200">
      <div className="container mx-auto text-center px-4">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">{heading}</h1>
        <p className="text-gray-500">{description}</p>
      </div>
    </div>
  );
};

export default PageHeader;