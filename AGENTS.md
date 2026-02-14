# Agent Development Guide — Yearster

## Overview
Yearster is a browser-based music year-guessing game. Fully client-side (no server, no build step). Players hear songs via Spotify embeds and guess the release year.

**Full specification and architecture**: see [README.md](./README.md) (written in Hebrew).

## Tech Stack
- Vanilla HTML / CSS / JavaScript — no frameworks, no bundler
- Spotify Embed iframes for playback
- Google Fonts (Heebo + Inter)
- Node.js scripts for song database generation only (not required at runtime)

## File Map

| File | Role | Lines | Notes |
|------|------|-------|-------|
| `index.html` | Structure | ~200 | 3 screens + instructions modal. RTL (`dir="rtl"`, `lang="he"`) |
| `style.css` | Styling | ~1070 | CSS variables in `:root`, glassmorphism (`.glass`), responsive at 480px |
| `game.js` | Logic | ~400 | All game state, localStorage, Spotify embed, year picker |
| `songs.js` | Data | ~600 entries | Auto-generated. Do NOT edit manually — use `build_songs.js` |
| `hebrew_songs.js` | Data | ~48 entries | Hebrew songs with verified Spotify Track IDs |
| `build_songs.js` | Build script | ~220 | Downloads TidyTuesday CSV, merges Hebrew, outputs `songs.js` |
| `find_hebrew_ids.js` | Build script | ~130 | Finds Hebrew Track IDs from kworb.net, verifies via oEmbed |
| `verify_songs.js` | Build script | ~60 | Verifies existing Track IDs via oEmbed |

## Key Patterns

### Screen Management
Three `div.screen` elements. Only one has `.active` at a time. Controlled by `showScreen(id)`.
```
screen-register → screen-game → screen-results
```

### Game State
Single `state` object holds everything. Serialized to `localStorage` under key `yearster_game_state` after each action. Restored on `DOMContentLoaded`.

### Song Selection
Songs are shuffled once at game start (`shuffleArray([...SONGS]).slice(0, needed)`). The shuffled subset is stored in `state.gameSongs` and persisted in localStorage. No song repeats within a game.

### Spotify Embed
- iframe: `https://open.spotify.com/embed/track/{id}?theme=0`
- Height: 152px (compact player)
- Song cover overlay (`.song-cover`) hides title + album art. Uses `bottom: 68px` to leave play controls visible. Add class `.revealed` to fade it out.

### Year Picker
Replaced the range slider for mobile friendliness:
- `setDecade(decade)` — jumps to `decade + 5`
- `adjustYear(delta)` — increments/decrements
- `currentYear` variable holds the value (no DOM input element)
- `updateDecadeButtons()` highlights the active decade button

### Scoring
```
distance = Math.abs(guessed - actual)
points = distance === 0 ? -5 : distance
```
Lowest total score wins.

## How to Rebuild the Song Database
```bash
node build_songs.js     # Downloads ~8MB CSV, generates songs.js (600 songs)
node find_hebrew_ids.js # Re-verifies Hebrew Track IDs, writes hebrew_songs.js
node verify_songs.js    # Verifies all IDs in songs.js via oEmbed
```

## Adding Songs
1. Add entries to `hebrew_songs.js` (for Hebrew) or directly to `songs.js`
2. Format: `{ id: "SPOTIFY_TRACK_ID", title: "...", artist: "...", year: YYYY }`
3. Verify ID: `https://open.spotify.com/oembed?url=https://open.spotify.com/track/ID` — should return JSON

## Known Limitations
- Hebrew songs only available for 2010s-2020s (older Israeli music hard to find on Spotify programmatically)
- Spotify embed requires internet + Spotify account (free tier works)
- TidyTuesday dataset is from 2020 — some Track IDs may be removed over time
- All UI text is in Hebrew (RTL layout)

## CSS Variables Reference
```css
--bg-primary: #0a0a1a       /* Main background */
--accent-1: #8b5cf6         /* Purple — primary accent */
--accent-2: #ec4899         /* Pink — secondary accent */
--accent-3: #3b82f6         /* Blue — tertiary accent */
--gradient-primary: linear-gradient(135deg, #8b5cf6, #ec4899)
--surface: rgba(255,255,255,0.06)  /* Glass panel background */
--border: rgba(255,255,255,0.08)   /* Subtle borders */
```
