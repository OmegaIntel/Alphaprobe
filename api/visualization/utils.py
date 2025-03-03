import matplotlib.pyplot as plt
from io import BytesIO
import base64
import pandas as pd
import numpy as np
import json
from typing import Dict, List, Any, Optional
import re
from common_logging import loginfo, logerror

def extract_visualization_data(text: str) -> Dict[str, Any]:
    """
    Extract visualization data from research text:
    - Tables
    - Chart data
    - Image URLs
    """
    result = {
        "tables": extract_tables_from_markdown(text),
        "chart_data": extract_chart_data(text),
        "image_urls": extract_image_urls(text)
    }
    return result

def extract_tables_from_markdown(text: str) -> List[Dict[str, Any]]:
    """
    Extract tables from markdown formatted text
    """
    tables = []
    table_pattern = r'(\|[^\n]+\|\n\|[-:| ]+\|\n(?:\|[^\n]+\|\n)+)'
    
    for table_match in re.finditer(table_pattern, text):
        table_text = table_match.group(1)
        lines = table_text.strip().split('\n')
        
        # Extract headers
        headers = [cell.strip() for cell in lines[0].split('|') if cell.strip()]
        
        # Skip separator line
        rows = []
        for line in lines[2:]:  # Skip header and separator
            row_cells = [cell.strip() for cell in line.split('|') if cell.strip()]
            if len(row_cells) > 0:
                rows.append(row_cells)
        
        # Create table object
        tables.append({
            "headers": headers,
            "rows": rows,
            "caption": f"Table extracted from research"
        })
    
    return tables

def extract_chart_data(text: str) -> List[Dict[str, Any]]:
    """
    Extract chart data from text. Look for potential JSON blocks or infer from tables.
    """
    charts = []
    
    # Try to find JSON chart data
    json_pattern = r'```json\s*(\{.*?\})\s*```'
    json_matches = re.finditer(json_pattern, text, re.DOTALL)
    
    for match in json_matches:
        try:
            data = json.loads(match.group(1))
            if isinstance(data, dict) and "labels" in data and "values" in data:
                charts.append(data)
        except json.JSONDecodeError:
            continue
    
    # If no explicit JSON chart data, try to infer from tables
    if not charts:
        tables = extract_tables_from_markdown(text)
        for i, table in enumerate(tables):
            if len(table["headers"]) >= 2:
                try:
                    # Check if second column can be numeric
                    numeric_values = []
                    for row in table["rows"]:
                        if len(row) >= 2:
                            try:
                                numeric_values.append(float(row[1]))
                            except (ValueError, TypeError):
                                numeric_values.append(None)
                    
                    # Only use if at least 70% of rows have numeric values
                    valid_values = [v for v in numeric_values if v is not None]
                    if len(valid_values) >= 0.7 * len(numeric_values) and len(valid_values) > 0:
                        labels = [row[0] for row in table["rows"] if len(row) >= 2]
                        
                        charts.append({
                            "chart_type": "bar" if len(labels) <= 10 else "line",
                            "title": f"Data from {table['caption']}",
                            "labels": labels,
                            "values": valid_values,
                            "x_label": table["headers"][0],
                            "y_label": table["headers"][1]
                        })
                except Exception as e:
                    # Skip this table if there's any issue
                    continue
    
    return charts

def extract_image_urls(text: str) -> List[str]:
    """
    Extract image URLs from markdown/HTML
    """
    # Match markdown image syntax and HTML img tags
    markdown_pattern = r'!\[.*?\]\((https?://\S+\.(?:jpg|jpeg|gif|png)(?:\?\S+)?)\)'
    html_pattern = r'<img\s+[^>]*src="(https?://\S+\.(?:jpg|jpeg|gif|png)(?:\?\S+)?)"[^>]*>'
    
    markdown_matches = re.findall(markdown_pattern, text)
    html_matches = re.findall(html_pattern, text)
    
    return list(set(markdown_matches + html_matches))


def generate_chart(chart_data: Dict[str, Any], chart_type: Optional[str] = None) -> str:
    """
    Generate a chart image and return as base64 encoded string.
    Handles different data formats and provides error handling.
    """
    try:
        plt.figure(figsize=(10, 6))  # Create a new figure to avoid overlap
        
        # Get chart type
        chart_type = chart_data.get("chart_type", chart_type or "bar").lower()
        
        # Extract data
        labels = chart_data.get("labels", [])
        values = chart_data.get("values", [])
        title = chart_data.get("title", "Chart")
        x_label = chart_data.get("x_label", "")
        y_label = chart_data.get("y_label", "")
        
        # Validate data
        if not labels or not values:
            print(f"⚠️ [generate_chart] Empty data detected: Labels: {labels}, Values: {values}")
            plt.text(0.5, 0.5, "No data available", 
                    horizontalalignment='center', verticalalignment='center')
            plt.title(title)
        else:
            # Ensure we are working with new figures
            plt.clf()

            # Ensure values are numeric
            try:
                values = [float(v) if v is not None else 0 for v in values]
            except (ValueError, TypeError) as e:
                print(f"⚠️ [generate_chart] Error converting values to numeric: {e}")
                plt.text(0.5, 0.5, "Error in data format", 
                        horizontalalignment='center', verticalalignment='center')
                plt.title(title)
                
            # Generate chart
            if chart_type == "bar" and all(v is not None for v in values):
                plt.bar(labels, values, color='skyblue')
                plt.xticks(rotation=45, ha='right')
            
            elif chart_type == "line" and all(v is not None for v in values):
                plt.plot(labels, values, marker='o', linestyle='-', color='green')
                plt.xticks(rotation=45, ha='right')
            
            elif chart_type == "pie" and all(v is not None for v in values) and all(v >= 0 for v in values):
                plt.pie(values, labels=labels, autopct='%1.1f%%', startangle=90)
                plt.axis('equal')
            
            elif chart_type == "scatter" and all(v is not None for v in values):
                plt.scatter(range(len(values)), values, color='purple')
            
            else:  # Default to bar chart
                print(f"⚠️ [generate_chart] Using default bar chart for type: {chart_type}")
                plt.bar(labels, values, color='skyblue')

            # Add labels and title
            plt.title(title)
            if x_label:
                plt.xlabel(x_label)
            if y_label:
                plt.ylabel(y_label)

        # Adjust layout
        plt.tight_layout()

        # Save to BytesIO buffer
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=100)
        plt.close()  # Ensure the figure is closed

        # Convert to base64
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode()

        return f"data:image/png;base64,{img_base64}"
        
    except Exception as e:
        print(f"❌ [generate_chart] Error generating chart: {str(e)}")
        # Create an error image
        plt.figure(figsize=(10, 6))
        plt.text(0.5, 0.5, f"Error generating chart: {str(e)}", 
                horizontalalignment='center', verticalalignment='center')
        plt.title("Chart Generation Error")
        
        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=100)
        plt.close()
        
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_base64}"


def analyze_table_data(table_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform basic analysis on table data and return summary
    """
    df = convert_table_to_dataframe(table_data)
    
    # Initialize results
    analysis = {
        "summary": {},
        "numeric_columns": [],
        "categorical_columns": [],
        "column_stats": {}
    }
    
    # Identify numeric and categorical columns
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            analysis["numeric_columns"].append(col)
            
            # Calculate statistics for numeric columns
            analysis["column_stats"][col] = {
                "min": df[col].min(),
                "max": df[col].max(),
                "mean": df[col].mean(),
                "median": df[col].median(),
                "std": df[col].std()
            }
        else:
            analysis["categorical_columns"].append(col)
            
            # Calculate frequency for categorical columns
            value_counts = df[col].value_counts().to_dict()
            analysis["column_stats"][col] = {
                "unique_values": len(value_counts),
                "top_values": dict(sorted(value_counts.items(), 
                                         key=lambda x: x[1], 
                                         reverse=True)[:5])
            }
    
    # Overall summary
    analysis["summary"] = {
        "row_count": len(df),
        "column_count": len(df.columns),
        "numeric_column_count": len(analysis["numeric_columns"]),
        "categorical_column_count": len(analysis["categorical_columns"])
    }
    
    return analysis

def convert_table_to_dataframe(table_data: Dict[str, Any]) -> pd.DataFrame:
    """
    Convert table data to pandas DataFrame for further analysis
    """
    # Create DataFrame from rows with headers
    df = pd.DataFrame(table_data["rows"], columns=table_data["headers"])
    
    # Try to convert numeric columns
    for col in df.columns:
        try:
            df[col] = pd.to_numeric(df[col])
        except (ValueError, TypeError):
            # Keep as is if conversion fails
            pass
    
    return df

def suggest_visualizations(table_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Suggest appropriate visualizations based on table data
    """
    df = convert_table_to_dataframe(table_data)
    suggestions = []
    
    # Get column types
    numeric_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
    categorical_cols = [col for col in df.columns if not pd.api.types.is_numeric_dtype(df[col])]
    
    # Case 1: One categorical + one numeric column
    if len(categorical_cols) >= 1 and len(numeric_cols) >= 1:
        cat_col = categorical_cols[0]
        num_col = numeric_cols[0]
        
        # Check if categorical column has reasonable number of unique values
        unique_values = df[cat_col].nunique()
        if 2 <= unique_values <= 10:  # Good for bar chart
            suggestions.append({
                "chart_type": "bar",
                "title": f"{num_col} by {cat_col}",
                "x_column": cat_col,
                "y_column": num_col,
                "description": f"Bar chart showing {num_col} for each {cat_col}"
            })
        elif unique_values > 10:  # Better for line chart
            suggestions.append({
                "chart_type": "line",
                "title": f"{num_col} trend by {cat_col}",
                "x_column": cat_col,
                "y_column": num_col,
                "description": f"Line chart showing {num_col} trend across {cat_col}"
            })
    
    # Case 2: Two numeric columns
    if len(numeric_cols) >= 2:
        suggestions.append({
            "chart_type": "scatter",
            "title": f"{numeric_cols[0]} vs {numeric_cols[1]}",
            "x_column": numeric_cols[0],
            "y_column": numeric_cols[1],
            "description": f"Scatter plot showing relationship between {numeric_cols[0]} and {numeric_cols[1]}"
        })
    
    # Case 3: One numeric column (distribution)
    if len(numeric_cols) >= 1:
        suggestions.append({
            "chart_type": "histogram",
            "title": f"Distribution of {numeric_cols[0]}",
            "column": numeric_cols[0],
            "description": f"Histogram showing distribution of {numeric_cols[0]}"
        })
    
    # Case 4: One categorical column with few unique values
    if len(categorical_cols) >= 1:
        cat_col = categorical_cols[0]
        unique_values = df[cat_col].nunique()
        if 2 <= unique_values <= 10:
            suggestions.append({
                "chart_type": "pie",
                "title": f"Distribution of {cat_col}",
                "column": cat_col,
                "description": f"Pie chart showing distribution of {cat_col}"
            })
    
    return suggestions

def format_table_as_html(table_data: Dict[str, Any], include_styles: bool = True) -> str:
    """
    Format table data as HTML for rendering
    """
    if include_styles:
        html = """
        <style>
            .research-table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 1rem;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            }
            .research-table th {
                padding: 10px;
                background-color: #f5f5f5;
                border: 1px solid #ddd;
                font-weight: bold;
                text-align: left;
            }
            .research-table td {
                padding: 8px 10px;
                border: 1px solid #ddd;
                text-align: left;
            }
            .research-table tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .research-table tr:hover {
                background-color: #f0f0f0;
            }
            .table-container {
                overflow-x: auto;
                margin: 20px 0;
            }
            .table-caption {
                font-weight: bold;
                margin-bottom: 10px;
                text-align: center;
            }
        </style>
        """
    else:
        html = ""
    
    html += '<div class="table-container">'
    
    if table_data.get("caption"):
        html += f'<p class="table-caption">{table_data["caption"]}</p>'
    
    html += '<table class="research-table">'
    
    # Header row
    html += '<thead><tr>'
    for header in table_data.get("headers", []):
        html += f'<th>{header}</th>'
    html += '</tr></thead>'
    
    # Data rows
    html += '<tbody>'
    for row in table_data.get("rows", []):
        html += '<tr>'
        for cell in row:
            html += f'<td>{cell}</td>'
        html += '</tr>'
    html += '</tbody></table></div>'
    
    return html

def create_advanced_chart(chart_config: Dict[str, Any], df: pd.DataFrame) -> str:
    """
    Create more advanced charts based on configuration and DataFrame
    """
    plt.figure(figsize=(10, 6))
    chart_type = chart_config.get("chart_type", "").lower()
    
    try:
        if chart_type == "bar":
            x_col = chart_config.get("x_column")
            y_col = chart_config.get("y_column")
            
            # Group by categorical column and compute mean of numeric column
            plot_data = df.groupby(x_col)[y_col].mean().reset_index()
            plt.bar(plot_data[x_col], plot_data[y_col], color='skyblue')
            plt.xticks(rotation=45, ha='right')
            plt.xlabel(x_col)
            plt.ylabel(f"Average {y_col}")
            
        elif chart_type == "line":
            x_col = chart_config.get("x_column")
            y_col = chart_config.get("y_column")
            
            # Sort by x column first if it's datetime or numeric
            try:
                if pd.api.types.is_datetime64_dtype(df[x_col]) or pd.api.types.is_numeric_dtype(df[x_col]):
                    plot_data = df.sort_values(by=x_col)
                else:
                    plot_data = df
            except:
                plot_data = df
                
            plt.plot(plot_data[x_col], plot_data[y_col], marker='o', linestyle='-', color='green')
            plt.xticks(rotation=45, ha='right')
            plt.xlabel(x_col)
            plt.ylabel(y_col)
            
        elif chart_type == "scatter":
            x_col = chart_config.get("x_column")
            y_col = chart_config.get("y_column")
            
            plt.scatter(df[x_col], df[y_col], alpha=0.6, color='purple')
            plt.xlabel(x_col)
            plt.ylabel(y_col)
            
            # Add trendline
            if len(df) > 1:
                try:
                    z = np.polyfit(df[x_col], df[y_col], 1)
                    p = np.poly1d(z)
                    plt.plot(df[x_col], p(df[x_col]), "r--", alpha=0.8)
                except:
                    pass
            
        elif chart_type == "histogram":
            column = chart_config.get("column")
            
            plt.hist(df[column], bins=10, alpha=0.7, color='blue')
            plt.xlabel(column)
            plt.ylabel("Frequency")
            
        elif chart_type == "pie":
            column = chart_config.get("column")
            
            # Get value counts
            counts = df[column].value_counts()
            plt.pie(counts, labels=counts.index, autopct='%1.1f%%', startangle=90)
            plt.axis('equal')
            
        else:  # Default to bar chart
            if len(df.columns) >= 2:
                plt.bar(df.iloc[:, 0], df.iloc[:, 1], color='skyblue')
                plt.xticks(rotation=45, ha='right')
                plt.xlabel(df.columns[0])
                plt.ylabel(df.columns[1])
                
    except Exception as e:
        plt.clf()
        plt.text(0.5, 0.5, f"Error creating chart: {str(e)}", 
                 horizontalalignment='center', verticalalignment='center')
    
    # Add title
    plt.title(chart_config.get("title", "Chart"))
    
    # Tight layout for better appearance
    plt.tight_layout()
    
    # Save to BytesIO buffer
    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=100)
    plt.close()
    
    # Convert to base64
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"