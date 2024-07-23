import os
import fitz  # PyMuPDF
import pandas as pd
import argparse

def find_files(source_folder):
    files = []
    for root, _, filenames in os.walk(source_folder):
        for filename in filenames:
            files.append(os.path.join(root, filename))
    return files

def convert_pdf_to_text(pdf_path, text_path):
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        
        with open(text_path, 'w', encoding='utf-8') as text_file:
            text_file.write(text)
    except Exception as e:
        print(f"Error converting {pdf_path}: {e}")

def convert_xlsm_to_text(xlsm_path, text_path):
    try:
        excel_file = pd.ExcelFile(xlsm_path, engine='openpyxl')
        all_text = ""
        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            all_text += df.to_csv(index=False)
        
        with open(text_path, 'w', encoding='utf-8') as text_file:
            text_file.write(all_text)
    except Exception as e:
        print(f"Error converting {xlsm_path}: {e}")

def convert_xlsx_to_text(xlsx_path, text_path):
    try:
        df = pd.read_excel(xlsx_path, engine='openpyxl')
        text = df.to_csv(index=False)
        
        with open(text_path, 'w', encoding='utf-8') as text_file:
            text_file.write(text)
    except Exception as e:
        print(f"Error converting {xlsx_path}: {e}")

def maintain_structure_and_convert(source_folder, target_folder):
    files = find_files(source_folder)
    
    for file in files:
        relative_path = os.path.relpath(file, source_folder)
        file_extension = os.path.splitext(file)[1].lower()
        text_path = os.path.join(target_folder, os.path.splitext(relative_path)[0] + '.txt')
        
        os.makedirs(os.path.dirname(text_path), exist_ok=True)
        
        if file_extension == '.pdf':
            convert_pdf_to_text(file, text_path)
        elif file_extension == '.xlsm':
            convert_xlsm_to_text(file, text_path)
        elif file_extension == '.xlsx':
            convert_xlsx_to_text(file, text_path)
        else:
            print(f"Warning: Unsupported file extension '{file_extension}' for file {file}. Skipping.")

def main():
    parser = argparse.ArgumentParser(description='Convert files to text and maintain folder structure.')
    parser.add_argument('source_folder', type=str, help='The source folder containing files.')
    parser.add_argument('target_folder', type=str, help='The target folder where text files will be saved.')

    args = parser.parse_args()

    maintain_structure_and_convert(args.source_folder, args.target_folder)

if __name__ == "__main__":
    main()
