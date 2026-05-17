const { ipcRenderer } = require('electron');

ipcRenderer.on('start-voice-mode', () => {
    console.log("[F.R.I.D.A.Y.] Trigger received. Hunting for Voice Mode button...");
    
    // The Waterfall: Updated with your live DOM inspection
    const possibleSelectors = [
        '[aria-label="Start Voice"]',           // <--- YOUR EXACT TARGET
        '[aria-label="Start voice session"]',   // Fallback 1
        '[data-testid="voice-mode-button"]',    // Fallback 2
        'button[aria-label="Voice Mode"]'       // Fallback 3
    ];

    let voiceButton = null;

    for (const selector of possibleSelectors) {
        voiceButton = document.querySelector(selector);
        if (voiceButton) {
            console.log(`[F.R.I.D.A.Y.] Target acquired using selector: ${selector}`);
            break; 
        }
    }
    
    if (voiceButton) {
        // Dispatching a full MouseEvent to bypass React's synthetic event traps
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            buttons: 1
        });
        
        voiceButton.dispatchEvent(clickEvent);
        console.log("[F.R.I.D.A.Y.] Button pressed. WebRTC handshake initiating...");
        
    } else {
        console.error("[F.R.I.D.A.Y.] CRITICAL ERROR: Voice button not found.");
    }
});

window.addEventListener('DOMContentLoaded', () => {
    console.log("[F.R.I.D.A.Y.] DOM Assassin online. Awaiting IPC signals...");
});