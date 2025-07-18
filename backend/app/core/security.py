from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader
from .config import get_settings

api_key_header = APIKeyHeader(name='X-API-Key', auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    settings = get_settings()

    valid_keys = {key.strip() for key in settings.api_keys.split(',')}

    if not api_key or api_key not in valid_keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or missing API key',
            headers={'WWW-Authenticate': 'API_KEY'},
        )
    
    return api_key
