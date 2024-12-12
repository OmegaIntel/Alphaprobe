import React, { useEffect, useState } from 'react';

const TypingAnimation = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50); // Adjust typing speed

    return () => clearInterval(interval);
  }, [text]);

  return <span className="text-gray-800">{displayedText}</span>;
};

export default TypingAnimation;