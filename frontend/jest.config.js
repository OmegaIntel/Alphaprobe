module.exports = {
    // Use babel-jest for transforming JS and JSX files
    transform: {
      "^.+\\.[t|j]sx?$": "babel-jest", // This ensures Jest transforms JS/JSX files with Babel
    },
    extensionsToTreatAsEsm: [".jsx", ".js", ".mjs"], // Ensure .jsx, .js, and .mjs are treated as ESM
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1' // Ensure Jest can handle imports without extensions
    },
    testEnvironment: "jsdom", // Specify the testing environment for React
    transformIgnorePatterns: [
      "/node_modules/(?!your-esm-package-to-transform).*/", // Optionally handle transforming certain node_modules
    ]
  };
  