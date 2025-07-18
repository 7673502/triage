from fastapi import FastAPI
from datetime import datetime, timezone
from pydantic import BaseModel

class RequestIn(BaseModel):
    service_name: str
    description: str | None = None
    media_url: str | None = None
    address: str | None = None
    lat: float | None = None
    long: float | None = None

app = FastAPI()
db = []

@app.post('/requests', status_code=201)
async def create_request(request: RequestIn):
    current_time = datetime.now(timezone.utc)
    formatted_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")

    new_request = {
        'service_request_id': str(len(db)),
        'status': 'open',
        'service_name': request.service_name,
        'requested_datetime': formatted_time,
        'updated_datetime': formatted_time,
    }

    if request.description:
        new_request['description'] = request.description
    if request.media_url:
        new_request['media_url'] = request.media_url
    if request.address:
        new_request['address'] = request.address
    if request.lat:
        new_request['lat'] = request.lat
    if request.long:
        new_request['long'] = request.long

    db.append(new_request)
    return new_request

@app.get('/requests')
async def get_requests():
    return db
