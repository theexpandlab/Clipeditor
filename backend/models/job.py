from pydantic import BaseModel
from typing import Literal, Optional
from enum import Enum


class ClipStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class JobStatus(str, Enum):
    uploading = "uploading"
    transcribing = "transcribing"
    analyzing = "analyzing"
    clipping = "clipping"
    done = "done"
    failed = "failed"


class Clip(BaseModel):
    id: str
    title: str
    start_time: float
    end_time: float
    duration: float
    virality_score: int
    hook: str
    transcript_excerpt: str
    file_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    status: ClipStatus = ClipStatus.pending


class Job(BaseModel):
    job_id: str
    status: JobStatus = JobStatus.uploading
    progress: int = 0
    message: str = "Starting..."
    clips: list[Clip] = []
    video_duration: Optional[float] = None
    error: Optional[str] = None
    video_path: Optional[str] = None
    transcript: Optional[str] = None
