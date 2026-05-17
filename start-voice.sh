#!/bin/bash

LOG="$HOME/assistant/logs/assistant.log"

APP="chrome-cadlkienfkclaiaibeoongdcgmdikeeg-Default"

echo "Starting: $(date)" >> "$LOG"

# Launch if app not running
if ! hyprctl clients -j | jq -e \
'.[] | select(.class=="'"$APP"'")' >/dev/null
then
    gtk-launch "$APP"
    sleep 1
fi

# Focus ChatGPT PWA
hyprctl dispatch focuswindow \
"class:^($APP)$"

sleep 3

ACTIVE=$(hyprctl activewindow -j | jq -r '.class')

echo "Focused: $ACTIVE" >> "$LOG"

if [ "$ACTIVE" != "$APP" ]; then
    echo "Focus failed" >> "$LOG"
    exit 1
fi

# Wake page
wtype " "

sleep 1

echo "Navigating to pinned PA chat..." >> "$LOG"

# Reach pinned assistant thread
for i in {1..26}; do
    wtype -k Tab
    sleep 0.08
done

wtype -k Return

echo "Pinned chat opened" >> "$LOG"

# Allow chat page to load
sleep 3

echo "Launching voice..." >> "$LOG"

# Shift + Ctrl + V
wtype -M shift -M ctrl
sleep 0.2
wtype v
sleep 0.2
wtype -m shift -m ctrl

echo "Voice trigger attempted" >> "$LOG"
