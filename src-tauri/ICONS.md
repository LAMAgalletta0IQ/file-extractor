# Icon Setup

Tauri requires icon files for building the application. You need to create the following icons:

- `icons/32x32.png`
- `icons/128x128.png`
- `icons/128x128@2x.png`
- `icons/icon.icns` (macOS)
- `icons/icon.ico` (Windows)

You can generate these from a single high-resolution source image (1024x1024 recommended) using tools like:

- [Tauri Icon Generator](https://github.com/tauri-apps/tauri-icon-gen)
- Online icon generators
- Image editing software

Alternatively, you can use placeholder icons or remove the icon configuration from `tauri.conf.json` for development purposes.

To generate icons using the Tauri icon generator:
```bash
npm install -g @tauri-apps/cli
tauri icon path/to/your-icon.png
```

This will generate all required icon sizes automatically.
