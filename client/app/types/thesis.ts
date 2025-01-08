export interface Question {
    id: number;
    question: string;
    type: "text" | "select"; // Strict union type
    options?: string[]; // Optional property for "select" type
  }
  