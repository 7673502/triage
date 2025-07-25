import logging
import asyncio
from datetime import datetime, timezone, timedelta
from app.core.config import get_settings
from app.services.georeport_client import fetch_open_requests
from app.services.openai_client import classify_batch
from app.utils.time_helper import parse_time, format_time
import app.services.cache as cache

log = logging.getLogger('uvicorn.error')
settings = get_settings()

async def poll_city(city: str) -> None:
    while True:
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=1)
        page = 1
        total_found = 0
        total_processed = 0
        seen_ids = set() # keep track of seen ids to diff at end

        # page through open requests between start_date and end_date
        while True:
            requests = await fetch_open_requests(
                city,
                start_date=start_date,
                end_date=end_date,
                page=page,
                page_size=100
            )
            if not requests:
                break

            # filter out processed requests
            new_requests = []
            for request in requests:
                req_id = str(request['service_request_id'])
                seen_ids.add(req_id)

                if await cache.is_cached(city, req_id):
                    continue
                new_requests.append(request)

            # classify new requests and cache them
            if new_requests:
                classifications = await classify_batch(new_requests)

                for request, classified in zip(new_requests, classifications):
                    req_id = str(request['service_request_id'])
                    payload = request | classified.model_dump()
                    payload['city'] = city
                    await cache.cache_request(city, req_id, payload)

            log.info("%s: page %d fetched %d items and processed %d", city, page, len(requests), len(new_requests))

            page += 1
            total_found += len(requests)
            total_processed += len(new_requests)

            await asyncio.sleep(settings.poll_interval)
    
        cached_ids = await cache.get_cached_ids(city)
        closed_ids = cached_ids - seen_ids

        for req_id in closed_ids:
            await cache.evict_request(city, req_id)

        log.info(
            '%s: poller fetched %d requests between %s - %s and processed %d', 
            city, 
            total_found, 
            format_time(start_date), 
            format_time(end_date), 
            total_processed
        )
        await asyncio.sleep(settings.poll_interval)

async def start_pollers():
    for city in settings.cities:
        asyncio.create_task(poll_city(city))
