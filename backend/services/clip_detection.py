"""AI-powered clip detection using GPT-4."""
import json
import logging
import os
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

CLIP_PROMPT = """You are an expert social media content strategist and video editor.

Analyze the following video transcript and identify the {num_clips} most engaging, shareable moments that would make great short-form clips (30-90 seconds) for TikTok, YouTube Shorts, or Instagram Reels.

For each clip, look for:
- Strong hooks that grab attention in the first 3 seconds
- Surprising, controversial, or emotionally resonant moments
- Clear standalone value (can be understood without the full video)
- Stories, insights, or actionable advice
- Humor, drama, or inspiration

VIDEO TRANSCRIPT (with timestamps in seconds):
{transcript}

Respond with a JSON array of clip objects. Each object must have:
- "title": catchy, attention-grabbing title (under 60 chars)
- "start_time": start in seconds (float)
- "end_time": end in seconds (float)
- "virality_score": 0-100 score for viral potential
- "hook": the opening line/hook of the clip (1-2 sentences)
- "transcript_excerpt": the key quote or moment (2-4 sentences)
- "reasoning": why this clip will perform well

Rules:
- Clips must be between 30 and 90 seconds long
- Do NOT overlap clips significantly
- Spread clips across the video
- Score honestly: 85+ = truly viral, 70-84 = high engagement, 50-69 = decent, <50 = low
- Return ONLY valid JSON, no markdown code blocks

Return the JSON array:"""


async def detect_clips(transcript_data: dict, video_duration: float, num_clips: int = 8) -> list[dict]:
    """
    Use GPT-4 to identify the best clips from a transcript.
    Returns list of clip dicts with timing, title, score, etc.
    """
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # Format transcript with timestamps
    segments = transcript_data.get("segments", [])
    if segments:
        formatted = "\n".join(
            f"[{seg['start']:.1f}s - {seg['end']:.1f}s] {seg['text']}"
            for seg in segments
        )
    else:
        # Fallback: use plain text
        formatted = transcript_data.get("text", "")

    prompt = CLIP_PROMPT.format(
        num_clips=num_clips,
        transcript=formatted[:12000],  # token limit safety
    )

    logger.info("Sending transcript to GPT-4 for clip detection")
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=3000,
    )

    content = response.choices[0].message.content or "[]"
    content = content.strip()

    # Strip markdown code blocks if present
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    content = content.strip()

    try:
        clips = json.loads(content)
        if not isinstance(clips, list):
            clips = []
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse GPT response as JSON: {e}\nContent: {content[:500]}")
        clips = []

    # Validate and clamp values
    valid_clips = []
    for c in clips:
        start = float(c.get("start_time", 0))
        end = float(c.get("end_time", 0))
        duration = end - start

        if duration < 15 or duration > 120:
            continue
        if start < 0 or end > video_duration + 5:
            continue

        c["start_time"] = max(0, start)
        c["end_time"] = min(video_duration, end)
        c["duration"] = c["end_time"] - c["start_time"]
        c["virality_score"] = max(0, min(100, int(c.get("virality_score", 50))))
        valid_clips.append(c)

    # Sort by virality score
    valid_clips.sort(key=lambda x: x["virality_score"], reverse=True)
    return valid_clips[:num_clips]
