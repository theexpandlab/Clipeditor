"""ClipEditor FastAPI backend."""
import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from .routers import upload, jobs


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure directories exist
    os.makedirs(os.getenv("UPLOADS_DIR", "/app/uploads"), exist_ok=True)
    os.makedirs(os.getenv("OUTPUTS_DIR", "/app/outputs"), exist_ok=True)
    yield


app = FastAPI(
    title="ClipEditor API",
    description="AI-powered video clipping backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(jobs.router, prefix="/api", tags=["jobs"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
