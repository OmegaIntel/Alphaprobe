MATCHING_QA_TO_INDUSTRIES_PROMPT = """
You are given in triple quotes a list of questions and answers that express a pereson's interest
in investing into various industries.

Come up with a list of 10 industries that match the person's investment interests.

Return the result in JSON format. Do not use non-JSON tags such as <property> or <UNKNOWN>.

Be mindful of the person's preferences and only choose industries that reflect those preferences.

Use standard NAICS codes and only include one industry per code. Return the codes in your JSON.
"""
