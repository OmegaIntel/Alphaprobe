import React from 'react';

function SimpleTextBox(props) {
  const { sectionKey, definition } = props;

  return (
    <div
      className="p-4 bg-gray-600/30 rounded-xl my-10"
    >
      <p className="text-2xl my-5">{sectionKey}</p>
      <h1 className="text-lg text-gray-300">{definition}</h1>
    </div>
  );
}

export default SimpleTextBox;