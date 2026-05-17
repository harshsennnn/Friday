
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // If an instance is already running, quit this new one immediately
  app.quit();
} else {
  let workspaceWindow;
  let hudWindow;

  app.commandLine.appendSwitch('enable-transparent-visuals');

function createWindows() {
    console.log("Creating windows...");
    
    // --- ADD THIS LOG ---
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log("Attempting to load preload script from:", preloadPath);
    // --------------------

    workspaceWindow = new BrowserWindow({
      width: 1200, height: 800,
      show: true, // Keep it true for this test
      webPreferences: {
        preload: preloadPath,
        backgroundThrottling: false,
        contextIsolation: true,
      }
    });
    workspaceWindow.loadURL('https://chatgpt.com');
    
    // Listen for messages coming from the hidden webpage
ipcMain.on('preload-log', (event, message) => {
    console.log(`[DOM ASSASSIN SAYS]: ${message}`);
});


// 2. The HUD Overlay Window
  hudWindow = new BrowserWindow({
    width: 200, height: 200,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    type: 'splash', // <-- Tells Linux WMs "I am an overlay, do not decorate me"
    title: 'friday-hud', // <-- Explicit title so we can target it in Hyprland
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
    console.log("F.R.I.D.A.Y. Background Engine Online.");
  }

  // When Hyprland tries to launch a second instance via hotkey, this triggers:
// Intercept the OS-level hotkey launch from Hyprland
// Intercept the OS-level hotkey launch
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (commandLine.includes('--toggle')) {
      if (hudWindow.isVisible()) {
        
        // TURN OFF SEQUENCE
        hudWindow.hide();
        console.log("HUD Hidden. Sending STOP trigger to Workspace...");
        if (workspaceWindow) {
          workspaceWindow.webContents.send('stop-voice-mode');
        }

      } else {
        
        // TURN ON SEQUENCE
        hudWindow.showInactive(); 
        console.log("HUD Active. Sending START trigger to Workspace...");
        if (workspaceWindow) {
          workspaceWindow.webContents.send('start-voice-mode');
        }

      }
    }
  });

  app.whenReady().then(() => {
    setTimeout(createWindows, 500);
  });
}