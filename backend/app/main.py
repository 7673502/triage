import os
import requests
import redis
from fastapi import FastAPI

rd = redis.Redis(host=os.getenv("REDIS_HOST", "redis"), port=6379)

app = FastAPI()

@app.get("/")
def read_root():
  return "Triage"

@app.get("/number/{number}")
def read_number(number: int):
  cache = rd.get(number)
  if cache:
    print("cache hit")
    return cache
  else:
    print("cache miss")
    r = requests.get(f"http://numbersapi.com/{number}")
    rd.set(number, r.text)
    rd.expire(number, 5)
    return r.text
