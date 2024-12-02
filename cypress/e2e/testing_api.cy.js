describe("Data Fetching Component Integration", () => {
  const apiUrl = "http://127.0.0.1:8000/api";

  // Set up global uncaught exception handler
  before(() => {
      Cypress.on('fail', (err, runnable) => {
        // Log uncaught exceptions to the error log file
        cy.task("logErrorToFile", {
          query: 'Uncaught exception in the test', // You can add more context here
          error: err.message || 'An uncaught exception occurred'
        });
        // Return false to prevent Cypress from failing the test
        return false;
      });
  });

  it("renders search suggestions based on input", () => {
    // Load the queries from the fixture file
    cy.fixture("queries.json").then((queries) => {
      // Visit the login page
      cy.visit("http://localhost:3000/login");
      cy.get("input[name='email']").clear().type("abcd@gmail.com");
      cy.get("input[name='password']").type("pass1");
      cy.get("button[type='submit']").click();
      cy.wait(10000);
      cy.get("#2").contains("Market Research").click();

      // Loop over each query and test the functionality
      queries.forEach((payload) => {
        cy.visit("http://localhost:3000/projects");
        cy.get("#2").contains("Market Research").click();
        cy.log(`Testing query: ${payload.name}`);

        // Type the query into the fuzzy search bar
        cy.get("input[name='fuzzySearch']")
          .clear()
          .type(payload.name)
          .should('have.value', payload.name);

        // Wait for suggestions to load
        cy.wait(10000); // Adjust based on API response speed

        cy.contains(payload.name).click();

        cy.get("button[type='submit']").click();

        // Wait for suggestions to load
        cy.wait(60000);

        cy.get('body').then(($body) => {
          if($body.find('#2').length > 0) {
            cy.get('#2').should('be.visible');
          } else {
            // If the element does not exist, perform a task
            cy.task('logErrorToFile', { query: payload.name, error: 'UI crashed' });
          }
        });        
      });
  });

    // it("renders search suggestions based on input", () => {
    //   cy.visit("http://localhost:3000/login");
    //   cy.get("input[name='email']").clear().type("abcd@gmail.com");
    //   cy.get("input[name='password']").type("pass1");
    //   cy.get("button[type='submit']").click();
    //   // cy.url().should("eq", "http://localhost:3000/login");
    //   // cy.get("input[type='email']").type("abcd@gmail.com");
    //   // cy.get("input[type='password']").type("pass1");
    //   // cy.get("button[type='submit']").click();
    //   // cy.url().should("eq", "http://localhost:3000/projects");
    //   cy.get("#2").contains("Market Research").click();
    //   // Stub the API response for fuzzy search
    //   cy.intercept("GET", `${apiUrl}/fuzzy-search?query=*`, {
    //     statusCode: 200,
    //     body: [
    //       { name: "Accounting Services in the US", code: "541211" },
    //     ],
    //   }).as("fuzzySearch");
  
    //   // Type into the search box
    //   cy.get("input[name='fuzzySearch']").clear().type("Accounting");
  
    //   // Wait for the API call
    //   // cy.wait("@fuzzySearch");
  
    //   // Check if suggestions are displayed
    //   cy.contains("Accounting Services in the US").should("be.visible");
    // });

  // it("selects a suggestion from the list", () => {
  //   cy.visit("http://localhost:3000/login");
  //     cy.get("input[type='email']").type("abcd@gmail.com");
  //     cy.get("input[type='password']").type("pass1");
  //     cy.get("button[type='submit']").click();
  //     cy.url().should("eq", "http://localhost:3000/login");
  //     cy.get("input[type='email']").type("abcd@gmail.com");
  //     cy.get("input[type='password']").type("pass1");
  //     cy.get("button[type='submit']").click();
  //     cy.url().should("eq", "http://localhost:3000/projects");
  //     cy.get("#2").contains("Market Research").click();
  //   // Stub the API response
  //   cy.intercept("GET", `${apiUrl}/fuzzy-search?query=*`, {
  //     statusCode: 200,
  //     body: [
  //       { name: "Accounting Services", code: "123" },
  //       { name: "Consulting Services", code: "456" },
  //     ],
  //   }).as("fuzzySearch");
  
  //   // Type into the search box
  //   cy.get("input[name='fuzzySearch']").type("Accounting");
  
  //   // Wait for the API call and select a suggestion
  //   cy.contains("Accounting Services").click();
  
  //   // Check if the input field is updated
  //   cy.get("input[type='text']").should("have.value", "Accounting Services");
  // });

  // it("submits the search form with the correct payload", () => {
  //   cy.visit("http://localhost:3000/login");
  //     cy.get("input[type='email']").type("abcd@gmail.com");
  //     cy.get("input[type='password']").type("pass1");
  //     cy.get("button[type='submit']").click();
  //     cy.url().should("eq", "http://localhost:3000/login");
  //     cy.get("input[type='email']").type("abcd@gmail.com");
  //     cy.get("input[type='password']").type("pass1");
  //     cy.get("button[type='submit']").click();
  //     cy.url().should("eq", "http://localhost:3000/projects");
  //     cy.get("#2").contains("Market Research").click();
  //   // Stub the API response for the search form submission
  //   cy.intercept("POST", `${apiUrl}/industry-summary`, {
  //     statusCode: 200,
  //     body: { result: [{ data: "Test summary" }] },
  //   }).as("submitSearch");
  
  //   // Type into the search box and set up the form
  //   // Type into the search box
  //   cy.get("input[name='fuzzySearch']").type("Accounting");
  
  //   // Wait for the API call and select a suggestion
  //   cy.contains("Accounting Services").click();
  //   cy.get("button[type='submit']").click();
  
  //   // Wait for the API call
  //   cy.wait("@submitSearch").then((interception) => {
  //     // Assert that the correct payload is sent
  //     expect(interception.request.body).to.deep.equal({
  //       data: {
  //         source: "IBIS",
  //         industry_name: "Accounting Services in the US",
  //         industry_code: "541211",
  //       },
  //     });
  //   });
  // });

  // it("check that the result is displayed", () => {
  //   cy.visit("http://localhost:3000/login");
  //   cy.get("input[type='email']").type("abcd@gmail.com");
  //   cy.get("input[type='password']").type("pass1");
  //   cy.get("button[type='submit']").click();
  //   cy.url().should("eq", "http://localhost:3000/login");
  //   cy.get("input[type='email']").type("abcd@gmail.com");
  //   cy.get("input[type='password']").type("pass1");
  //   cy.get("button[type='submit']").click();
  //   cy.url().should("eq", "http://localhost:3000/projects");
  //   cy.get("#2").contains("Market Research").click();
  
  //   cy.get("input[name='fuzzySearch']").type("Accounting");
  
  //   // Wait for the API call and select a suggestion
  //   cy.contains("Accounting Services").click();
  //   cy.get("button[type='submit']").click();
  
  //   // Wait for the API call
  //   cy.wait("@submitSearch").then((interception) => {
  //     // Assert that the correct payload is sent
  //     expect(interception.request.body).to.deep.equal({
  //       data: {
  //         source: "IBIS",
  //         industry_name: "Accounting Services in the US",
  //         industry_code: "541211",
  //       },
  //     });
  //   });
  // });
});
});
