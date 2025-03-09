from pydantic import BaseModel, Field
from typing import List

class AnswerQuestionInput(BaseModel):
    question: str = Field(..., description="The question to generate SQL for")


class AnswerQuestionViaPDFCitationsInput(AnswerQuestionInput):
    pdf_files: List[int] = Field(
        ..., description="The ids of the PDFs to use for citation"
    )
