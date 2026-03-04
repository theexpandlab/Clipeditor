"""FFmpeg-based video clip extraction with caption overlay."""
import asyncio
import json
import logging
import os
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)


def _run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    logger.debug(f"Running: {' '.join(cmd)}")
    return subprocess.run(cmd, capture_output=True, text=True, check=check)


async def get_video_duration(video_path: str) -> float:
    """Get video duration in seconds using ffprobe."""
    cmd = [
        "ffprobe", "-v", "quiet", "-print_format", "json",
        "-show_streams", video_path,
    ]
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: _run(cmd, check=False))
    try:
        data = json.loads(result.stdout)
        for stream in data.get("streams", []):
            if stream.get("codec_type") == "video":
                return float(stream.get("duration", 0))
        # Fallback: check format
        cmd2 = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", video_path]
        result2 = await loop.run_in_executor(None, lambda: _run(cmd2, check=False))
        data2 = json.loads(result2.stdout)
        return float(data2.get("format", {}).get("duration", 0))
    except Exception as e:
        logger.error(f"Could not get duration: {e}")
        return 0.0


async def extract_clip(
    video_path: str,
    output_path: str,
    start: float,
    end: float,
    transcript_segments: list[dict],
    target_aspect: str = "9:16",
) -> bool:
    """
    Extract a clip from video_path [start..end] seconds.
    Applies vertical reframe and burned-in captions.
    """
    duration = end - start
    output_dir = os.path.dirname(output_path)
    os.makedirs(output_dir, exist_ok=True)

    # Filter transcript segments that fall within this clip
    clip_segments = [
        seg for seg in transcript_segments
        if seg["end"] > start and seg["start"] < end
    ]

    # Build subtitle file (SRT) for caption overlay
    srt_path = output_path.replace(".mp4", ".srt")
    _write_srt(clip_segments, start, srt_path)

    # Build FFmpeg filter chain
    # 1) Scale + crop to 9:16 (1080x1920 or smaller portrait)
    # 2) Burn captions if SRT exists
    out_w, out_h = 720, 1280  # 9:16

    vf_parts = [
        # Scale maintaining aspect ratio
        f"scale='if(gt(iw/ih,{out_w}/{out_h}),{out_h}*iw/ih,{out_w})':'if(gt(iw/ih,{out_w}/{out_h}),{out_h},{out_w}*ih/iw)'",
        # Crop to exact target size
        f"crop={out_w}:{out_h}",
    ]

    if os.path.exists(srt_path):
        # Escape path for ffmpeg filter
        escaped = srt_path.replace("\\", "/").replace(":", "\\:")
        vf_parts.append(
            f"subtitles='{escaped}':force_style='FontName=Arial,FontSize=20,"
            f"PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,"
            f"Outline=2,Shadow=1,Alignment=2,MarginV=40'"
        )

    vf = ",".join(vf_parts)

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start),
        "-i", video_path,
        "-t", str(duration),
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        output_path,
    ]

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, lambda: _run(cmd, check=False))
        if result.returncode != 0:
            logger.error(f"FFmpeg error: {result.stderr[-500:]}")
            return False
        return True
    except Exception as e:
        logger.error(f"Extract clip failed: {e}")
        return False
    finally:
        if os.path.exists(srt_path):
            os.remove(srt_path)


async def extract_thumbnail(video_path: str, thumbnail_path: str, time_offset: float = 2.0) -> bool:
    """Extract a thumbnail frame from a video."""
    os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(time_offset),
        "-i", video_path,
        "-vframes", "1",
        "-vf", "scale=360:-1",
        thumbnail_path,
    ]
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, lambda: _run(cmd, check=False))
        return result.returncode == 0
    except Exception as e:
        logger.error(f"Thumbnail failed: {e}")
        return False


def _write_srt(segments: list[dict], clip_start: float, srt_path: str) -> None:
    """Write SRT subtitle file with timestamps relative to clip start."""
    lines = []
    idx = 1
    for seg in segments:
        # Re-base timestamps relative to clip start
        t_start = max(0, seg["start"] - clip_start)
        t_end = max(0, seg["end"] - clip_start)
        if t_end <= t_start:
            continue
        lines.append(str(idx))
        lines.append(f"{_fmt_srt(t_start)} --> {_fmt_srt(t_end)}")
        lines.append(seg["text"].strip())
        lines.append("")
        idx += 1

    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def _fmt_srt(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
