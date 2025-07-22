from functools import lru_cache
from pydantic import Field, AnyUrl
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str = Field(..., env='OPENAI_API_KEY')
    api_keys: str = Field(..., env='API_KEYS')
    redis_url: str = Field('redis://redis:6379/0', env='REDIS_URL')
    poll_interval: int = Field(60, env='POLL_INTERVAL')
    cities: dict[str, AnyUrl] = Field(..., env='CITIES')

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'

@lru_cache()
def get_settings() -> Settings:
    return Settings()
