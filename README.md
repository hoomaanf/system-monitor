# System Monitor 🖥️

A beautiful, real-time system monitoring application for Linux built with Vue 3, Nuxt 3, and Electron.

![System Monitor Screenshot](assets/screenshot.png)

## Features ✨

- ✅ Real-time CPU, RAM, Swap, and GPU monitoring
- ✅ Modern dark theme with gradient UI
- ✅ Responsive design for all screen sizes
- ✅ Auto-refresh toggle
- ✅ Custom title bar
- ✅ System tray icon
- ✅ AppImage and DEB package support

## Screenshot 📸

![Dashboard](assets/screenshot.png)

## Quick Start 🚀

### Download & Run (AppImage)

```bash
# Download latest release from GitHub
# Make it executable
chmod +x system_monitor-*.AppImage

# Run it
./system_monitor-*.AppImage

# Run without terminal output
./system_monitor-*.AppImage > /dev/null 2>&1 &
```

### Install DEB Package

```bash
sudo dpkg -i system_monitor_*_amd64.deb
```

## Development 👨‍💻

### Prerequisites

- Node.js 18+
- npm or pnpm
- Linux

### Setup

```bash
# Clone
git clone https://github.com/hoomaan/system-monitor.git
cd system-monitor

# Install dependencies
npm install

# Run in development
npm run dev
```

### Build

```bash
# Build AppImage
npm run build:appimage

# Build DEB package
npm run build:deb

# Build all packages
npm run build
```

## Project Structure 📁

```
system_monitor/
├── app/              # Nuxt 3 application
├── server/           # API endpoints
├── public/           # Static assets
├── electron-main.js  # Electron entry point
└── package.json      # Project configuration
```

## Tech Stack 🛠️

- **Frontend**: Vue 3, Nuxt 3
- **Desktop**: Electron
- **Icons**: Lucide
- **Styling**: CSS3
- **Packaging**: electron-builder

## Usage 📊

1. Launch the application
2. Monitor system resources in real-time
3. Toggle auto-refresh for live updates
4. Minimize to system tray when needed

## Building Packages 🔧

### AppImage

```bash
npm run build:appimage
# Output: dist/system_monitor-*.AppImage
```

### DEB Package

```bash
npm run build:deb
# Output: dist/system_monitor_*_amd64.deb
```

## Troubleshooting 🔍

### AppImage won't run

```bash
# Check permissions
chmod +x system_monitor-*.AppImage

# Run with logs
./system_monitor-*.AppImage --enable-logging
```

### Missing Node.js

```bash
# Ubuntu/Debian
sudo apt install nodejs npm

# Fedora/RHEL
sudo dnf install nodejs npm
```

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Author

**HOOMAAN** - [hoomaanfelfeli@gmail.com](mailto:hoomaanfelfeli@gmail.com)
