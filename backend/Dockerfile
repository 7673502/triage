# VARIABLES
ARG PYTHON_TAG=3.11.13-slim-bookworm
ARG POETRY_VERSION=2.1.3

# DEVELOPMENT
FROM python:${PYTHON_TAG} AS dev

ARG POETRY_VERSION
RUN pip install --no-cache-dir poetry==${POETRY_VERSION}

RUN poetry config virtualenvs.create false

WORKDIR /app

COPY pyproject.toml poetry.lock ./
RUN poetry install --no-interaction --no-root

COPY ./app ./app

CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# BUILDER FOR PRODUCTION
FROM python:${PYTHON_TAG} AS builder

RUN pip install poetry==${POETRY_VERSION}

WORKDIR /app
COPY pyproject.toml poetry.lock ./

RUN poetry config virtualenvs.create false \
 && poetry export -f requirements.txt --without-hashes --output requirements.txt

# PRODUCTION
FROM python:${PYTHON_TAG} AS prod

WORKDIR /app

COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
