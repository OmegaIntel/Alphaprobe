# ------------------------ Configuration ------------------------

from dataclasses import dataclass, fields
from typing import Any, Optional
import os
from langchain_core.runnables import RunnableConfig



@dataclass(kw_only=True)
class Configuration:
    """The configurable fields for the chatbot."""
    number_of_queries: int = 2
    tavily_topic: str = "general"
    tavily_days: Optional[str] = None
    section_iterations: int = 3  # Increased from 2 to 3 for deeper research

    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> "Configuration":
        configurable = (
            config["configurable"] if config and "configurable" in config else {}
        )
        values: dict[str, Any] = {
            f.name: os.environ.get(f.name.upper(), configurable.get(f.name))
            for f in fields(cls)
            if f.init
        }
        print(f"[DEBUG] Loaded Configuration values: {values}")
        return cls(**{k: v for k, v in values.items() if v})


