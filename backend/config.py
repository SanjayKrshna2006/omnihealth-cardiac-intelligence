from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    anthropic_api_key: str = "mock-dev-key"
    langchain_api_key: Optional[str] = None
    langchain_tracing_v2: bool = False
    langchain_project: str = "omnihealth"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "omnihealth"
    secret_key: str = "omnihealth-dev-secret-key-change-in-production"
    ecg_model_path: str = "./models/ecg_model.pt"
    echo_model_path: str = "./models/echo_model.pt"
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 100
    environment: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()
