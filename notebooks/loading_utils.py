"""A few utils helpful for loading."""

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


def get_initial_pages(pdf_doc_path: str, pmin=0, pmax=5) -> str:
    """Extract a specific number of pages from a PDF doc"""
    with open(pdf_doc_path, "rb") as f:
      inputpdf = PdfReader(f)
      output = PdfWriter()

      pmin = min(pmin, len(inputpdf.pages))
      pmax = min(pmax, len(inputpdf.pages))

      doc_root = pdf_doc_path[:-4]
      target = f'{doc_root}-{pmin}:{pmax}.pdf'

      for i in range(pmin, pmax):
          output.add_page(inputpdf.pages[i])

      with open(target, "wb") as outputStream:
          output.write(outputStream)

      return target
