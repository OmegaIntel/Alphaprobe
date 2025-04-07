import os
from dataclasses import dataclass, fields
from typing import Any, Optional, Dict
from langchain_core.runnables import RunnableConfig


@dataclass(kw_only=True)
class Configuration:
    """The configurable fields for the chatbot."""

    number_of_queries: int = 2
    tavily_topic: str = "general"
    tavily_days: Optional[str] = None
    section_iterations: int = 3

    @classmethod
    def from_runnable_config(cls, config: Optional[RunnableConfig] = None) -> "Configuration":
        """Creates a Configuration instance from a RunnableConfig.
        Args:
            config (Optional[RunnableConfig]): The runnable configuration.
        Returns:
            Configuration: An instance of the Configuration class.
        """
        configurable: Dict[str, Any] = (config["configurable"] if config and "configurable" in config else {})
        values: Dict[str, Any] = {
            f.name: os.environ.get(f.name.upper(), configurable.get(f.name))
            for f in fields(cls)
            if f.init
        }
        return cls(**{k: v for k, v in values.items() if v is not None})
