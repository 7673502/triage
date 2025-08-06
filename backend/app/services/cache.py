import json
import time
from datetime import datetime, timezone
import redis.asyncio as redis_client
from app.core.config import get_settings

ONE_HOUR = 3600
settings = get_settings()

redis = redis_client.from_url(
    settings.redis_url,
    decode_responses=True,
)

def req_key(city: str, req_id: str) -> str:
    return f'req:{city}:{req_id}'

def open_set_key(city: str) -> str:
    return f'city:{city}:open_ids'

def priority_sum_key(city: str) -> str:
    return f'city:{city}:priority_sum'

def ts_zset_key(city: str) -> str:
    return f'city:{city}:ts_open'

def global_priority_sum_key() -> str:
    return 'global:priority_sum'

def global_num_open_key() -> str:
    return 'global:num_open'

def global_ts_zset_key() -> str:
    return 'global:ts_open'

async def cache_request(
    city: str,
    req_id: str,
    payload: dict,
    expiration: int = 24 * 60 * 60
) -> None:
    priority = int(payload.get('priority', 0))
    try:
        ts_str = payload.get('requested_datetime')
        ts_epoch = int(datetime.fromisoformat(ts_str.replace('Z', '+00:00')).timestamp())
    except Exception:
        ts_epoch = int(time.time())

    pipe = redis.pipeline(transaction=False)

    pipe.set(req_key(city, req_id), json.dumps(payload), ex=expiration)
    pipe.sadd(open_set_key(city), req_id)
    pipe.incrby(priority_sum_key(city), priority)
    pipe.zadd(ts_zset_key(city), {req_id: ts_epoch})

    # global updates
    pipe.incrby(global_priority_sum_key(), priority)
    pipe.incr(global_num_open_key())
    pipe.zadd(global_ts_zset_key(), {req_key(city, req_id): ts_epoch})

    await pipe.execute()

async def evict_request(city: str, req_id: str) -> None:
    request_data = await redis.get(req_key(city, req_id))
    priority = 0
    if request_data:
        try:
            priority = int(json.loads(request_data).get('priority', 0))
        except Exception:
            pass

    pipe = redis.pipeline(transaction=False)

    pipe.delete(req_key(city, req_id))
    pipe.srem(open_set_key(city), req_id)
    pipe.decrby(priority_sum_key(city), priority)
    pipe.zrem(ts_zset_key(city), req_id)

    # global updates
    pipe.decrby(global_priority_sum_key(), priority)
    pipe.decr(global_num_open_key())
    pipe.zrem(global_ts_zset_key(), req_key(city, req_id))

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

async def get_city_stats(city: str) -> dict:
    now = int(datetime.now(timezone.utc).timestamp())
    one_hour_ago = now - ONE_HOUR

    pipe = redis.pipeline(transaction=False)

    pipe.scard(open_set_key(city)) # number of open requests
    pipe.get(priority_sum_key(city)) # sum of all priority scores
    pipe.zcount(ts_zset_key(city), one_hour_ago, '+inf') # number of open requests in last hour

    num_open, priority_sum, recent_requests = await pipe.execute()

    num_open = int(num_open or 0)
    priority_sum = int(priority_sum or 0)
    recent_requests = int(recent_requests or 0)
    
    avg_priority = round(priority_sum / num_open, 1) if num_open else 0.0
    
    return {
        'num_open': num_open,
        'avg_priority': avg_priority,
        'recent_requests': recent_requests
    }

async def get_global_stats() -> dict:
    now = int(datetime.now(timezone.utc).timestamp())
    one_hour_ago = now - ONE_HOUR

    pipe = redis.pipeline(transaction=False)

    pipe.get(global_num_open_key()) # number of open requests
    pipe.get(global_priority_sum_key()) # sum of all priority scores
    pipe.zcount(global_ts_zset_key(), one_hour_ago, '+inf') # number of open requests in last hour

    num_open, priority_sum, recent_requests = await pipe.execute()

    num_open = int(num_open or 0)
    priority_sum = int(priority_sum or 0)
    recent_requests = int(recent_requests or 0)
    
    avg_priority = round(priority_sum / num_open, 1) if num_open else 0.0
    
    return {
        'num_open': num_open,
        'avg_priority': avg_priority,
        'recent_requests': recent_requests
    }

async def get_recent_requests(num: int) -> list[dict]:
    keys = await redis.zrevrange(global_ts_zset_key(), 0, num - 1)
    if not keys:
        return []
    raw = await redis.mget(keys)
    return [json.loads(item) for item in raw if item]