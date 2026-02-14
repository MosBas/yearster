# Yearster - משחק ניחוש שנת שירים 🎵

משחק דפדפן (client-side בלבד) שבו 2-5 שחקנים מתחרים מי מכיר הכי טוב את שנת יציאת השירים.
30 שניות מושמעות מכל שיר דרך Spotify Embed, והשחקן מנחש את השנה.

---

## 🎮 חוקי המשחק

- **2-5 שחקנים** — 2 חובה, השאר אופציונלי
- **10 סיבובים** — כל שחקן מנחש פעם בכל סיבוב
- **שם השיר מוסתר** — כיסוי מעל ה-Spotify embed (שם + אלבום) במהלך ההשמעה, נחשף רק אחרי הניחוש
- **ניקוד** = 100 פחות המרחק (בשנים) בין הניחוש לשנה האמיתית
- **פגיעה מדויקת** = **110 נקודות** (100 + 10 בונוס)
- **אותו שיר לא חוזר פעמיים** — השירים מעורבבים ונחתכים מראש
- **מנצח** — השחקן עם הניקוד **הגבוה ביותר**
- **שמירה אוטומטית** — המשחק נשמר ב-localStorage, ריענון הדף לא מאפס את המשחק

---

## 🚀 הרצה

```
פתח את index.html בדפדפן (double-click או drag & drop)
```

- נדרש חיבור אינטרנט (Spotify Embed + Google Fonts)
- אין צורך בשרת — הכל רץ ב-client
- עובד במובייל ובדסקטופ

---

## 📁 מבנה הקבצים

```
hitster2/
├── index.html          # HTML — 3 מסכים + מודאל הוראות
├── style.css           # עיצוב — dark mode, glassmorphism, responsive
├── game.js             # לוגיקת משחק — סיבובים, ניקוד, localStorage, Spotify
├── songs.js            # מאגר שירים — 600 שירים (נוצר אוטומטית)
├── hebrew_songs.js     # שירים עבריים — 48 שירים מאומתים מ-kworb.net
├── build_songs.js      # סקריפט Node.js ליצירת songs.js מ-dataset + עברית
├── find_hebrew_ids.js  # סקריפט למציאת Track IDs עבריים מ-kworb.net
├── verify_songs.js     # סקריפט לאימות Track IDs דרך Spotify oEmbed
└── README.md           # מסמך זה
```

---

## 🏗️ ארכיטקטורה ומסכים

### 3 מסכים (screens)
מנוהלים דרך `showScreen(id)` — רק מסך אחד active בכל רגע.

| מסך | ID | תיאור |
|-----|----|--------|
| רישום | `screen-register` | הכנסת שמות 2-5 שחקנים, כפתור התחלה, כפתור הוראות |
| משחק | `screen-game` | בר עליון (סיבוב + ניקוד + כפתור יציאה), באנר שחקן, Spotify embed עם כיסוי, בוחר שנה, תוצאת ניחוש |
| תוצאות | `screen-results` | מנצח, טבלת ניקוד מדורגת, כפתור משחק חדש |

### מודאל הוראות
`#instructions-modal` — נפתח מכפתור "📖 איך משחקים?" במסך הרישום. נסגר ב-X / לחיצה בחוץ / Escape.

---

## 🎯 לוגיקת המשחק (`game.js`)

### State
```javascript
const state = {
    players: [],           // שמות שחקנים (2-5)
    currentPlayerIndex: 0, // אינדקס שחקן נוכחי
    currentRound: 1,       // סיבוב נוכחי (1-10)
    totalRounds: 10,
    scores: [],            // ניקוד לכל שחקן
    currentSong: null,     // השיר הנוכחי { id, title, artist, year }
    gameSongs: [],         // מערך שירים מעורבב למשחק
};
```

### זרימת משחק
1. `startGame()` — מאמת ≥2 שחקנים, מערבב SONGS, חותך כמה שצריך, שומר ב-localStorage
2. `startTurn()` — טוען שיר, מסתיר כיסוי, מאפס בוחר שנה
3. `submitGuess()` — מחשב מרחק, בונוס -5 לפגיעה מדויקת, שומר ב-localStorage
4. `showResult()` — חושף שם שיר, מציג תוצאה עם אימוג'י/טקסט לפי דיוק
5. `nextTurn()` — מתקדם שחקן/סיבוב, שומר ב-localStorage
6. `endGame()` — מציג מנצח + טבלה מדורגת, מנקה localStorage

### localStorage
- **מפתח**: `yearster_game_state`
- **נשמר**: אחרי startGame, submitGuess, nextTurn
- **נמחק**: אחרי endGame, resetGame, abandonGame
- **משוחזר**: ב-`DOMContentLoaded` — חוזר לאותו תור בדיוק

### ניקוד
```
distance = |guessed - actual|
points = distance === 0 ? 110 : max(0, 100 - distance)
total = sum of all points (higher is better)
```

### Spotify Embed
- iframe של `https://open.spotify.com/embed/track/{id}?theme=0`
- גובה 152px, theme=0 (dark)
- כיסוי (`.song-cover`) מסתיר שם + אלבום, משאיר רק פקדי נגינה למטה

---

## 🎨 עיצוב (`style.css`)

### Design System
| Variable | ערך | שימוש |
|----------|-----|-------|
| `--bg-primary` | `#0a0a1a` | רקע כהה |
| `--accent-1` | `#8b5cf6` | סגול — צבע ראשי |
| `--accent-2` | `#ec4899` | ורוד — צבע משני |
| `--accent-3` | `#3b82f6` | כחול — צבע שלישי |
| `--gradient-primary` | סגול→ורוד | כפתורים, הדגשות |

### מאפיינים
- **Dark mode** בלבד
- **Glassmorphism** — `.glass` עם `backdrop-filter: blur(16px)` וגבול שקוף
- **RTL** — `dir="rtl"` ו-`lang="he"`
- **פונטים** — Heebo (עברית) + Inter (אנגלית/מספרים)
- **אנימציות** — fadeIn, popIn, pulse, shake, slideIn
- **Responsive** — `@media (max-width: 480px)` עבור מובייל

### בוחר שנה (Year Picker)
חליף לסליידר, מותאם למובייל:
- **6 כפתורי עשור** בגריד (70s-20s) — `setDecade(1970)` קופץ לאמצע העשור
- **4 כפתורי ±** — `adjustYear(-5)`, `adjustYear(-1)`, `adjustYear(+1)`, `adjustYear(+5)`
- **תצוגת שנה** גדולה (3.2rem) באמצע

---

## 🎵 מאגר השירים (`songs.js`)

### מספרים
- **600 שירים** — 100 לכל עשור (1970s-2020s)
- **שירים באנגלית** — מ-[TidyTuesday Spotify Dataset](https://github.com/rfordatascience/tidytuesday/tree/master/data/2020/2020-01-21) (~33,000 שירים), ממוינים לפי popularity
- **שירים בעברית** — 48 שירים מ-kworb.net Israel charts (עומר אדם, עדן בן זקן, ועוד)
- **כל ה-Track IDs מאומתים** דרך Spotify oEmbed API

### חלוקה לפי עשור
| עשור | אנגלית | עברית | סה"כ |
|------|--------|-------|------|
| 1970s | 100 | 0 | 100 |
| 1980s | 100 | 0 | 100 |
| 1990s | 100 | 0 | 100 |
| 2000s | 100 | 0 | 100 |
| 2010s | 78 | 22 | 100 |
| 2020s | 74 | 26 | 100 |

### פורמט שיר
```javascript
{ id: "SPOTIFY_TRACK_ID", title: "Song Title", artist: "Artist Name", year: 2023 }
```

---

## 🔧 סקריפטים

### `build_songs.js` — בניית מאגר שירים
```bash
node build_songs.js
```
1. מוריד CSV מ-TidyTuesday (~8MB)
2. מפרסר ומסיר כפילויות (שומר הכי פופולרי)
3. ממזג עם `hebrew_songs.js`
4. בוחר 100 לעשור (אנגלית לפי popularity + כל העברית)
5. מאמת 15 שירים אקראיים דרך oEmbed
6. כותב ל-`songs.js`

### `find_hebrew_ids.js` — מציאת Track IDs עבריים
```bash
node find_hebrew_ids.js
```
- רשימת שירים עם IDs מ-kworb.net Israel charts
- מאמת כל ID דרך oEmbed
- כותב ל-`hebrew_songs.js`

### `verify_songs.js` — אימות שירים קיימים
```bash
node verify_songs.js
```
- בודק כל ID ב-`songs.js` דרך oEmbed

---

## ➕ הוספת שירים

### אוטומטית
```bash
node build_songs.js
```

### ידנית
ערוך `hebrew_songs.js` או `songs.js`:
```javascript
{ id: "7tFiyTwD0nx5a1eklYtX2J", title: "שם השיר", artist: "זמר", year: 2023 }
```

### למציאת Track ID
1. פתח [Spotify Web Player](https://open.spotify.com/)
2. חפש שיר → לחץ ⋯ → Share → Copy Song Link
3. ה-ID הוא החלק האחרון: `https://open.spotify.com/track/**ID_HERE**`

### אימות ID
```
https://open.spotify.com/oembed?url=https://open.spotify.com/track/YOUR_ID
```
אם מחזיר JSON עם `title` — ה-ID תקין.

---

## 🛠️ טכנולוגיות

| רכיב | טכנולוגיה |
|-------|-----------|
| Frontend | HTML / CSS / JavaScript (וניל, ללא frameworks) |
| נגן שירים | Spotify Embed (iframe, 30 שניות) |
| פונטים | Google Fonts — Heebo + Inter |
| מאגר שירים | TidyTuesday CSV + kworb.net |
| אימות IDs | Spotify oEmbed API |
| שמירת מצב | localStorage |
| Node.js | סקריפטים לבניית מאגר (לא נדרש להרצת המשחק) |

---

## ⚠️ הערות חשובות

- **Spotify Embed** דורש חיבור אינטרנט ו-Spotify account (חינמי) בדפדפן לנגינה
- **Track IDs מ-TidyTuesday** הם מ-2020, חלקם עלולים להתבטל (נדיר)
- **שירים עבריים מעשורים ישנים** (70s-90s) לא נמצאים — Spotify API חסום ללא אימות, kworb לא עוקב שירים ישנים
- **localStorage** — מוגבל ל-~5MB, מספיק ל-600 שירים
