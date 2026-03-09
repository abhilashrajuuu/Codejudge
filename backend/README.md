# CodeJudge — Backend

> Node.js / Express backend for the CodeJudge online code compiler.

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials:
   ```
   cp .env.example .env
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JUDGE0_API_URL` | Judge0 API base URL |
| `JUDGE0_API_KEY` | RapidAPI key for Judge0 |
| `JUDGE0_API_HOST` | Judge0 API host |
| `PORT` | Server port (default: 5000) |
