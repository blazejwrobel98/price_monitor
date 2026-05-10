# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DATA_DIR=/data \
    PIP_NO_CACHE_DIR=1

RUN pip install --upgrade pip

COPY backend/pyproject.toml backend/README.md ./
COPY backend/price_monitor ./price_monitor
COPY backend/alembic.ini ./alembic.ini
COPY backend/alembic ./alembic
RUN pip install .

COPY --from=frontend /src/dist ./price_monitor/static

RUN useradd --create-home --uid 10001 appuser
RUN mkdir -p /data && chown appuser:appuser /data
USER appuser

EXPOSE 8080
CMD ["uvicorn", "price_monitor.main:app", "--host", "0.0.0.0", "--port", "8080"]
