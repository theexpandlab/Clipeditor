"""Upload and URL submission endpoints."""
import asyncio
import os
import uuid
import logging
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from pydantic import BaseModel

from ..models.job import Job, JobStatus
from ..services.storage import set_job
from ..services.pipeline import run_pipeline
from ..services.downloader import download_video

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "/app/uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", "2000")) * 1024 * 1024  # 2 GB

ALLOWED_TYPES = {
    "video/mp4", "video/quicktime", "video/x-msvideo",
    "video/webm", "video/x-matroska", "video/mpeg",
}


class UrlRequest(BaseModel):
    url: str


@router.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}. Upload a video file.")

    job_id = str(uuid.uuid4())
    os.makedirs(UPLOADS_DIR, exist_ok=True)

    # Get extension
    ext = Path(file.filename or "video.mp4").suffix or ".mp4"
    save_path = os.path.join(UPLOADS_DIR, f"{job_id}{ext}")

    # Stream file to disk
    size = 0
    try:
        with open(save_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    raise HTTPException(413, "File too large (max 2 GB)")
                f.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to save file: {e}")

    logger.info(f"Saved upload {job_id} ({size / 1024 / 1024:.1f} MB)")

    job = Job(job_id=job_id, status=JobStatus.transcribing, message="Video received, starting transcription...")
    set_job(job)

    background_tasks.add_task(run_pipeline, job_id, save_path)

    return {"job_id": job_id, "message": "Processing started"}


@router.post("/submit-url")
async def submit_url(body: UrlRequest, background_tasks: BackgroundTasks):
    url = body.url.strip()
    if not url:
        raise HTTPException(400, "URL is required")

    job_id = str(uuid.uuid4())
    os.makedirs(UPLOADS_DIR, exist_ok=True)

    job = Job(job_id=job_id, status=JobStatus.uploading, message="Downloading video...")
    set_job(job)

    async def _download_then_run():
        try:
            video_path = await download_video(url, UPLOADS_DIR, job_id)
            await run_pipeline(job_id, video_path)
        except Exception as e:
            from ..services.storage import update_job
            from ..models.job import JobStatus as JS
            update_job(job_id, status=JS.failed, error=str(e), message="Download failed")

    background_tasks.add_task(_download_then_run)

    return {"job_id": job_id, "message": "Download started"}
