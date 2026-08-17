# Fluely

Fluely is a tool that listens to your conversations and reads your screen to provide real-time answers during interviews, exams, or meetings.

In short, it is just a tool for cheating :)

## Features

- Works with the LLMs you already use: Supports Google Gemini, Anthropic, OpenAI, Grok, DeepSeek, Qwen, Kimi, local models and Open API compatible keys.
- Built for discreet assistance: Shows real-time help during meetings without appearing in screen shares all major meeting or Video Conferencing Software.
- Native audio capture: Picks up both microphone and system audio directly through the operating system for reliable transcription.
- Keeps your data local: Stores transcripts, summaries, and action items on your device using SQLite instead of sending everything to the cloud.
- Understands what’s happening: Combines live speech transcription with screen context to give you quick relevant answers while the meeting is happening.

## Tech Stack

- Desktop Runtime: Tauri 2 (Rust)
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Database: SQLite (via rusqlite)
- State Management: Zustand

## Getting Started





## Installation for Development

#### Prerequisites

- Node.js (v24+)
- Rust toolchain (`rustc`, `cargo`)

#### Steps

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/rx76d/fluely.git
   cd fluely
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

#### Building for Production

- To compile a standalone binary and installer that runs independently without Node.js or terminal dependencies:

   ```bash
   npm run tauri build
   ```

- The generated executable will be placed in `src-tauri/target/release/`.


## License

This project is open source and available under the GPL-3.0 License.

<br>

<div align="center">
<sub>Developed by rx76d</sub>
</div>
