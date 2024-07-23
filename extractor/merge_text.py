import os
import argparse

def merge_text_files(input_dir, output_file):
    with open(output_file, 'w') as outfile:
        for root, _, files in os.walk(input_dir):
            for file in files:
                if file.endswith('.txt'):
                    file_path = os.path.join(root, file)
                    with open(file_path, 'r') as infile:
                        content = infile.read()
                        outfile.write(f"--- Start of {file} ---\n")
                        outfile.write(f"Path: {file_path}\n")
                        outfile.write(content)
                        outfile.write(f"\n--- End of {file} ---\n\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge text files from subfolders into a single file")
    parser.add_argument('input_directory', type=str, help="Path to the input directory containing text files")
    parser.add_argument('output_file_path', type=str, help="Path to the output file to save merged content")
    
    args = parser.parse_args()
    
    merge_text_files(args.input_directory, args.output_file_path)
