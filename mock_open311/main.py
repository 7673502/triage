from fastapi import FastAPI, HTTPException
from datetime import datetime, timezone
from pydantic import BaseModel
import copy

def parse_time(t: str) -> datetime:
    dt = datetime.fromisoformat(t.replace('Z', '+00:00'))
    return dt.replace(tzinfo=timezone.utc)

def format_time(t: datetime) -> str:
    return t.astimezone(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')

class RequestIn(BaseModel):
    service_code: str
    description: str | None = None
    media_url: str | None = None
    address: str | None = None
    lat: float | None = None
    long: float | None = None

app = FastAPI()
db = [] 

SERVICES = {
    '1': 'Pothole',
    '2': 'Broken Sidewalk',
    '3': 'Litter',
    '4': 'Graffiti',
    '5': 'Abandoned Vehicle',
    '6': 'Streetlight Out',
    '7': 'Traffic Signal Malfunction',
    '8': 'Trash - Missed Pickup',
    '9': 'Illegal Dumping',
    '10': 'Other',
}

@app.post('/requests', status_code=201)
async def create_request(request: RequestIn):
    current_time = datetime.now(timezone.utc)
    formatted_time = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")

    new_request = {
        'service_request_id': str(len(db)),
        'status': 'open',
        'requested_datetime': formatted_time,
        'updated_datetime': formatted_time,
        'service_name': SERVICES[request.service_code]
    }

    new_request = new_request | request.model_dump(exclude_none=True)

    db.append(new_request)
    return new_request

@app.post('/close-request')
async def close_request(request_id: str):
    for req in db:
        if req['service_request_id'] == request_id and req['status'] == 'open':
            req['status'] = 'closed'
            return 'Success!'
        elif req['service_request_id'] == request_id:
            raise HTTPException(400, 'Request is already closed')
    raise HTTPException(404, 'Request with given ID couldn\'t be found')

@app.get('/requests.json')
async def get_requests(
    service_request_id: str | None = None,
    service_code: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 50
):
    filtered_db = copy.copy(db)
    if service_request_id:
        ids = {i.strip() for i in service_request_id.split(',')}
        filtered_db = [i for i in filtered_db if i['service_request_id'] in ids]
    else:
        if service_code:
            codes = {i.strip() for i in service_code.split(',')}
            filtered_db = [i for i in filtered_db if i['service_code'] in codes]
        if start_date:
            start_dt = parse_time(start_date)
            filtered_db = [i for i in filtered_db if parse_time(i['requested_datetime']) > start_dt]
        if end_date:
            end_dt = parse_time(end_date)
            filtered_db = [i for i in filtered_db if parse_time(i['requested_datetime']) < end_dt]
        if status:
            filtered_db = [i for i in filtered_db if i['status'] == status.strip()]
        

    start_index = page_size * (page - 1)
    end_index = page_size * page

    if start_index >= len(filtered_db):
        return []

    return filtered_db[start_index:end_index]
