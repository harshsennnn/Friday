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
    element.click(); 
}

ipcRenderer.on('start-voice-mode', (event, contextPrompt) => {
    ipcRenderer.send('preload-log', 'Start trigger received! Initiating Pre-Strike Clearance...');

    const chatBox = document.getElementById('prompt-textarea');

    // --- YOUR IDEA: THE GHOST DRAFT WIPER ---
    // Check if there's text blocking our Voice button
    if (chatBox && chatBox.textContent.trim().length > 0) {
        ipcRenderer.send('preload-log', 'Ghost draft detected. Wiping it to force Voice UI to appear...');
        chatBox.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null); // Deletes the ghost draft
    }

    // Give React 150ms to realize the box is empty and bring the Voice button back
    setTimeout(() => {
        ipcRenderer.send('preload-log', 'Hunting Voice button...');
        
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
            ipcRenderer.send('preload-log', 'Voice Target acquired. Executing click synchronously...');
            
            // 1. STRIKE THE VOICE BUTTON
            triggerNuclearClick(voiceButton);

            if (contextPrompt) {
                // 2. WAIT A FRACTION OF A SECOND (50ms)
                setTimeout(() => {
                    if (chatBox) {
                        try {
                            chatBox.focus();
                            
                            // 3. INJECT THE PROMPT
                            document.execCommand('insertText', false, contextPrompt);
                            ipcRenderer.send('preload-log', `Text injected: "${contextPrompt}"`);
                            
                            // 4. WAIT A FRACTION OF A SECOND (50ms) FOR REACT
                            setTimeout(() => {
                                // 5. HIT ENTER
                                const enterEvent = new KeyboardEvent('keydown', {
                                    bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
                                });
                                chatBox.dispatchEvent(enterEvent);
                                ipcRenderer.send('preload-log', 'Enter dispatched. Context fired successfully.');
                            }, 50);

                        } catch (err) {
                            ipcRenderer.send('preload-log', `CRASH: ${err.message}`);
                        }
                    } else {
                        ipcRenderer.send('preload-log', 'Warning: Chat box vanished before we could type.');
                    }
                }, 50); 
            }
        } else {
            ipcRenderer.send('preload-log', 'CRITICAL ERROR: Voice Target not found!');
        }
    }, 150); // The delay buffer for your Ghost Wiper
});

ipcRenderer.on('stop-voice-mode', () => {
    ipcRenderer.send('preload-log', 'Stop trigger received! Hunting for End button...');
    const possibleSelectors = ['[aria-label="End Voice"]', '[aria-label="End voice session"]'];
    let endButton = null;
    for (const selector of possibleSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) { endButton = elements[0]; break; }
    }
    if (endButton) {
        triggerNuclearClick(endButton);
        ipcRenderer.send('preload-log', 'End button clicked.');
    } else {
        ipcRenderer.send('preload-log', 'End button not found.');
    }
});