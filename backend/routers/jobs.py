"""Job status and clip serving endpoints."""
import os
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..services.storage import get_job

router = APIRouter()
logger = logging.getLogger(__name__)

OUTPUTS_DIR = os.getenv("OUTPUTS_DIR", "/app/outputs")


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job.model_dump()


@router.get("/clips/{job_id}/{clip_id}/video")
async def get_clip_video(job_id: str, clip_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    clip = next((c for c in job.clips if c.id == clip_id), None)
    if not clip:
        raise HTTPException(404, "Clip not found")

    video_path = os.path.join(OUTPUTS_DIR, job_id, f"{clip_id}.mp4")
    if not os.path.exists(video_path):
        raise HTTPException(404, "Clip video not found")

    return FileResponse(
        video_path,
        media_type="video/mp4",
        headers={"Accept-Ranges": "bytes"},
    )


@router.get("/clips/{job_id}/{clip_id}/thumbnail")
async def get_clip_thumbnail(job_id: str, clip_id: str):
    thumb_path = os.path.join(OUTPUTS_DIR, job_id, f"{clip_id}_thumb.jpg")
    if not os.path.exists(thumb_path):
        raise HTTPException(404, "Thumbnail not found")
    return FileResponse(thumb_path, media_type="image/jpeg")


@router.get("/clips/{job_id}/{clip_id}/download")
async def download_clip(job_id: str, clip_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    clip = next((c for c in job.clips if c.id == clip_id), None)
    if not clip:
        raise HTTPException(404, "Clip not found")

    video_path = os.path.join(OUTPUTS_DIR, job_id, f"{clip_id}.mp4")
    if not os.path.exists(video_path):
        raise HTTPException(404, "Clip not ready for download")

    safe_title = "".join(c if c.isalnum() or c in " -_" else "_" for c in clip.title)[:50]
    filename = f"{safe_title}.mp4"

    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
