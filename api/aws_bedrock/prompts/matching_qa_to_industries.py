MATCHING_QA_TO_INDUSTRIES_PROMPT = """
You are given in triple quotes a list of questions and answers
in support of an investment thesis in the private equity domain.

Come up with a list of 5-10 industries that are worth investing into according to the questions and answers.
Also supply their NAICS codes .

Return the result in JSON format. Do not use non-JSON tags such as <property> or <UNKNOWN>.

"""
