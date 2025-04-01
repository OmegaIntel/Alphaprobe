from typing import Dict, List, Any
import json
import pandas as pd
import io
from .utils import format_table_as_html, convert_table_to_dataframe
from common_logging import loginfo, logerror

# Constants for visualization types
VIZ_TYPES = {
    "BAR": "bar",
    "LINE": "line",
    "PIE": "pie",
    "SCATTER": "scatter",
    "HEATMAP": "heatmap",
    "AREA": "area",
    "TABLE": "table",
    "MAP": "map"
}

class VisualizationIntegration:
    """
    Handles integration with various visualization libraries and formats
    to support multiple front-end visualization tools.
    """
    
    @staticmethod
    def convert_to_plotly_format(chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert our standard chart data format to Plotly compatible format
        """
        chart_type = chart_data.get("chart_type", "bar").lower()
        
        # Base plotly layout
        layout = {
            "title": chart_data.get("title", ""),
            "xaxis": {"title": chart_data.get("x_label", "")},
            "yaxis": {"title": chart_data.get("y_label", "")},
            "template": "plotly_white"
        }
        
        # Base data structure
        data = []
        
        # Convert based on chart type
        if chart_type == "bar":
            data.append({
                "type": "bar",
                "x": chart_data.get("labels", []),
                "y": chart_data.get("values", []),
                "marker": {"color": "rgb(55, 83, 109)"}
            })
        
        elif chart_type == "line":
            data.append({
                "type": "scatter",
                "mode": "lines+markers",
                "x": chart_data.get("labels", []),
                "y": chart_data.get("values", []),
                "line": {"color": "rgb(26, 118, 255)"}
            })
        
        elif chart_type == "pie":
            data.append({
                "type": "pie",
                "labels": chart_data.get("labels", []),
                "values": chart_data.get("values", []),
                "hole": 0.4
            })
        
        elif chart_type == "scatter":
            data.append({
                "type": "scatter",
                "mode": "markers",
                "x": chart_data.get("labels", []),
                "y": chart_data.get("values", []),
                "marker": {"color": "rgb(242, 54, 69)"}
            })
        
        return {
            "data": data,
            "layout": layout
        }
    
    @staticmethod
    def convert_to_highcharts_format(chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert our standard chart data format to Highcharts compatible format
        """
        chart_type = chart_data.get("chart_type", "bar").lower()
        
        # Base highcharts config
        config = {
            "chart": {
                "type": chart_type if chart_type != "line" else "spline"
            },
            "title": {
                "text": chart_data.get("title", "")
            },
            "xAxis": {
                "categories": chart_data.get("labels", []),
                "title": {
                    "text": chart_data.get("x_label", "")
                }
            },
            "yAxis": {
                "title": {
                    "text": chart_data.get("y_label", "")
                }
            },
            "credits": {
                "enabled": False
            }
        }
        
        # Add series data based on chart type
        if chart_type == "pie":
            config["series"] = [{
                "name": "Value",
                "colorByPoint": True,
                "data": [
                    {"name": label, "y": value}
                    for label, value in zip(
                        chart_data.get("labels", []),
                        chart_data.get("values", [])
                    )
                ]
            }]
        else:
            config["series"] = [{
                "name": chart_data.get("y_label", "Value"),
                "data": chart_data.get("values", [])
            }]
        
        return config
    
    @staticmethod
    def convert_to_chartjs_format(chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert our standard chart data format to Chart.js compatible format
        """
        chart_type = chart_data.get("chart_type", "bar").lower()
        
        # Standard colors
        colors = [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(153, 102, 255, 0.8)'
        ]
        
        # Base chartjs config
        config = {
            "type": chart_type,
            "data": {
                "labels": chart_data.get("labels", []),
                "datasets": [{
                    "label": chart_data.get("y_label", "Value"),
                    "data": chart_data.get("values", []),
                    "backgroundColor": colors[0] if chart_type != "line" else 'rgba(54, 162, 235, 0.1)',
                    "borderColor": 'rgba(54, 162, 235, 1)',
                    "borderWidth": 1
                }]
            },
            "options": {
                "responsive": True,
                "title": {
                    "display": True,
                    "text": chart_data.get("title", "")
                },
                "scales": {}
            }
        }
        
        # Adjust specific options based on chart type
        if chart_type == "pie":
            config["data"]["datasets"][0]["backgroundColor"] = colors
            config["options"]["scales"] = {}  # No scales for pie chart
        else:
            config["options"]["scales"] = {
                "y": {
                    "title": {
                        "display": True,
                        "text": chart_data.get("y_label", "")
                    }
                },
                "x": {
                    "title": {
                        "display": True,
                        "text": chart_data.get("x_label", "")
                    }
                }
            }
        
        return config
    
    @staticmethod
    def convert_to_d3_format(chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert our standard chart data format to D3.js compatible format
        """
        chart_type = chart_data.get("chart_type", "bar").lower()
        
        # For D3, we typically need to combine labels and values
        d3_data = []
        for i, (label, value) in enumerate(zip(
            chart_data.get("labels", []),
            chart_data.get("values", [])
        )):
            d3_data.append({
                "label": label,
                "value": value,
                "color": f"hsl({i * 360 / len(chart_data.get('labels', []))}, 70%, 50%)"
            })
        
        return {
            "type": chart_type,
            "title": chart_data.get("title", ""),
            "xLabel": chart_data.get("x_label", ""),
            "yLabel": chart_data.get("y_label", ""),
            "data": d3_data
        }
    
    @staticmethod
    def convert_tables_to_excel(tables: List[Dict[str, Any]]) -> bytes:
        """
        Convert multiple tables to Excel file format
        """
        # Create Excel file in memory
        output = io.BytesIO()
        
        # Use pandas to create a writer
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            for i, table in enumerate(tables):
                # Convert to DataFrame
                df = pd.DataFrame(table.get("rows", []), columns=table.get("headers", []))
                
                # Write to Excel
                sheet_name = f"Table_{i+1}"
                df.to_excel(writer, sheet_name=sheet_name, index=False)
                
                # Get the xlsxwriter workbook and worksheet objects
                workbook = writer.book
                worksheet = writer.sheets[sheet_name]
                
                # Add a header format
                header_format = workbook.add_format({
                    'bold': True,
                    'text_wrap': True,
                    'valign': 'top',
                    'border': 1,
                    'bg_color': '#D9E1F2'
                })
                
                # Write the column headers with the defined format
                for col_num, value in enumerate(df.columns.values):
                    worksheet.write(0, col_num, value, header_format)
                
                # Set column widths
                for col_num, column in enumerate(df.columns):
                    max_width = max(
                        df[column].astype(str).map(len).max(),
                        len(str(column))
                    )
                    worksheet.set_column(col_num, col_num, max_width + 2)
        
        # Reset the buffer position to the beginning
        output.seek(0)
        
        return output.getvalue()
    
    @staticmethod
    def process_all_visualizations(research_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process all visualizations from a research result and add compatible formats
        for various front-end libraries
        """
        result = research_result.copy()
        
        # Process tables
        if "visualization_data" in result and "tables" in result["visualization_data"]:
            tables = result["visualization_data"]["tables"]
            
            # Add HTML versions
            html_tables = []
            for table in tables:
                html_tables.append(format_table_as_html(table))
            
            result["html_tables"] = html_tables
        
        # Process charts
        if "visualization_data" in result and "chart_data" in result["visualization_data"]:
            charts = result["visualization_data"]["chart_data"]
            
            # Add various chart formats
            result["chart_formats"] = {
                "plotly": [VisualizationIntegration.convert_to_plotly_format(chart) for chart in charts],
                "highcharts": [VisualizationIntegration.convert_to_highcharts_format(chart) for chart in charts],
                "chartjs": [VisualizationIntegration.convert_to_chartjs_format(chart) for chart in charts],
                "d3": [VisualizationIntegration.convert_to_d3_format(chart) for chart in charts]
            }
        
        return result