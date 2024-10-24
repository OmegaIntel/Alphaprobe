"""PDF utils"""

import os
from contextlib import contextmanager

from pypdf import PdfWriter, PdfReader


@contextmanager
def extract_pages(pdf_doc_path: str, first_page: int, last_page: int):
    """Extract specific consecutive pages from a PDF doc"""
    with open(pdf_doc_path, "rb") as f:
        inputpdf = PdfReader(f)
        output = PdfWriter()

        first_page = max(min(first_page, len(inputpdf.pages)), 0)
        last_page = max(min(last_page+1, len(inputpdf.pages)), 0)

        doc_root = pdf_doc_path[:-4]
        target = f'{doc_root}-{first_page}:{last_page}.pdf'

        for i in range(first_page, last_page):
            output.add_page(inputpdf.pages[i])

        with open(target, "wb") as outputStream:
            output.write(outputStream)

        try:
            yield target
        finally:
            os.remove(target)


def number_of_pages(pdf_doc_path: str) -> int:
    with open(pdf_doc_path, "rb") as f:
        inputpdf = PdfReader(f)
        return len(inputpdf.pages)


def doc_id(docpath: str) -> str:
    """Standardized ID"""
    return docpath.split('/')[-1].split('.')[0].lower().replace(' ', '-')
