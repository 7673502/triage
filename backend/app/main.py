from fastapi import FastAPI, Depends
from app.core.config import get_settings
from app.core.security import verify_api_key
from app.routers.requests import router as requests_router
from app.tasks.ingest import start_pollers
from contextlib import asynccontextmanager

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await start_pollers()
    yield

app = FastAPI(
    title='Triage',
    dependencies=[Depends(verify_api_key)],
    lifespan=lifespan
)

app.include_router(requests_router)

@app.get('/ping')
async def ping():
    return {'msg': 'pong'}
