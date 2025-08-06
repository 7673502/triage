from fastapi import FastAPI, Depends
from app.core.config import get_settings
from app.core.security import verify_api_key
from app.routers.requests import router as requests_router
from app.routers.stats import router as stats_router
import app.services.cache as cache

settings = get_settings()

app = FastAPI(
    title='Triage',
    #dependencies=[Depends(verify_api_key)]
)

app.include_router(requests_router)
app.include_router(stats_router)

@app.get('/ping')
async def ping():
    return {'msg': 'pong'}

@app.get('/v1/available_cities')
async def available_cities():
    return list(settings.cities.keys())

@app.get('/v1/recents')
async def get_recents(num: int = 5):
    return await cache.get_recent_requests(num)
