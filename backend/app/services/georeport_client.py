import httpx
from datetime import datetime, timezone
from app.core.config import get_settings
from app.utils.time_helper import format_time

settings = get_settings()

async def fetch_requests(
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
        'start_date': format_time(start_date),
        'end_date': format_time(end_date),
        'page_size': page_size,
        'page': page
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(f'{base_url}/requests', params=params, timeout=15)
        response.raise_for_status()
        return response.json()
