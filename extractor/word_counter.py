import os
import argparse

def find_text_files(source_folder):
    text_files = []
    for root, _, files in os.walk(source_folder):
        for file in files:
            if file.lower().endswith('.txt'):
                text_files.append(os.path.join(root, file))
    return text_files

def count_words_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
        words = content.split()
        return len(words)

def word_count_per_subfolder(source_folder):
    word_counts = {}
    text_files = find_text_files(source_folder)
    
    for text_file in text_files:
        relative_path = os.path.relpath(text_file, source_folder)
        subfolder = os.path.dirname(relative_path)
        
        word_count = count_words_in_file(text_file)
        
        if subfolder not in word_counts:
            word_counts[subfolder] = []
        
        word_counts[subfolder].append((relative_path, word_count))
    
    return word_counts

def main():
    parser = argparse.ArgumentParser(description='Calculate word count in all text files in a folder and its subfolders, and print subtotal word count for each subfolder and file.')
    parser.add_argument('source_folder', type=str, help='The source folder containing text files.')

    args = parser.parse_args()
    
    word_counts = word_count_per_subfolder(args.source_folder)
    total_word_count = 0
    
    for subfolder, files in word_counts.items():
        subfolder_total = 0
        print(f"Subfolder: {subfolder}")
        for file_path, word_count in files:
            print(f"  File: {file_path} - Word count: {word_count}")
            subfolder_total += word_count
        print(f"Subtotal word count for subfolder '{subfolder}': {subfolder_total}\n")
        total_word_count += subfolder_total
    
    print(f"Total word count for all files: {total_word_count}")

if __name__ == "__main__":
    main()
