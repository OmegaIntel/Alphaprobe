
from doc_parser.pdf_utils import extract_pages, number_of_pages
import os


def test_extract_pages():
    filename = 'test-data/study_id66974_in-depth-report-industry-40.pdf'
    with extract_pages(filename, first_page=5, last_page=15) as temp_filename:
        assert os.path.exists(temp_filename)
    assert not os.path.exists(temp_filename)


def test_number_of_pages():
    filename = 'test-data/study_id66974_in-depth-report-industry-40.pdf'
    num_pages = number_of_pages(filename)
    assert num_pages == 146
