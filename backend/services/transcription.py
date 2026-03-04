"""Transcription using OpenAI Whisper API."""
import os
import logging
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        _client = AsyncOpenAI(api_key=api_key)
    return _client


async def transcribe_video(video_path: str) -> dict:
    """
    Transcribe video audio using Whisper.
    Returns dict with 'text' and 'segments' (list of {start, end, text}).
    """
    client = get_client()
    logger.info(f"Transcribing {video_path}")

    with open(video_path, "rb") as f:
        response = await client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )

    segments = []
    if hasattr(response, "segments") and response.segments:
        for seg in response.segments:
            segments.append({
                "start": seg.start,
                "end": seg.end,
                "text": seg.text.strip(),
            })

    return {
        "text": response.text,
        "segments": segments,
    }
