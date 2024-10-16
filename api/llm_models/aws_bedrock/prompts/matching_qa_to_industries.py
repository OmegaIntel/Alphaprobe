MATCHING_QA_TO_INDUSTRIES_PROMPT_OLD = """
You are given in triple quotes a list of questions and answers that express a pereson's interest
in investing into various industries.

Come up with a list of 5-10 industries that match the person's interest.

Return the result in JSON format. Do not use non-JSON tags such as <property> or <UNKNOWN>.

Be mindful of the person's preferences and only choose industries that reflect those interests.

Use standard NAICS codes and only include one industry per code. Return the codes in your JSON.
"""

# Also supply their NAICS codes.
# The enclosed document includes a list of industries from which you can choose your recommendations.


MATCHING_QA_TO_INDUSTRIES_PROMPT = """
You are given in triple quotes a list of questions and answers that express a pereson's interest
in investing into various industries.

Come up with a list of 10 industries that match the person's investment interests.

Return the result in JSON format. Do not use non-JSON tags such as <property> or <UNKNOWN>.

Be mindful of the person's preferences and only choose industries that reflect those preferences.

Use standard NAICS codes and only include one industry per code. Return the codes in your JSON.

'''
[
  {
    "Question": "What industries or sectors are you most interested in?",
    "Response": "Emerging technologies, sustainable energy, advanced manufacturing"
  },
  {
    "Question": "Do you have expertise or experience in particular industries that you'd like to leverage?",
    "Response": "8 years in robotics engineering, 5 years in renewable energy project management"
  },
  {
    "Question": "What industry characteristics are most important to you?",
    "Response": "High barriers to entry, intellectual property potential"
  },
  {
    "Question": "Are there any specific mega-trends you want to capitalize on?",
    "Response": "Automation and robotics"
  },
  {
    "Question": "Are you more interested in industries with:",
    "Response": "Rapid technological change selected"
  },
  {
    "Question": "Anything else we should consider in coming up with your investment thesis?",
    "Response": "Focus on B2B companies with scalable solutions and potential for international markets"
  }
]
'''
"""