module.exports = {
    transform: {
      "^.+\\.[t|j]sx?$": "babel-jest",
    },
    transformIgnorePatterns: [
      "node_modules/(?!axios)" // Add other packages as needed
    ],
    moduleNameMapper: {
      "\\.(css|scss)$": "identity-obj-proxy", // Mock CSS imports
    },
  };
  