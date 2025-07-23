import json
import redis.asyncio as redis_client
from app.core.config import get_settings

settings = get_settings()

redis = redis_client.from_url(
    settings.redis_url,
    decode_responses=True,
)

async def get_cached(req_id: str) -> dict | None:
    data = await redis.get(req_id)
    return json.loads(data) if data else None

async def set_cached(req_id: str, payload: dict, expiration: int = 24 * 60 * 60) -> None:
    await redis.set(req_id, json.dumps(payload), ex=expiration)
