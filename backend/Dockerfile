FROM python:3.12-slim

WORKDIR /app

# Dependencies first for layer caching
RUN pip install --no-cache-dir \
    "fastapi>=0.115" \
    "uvicorn[standard]>=0.34" \
    "pydantic>=2.10" \
    "pydantic-settings>=2.8" \
    "sqlalchemy[asyncio]>=2.0.40" \
    "aiosqlite>=0.21" \
    "httpx>=0.27" \
    "cryptography>=43"

COPY backend/app/ app/

# SQLite lives on the PVC mounted at /data
RUN mkdir -p /data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
