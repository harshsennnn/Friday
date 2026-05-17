const { ipcRenderer } = require('electron');

// 1. Instantly phone home the moment the script is injected
ipcRenderer.send('preload-log', 'Script injected and running!');

ipcRenderer.on('start-voice-mode', () => {
    ipcRenderer.send('preload-log', 'Trigger received! Hunting for Voice button...');
    
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
        ipcRenderer.send('preload-log', 'Target acquired. Executing click...');
        
        // The Nuclear Click
        const eventSequence = ['mouseover', 'mousedown', 'mouseup', 'click'];
        eventSequence.forEach(eventType => {
            const event = new MouseEvent(eventType, {
                view: window, bubbles: true, cancelable: true, buttons: 1
            });
            voiceButton.dispatchEvent(event);
        });
        
        setTimeout(() => voiceButton.click(), 50); 
    } else {
        ipcRenderer.send('preload-log', 'CRITICAL ERROR: Target not found!');
    }
});