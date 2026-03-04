"""Main processing pipeline: transcribe → detect clips → extract clips."""
import asyncio
import logging
import os
import uuid
from pathlib import Path

from ..models.job import Clip, ClipStatus, Job, JobStatus
from ..services.storage import get_job, update_job
from ..services.transcription import transcribe_video
from ..services.clip_detection import detect_clips
from ..services.video_processor import extract_clip, extract_thumbnail, get_video_duration

logger = logging.getLogger(__name__)

OUTPUTS_DIR = os.getenv("OUTPUTS_DIR", "/app/outputs")


async def run_pipeline(job_id: str, video_path: str) -> None:
    """Run the full processing pipeline for a job."""
    try:
        await _pipeline(job_id, video_path)
    except Exception as e:
        logger.exception(f"Pipeline failed for job {job_id}: {e}")
        update_job(
            job_id,
            status=JobStatus.failed,
            progress=0,
            error=str(e),
            message="Processing failed",
        )


async def _pipeline(job_id: str, video_path: str) -> None:
    logger.info(f"Starting pipeline for job {job_id}")

    # --- Step 1: Get video duration ---
    duration = await get_video_duration(video_path)
    update_job(job_id, video_duration=duration, video_path=video_path)

    # --- Step 2: Transcribe ---
    update_job(
        job_id,
        status=JobStatus.transcribing,
        progress=10,
        message="Transcribing audio with Whisper...",
    )
    transcript_data = await transcribe_video(video_path)
    update_job(job_id, transcript=transcript_data.get("text", ""), progress=35)

    # --- Step 3: AI clip detection ---
    update_job(
        job_id,
        status=JobStatus.analyzing,
        progress=40,
        message="AI is finding your best moments...",
    )
    num_clips = min(8, max(3, int(duration / 60)))  # ~1 clip per minute, max 8
    raw_clips = await detect_clips(transcript_data, duration, num_clips=num_clips)

    if not raw_clips:
        update_job(
            job_id,
            status=JobStatus.failed,
            error="No clips could be detected. The video may be too short or have no speech.",
            message="No clips found",
        )
        return

    # Create clip records
    clips = []
    for i, rc in enumerate(raw_clips):
        clip = Clip(
            id=str(uuid.uuid4()),
            title=rc.get("title", f"Clip {i+1}"),
            start_time=rc["start_time"],
            end_time=rc["end_time"],
            duration=rc["duration"],
            virality_score=rc["virality_score"],
            hook=rc.get("hook", ""),
            transcript_excerpt=rc.get("transcript_excerpt", ""),
            status=ClipStatus.pending,
        )
        clips.append(clip)

    update_job(job_id, clips=clips, progress=55)

    # --- Step 4: Extract clips ---
    update_job(
        job_id,
        status=JobStatus.clipping,
        progress=60,
        message=f"Extracting {len(clips)} clips...",
    )

    job_output_dir = os.path.join(OUTPUTS_DIR, job_id)
    os.makedirs(job_output_dir, exist_ok=True)

    segments = transcript_data.get("segments", [])

    for i, clip in enumerate(clips):
        clip_output = os.path.join(job_output_dir, f"{clip.id}.mp4")
        thumb_output = os.path.join(job_output_dir, f"{clip.id}_thumb.jpg")

        success = await extract_clip(
            video_path=video_path,
            output_path=clip_output,
            start=clip.start_time,
            end=clip.end_time,
            transcript_segments=segments,
        )

        if success:
            await extract_thumbnail(clip_output, thumb_output, time_offset=1.0)
            clip.status = ClipStatus.ready
            clip.file_path = clip_output
            clip.thumbnail_path = thumb_output if os.path.exists(thumb_output) else None
        else:
            clip.status = ClipStatus.failed

        # Update progress
        progress = 60 + int((i + 1) / len(clips) * 38)
        update_job(job_id, clips=clips, progress=progress)
        await asyncio.sleep(0)  # yield

    # --- Done ---
    update_job(
        job_id,
        status=JobStatus.done,
        progress=100,
        message=f"Done! {len([c for c in clips if c.status == ClipStatus.ready])} clips ready.",
        clips=clips,
    )
    logger.info(f"Pipeline complete for job {job_id}")
