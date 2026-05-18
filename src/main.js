const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// --- NEW: OS DETECTION ROUTER ---
const isLinux = process.platform === 'linux';
// If this environment variable exists, we know they are running Hyprland
const isHyprland = isLinux && process.env.HYPRLAND_INSTANCE_SIGNATURE !== undefined;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  let workspaceWindow;
  let hudWindow;

  app.commandLine.appendSwitch('enable-transparent-visuals');

  function createWindows() {
    console.log("Creating windows...");
    const preloadPath = path.join(__dirname, 'preload.js');

    // --- DYNAMIC WORKSPACE CONFIGURATION ---
    let workspaceConfig = {
      width: 1200, 
      height: 800,
      show: true, // Must be true so React doesn't destroy the DOM
      webPreferences: {
        preload: preloadPath,
        backgroundThrottling: false, 
        contextIsolation: true,
      }
    };

    if (isHyprland) {
      console.log("Hyprland detected: Applying scratchpad title tag.");
      workspaceConfig.title = "friday-workspace"; 
    } else {
      console.log("Standard OS detected: Pushing window off-screen.");
      // Windows, Mac, and GNOME/KDE respect these coordinates.
      // The window exists, React renders it, but it's invisible to the user.
      workspaceConfig.x = -10000;
      workspaceConfig.y = -10000;
      workspaceConfig.skipTaskbar = true; // Hide it from the Windows/Mac dock
    }

    // 1. The Full Workspace Window
    workspaceWindow = new BrowserWindow(workspaceConfig);
    workspaceWindow.loadURL('https://chatgpt.com');

    // 2. The HUD Overlay Window
    hudWindow = new BrowserWindow({
      width: 200, height: 200,
      transparent: true,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      show: false,
      type: 'splash',      
      title: 'friday-hud', 
      webPreferences: { nodeIntegration: true }
    });
    
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    hudWindow.setBounds({
      x: Math.round((width / 2) - 100),
      y: Math.round(height - 250),
      width: 200, height: 200
    });

    hudWindow.loadFile(path.join(__dirname, 'ui/hud.html'));
  }

  // Intercept the OS-level hotkey launch
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (commandLine.includes('--toggle')) {
      if (hudWindow.isVisible()) {
        hudWindow.hide();
        if (workspaceWindow) workspaceWindow.webContents.send('stop-voice-mode');
      } else {
        hudWindow.showInactive(); 
        if (workspaceWindow) workspaceWindow.webContents.send('start-voice-mode');
      }
    }
  });

  // Listen for logs from the DOM Assassin
  ipcMain.on('preload-log', (event, message) => {
      console.log(`[DOM ASSASSIN SAYS]: ${message}`);
  });

  app.whenReady().then(() => {
    setTimeout(createWindows, 500);
  });
}