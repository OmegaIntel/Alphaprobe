import os
from typing import Any, Optional
from dataclasses import dataclass, fields
from langchain_core.runnables import RunnableConfig
from api.services.researcher.prompts import DEFAULT_REPORT_STRUCTURE

# ------------------------ Configuration ------------------------


@dataclass(kw_only=True)
class Configuration:
    """The configurable fields for the chatbot."""

    report_structure: str = DEFAULT_REPORT_STRUCTURE
    number_of_queries: int = 2
    tavily_topic: str = "general"
    tavily_days: Optional[str] = None

    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> "Configuration":
        print("[DEBUG] Entering Configuration.from_runnable_config")
        configurable = (
            config["configurable"] if config and "configurable" in config else {}
        )
        values: dict[str, Any] = {
            f.name: os.environ.get(f.name.upper(), configurable.get(f.name))
            for f in fields(cls)
            if f.init
        }
        result = cls(**{k: v for k, v in values.items() if v})
        print("[DEBUG] Exiting Configuration.from_runnable_config with values:", result)
        return result
