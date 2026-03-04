"""In-memory job store. Replace with Redis/DB for production."""
from typing import Optional
from ..models.job import Job

_jobs: dict[str, Job] = {}


def get_job(job_id: str) -> Optional[Job]:
    return _jobs.get(job_id)


def set_job(job: Job) -> None:
    _jobs[job.job_id] = job


def update_job(job_id: str, **kwargs) -> Optional[Job]:
    job = _jobs.get(job_id)
    if not job:
        return None
    updated = job.model_copy(update=kwargs)
    _jobs[job_id] = updated
    return updated
