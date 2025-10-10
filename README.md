# Triage

Triage is a tool for local governments to process 311 complaints more efficiently by automatically prioritizing reports and flagging for potential issues such as missing information. 

Triage was kindly sponsored by OpenAI and the 2025 UW-Madison Summer AI Lab. This project placed top 3 and was selected to present to the VP of engineering and VP of applied infrastructure at OpenAI. While the original prototype website is no longer live, you can see a demo of Triage on [YouTube](https://www.youtube.com/watch?v=xkxlRWWWP_c). 

A full-scale rebuild of Triage is currently in progress with a new development team. This repository reflects the original research prototype.

More information is available at this [slide deck](https://docs.google.com/presentation/d/1VjSKiz6Yig8xiYYz8R5TfOt2AAXwVRcTkTDxuv9pRm8/edit?usp=sharing).

## Development
Create a `.dev.env` file at the project root with these values:
```
OPENAI_API_KEY=[YOUR OPENAI KEY]
CITIES={"test" : "http://mock_open311:80"}
MODELS=["o4-mini", "gpt-5-mini"]
```
You can optionally add the `REDIS_URL` and `POLL_INTERVAL` if necessary otherwise they will default to `redis://redis:6379/0` and `10`, respectively (you shouldn't have to change these).

```bash
docker-compose -f compose.dev.yml up
```
Use the --build option  if you make changes to the [Dockerfile](backend/Dockerfile) or [pyproject.toml](backend/pyproject.toml).

I'd recommend using [Bruno](https://www.usebruno.com/) if you want to test sending requests using a GUI instead of the command line. Just import the [Postman Collection](PostmanCollection.json) and you'll be set.

**The frontend can be accessed on [port 3000](http://localhost:3000).**

For the map view to work, create a `.env` file in the `frontend/` folder with this value:
```
VITE_MAPBOX_TOKEN=[your MapBox token]
```

## Production
Triage was being ran on a virtual machine hosted on [DigitalOcean](https://www.digitalocean.com/) but is not currently live while the new team works on the rebuild.
