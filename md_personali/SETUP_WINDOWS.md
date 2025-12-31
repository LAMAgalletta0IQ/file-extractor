# Windows Build Setup Guide

## Problem
Rust compilation requires either:
1. **MSVC toolchain** (recommended for Tauri) - needs Visual Studio Build Tools
2. **GNU toolchain** - needs MinGW-w64

## Solution Options

### Option 1: Install Visual Studio Build Tools (Recommended for Tauri)

1. Download **Build Tools for Visual Studio 2022**:
   - Go to: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Scroll down to "Tools for Visual Studio 2022"
   - Click "Download" on "Build Tools for Visual Studio 2022"

2. Run the installer and select:
   - ✅ **Desktop development with C++** workload
   - This includes MSVC compiler, Windows SDK, and linker

3. After installation, restart your terminal and try building again:
   ```bash
   npm run tauri dev
   ```

### Option 2: Install MinGW-w64 (Alternative)

If you prefer not to install Visual Studio Build Tools:

1. Install MinGW-w64 via MSYS2:
   - Download MSYS2 from: https://www.msys2.org/
   - Install it
   - Open MSYS2 terminal and run:
     ```bash
     pacman -S mingw-w64-x86_64-toolchain
     ```

2. Add MinGW to PATH:
   - Add `C:\msys64\mingw64\bin` to your system PATH
   - Restart your terminal

3. Verify:
   ```bash
   dlltool --version
   ```

4. Switch Rust to GNU toolchain (already done):
   ```bash
   rustup default stable-x86_64-pc-windows-gnu
   ```

### Quick Check Script

Run this to check your current setup:
```powershell
# Check Rust toolchain
rustup show

# Check for MSVC linker
where link.exe

# Check for MinGW dlltool
where dlltool.exe
```

## Recommended Approach

**For Tauri development on Windows, Visual Studio Build Tools is strongly recommended** because:
- Better compatibility with Windows APIs
- Smaller binary sizes
- Faster compilation
- Standard for Windows Rust development

After installing Visual Studio Build Tools, switch back to MSVC toolchain:
```bash
rustup default stable-x86_64-pc-windows-msvc
cd src-tauri
cargo clean
cd ..
npm run tauri dev
```

