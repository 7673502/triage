# Triage

## Development
Create a `.dev.env` file at the project root with these values:
```
OPENAI_API_KEY=[YOUR OPENAI KEY]
API_KEYS=[COMMA SEPERATED LIST OF API KEYS]
CITIES={"test" : "http://mock_open311:80"}
MODELS=["o4-mini", "gpt-4.1"]
```
You can optionally add the `REDIS_URL` and `POLL_INTERVAL` if necessary otherwise they will default to `redis://redis:6379/0` and `10`, respectively.

```bash
docker-compose -f compose.dev.yml up
```
Use the --build option  if you make changes to the [Dockerfile](backend/Dockerfile) or [pyproject.toml](backend/pyproject.toml).

I'd recommend using [Bruno](https://www.usebruno.com/) if you want to test sending requests using a GUI instead of the command line. Just import the [Postman Collection](PostmanCollection.json) and you'll be set.

**The frontend can be accessed on [port 3000](http://localhost:3000).**

For the map view, create a `.env` file in the `frontend/` folder with this value:
```
VITE_GOOGLE_MAPS_API_KEY=[YOUR GOOGLE API KEY]
```

## Production
*work in progress...*

## Appendix
### Cities List
These are the endpoints I've found that have particularly rich data

| City              | Endpoint                                                    |
| ----------------- | ----------------------------------------------------------- |
| Boston, MA        | https://311.boston.gov/open311/v2                           |
| San Francisco, CA | https://san-francisco2-production.spotmobile.net/open311/v2 |
| Clark County, NV  | https://seeclickfix.com/open311/v2/1375                     |
| Tucson, AZ        | https://seeclickfix.com/open311/v2/36                       |
| Detroit, MI       | https://seeclickfix.com/open311/v2/507                      |

### Model Performance
| Model       | Notes                                            |
| ----------- | ------------------------------------------------ |
| gpt-4o-mini | very bad, do not use                             |
| o4-mini     | works decently                                   |
| gpt-4.1     | seems to work decently, further testing required |
