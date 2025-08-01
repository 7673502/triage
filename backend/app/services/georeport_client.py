import httpx
import sys
import logging
import backoff
from datetime import datetime
from app.core.config import get_settings
from app.utils.time_helper import format_time

settings = get_settings()


logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO
)
log = logging.getLogger('georeport-client')

@backoff.on_exception(
    backoff.expo,
    (httpx.RemoteProtocolError,),
    jitter=backoff.full_jitter
)
async def fetch_open_requests(
    city: str,
    *,
    start_date: datetime,
    end_date: datetime,
    page_size: int = 100,
    page: int = 1
) -> list[dict]:
    try:
        base_url = str(settings.cities[city]).rstrip('/')
    except KeyError:
        raise ValueError(f'Unknown city: {city}')

    params = {
        'status': 'open',
        'start_date': format_time(start_date),
        'end_date': format_time(end_date),
        'page_size': page_size,
        'page': page
    }

    timeout = httpx.Timeout(connect=5.0, read=45.0, write=10.0, pool=5.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(f'{base_url}/requests.json', params=params)
        response.raise_for_status()
        try:
            return response.json()
        except Exception as e:
            log.info(f"JSON decode error: {e}, body: {response.text}")
            return []
