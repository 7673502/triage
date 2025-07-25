import json
import redis.asyncio as redis_client
from app.core.config import get_settings

settings = get_settings()

redis = redis_client.from_url(
    settings.redis_url,
    decode_responses=True,
)

def req_key(city: str, req_id: str) -> str:
    return f'req:{city}:{req_id}'

def open_set_key(city: str) -> str:
    return f'city:{city}:open_ids'

async def cache_request(
    city: str,
    req_id: str,
    payload: dict,
    expiration: int = 24 * 60 * 60
) -> None:
    pipe = redis.pipeline(transaction=False)
    pipe.set(req_key(city, req_id), json.dumps(payload), ex=expiration)
    pipe.sadd(open_set_key(city), req_id)
    await pipe.execute()

async def evict_request(city: str, req_id: str) -> None:
    pipe = redis.pipeline(transaction=False)
    pipe.delete(req_key(city, req_id))
    pipe.srem(open_set_key(city), req_id)
    await pipe.execute()

async def get_cached_ids(city: str) -> set[str]:
    return await redis.smembers(open_set_key(city))

async def is_cached(city: str, req_id: str) -> bool:
    if await redis.sismember(open_set_key(city), req_id):
        return True
    return await redis.exists(req_key(city, req_id)) == 1

async def get_request(city: str, req_id: str) -> dict | None:
    data = await redis.get(req_key(city, req_id))
    return json.loads(data) if data else None

async def mget_requests(city: str) -> list[dict]:
    req_ids = await redis.smembers(open_set_key(city))
    if not req_ids:
        return []
    
    keys = [req_key(city, req_id) for req_id in req_ids]

    raw_reqs = await redis.mget(keys)

    items = [json.loads(req) for req in raw_reqs if req]

    return items
