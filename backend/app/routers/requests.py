from fastapi import APIRouter, Depends
from app.core.security import verify_api_key

router = APIRouter(
    prefix='/requests',
    dependencies=[Depends(verify_api_key)],
)

@router.get('/ping')
async def ping():
    return {'msg': 'pong'}
