from fastapi import FastAPI, Depends
from app.core.security import verify_api_key
from app.routers.requests import router as requests_router
import app.services.cache as cache

app = FastAPI(
    title='Triage',
    dependencies=[Depends(verify_api_key)]
)

app.include_router(requests_router)

@app.get('/test-cache')
async def test_cache():
    await cache.set_cached('foo', {'bar': 123})
    return await cache.get_cached('foo')
