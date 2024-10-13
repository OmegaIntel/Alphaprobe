"""Image-based PDF parsing."""

import os
import pickle

import anthropic

import nest_asyncio
nest_asyncio.apply()

from dotenv import load_dotenv
from pdf2image import convert_from_path
import base64
from llama_index.core import Document

from typing import List, Union
from llama_index.core.schema import TextNode
from api.doc_parser.pdf_parser import PDFParser, PAGE_NUMBER, LINE_NUMBER, LEVEL


load_dotenv()
os.environ["ANTHROPIC_API_KEY"] = os.getenv('ANTHROPIC_API_KEY')


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


IMAGE_PROMPT = """
Given an image of a page from a market research report, your task is to convert all the information on the page into markdown format, preserving the original structure and content.

- Transcribe all text, including paragraphs and headings, verbatim from the page to markdown, maintaining the original format. Do not modify, omit, or add any text.
- If the page includes numerical information with arrows, percentages etc, describe the text in full sentences in markdown format. For example, if there's a box with the text "revenue of wine industry" and an arrow pointing up saying "10% (2015-2020)", describe this as "Revenue of wine industry increased by 10% from 2015 to 2020" instead of just copying the text.
- Do not explain any text that is clearly written in the page, including headings, subheadings, and paragraphs. Copy the text as it is.
- If the text structure is unclear, use your best judgement to format it in markdown.
- If the page contains tables, convert them into markdown table format and provide an explnation as well. Explain all the data that can be inferred from each table. For example, if a table shows sales data for different products, explain the sales trends and patterns with respect to each product. Try to provide as much detail as possible.
- If the page includes a plot or graph, describe it objectively in markdown format. Explain all the details that can be inferred from the plot or graph. For example, if a plot shows sales trends over time, describe the sales trends and patterns observed. Provide a detailed explanation of the data represented in the plot or graph.
- When explaining any component, understand the context of the entire page and be as specific as possible without any ambiguity. The position of the explanation should match the position of the component in the page.
- The output should not contain personal opinions or biases. Do not add personal comments or any information not present on the page. Avoid referring to the page or the report - explain without reference.
- Ensure no important information from the page is missed, as capturing all details is crucial.
"""

SYSTEM_MESSAGE = "You are a profession converter that converts all the details in given image of page of a market research report to markdown format while preserving all the structure."

FINAL_MESSAGE = "Please describe the provided page in markdown format. Strictly follow the criteria mentioned above to describe each component of the page."


def request_claude_with_image(base64_image, model="claude-3-5-sonnet-20240620"):
    responded = False
    num_tries = 0
    failed = 0
    
    while not responded and num_tries < 5:
        num_tries += 1

        client = anthropic.Anthropic()
        response = client.messages.create(
            model=model,
            max_tokens=5000,
            system = SYSTEM_MESSAGE,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": IMAGE_PROMPT},
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": base64_image,
                            },
                        },
                        {"type": "text", "text": FINAL_MESSAGE},
                    ],
                }
            ],
        )
    
        try:
            response_txt = response.content[0].text
            responded = True
            return response_txt, failed
        except:
            failed += 1
            continue
    return None, failed


def ClaudeParse(pdf_path, output_dir_path, model="claude-3-5-sonnet-20240620"):
    # check if outpu_pickle exists
    output_pickle_path = os.path.join(output_dir_path, f"_{model}_pages.pkl")
    if os.path.exists(output_pickle_path):
        return pickle.load(open(output_pickle_path, "rb"))
    
    img_dir = os.path.join(output_dir_path, "_imgs")
    if not os.path.exists(img_dir):
        os.makedirs(img_dir)
    
    images = convert_from_path(pdf_path)
    pages = []
    skipped_pages = 0
    average_failures = 0
    # Iterate over the images
    for i, image in enumerate(images):
        # Define the path to save the image
        image_path = os.path.join(img_dir, f'page_{i+1}.png')

        # Save the image
        image.save(image_path, 'PNG')
        base64_image = encode_image(image_path)
        response, failed = request_claude_with_image(base64_image, model)
        average_failures += failed
        if response is None:
            print(f"Failed to parse the page {i+1} after {failed} tries")
            response = ""
            skipped_pages += 1

        # convert the response to llama-index document
        doc = Document(text=response, metadata={"page_number": i+1})
        pages.append(doc)

    print(f"Average failures in calling claude API: {average_failures/len(images)}")
    print(f"Skipped {skipped_pages} pages out of {len(images)}")

    output_text_path = os.path.join(output_dir_path, f"_{model}_pages.txt")

    # save the pages as txt file for easier debugging
    with open(output_text_path, "w") as f:
        for page in pages:
            #write page number
            f.write(f"***Page {page.metadata['page_number']}***\n\n")
            f.write(page.text)
            f.write("\n")

    pickle.dump(pages, open(output_pickle_path, "wb"))
    return pages


class ClaudeImageParser(PDFParser):
    """Specific parser implementation"""

    def __init__(self, **kwargs):
        self.model = kwargs.get('model', "claude-3-5-sonnet-20240620")
        self.output_dir_path = kwargs.get('output_dir_path', '_temp')

    def _parse_pdf(self, pdf: Union[str, bytes]) -> List[TextNode]:
        assert isinstance(pdf, str) # for now
        pages = ClaudeParse(pdf, self.output_dir_path, self.model)
        print(pages)
        return []
