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

Download the latest release for your platform and install it.

### Windows

- [fluely_0.1.0_x64-setup.exe](https://github.com/rx76d/fluely/releases/download/v0.1.0/fluely_0.1.0_x64-setup.exe)  
- [fluely_0.1.0_x64_en-US.msi](https://github.com/rx76d/fluely/releases/download/v0.1.0/fluely_0.1.0_x64_en-US.msi)  

Download the installer, run it and follow the setup wizard to install Fluely.

### macOS

- [fluely_0.1.0_universal.dmg](https://github.com/rx76d/fluely/releases/download/v0.1.0/fluely_0.1.0_universal.dmg)  
- [fluely_universal.app.tar.gz](https://github.com/rx76d/fluely/releases/download/v0.1.0/fluely_universal.app.tar.gz)

Open the DMG file and drag Fluely into Applications or extract the App tarball and run the app from the extracted package.

### Linux

- [fluely-0.1.0-1.x86_64.rpm](https://github.com/rx76d/fluely/releases/download/v0.1.0/fluely-0.1.0-1.x86_64.rpm)  
- [fluely_0.1.0_amd64.deb](https://github.com/rx76d/fluely/releases/download/v0.1.0/fluely_0.1.0_amd64.deb)  
- [fluely_0.1.0_amd64.AppImage](https://github.com/rx76d/fluely/releases/download/v0.1.0/fluely_0.1.0_amd64.AppImage)  

Install using your distro package manager for the RPM or DEB package or make the AppImage executable and launch it directly.

After installation, open Fluely and grant the permissions it requests to enable microphone and screen monitoring.

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
