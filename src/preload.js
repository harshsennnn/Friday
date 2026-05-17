const { ipcRenderer } = require('electron');

// 1. Phone home
ipcRenderer.send('preload-log', 'Script injected and running!');

// 2. Reusable Nuclear Click Function
function triggerNuclearClick(element) {
    const eventSequence = ['mouseover', 'mousedown', 'mouseup', 'click'];
    eventSequence.forEach(eventType => {
        const event = new MouseEvent(eventType, {
            view: window, bubbles: true, cancelable: true, buttons: 1
        });
        element.dispatchEvent(event);
    });
    setTimeout(() => element.click(), 50); 
}

// 3. START VOICE LISTENER
ipcRenderer.on('start-voice-mode', () => {
    ipcRenderer.send('preload-log', 'Start trigger received! Hunting for Start button...');
    
    const possibleSelectors = [
        '[aria-label="Start Voice"]',
        '[aria-label="Start voice session"]',
        'button[data-testid="voice-mode-button"]'
    ];

    let voiceButton = null;
    for (const selector of possibleSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
            if (el.offsetParent !== null) { 
                voiceButton = el;
                break;
            }
        }
        if (voiceButton) break;
    }
    
    if (voiceButton) {
        ipcRenderer.send('preload-log', 'Start Target acquired. Executing click...');
        triggerNuclearClick(voiceButton);
    } else {
        ipcRenderer.send('preload-log', 'CRITICAL ERROR: Start Target not found!');
    }
});

// 4. STOP VOICE LISTENER (NEW)
ipcRenderer.on('stop-voice-mode', () => {
    ipcRenderer.send('preload-log', 'Stop trigger received! Hunting for End button...');
    
    // Add a fallback just in case they change it to "End voice session" later
    const possibleSelectors = [
        '[aria-label="End Voice"]',
        '[aria-label="End voice session"]'
    ];

    let endButton = null;
    for (const selector of possibleSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
            if (el.offsetParent !== null) { 
                endButton = el;
                break;
            }
        }
        if (endButton) break;
    }
    
    if (endButton) {
        ipcRenderer.send('preload-log', 'End Target acquired. Executing click...');
        triggerNuclearClick(endButton);
    } else {
        ipcRenderer.send('preload-log', 'End button not found (Voice might already be off).');
    }
});