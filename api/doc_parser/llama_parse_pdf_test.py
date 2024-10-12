"""Basic tests for llama parse pdf"""
# To be run from Alphaprobe root

from api.doc_parser.llama_parse_pdf import LlamaParser

TEST_PDF = 'api/doc_parser/Test_data/Updated_JD_for_US_Cohort__GenAI_Instructor.pdf'


def test1():
    lp = LlamaParser()
    result = lp.parse_pdf(TEST_PDF)

    assert len(result) > 0
