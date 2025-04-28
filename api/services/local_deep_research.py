import os, requests, asyncio
from ollama_deep_researcher.graph import graph as deep_graph

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")

def generate_with_ollama(prompt: str):
    res = requests.post(
        f"{OLLAMA_URL}/v1/chat/completions",
        json={
            "model": "llama2",
            "messages": [{"role": "user", "content": prompt}]
        },
    )
    res.raise_for_status()
    return res.json()


"""
async def run_local_research(topic: str):
    result = await deep_graph.ainvoke({
        "research_topic": topic,
        "research_loop_count": 0
    })
    return result["running_summary"]

if __name__ == "__main__":
    # 1) Quick HTTP test
    print("=== Ollama HTTP test ===")
    chat = generate_with_ollama("Say hi")
    print(chat)

    # 2) Local-deep-researcher test
    print("\n=== deep_researcher test ===")
    summary = asyncio.run(run_local_research("What is AI?"))
    print(summary)
"""