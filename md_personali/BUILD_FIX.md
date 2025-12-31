# Fixing Build Errors on Windows

## Option 1: Install Visual Studio Build Tools (Recommended for MSVC)

1. Download **Build Tools for Visual Studio** from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

2. Run the installer and select:
   - **C++ build tools**
   - **Windows 10/11 SDK** (latest version)
   - **MSVC v143 - VS 2022 C++ x64/x86 build tools**

3. After installation, restart your terminal and try building again:
   ```bash
   npm run tauri dev
   ```

## Option 2: Use GNU Toolchain with MinGW-w64

### Install MSYS2 (includes MinGW-w64):

1. Download MSYS2 from: https://www.msys2.org/
2. Install it to the default location (usually `C:\msys64`)
3. Open MSYS2 terminal and run:
   ```bash
   pacman -Syu
   pacman -S mingw-w64-x86_64-toolchain
   ```

4. Add MSYS2 to your PATH:
   - Add `C:\msys64\mingw64\bin` to your system PATH environment variable
   - Or add it to your PowerShell profile

5. Switch Rust to GNU toolchain:
   ```bash
   rustup default stable-x86_64-pc-windows-gnu
   ```

6. Try building again:
   ```bash
   npm run tauri dev
   ```

## Quick Fix (Try this first)

If you have Chocolatey installed:
```powershell
choco install mingw -y
refreshenv
```

Then set Rust to use GNU:
```powershell
rustup default stable-x86_64-pc-windows-gnu
```

## Verify Installation

Check if the linker is available:
- For MSVC: `where link.exe`
- For MinGW: `where x86_64-w64-mingw32-gcc.exe` or `where gcc.exe`

## Current Status

The project is configured for MSVC by default. To use GNU toolchain instead, run:
```bash
rustup default stable-x86_64-pc-windows-gnu
```

Then ensure MinGW-w64 is installed and in your PATH.
