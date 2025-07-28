# Triage

## Development
Create a `.dev.env` file at the project root with these values:
```
OPENAI_API_KEY=[YOUR OPENAI KEY]
API_KEYS=[COMMA SEPERATED LIST OF API KEYS]
CITIES={"test" : "http://mock_open311:80"}
```
You can optionally add the `REDIS_URL` and `POLL_INTERVAL` if necessary otherwise they will default to `redis://redis:6379/0` and `10`, respectively.

```bash
docker-compose -f compose.dev.yml up
```
Use the --build option  if you make changes to the [Dockerfile](backend/Dockerfile) or [pyproject.toml](backend/pyproject.toml).

## Cities List
These are the endpoints I've found that have particularly rich data

| City              | Endpoint                                                    |
| ----------------- | ----------------------------------------------------------- |
| Boston, MA        | https://311.boston.gov/open311/v2                           |
| San Francisco, CA | https://san-francisco2-production.spotmobile.net/open311/v2 |
| Clark County, NV  | https://seeclickfix.com/open311/v2/1375                     |
| Tucson, AZ        | https://seeclickfix.com/open311/v2/36                       |
| Detroit, MI       | https://seeclickfix.com/open311/v2/507                      |
