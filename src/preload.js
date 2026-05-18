const { ipcRenderer } = require('electron');

ipcRenderer.send('preload-log', 'Script injected and running!');

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
        if (elements.length > 0) {
            voiceButton = elements[0]; // Just grab the first one we find!
            break;
        }
    }
    
    if (voiceButton) {
        ipcRenderer.send('preload-log', 'Start Target acquired. Executing click...');
        triggerNuclearClick(voiceButton);
    } else {
        ipcRenderer.send('preload-log', 'CRITICAL ERROR: Start Target not found!');
    }
});

// 4. STOP VOICE LISTENER
ipcRenderer.on('stop-voice-mode', () => {
    ipcRenderer.send('preload-log', 'Stop trigger received! Hunting for End button...');
    
    const possibleSelectors = [
        '[aria-label="End Voice"]',
        '[aria-label="End voice session"]'
    ];

    let endButton = null;
    for (const selector of possibleSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            endButton = elements[0]; // Just grab the first one!
            break;
        }
    }
    
    if (endButton) {
        ipcRenderer.send('preload-log', 'End Target acquired. Executing click...');
        triggerNuclearClick(endButton);
    } else {
        ipcRenderer.send('preload-log', 'End button not found (Voice might already be off).');
    }
});