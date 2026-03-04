# ClipEditor — AI Video Clipping MVP

An open-source clone of [Opus Pro](https://www.opus.pro/) that turns long-form videos into viral short clips using AI.

## Features

- **Upload video** (drag & drop) or paste a **YouTube / video URL**
- **AI Transcription** via OpenAI Whisper — accurate speech-to-text with timestamps
- **AI Clip Detection** via GPT-4o — finds the most engaging, shareable moments
- **Virality Score** — 0-100 score predicting clip performance
- **Auto Reframe** — crops to 9:16 vertical format (TikTok, Reels, Shorts)
- **Burned-in Captions** — accurate subtitles overlaid on every clip
- **Download clips** as MP4

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Backend | Python 3.12 + FastAPI + asyncio |
| AI | OpenAI Whisper (transcription) + GPT-4o (clip detection) |
| Video | FFmpeg (clip extraction, reframe, captions) |
| Download | yt-dlp (YouTube/URL support) |
| Deploy | Docker Compose |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- OpenAI API key

### 1. Clone and configure

```bash
git clone <repo>
cd Clipeditor
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 2. Run with Docker

```bash
docker-compose up --build
```

Open http://localhost:5173

### Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Also install: ffmpeg (system), yt-dlp
apt install ffmpeg   # or: brew install ffmpeg

OPENAI_API_KEY=sk-... UPLOADS_DIR=./uploads OUTPUTS_DIR=./outputs \
  uvicorn backend.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## How It Works

1. **Upload** — Video file is saved to disk, job created
2. **Transcribe** — Whisper API transcribes audio with word-level timestamps
3. **Analyze** — GPT-4o reads the full transcript and selects the N best moments based on virality signals (hooks, emotional resonance, standalone value)
4. **Clip** — FFmpeg extracts each clip, applies 9:16 crop, burns in captions
5. **Preview** — Frontend polls job status and shows clips sorted by virality score

## Project Structure

```
Clipeditor/
├── frontend/           # React app
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page routes
│   │   ├── lib/        # API client, utils
│   │   └── types/      # TypeScript types
│   └── package.json
├── backend/            # FastAPI app
│   ├── main.py         # App entrypoint
│   ├── models/         # Pydantic models
│   ├── routers/        # API endpoints
│   └── services/       # Business logic
│       ├── pipeline.py       # Orchestrates full flow
│       ├── transcription.py  # Whisper integration
│       ├── clip_detection.py # GPT-4o clip finder
│       ├── video_processor.py# FFmpeg wrapper
│       ├── downloader.py     # yt-dlp wrapper
│       └── storage.py        # In-memory job store
├── docker-compose.yml
└── .env.example
```

## Roadmap

- [ ] Persistent storage (PostgreSQL + S3)
- [ ] User authentication
- [ ] Social media scheduling
- [ ] B-roll insertion
- [ ] Brand templates (logo, fonts)
- [ ] Multiple export formats
- [ ] Batch processing
