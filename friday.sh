#!/bin/bash

LOG="$HOME/Projects/FRIDAY/logs/assistant.log"

APP="chrome-jgcmjidbdajaaefpibonglnpcjleghfj-Default"


STATE="$HOME/Projects/FRIDAY/state.json"

TODAY=$(date +%F)
HOUR=$(date +%H)

# create initial file if missing
if [ ! -f "$STATE" ]; then
cat > "$STATE" <<EOF
{
 "date":"$TODAY",
 "morning":false,
 "midday":false,
 "evening":false
}
EOF
fi

# reset daily
SAVED_DATE=$(jq -r '.date' "$STATE")

if [ "$SAVED_DATE" != "$TODAY" ]; then

cat > "$STATE" <<EOF
{
 "date":"$TODAY",
 "morning":false,
 "midday":false,
 "evening":false
}
EOF

fi

MORNING_DONE=$(jq -r '.morning' "$STATE")
MIDDAY_DONE=$(jq -r '.midday' "$STATE")
EVENING_DONE=$(jq -r '.evening' "$STATE")

if [ "$HOUR" -ge 5 ] && [ "$HOUR" -lt 12 ] && [ "$MORNING_DONE" = "false" ]; then

PROMPT="Good morning FRIDAY. Morning standup time. Greet me as Boss and ask priorities and blockers."

jq '.morning=true' "$STATE" > /tmp/state.tmp
mv /tmp/state.tmp "$STATE"

elif [ "$HOUR" -ge 12 ] && [ "$HOUR" -lt 17 ] && [ "$MIDDAY_DONE" = "false" ]; then

PROMPT="FRIDAY, midday check-in. Ask about blockers and progress."

jq '.midday=true' "$STATE" > /tmp/state.tmp
mv /tmp/state.tmp "$STATE"

elif [ "$HOUR" -ge 17 ] && [ "$HOUR" -lt 22 ] && [ "$EVENING_DONE" = "false" ]; then

PROMPT="FRIDAY, wrap-up time. Ask what got completed today."

jq '.evening=true' "$STATE" > /tmp/state.tmp
mv /tmp/state.tmp "$STATE"

else

PROMPT="FRIDAY, continue from previous context and ask where we left off."

fi


echo "Starting: $(date)" >> "$LOG"

# Launch Chromium PWA if absent
if ! hyprctl clients -j | jq -e \
'.[] | select(.class=="'"$APP"'")' >/dev/null
then
    gtk-launch "$APP"
    sleep 1
fi

# Focus exact PWA
hyprctl dispatch focuswindow \
"class:^($APP)$"

sleep 1

ACTIVE=$(hyprctl activewindow -j | jq -r '.class')

echo "Focused: $ACTIVE" >> "$LOG"

if [ "$ACTIVE" != "$APP" ]; then
    echo "Focus failed" >> "$LOG"
    exit 1
fi

# Wake page
wtype " "

sleep 3

echo "Triggering voice..." >> "$LOG"

# Ctrl+Shift+V
wtype -M ctrl -M shift
sleep 0.08
wtype v
sleep 0.08
wtype -m ctrl -m shift

# tiny race delay
sleep 0.20

echo "Injecting prompt..." >> "$LOG"

wtype "$PROMPT"

sleep 0.12

wtype -k Return

echo "Prompt sent" >> "$LOG"

echo "Done: $(date)" >> "$LOG"
