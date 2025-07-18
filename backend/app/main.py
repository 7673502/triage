from fastapi import FastAPI
from app.routers.requests import router as requests_router

app = FastAPI(title='Triage')

app.include_router(requests_router)
