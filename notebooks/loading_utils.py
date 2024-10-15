"""A few utils helpful for loading."""

import os
from contextlib import contextmanager

from pypdf import PdfWriter, PdfReader


def new_lines_to_list(obj: object) -> object:
    """Replaces new lines with lists in strings"""
    assert type(obj) in (dict, list)

    if isinstance(obj, dict):
        key_vals = list(obj.items())
    else:
        key_vals = list(enumerate(obj))
    for k, v in key_vals:
        if isinstance(v, str):
            if '\n' in v:
                arr = v.split('\n')
                obj[k] = arr
        elif type(v) in (dict, list):
            obj[k] = new_lines_to_list(v)
    return obj



@contextmanager
def extract_pages(pdf_doc_path: str, first_page=0, last_page=5):
    """Extract specific consecutive pages from a PDF doc"""
    with open(pdf_doc_path, "rb") as f:
        inputpdf = PdfReader(f)
        output = PdfWriter()

        first_page = min(first_page, len(inputpdf.pages))
        last_page = min(last_page, len(inputpdf.pages))

        doc_root = pdf_doc_path[:-4]
        target = f'{doc_root}-{first_page}:{last_page}.pdf'

        for i in range(first_page, last_page+1):
            output.add_page(inputpdf.pages[i])

        with open(target, "wb") as outputStream:
            output.write(outputStream)

        try:
            yield target
        finally:
            os.remove(target)
