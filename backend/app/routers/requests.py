from fastapi import APIRouter, Depends

router = APIRouter(prefix='/requests')

@router.get('/ping')
async def ping():
    return {'msg': 'pong'}
