const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// --- OS DETECTION ROUTER ---
const isLinux = process.platform === 'linux';
const isHyprland = isLinux && process.env.HYPRLAND_INSTANCE_SIGNATURE !== undefined;

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // CRITICAL FIX FOR WAYLAND: Prevents GPU crashes and centering issues
  app.disableHardwareAcceleration();

  let workspaceWindow;
  let hudWindow;

  app.commandLine.appendSwitch('enable-transparent-visuals');

  // --- THE CONTEXT GENERATOR ---
  function getContextPrompt() {
    const statePath = path.join(app.getPath('userData'), 'friday-state.json');
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();

    let state = { date: today, morning: false, midday: false, evening: false };
    
    if (fs.existsSync(statePath)) {
      try {
        const rawState = fs.readFileSync(statePath);
        const parsedState = JSON.parse(rawState);
        if (parsedState.date === today) {
          state = parsedState;
        }
      } catch (e) {
        console.error("State read error, resetting.");
      }
    }

    let prompt = null;

    if (hour >= 5 && hour < 12 && !state.morning) {
      prompt = "Good morning FRIDAY. Morning standup time. Greet me as Boss and ask priorities and blockers.";
      state.morning = true;
    } else if (hour >= 12 && hour < 17 && !state.midday) {
      prompt = "FRIDAY, midday check-in. Ask about blockers and progress.";
      state.midday = true;
    } else if (hour >= 17 && hour < 22 && !state.evening) {
      prompt = "FRIDAY, wrap-up time. Ask what got completed today.";
      state.evening = true;
    }

    // --- FORCE TEST OVERRIDE ---
    // This guarantees the context runs every time you hit the hotkey for testing.
    prompt = "F.R.I.D.A.Y., this is a system test. Say 'Systems nominal, Boss'.";

    fs.writeFileSync(statePath, JSON.stringify(state));
    return prompt; 
  }

  function createWindows() {
    console.log("Creating windows...");
    const preloadPath = path.join(__dirname, 'preload.js');

    // --- DYNAMIC WORKSPACE CONFIGURATION ---
    let workspaceConfig = {
      width: 1200, height: 800,
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
      workspaceConfig.x = -10000;
      workspaceConfig.y = -10000;
      workspaceConfig.skipTaskbar = true;
    }

    workspaceWindow = new BrowserWindow(workspaceConfig);
    workspaceWindow.loadURL('https://chatgpt.com');

    hudWindow = new BrowserWindow({
      width: 200, height: 200,
      transparent: true, frame: false, resizable: false,
      alwaysOnTop: true, skipTaskbar: true, show: false,
      type: 'splash', title: 'friday-hud', 
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
  app.on('second-instance', (event, commandLine) => {
    if (commandLine.includes('--toggle')) {
      if (hudWindow.isVisible()) {
        hudWindow.hide();
        console.log("HUD Hidden. Sending STOP trigger...");
        if (workspaceWindow) workspaceWindow.webContents.send('stop-voice-mode');
      } else {
        hudWindow.showInactive(); 
        console.log("HUD Active. Sending START trigger...");
        const contextPrompt = getContextPrompt();
        if (workspaceWindow) workspaceWindow.webContents.send('start-voice-mode', contextPrompt);
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