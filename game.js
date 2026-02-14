// ===== GAME STATE =====
const state = {
    players: [],
    currentPlayerIndex: 0,
    currentRound: 1,
    totalRounds: 10,
    scores: [],
    usedSongs: [],
    currentSong: null,
    gameSongs: [],
};

const EMOJIS = ['🎤', '🎸', '🥁', '🎹', '🎷'];
const PLAYER_COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#f59e0b', '#10b981'];
const LS_KEY = 'yearster_game_state';

// ===== LOCAL STORAGE =====
function saveState() {
    const data = {
        players: state.players,
        currentPlayerIndex: state.currentPlayerIndex,
        currentRound: state.currentRound,
        totalRounds: state.totalRounds,
        scores: state.scores,
        gameSongs: state.gameSongs,
        currentSong: state.currentSong,
        phase: document.getElementById('screen-game').classList.contains('active') ? 'game' :
            document.getElementById('screen-results').classList.contains('active') ? 'results' : 'register'
    };
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch (e) { /* storage full or unavailable */ }
}

function clearSavedState() {
    try { localStorage.removeItem(LS_KEY); } catch (e) { }
}

function loadState() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data.players || data.players.length < 2) return false;

        state.players = data.players;
        state.scores = data.scores;
        state.currentPlayerIndex = data.currentPlayerIndex;
        state.currentRound = data.currentRound;
        state.totalRounds = data.totalRounds;
        state.gameSongs = data.gameSongs;
        state.currentSong = data.currentSong;

        if (data.phase === 'results') {
            endGame();
        } else if (data.phase === 'game') {
            showScreen('screen-game');
            startTurn();
        } else {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ===== REGISTRATION & START =====
function startGame() {
    const players = [];
    for (let i = 1; i <= 5; i++) {
        const name = document.getElementById(`player-${i}`).value.trim();
        if (name) players.push(name);
    }

    if (players.length < 2) {
        shakeElement(document.querySelector('.players-form'));
        return;
    }

    state.players = players;
    state.scores = players.map(() => 0);
    state.currentPlayerIndex = 0;
    state.currentRound = 1;
    state.usedSongs = [];

    // Shuffle and pick songs for the game
    const totalSongsNeeded = state.totalRounds * players.length;
    state.gameSongs = shuffleArray([...SONGS]).slice(0, totalSongsNeeded);

    showScreen('screen-game');
    startTurn();
    saveState();
}

function shakeElement(el) {
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
}

// ===== SHUFFLE UTILITY =====
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ===== TURN MANAGEMENT =====
function startTurn() {
    const songIndex = (state.currentRound - 1) * state.players.length + state.currentPlayerIndex;

    if (songIndex >= state.gameSongs.length) {
        endGame();
        return;
    }

    state.currentSong = state.gameSongs[songIndex];

    // Update UI
    updateScoreboard();
    updateCurrentPlayer();
    updateRound();
    loadSpotifyEmbed(state.currentSong.id);

    // Show guess section, hide result
    document.getElementById('guess-section').style.display = '';
    document.getElementById('result-section').style.display = 'none';

    // Reset year picker
    setYear(2000);

    // Hide song name
    document.getElementById('song-cover').classList.remove('revealed');
}

function updateCurrentPlayer() {
    const name = state.players[state.currentPlayerIndex];
    document.getElementById('current-player-name').textContent = name;
    document.getElementById('player-avatar').textContent = EMOJIS[state.currentPlayerIndex % EMOJIS.length];
}

function updateRound() {
    document.getElementById('round-number').textContent = state.currentRound;
}

function updateScoreboard() {
    const container = document.getElementById('scoreboard-mini');
    container.innerHTML = state.players.map((name, i) => `
    <div class="score-chip ${i === state.currentPlayerIndex ? 'active' : ''}">
      <span class="score-chip-name">${name}</span>
      <span class="score-chip-value">${state.scores[i]}</span>
    </div>
  `).join('');
}

// ===== SPOTIFY EMBED =====
function loadSpotifyEmbed(trackId) {
    const container = document.getElementById('spotify-embed');
    container.innerHTML = `
    <iframe
      src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0"
      width="100%"
      height="152"
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      style="border-radius: 12px;"
    ></iframe>
  `;
}

// ===== YEAR PICKER =====
let currentYear = 2000;

function setYear(y) {
    currentYear = Math.max(1970, Math.min(2025, y));
    document.getElementById('year-value').value = currentYear;
    document.getElementById('year-display').textContent = currentYear;
    updateDecadeButtons();
}

function setDecade(decade) {
    setYear(decade + 5);
}

function adjustYear(delta) {
    setYear(currentYear + delta);
}

function updateDecadeButtons() {
    const activeDecade = Math.floor(currentYear / 10) * 10;
    document.querySelectorAll('.decade-btn').forEach(btn => {
        const btnDecade = parseInt(btn.getAttribute('onclick').match(/\d+/)[0]);
        btn.classList.toggle('active', btnDecade === activeDecade);
    });
}

// ===== GUESS SUBMISSION =====
function submitGuess() {
    const guessedYear = currentYear;
    const actualYear = state.currentSong.year;
    const distance = Math.abs(guessedYear - actualYear);

    // Exact match bonus: -5 points
    const points = distance === 0 ? -5 : distance;

    // Update score
    state.scores[state.currentPlayerIndex] += points;
    saveState();

    // Show result
    showResult(guessedYear, actualYear, distance, points);
}

function showResult(guessed, actual, distance, points) {
    // Hide guess, show result
    document.getElementById('guess-section').style.display = 'none';
    const resultSection = document.getElementById('result-section');
    resultSection.style.display = '';
    resultSection.style.animation = 'none';
    // Trigger reflow for animation restart
    resultSection.offsetHeight;
    resultSection.style.animation = '';

    // Reveal song name
    document.getElementById('song-cover').classList.add('revealed');

    // Emoji & text based on accuracy
    let emoji, text;
    if (distance === 0) {
        emoji = '🎯'; text = 'פגיעה מדויקת! בונוס -5 נקודות!';
    } else if (distance <= 2) {
        emoji = '🔥'; text = 'כמעט מושלם!';
    } else if (distance <= 5) {
        emoji = '👏'; text = 'קרוב מאוד!';
    } else if (distance <= 10) {
        emoji = '😊'; text = 'לא רע בכלל';
    } else if (distance <= 20) {
        emoji = '🤔'; text = 'אפשר יותר טוב...';
    } else {
        emoji = '😬'; text = 'אוי אוי...';
    }

    document.getElementById('result-emoji').textContent = emoji;
    document.getElementById('result-text').textContent = text;
    document.getElementById('result-guessed').textContent = guessed;
    document.getElementById('result-actual').textContent = actual;
    document.getElementById('result-song').textContent =
        `${state.currentSong.title} - ${state.currentSong.artist}`;
    document.getElementById('result-points').textContent = points < 0 ? `${points}` : `+${points}`;

    // Update scoreboard with new score
    updateScoreboard();

    // Check if this is the last turn
    const isLastTurn = state.currentRound === state.totalRounds &&
        state.currentPlayerIndex === state.players.length - 1;

    const nextBtn = document.getElementById('btn-next');
    if (isLastTurn) {
        nextBtn.querySelector('.btn-text').textContent = '🏆 לתוצאות!';
    } else {
        nextBtn.querySelector('.btn-text').textContent = '⏭️ הבא';
    }
}

// ===== NEXT TURN =====
function nextTurn() {
    state.currentPlayerIndex++;

    if (state.currentPlayerIndex >= state.players.length) {
        state.currentPlayerIndex = 0;
        state.currentRound++;

        if (state.currentRound > state.totalRounds) {
            endGame();
            return;
        }
    }

    startTurn();
    saveState();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== END GAME =====
function endGame() {
    clearSavedState();
    showScreen('screen-results');

    // Find winner (lowest score)
    const minScore = Math.min(...state.scores);
    const winnerIndex = state.scores.indexOf(minScore);

    document.getElementById('winner-name').textContent = state.players[winnerIndex];
    document.getElementById('winner-score').textContent = `${minScore} נקודות`;

    // Build final scoreboard
    const ranked = state.players.map((name, i) => ({
        name,
        score: state.scores[i],
        index: i
    })).sort((a, b) => a.score - b.score);

    const scoreboard = document.getElementById('final-scoreboard');
    scoreboard.innerHTML = ranked.map((p, i) => `
    <div class="final-score-row ${i === 0 ? 'winner-row' : ''}"
         style="animation-delay: ${i * 0.1}s">
      <div class="final-rank ${i === 0 ? 'rank-1' : ''}">${i + 1}</div>
      <div class="final-player-name">${p.name}</div>
      <div class="final-player-score">${p.score} <span>נק׳</span></div>
    </div>
  `).join('');
}

// ===== RESET =====
function resetGame() {
    clearSavedState();
    state.players = [];
    state.scores = [];
    state.currentPlayerIndex = 0;
    state.currentRound = 1;
    state.usedSongs = [];
    state.gameSongs = [];
    state.currentSong = null;

    // Clear inputs
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`player-${i}`).value = '';
    }

    showScreen('screen-register');
}

function abandonGame() {
    if (confirm('בטוח שאתם רוצים לצאת מהמשחק?')) {
        resetGame();
    }
}

// ===== KEYBOARD SUPPORT =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const gameScreen = document.getElementById('screen-game');
        if (gameScreen.classList.contains('active')) {
            const guessSection = document.getElementById('guess-section');
            const resultSection = document.getElementById('result-section');
            if (guessSection.style.display !== 'none') {
                submitGuess();
            } else if (resultSection.style.display !== 'none') {
                nextTurn();
            }
        }
    }
});

// Add shake animation CSS dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-6px); }
    80% { transform: translateX(6px); }
  }
  .shake { animation: shake 0.4s ease-in-out; }
`;
document.head.appendChild(shakeStyle);

// ===== INSTRUCTIONS MODAL =====
function openInstructions() {
    document.getElementById('instructions-modal').style.display = '';
}

function closeInstructions(event) {
    if (!event || event.target === event.currentTarget) {
        document.getElementById('instructions-modal').style.display = 'none';
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeInstructions();
});

// ===== RESTORE SAVED GAME ON LOAD =====
window.addEventListener('DOMContentLoaded', () => {
    loadState();
});
