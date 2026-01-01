# File Extractor - Modern Tauri Application

A high-performance desktop application for building context files for LLMs. Built with Tauri, Rust, React, TypeScript, and Tailwind CSS.

## Features

- ✨ Modern, frameless UI with macOS-style window controls
- 🌓 Dark/Light theme toggle with persistence
- 📂 Recursive folder scanning with tree view
- ☑️ Cascading checkbox selection (select folders to select all children)
- 📝 Source name history and autocomplete
- 💾 Persistent settings and selection history
- 🚀 Fast file processing with encoding fallback (UTF-8 → Latin-1)

## Prerequisites

- **Rust** (latest stable version) - [Install Rust](https://www.rust-lang.org/tools/install)
- **Node.js** (v18 or later) - [Install Node.js](https://nodejs.org/)
- **npm** or **yarn**

## Installation

1. Clone or navigate to the project directory:
```bash
cd file-extractor
```

2. Install frontend dependencies:
```bash
npm install
```

3. The Rust dependencies will be automatically installed when you build the project.

## Development

Run the app in development mode:
```bash
npm run tauri dev
```

This will:
- Start the Vite dev server for the React frontend
- Compile and run the Tauri backend
- Hot-reload on code changes

## Building

Build the production app:
```bash
npm run tauri build
```

The compiled application will be in `src-tauri/target/release/`.

## Project Structure

```
file-extractor/
├── src/                      # React frontend source
│   ├── components/          # React components
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main app component
│   └── main.tsx             # React entry point
├── src-tauri/               # Rust backend
│   ├── src/
│   │   ├── commands/        # Tauri commands
│   │   ├── settings.rs      # Settings persistence
│   │   └── main.rs          # Rust entry point
│   └── Cargo.toml           # Rust dependencies
├── package.json             # Node.js dependencies
└── tailwind.config.js       # Tailwind CSS configuration
```

## Usage

1. **Step 1**: Enter a source name (project title). Recent names will appear as suggestions.

2. **Step 2**: 
   - Click "Scansiona Cartella" to scan an entire folder and select files via the tree view
   - Click "Aggiungi File" to add individual files
   - Use the tree view checkboxes to select files. Checking a folder selects all files within it.

3. **Step 3**: Click "GENERA FILE OUTPUT" to create a structured .txt file with all selected file contents.

## Settings

Settings are persisted in `~/.source_processor/`:
- `settings.json` - Theme preference, recent sources, last folder
- `history.json` - Selection history per source name (last 20 sources)

## File Output Format

The generated output file follows this structure:

```
========================================
[Source Name]
========================================

=== PATH: [full file path] ===
=== NAME: [file name] ===
[file content]

=== PATH: [next file path] ===
=== NAME: [next file name] ===
[next file content]

...
```

## Encoding Handling

The app uses intelligent encoding fallback:
1. First attempts to read files as UTF-8
2. Falls back to Latin-1 (ISO-8859-1) if UTF-8 fails
3. Marks files as unreadable if both fail

## License

This project is provided as-is for personal and commercial use.

## Credits

Made with ❤️ by LAMAgalletta0IQ and Tommy437
