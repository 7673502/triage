# Triage

## Development
Create a `.env` file at the project root with these values:
```
OPENAI_API_KEY=[YOUR OPENAI KEY]
API_KEYS=[COMMA SEPERATED LIST OF API KEYS]
CITIES={"Test" : "http://localhost:8081"}
```
You can optionally add the `REDIS_URL` and `POLL_INTERVAL` if necessary otherwise they will default to `redis://redis:6379/0` and `60`, respectively.

```bash
docker-compose -f compose.dev.yml up
```
Use the --build option  if you make changes to the [Dockerfile](backend/Dockerfile) or [pyproject.toml](backend/pyproject.toml).

