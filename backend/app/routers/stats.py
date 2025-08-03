from fastapi import APIRouter
import app.services.cache as cache

router = APIRouter(prefix="/v1")

@router.get("/stats")
async def global_stats():
    return await cache.get_global_stats()