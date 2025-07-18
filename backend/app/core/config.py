from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str = Field(..., env='OPENAI_API_KEY')
    redis_url: str = Field('redis://redis:6379/0', env='REDIS_URL')
    poll_interval: int = Field(60, env='POLL_INTERVAL')
    cities: str = Field(..., env='CITIES')
    api_keys: str = Field(..., env='API_KEYS')

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'

@lru_cache()
def get_settings() -> Settings:
    return Settings()
