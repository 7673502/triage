from fastapi import APIRouter, HTTPException
from app.core.config import get_settings
import app.services.cache as cache

router = APIRouter(prefix='/v1/cities')

settings = get_settings()

@router.get('/{city}/requests')
async def get_processed_requests(city: str):
    if city == 'all':
        return await cache.get_recent_requests(2000) # for all, return the 300 latest requests
    if city not in settings.cities:
        raise HTTPException(status_code=404, detail='City not found')
    return await cache.mget_requests(city)

@router.get('/{city}/quick_stats')
async def get_quick_stats(city: str):
    if city not in settings.cities:
        raise HTTPException(status_code=404, detail='City not found')
    return await cache.get_city_stats(city)
