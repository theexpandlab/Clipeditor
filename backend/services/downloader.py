"""Download videos from YouTube and other URLs using yt-dlp."""
import logging
import os
import asyncio
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)


async def download_video(url: str, output_dir: str, job_id: str) -> str:
    """
    Download a video from a URL using yt-dlp.
    Returns the path to the downloaded video file.
    """
    output_template = os.path.join(output_dir, f"{job_id}.%(ext)s")

    cmd = [
        "yt-dlp",
        "--format", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--output", output_template,
        "--no-playlist",
        "--max-filesize", "500m",
        url,
    ]

    logger.info(f"Downloading video: {url}")
    loop = asyncio.get_event_loop()

    def _run():
        return subprocess.run(cmd, capture_output=True, text=True)

    result = await loop.run_in_executor(None, _run)

    if result.returncode != 0:
        logger.error(f"yt-dlp error: {result.stderr[-500:]}")
        raise RuntimeError(f"Download failed: {result.stderr[-200:]}")

    # Find the downloaded file
    for ext in ["mp4", "webm", "mkv", "mov"]:
        candidate = os.path.join(output_dir, f"{job_id}.{ext}")
        if os.path.exists(candidate):
            return candidate

    # Glob for any file with job_id prefix
    import glob
    matches = glob.glob(os.path.join(output_dir, f"{job_id}.*"))
    if matches:
        return matches[0]

    raise RuntimeError("Downloaded file not found")
