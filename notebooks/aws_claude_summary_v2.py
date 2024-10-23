# # Rely on LLM's to extract info from docs
# 
# Will save them in JSON for future reuse.

# this is a command line script that takes the filename as the argument
# and produces the summary in the default place.

import os
import boto3
import json
import time
from typing import List
import pickle
import sys

from llama_index.core import Document

from Templates.aws_markdown_template import TEMPLATE as MARKDOWN_TEMPLATE
from Templates.ibis_aws_summary_template_all import TEMPLATE as IBIS_SUMMARY_TEMPLATE
from Templates.aws_section_page_number_template import TEMPLATE as page_number_template
from Templates.aws_templates_common import build_aws_template

from api.doc_parser.pdf_utils import extract_pages, number_of_pages

import logging
logging.basicConfig(
    filename='summary.log',
    encoding='utf-8',
    filemode='a',
    format="{asctime} - {levelname} - {message}",
    style="{",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO
)

loginfo = logging.info


from dotenv import load_dotenv
load_dotenv()

SLEEP_SUCCESS = .1   # seconds
SLEEP_FAILURE =  1   # seconds

AWS_REGION_NAME = 'us-west-2'       # older model
model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

# AWS_REGION_NAME = 'us-east-1'     # newer model
# model_id = "anthropic.claude-3-5-sonnet-20240620-v1:0"

aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')


PDF_LOCATION = sys.argv[1]

loginfo(f'Started processing {PDF_LOCATION}')

def doc_id(docpath: str) -> str:
    """Standardized ID"""
    # TODO: move elsewhere
    return docpath.split('/')[-1].split('.')[0].lower().replace(' ', '-')


DOC_ID = doc_id(PDF_LOCATION)
OUTPUT_FOLDER = f'./rag_outputs/{DOC_ID}'
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

JSON_PATH = f"{OUTPUT_FOLDER}/section_summaries.json"
if os.path.exists(JSON_PATH):
    loginfo(f"FOUND EXISTING SUMMARY {JSON_PATH}, SKIPPING")

PAGES_PICKLE_PATH = os.path.join(OUTPUT_FOLDER, f"_{model_id}_pages.pkl")


# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/bedrock-runtime.html
bedrock = boto3.client(
    service_name='bedrock-runtime',
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key,
    region_name=AWS_REGION_NAME
)

MARKDOWN_PROMPT = """
We are sequentially converting a pdf document page by page to markdown format. You are an expert in converting the given PDF content to a Markdown representation.

Follow these instructions to complete the task:
- Infer the headings and subheadings of the given content with their levels from the appearance and semantic context. Generally, the larger font size, more visible color, and boldface indicate a lower level of the heading. For example, level 1 headings are expected to be more prominent than level 2 headings.
- Depending on the level of the section, you use an appropriate number of hash signs (#) to mark their headers in markdown format. # for level 1, ## for level 2, ### for level 3 and so on.
- The provided content may start from any page of the document. So the heading at first does not necessarily mean a level 1 heading.
- Do not insert any new content. Just convert the existing content to Markdown format while keeping the structure.
- Text is converted as it is. If the text is present in conflicting format that can be confusing, please interpret the text correctly and convert it to markdown.
- For visuals such as graphs, plots and figures, interpret them, be objective and explain the interpretation of data in detail with numbers and use that explanation in place of the visuals. Explanation provided should capture all the data insights that can be inferred from the figure. Use your best judgement to interpret the visuals.
- For tables, convert them to markdown table format without any explanation.
- The output should be in markdown format. Do not modify any content. 
Next is the pdf content:\n\n
"""


def get_raw_pdf_part(filename: str) -> dict:
    """This works best and parses quickly."""
    with open(filename, 'rb') as f:
        content = f.read()
        return {
            "document": {
                "format": "pdf",
                "name": 'document',
                "source": {
                    "bytes": content
                }
            }
        }


def response_to_template(filename: str, template: dict, prompt: str) -> dict:
    initial_message = {
        "role": "user",
        "content": [
            {
                "text": prompt,
            },
        ],
    }

    initial_message['content'].append(get_raw_pdf_part(filename))

    tool_list = [{
        "toolSpec": template
    }]
    response = bedrock.converse(
        modelId=model_id,
        messages=[initial_message],
        inferenceConfig={
            "temperature": 0
        },
        toolConfig={
            "tools": tool_list,
            "toolChoice": {
                "tool": {
                    "name": "info_extract"
                }
            }
        }
    )
    core_response = response['output']['message']['content'][0]['toolUse']['input']
    if 'properties' in core_response:
        core_response: dict = core_response['properties']
    for k, v in core_response.items():
        if isinstance(v, str) and v[0] in '{[' and v[-1] in ']}':
            try:
                core_response[k] = json.loads(v)
            except Exception:
                pass

    return core_response


def info_from_doc_template(filename: str, template: dict, prompt: str, **kwargs) -> dict:
    """Populate the separate templates and merge the result."""

    template_parts = template['data']
    full_templates = build_aws_template(template_parts)
    results = [response_to_template(filename, part, prompt, **kwargs) for part in full_templates]

    total = {}
    for result in results:
        total.update(result)

    return total


def extract_markdown(filename: str, first_page: int, last_page: int) -> dict:
    with extract_pages(filename, first_page=first_page, last_page=last_page+1) as pages_filename:
        return info_from_doc_template(filename=pages_filename, template=MARKDOWN_TEMPLATE, prompt=MARKDOWN_PROMPT)


def sequentially_process_pdf(filename, np=1):
    # find total number of pages in the pdf document
    total_pages = number_of_pages(filename)

    results = []
    skipped_pages = []
    for i in range(0, total_pages, np):
        loginfo(f"Processing pages {i} to {i+np-1}")
        with extract_pages(filename, first_page=i, last_page=i+np-1) as pages_filename:
            failures = 0
            success = False
            result = None
            while (not success) and (failures < 3):
                try:
                    result = info_from_doc_template(filename=pages_filename, template=MARKDOWN_TEMPLATE, prompt=MARKDOWN_PROMPT)
                    success = True
                    time.sleep(SLEEP_SUCCESS)
                except Exception as e:
                    loginfo(f"Error processing page {i+1}")
                    loginfo(str(e))
                    failures += 1
                    loginfo(f"Retrying in {SLEEP_FAILURE} seconds.")
                    time.sleep(SLEEP_FAILURE)
                    if failures == 3:
                        result = {
                            'markdown': "**skipped**",
                        }
                        loginfo(f"Failed to process page {i+1} after 3 attempts.")
                        skipped_pages.append(i+1)
            results.append(result)

    loginfo(f" Had to skip pages: {len(skipped_pages)}")
    return results, skipped_pages


# # Phase 2 : Load documents and do post processing to correct the heading structure

# load pickle file if it exists
if os.path.exists(PAGES_PICKLE_PATH):
    with open(PAGES_PICKLE_PATH, 'rb') as f:
        parsed_result = pickle.load(f)
        documents = parsed_result['parsed_documents']
else:
    results, skipped_pages = sequentially_process_pdf(PDF_LOCATION, np=1)
    loginfo(f'LEN OF RESULTING PAGES:{len(results)}')

    documents = []
    for i, response in enumerate(results):
        doc = Document(text=results[i]['markdown'], metadata={"page_number": i+1})
        documents.append(doc)
    parsed_result = {"parsed_documents": documents, "skipped_pages": skipped_pages}
    pickle.dump(parsed_result, open(PAGES_PICKLE_PATH, 'wb'))


def response_to_text(content_text: str, template: dict, main_prompt: str, system_prompt: str, final_prompt: str, tool_name: str="info_extract") -> dict:
    initial_message = {
        "role": "user",
        "content": [
            {
                "text": main_prompt,
            },
        ],
    }

    initial_message['content'].append({"text": content_text})
    if final_prompt is not None:
        initial_message['content'].append({"text": final_prompt})

    tool_list = [{
        "toolSpec": template
    }]
    response = bedrock.converse(
        modelId=model_id,
        messages=[initial_message],
        inferenceConfig={
            "temperature": 0,
        },
        toolConfig={
            "tools": tool_list,
            "toolChoice": {
                "tool": {
                    "name": tool_name
                }
            }
        }
    )
    core_response = response['output']['message']['content'][0]['toolUse']['input']
    if 'properties' in core_response:
        core_response: dict = core_response['properties']
    for k, v in core_response.items():
        if isinstance(v, str) and v[0] in '{[' and v[-1] in ']}':
            try:
                core_response[k] = json.loads(v)
            except Exception:
                pass

    return core_response, response


docs = [document.text for document in documents]
# iterate over docs and see if the first sentence contains the title, then remove the whole line from the text
all_sentences = []
for i, doc in enumerate(docs):
    sentences = doc.split("\n")
    all_sentences.append(sentences)


all_titles = []
for i, sentences in enumerate(all_sentences):
    page_headings = []
    for j, sentence in enumerate(sentences):
        # sentence is a heading if it starts with # or ## or ### or #### or #####
        if sentence.startswith("#"):
            page_headings.append(sentence)
    all_titles.append(page_headings)

# print(len(all_titles))
# all_titles[:5]


PAGE_TITLE_PROMPT = """ You are expert in determining the page numbers where a specific section begins from the list of titles and corresponding page numbers.
There are 6 sections in the document: ["Industry at a Glance", "Supply Chain", "Competitive Landscape", "Costs & Operations", "Questions for Owners", "Datatables & Glossary"]
Section 1: Industry at a Glance contains subsections such as Key Statistics, Executive Summary, Current Performance, Future Outlook, Industry Definition, Industry Impact, SWOT Analysis, Key Trends.
Section 2: Supply Chain contains subsections such as External drivers, Supply Chain, Similar Industries, Related International Industries, Products & Services, Demand Determinants, Market Segmentation, Business Locations
Section 3: Competitive Landscape contains subsections such as Basis of Competition, Barriers to Entry, Market Share Concentration, Industry Globalization
Section 4: Costs & Operations contains subsections such as Cost Structure, Capital Intensity, Revenue Volatility, Regulation & Policy, Industry Assistance
Section 5: Questions for Owners contains some questions and answers
Section 6: Datatables & Glossary contains some tables for Industry Data and glossary of industry terms.
You will be given a list of titles parsed from pdf and the corresponding page number where each title was parsed from. Each title begins in a new line with a page number as prefix enclosed in angle brackets <>.
Use the given information and your best jusdgement to determine the page number where each section begins.
Use the tool to output the page numbers in json format. If you are not sure about any section, output 0.
"""


def get_page_numbers_for_sections(all_titles: List[List[str]]):
    template = page_number_template
    template_parts = template['data']
    page_title_template = build_aws_template(template_parts, tool_name="page_number_inference")[0]

    #add page number as prefix to each title
    all_titles_with_page = []
    for i, titles in enumerate(all_titles):
        titles_with_page = [f"<Page {i+1}> {title}" for title in titles]
        all_titles_with_page.extend(titles_with_page)
    # print(all_titles_with_page)
    titles_text = "\n".join(all_titles_with_page)
    num_failed = 0
    response = None
    response_raw = None
    while num_failed < 5:
        try:     
            response, response_raw = response_to_text(titles_text, page_title_template, PAGE_TITLE_PROMPT, None, None, tool_name="page_number_inference")
            break
        except Exception as e:
            loginfo(f"Failed to get page numbers for sections. Retrying in {SLEEP_FAILURE} seconds.")
            loginfo(str(e))
            time.sleep(SLEEP_FAILURE)
            num_failed += 1
    return response, response_raw


def get_page_mapping_list(page_mapping, sections_names):
    if page_mapping is None:
        page_mapping = [0]*len(sections_names)
    page_mapping_list = []

    total_pages = number_of_pages(PDF_LOCATION)
    for sec_ix, sec in enumerate(sections_names):
        sec_mod = sec.lower().replace(' & ','_').replace(' ', '_')
        f_p = page_mapping[sec_mod]
        prev_ix = sec_ix-1
        while f_p == 0 and prev_ix >= 0:
            prev_sec = sections_names[prev_ix].lower().replace(' & ','_').replace(' ', '_')
            f_p = page_mapping[prev_sec]
            prev_ix -= 1   
        if f_p == 0:
            f_p = 1
        
        if sec_ix == len(sections_names)-1:
            e_p = total_pages
        else:
            sec_next = sections_names[sec_ix+1].lower().replace(' & ','_').replace(' ', '_')
            e_p = min(page_mapping[sec_next], total_pages)
        next_ix = sec_ix+1
        while e_p == 0 and next_ix < len(sections_names):
            next_sec = sections_names[next_ix].lower().replace(' & ','_').replace(' ', '_')
            e_p = page_mapping[next_sec]
            next_ix += 1
        if e_p == 0:
            e_p = total_pages
        page_mapping_list.append((sec, f_p, e_p))
    return page_mapping_list
        

# # Phase 3: Extract info from respective section


INFO_EXTRACTION_PROMPT = """
You are an expert in extracting market and financial data from documents.
Use the given tool to extract essential data from text in the enclosed document. Do not make any assumptions or add any information that is not present in the text.

Return the result in JSON format. Do not use non-JSON tags. If some numeric data is not present in the text, simply output the number 101 as an answer where numeric data is expected.
For titles and names, limit the output to 20 words. For descriptions and key points, limit the output to 50 words.
"""

def get_section_text(docs, start_page, end_page):
    section_text = []
    for i in range(start_page-1, end_page):
        section_text.append(docs[i])
    return "\n".join(section_text)    


def extract_info_for_section(docs, template, main_prompt, start_page, end_page):
    section_text = get_section_text(docs, start_page, end_page)
    num_failed = 0
    result = None
    while num_failed < 2:
        try:
            result = response_to_text(section_text, template, main_prompt, None, None)
            break
        except Exception as e:
            num_failed += 1
            loginfo(f"Error: {e}")
            loginfo(f"Failed {num_failed} times. Sleeping for {SLEEP_FAILURE} seconds.")
            time.sleep(SLEEP_FAILURE)
    return result

def extract_info_for_all_sections(page_mapping_list, full_templates, docs):
    section_summaries = []
    raw_responses = []
    for idx, elem in enumerate(page_mapping_list):
        loginfo(f"Extracting for section {elem}")
        section_name, start_page, end_page = elem
        if idx >= len(full_templates):
            break
        section_summary, raw_response = extract_info_for_section(docs, full_templates[idx], INFO_EXTRACTION_PROMPT, start_page, end_page)
        section_summaries.append(section_summary)
        raw_responses.append(raw_response)
        loginfo(f"Extracted for section {section_name}")
        loginfo(f"Sleeping for {SLEEP_SUCCESS} seconds.")
        time.sleep(SLEEP_SUCCESS)
    return section_summaries, raw_responses


sections_names = ["Industry at a Glance", "Supply Chain", "Competitive Landscape", "Costs & Operations", "Questions for Owners", "Datatables & Glossary"]

page_mapping, page_response_raw = get_page_numbers_for_sections(all_titles)



# print(page_mapping)
page_mapping_list = get_page_mapping_list(page_mapping, sections_names)
# print(page_mapping_list)


template_parts = IBIS_SUMMARY_TEMPLATE['data']
full_templates = build_aws_template(template_parts)

pickle.dump((page_mapping, page_response_raw), open(f"{OUTPUT_FOLDER}/page_mappings.pkl", "wb"))
# print(full_templates)
section_summaries, raw_responses = extract_info_for_all_sections(page_mapping_list, full_templates, docs)

section_results = {"section_summaries": section_summaries, "raw_responses": raw_responses}

pickle.dump(section_results, open(f"{OUTPUT_FOLDER}/section_summaries.pkl", "wb"))


# print("SECTION SUMMARIES 2")
# print(section_summaries[2])


# COMMENTED OUT DUE TO FAILURES
# report_md = build_markdown_report.build_markdown_report_func(section_summaries)
# print(report_md)
# save the markdown report
# with open(f"{OUTPUT_FOLDER}/summary_report.md", "w") as file:
#     file.write(report_md)

with open(JSON_PATH, "w") as f:
    json.dump(section_summaries, f, indent=4)

# from Templates.build_markdown_report import report_order
# report_order_json_path = f"{OUTPUT_FOLDER}/report_order.json"
# with open(report_order_json_path, "w") as f:
#     json.dump(report_order, f, indent=4)

loginfo(f'Finished processing processing {PDF_LOCATION}')
