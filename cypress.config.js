const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");
const webpackConfig = require("./webpack.config");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Register custom tasks
      on("task", {
        logErrorToFile({ query, error }) {
          const logMessage = `Query: ${query}\nError: ${JSON.stringify(
            error
          )}\n\n`;
          fs.appendFileSync("cypress/logs/errors.log", logMessage);
          return null;
        },
        fileExists(filename) {
          return fs.existsSync(filename);
        },
        readFilesFromFolder(folderPath) {
          return new Promise((resolve, reject) => {
            fs.readdir(path.resolve(folderPath), (err, files) => {
              if (err) {
                console.error("Error reading folder:", err);
                return reject(err); // Properly handle errors
              }
              console.log("Files found:", files); // Debug logging
              resolve(files); // Return the files array
            });
          });
        },
      });
    },
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig,
    },
  },
});
