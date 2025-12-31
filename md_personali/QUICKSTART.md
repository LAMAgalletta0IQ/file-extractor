# Quick Start Guide

## First Time Setup

1. **Install Rust** (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **(Optional) Add application icons**:
   - Create a `src-tauri/icons/` directory
   - Add icon files (see `src-tauri/ICONS.md` for details)
   - Or use: `tauri icon path/to/your-icon.png`

## Running the Application

### Development Mode
```bash
npm run tauri dev
```

This starts the app with hot-reload for both frontend and backend changes.

### Production Build
```bash
npm run tauri build
```

Output will be in `src-tauri/target/release/`

## Application Workflow

1. **Enter Source Name**: Type a project name (e.g., "MyProject")
   - Previous source names will appear as suggestions

2. **Select Files**:
   - **Scan Folder**: Opens a dialog to select a folder, then shows a tree view with checkboxes
   - **Add Files**: Select individual files
   - Use checkboxes to select files. Checking a folder checkbox selects all files inside it.

3. **Generate Output**: Click the generate button to create a structured text file

## Settings Location

Settings are stored in:
- **macOS/Linux**: `~/.source_processor/`
- **Windows**: `%USERPROFILE%\.source_processor\`

Files:
- `settings.json` - Theme, recent sources, last folder
- `history.json` - Selection history per source name

## Troubleshooting

### Build Errors
- Ensure Rust is up to date: `rustup update`
- Clear build cache: `cd src-tauri && cargo clean && cd ..`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Icon Errors
- If you see icon-related errors during build, create placeholder icons or remove the icon configuration temporarily

### Permission Errors
- On macOS, you may need to grant file access permissions in System Preferences

## Development Tips

- Frontend code is in `src/`
- Backend Rust code is in `src-tauri/src/`
- Tauri commands are in `src-tauri/src/commands/`
- Settings persistence is in `src-tauri/src/settings.rs`
