const { defineConfig } = require("cypress");
const fs = require("fs");

module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        logErrorToFile({ query, error }) {
          const logMessage = `Query: ${query}\nError: ${JSON.stringify(
            error
          )}\n\n`;
          fs.appendFileSync("cypress/logs/errors.log", logMessage);
          return null;
        }
      });
    }
  }
};

// module.exports = defineConfig({
//   e2e: {
//     setupNodeEvents(on, config) {
//       // implement node event listeners here
//     },
//   },
// });
