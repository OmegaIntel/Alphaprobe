import YourComponent from "../../components/MarketResearch/IndustryReportSection/IndustryReport";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom"; // For better assertions

describe('sum module', () => {
    test('Industry Report', () => {
      render(<YourComponent />);
    });
  });