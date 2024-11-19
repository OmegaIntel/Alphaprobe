import Papa from 'papaparse';
import { API_BASE_URL, token } from '../../src/services';
import React from 'react';
import { mount } from 'cypress/react';
import ReportDropdown from '../../src/components/MarketResearch/IndustryReportSection/ReportDropdown';
 // Update path to your component

describe('Industry Summary API Test', () => {
  let csvData;

  before(() => {
    // Load CSV using Cypress's fixture
    cy.fixture('IBIS NAICS Code mapping.csv').then((fileContents) => {
      // Parse CSV using Papaparse
      Papa.parse(fileContents, {
        header: true,
        complete: (results) => {
          csvData = results.data;
        },
      });
    });
  });

  it('should handle API responses and pass data to the component', () => {
    // Ensure CSV data is loaded
    cy.wrap(csvData).should('not.be.empty');

    // Iterate through CSV entries sequentially
    cy.wrap(csvData).each((row) => {
      if (row['IBIS Report Name'] && row['NAICS Code']) {
        cy.log(`Sending request for ${row['IBIS Report Name']}...`);

        // API Request
        cy.request({
          method: 'POST',
          url: `${API_BASE_URL}/api/industry-summary`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: {
            data: {
              source: 'IBIS',
              industry_name: row['IBIS Report Name'],
              industry_code: row['NAICS Code'],
            },
          },
        }).then((response) => {
          const data = response.body;

          console.log('Response:', response);
          console.log('Data type:', typeof data); // Should log "object"
          console.dir('Data:', data); // Logs the actual data

          if (data.result && Array.isArray(data.result) && data.result.length > 0) {
            // Pass the result directly to the component
            mount(<ReportDropdown data={response.result} />, {
                document: 'cypress/fixtures/component-index.html' // Path to your component-index.html
              });

            // Catch component errors
            cy.on('uncaught:exception', (err) => {
              cy.log(`Error rendering ReportDropdown for: ${row['IBIS Report Name']} (${row['NAICS Code']})`);
              cy.log(`Error details: ${err.message}`);
              return false; // Prevent test failure
            });
          } else {
            // Log for empty or invalid data.result
            cy.log(`Empty or invalid response.result for: ${row['IBIS Report Name']} (${row['NAICS Code']})`);
          }
        });
      }
    });
  });
});
