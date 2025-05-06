import os
import ast
import subprocess
from typing import List, Dict

def get_python_files(directory: str) -> List[str]:
    """Recursively find all Python files in the given directory."""
    python_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                python_files.append(os.path.join(root, file))
    return python_files

def check_import_errors(file_path: str) -> List[str]:
    """Check for import errors in a Python file."""
    errors = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename=file_path)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import) or isinstance(node, ast.ImportFrom):
                try:
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            __import__(alias.name)
                    elif isinstance(node, ast.ImportFrom):
                        __import__(node.module)
                except ImportError as e:
                    errors.append(f"Import error in {file_path}: {e}")
    except Exception as e:
        errors.append(f"Error parsing {file_path}: {e}")
    return errors

def find_unused_functions_and_imports(directory: str) -> Dict[str, List[str]]:
    """Find unused functions and imports using vulture."""
    result = {"unused_functions": [], "unused_imports": []}
    try:
        # Run vulture on the directory
        process = subprocess.run(
            ["vulture", directory],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        output = process.stdout
        for line in output.splitlines():
            if "unused function" in line:
                result["unused_functions"].append(line)
            elif "unused import" in line:
                result["unused_imports"].append(line)
    except FileNotFoundError:
        print("Error: vulture is not installed. Install it using 'pip install vulture'.")
    return result

def main():
    project_dir = os.getcwd()  # Current working directory
    python_files = get_python_files(project_dir)

    # Check for import errors
    import_errors = []
    for file in python_files:
        import_errors.extend(check_import_errors(file))

    # Find unused functions and imports
    unused_items = find_unused_functions_and_imports(project_dir)

    # Output results
    print("\n=== Import Errors ===")
    for error in import_errors:
        print(error)

    print("\n=== Unused Functions ===")
    for func in unused_items["unused_functions"]:
        print(func)

    print("\n=== Unused Imports ===")
    for imp in unused_items["unused_imports"]:
        print(imp)

main()