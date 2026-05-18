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

// --- FEATURE 1: VOICE FIRST, TYPIST SECOND ---
ipcRenderer.on('start-voice-mode', (event, contextPrompt) => {
    ipcRenderer.send('preload-log', 'Start trigger received! Hunting Voice button FIRST...');

    const possibleSelectors = [
        '[aria-label="Start Voice"]',
        '[aria-label="Start voice session"]',
        'button[data-testid="voice-mode-button"]'
    ];

    let voiceButton = null;
    for (const selector of possibleSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            for (let el of elements) {
                if (el.offsetParent !== null || el.getBoundingClientRect().width > 0) {
                    voiceButton = el;
                    break;
                }
            }
        }
        if (voiceButton) break;
    }
    
    if (voiceButton) {
        ipcRenderer.send('preload-log', 'Voice Target acquired. Executing click...');
        triggerNuclearClick(voiceButton);

        // RACE CONDITION HACK: Inject text immediately while Voice Mode boots
        if (contextPrompt) {
            setTimeout(() => {
                ipcRenderer.send('preload-log', `Voice booting. Injecting Context: "${contextPrompt}"`);
                const chatBox = document.getElementById('prompt-textarea');
                
                if (chatBox) {
                    try {
                        chatBox.focus();
                        document.execCommand('insertText', false, contextPrompt);
                        
                        // Give ProseMirror 50ms to register the text, then hit Enter
                        setTimeout(() => {
                            const enterEvent = new KeyboardEvent('keydown', {
                                bubbles: true,
                                cancelable: true,
                                key: 'Enter',
                                code: 'Enter',
                                keyCode: 13
                            });
                            chatBox.dispatchEvent(enterEvent);
                            ipcRenderer.send('preload-log', 'Context fired into active Voice session.');
                        }, 50);

                    } catch (err) {
                        ipcRenderer.send('preload-log', `CRASH inside Ghost Typist: ${err.message}`);
                    }
                } else {
                    ipcRenderer.send('preload-log', 'Warning: ProseMirror chat box vanished before typing.');
                }
            }, 100); // Fire 100ms after the Voice click
        }
    } else {
        ipcRenderer.send('preload-log', 'CRITICAL ERROR: Voice Target not found!');
    }
});

// --- STOP VOICE LISTENER ---
ipcRenderer.on('stop-voice-mode', () => {
    ipcRenderer.send('preload-log', 'Stop trigger received! Hunting for End button...');
    const possibleSelectors = ['[aria-label="End Voice"]', '[aria-label="End voice session"]'];
    let endButton = null;
    for (const selector of possibleSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) { endButton = elements[0]; break; }
    }
    if (endButton) {
        ipcRenderer.send('preload-log', 'End Target acquired. Executing click...');
        triggerNuclearClick(endButton);
    } else {
        ipcRenderer.send('preload-log', 'End button not found.');
    }
});