const canvas = document.querySelector('#board');
const context = canvas.getContext('2d');
const nextCanvas = document.querySelector('#next');
const nextContext = nextCanvas.getContext('2d');
const holdCanvas = document.querySelector('#hold');
const holdContext = holdCanvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const linesElement = document.querySelector('#lines');
const levelElement = document.querySelector('#level');
const statusElement = document.querySelector('#status');
const startButton = document.querySelector('#start');
const highScoresElement = document.querySelector('#high-scores');
const modeSelect = document.querySelector('#mode');
const muteButton = document.querySelector('#mute');
const themeButton = document.querySelector('#theme');
const fullscreenButton = document.querySelector('#fullscreen');
const fileInput = document.querySelector('#score-file');
const importButton = document.querySelector('#import-scores');
const exportButton = document.querySelector('#export-scores');
const liveStatus = document.querySelector('#live-status');

const columns = 10;
const rows = 20;
const cellSize = 30;
const colors = [null, '#53c7b0', '#4169e1', '#ed6b3d', '#efc94c', '#bb76d1', '#5a9fe8', '#e2779e'];
const shapes = [
  [[1, 1, 1, 1]],
  [[2, 0, 0], [2, 2, 2]],
  [[0, 0, 3], [3, 3, 3]],
  [[4, 4], [4, 4]],
  [[0, 5, 5], [5, 5, 0]],
  [[0, 6, 0], [6, 6, 6]],
  [[7, 7, 0], [0, 7, 7]]
];
const highScoreKey = 'blockfall-high-scores';
const settingsKey = 'blockfall-settings';
const modes = { classic: { label: 'CLASSIC', target: 0 }, sprint: { label: 'SPRINT', target: 40 }, time: { label: 'TIME ATTACK', target: 120 } };
const wallKicks = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]];

let board = createBoard();
let currentPiece;
let nextPiece;
let heldPiece;
let canHold = true;
let score = 0;
let lines = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = 800;
let lockCounter = 0;
let lockDelay = 500;
let lastTime = 0;
let running = false;
let paused = false;
let mode = 'classic';
let elapsedTime = 0;
let bag = [];
let muted = false;
let soundContext;

function createBoard() {
  return Array.from({ length: rows }, () => Array(columns).fill(0));
}

function getHighScores() {
  try {
    const storedScores = JSON.parse(localStorage.getItem(highScoreKey) || '[]');
    return Array.isArray(storedScores) ? storedScores.map(entry => typeof entry === 'number' ? { score: entry, mode: 'classic', date: '' } : entry).filter(entry => entry && Number.isFinite(entry.score)).sort((a, b) => b.score - a.score).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function renderHighScores() {
  highScoresElement.innerHTML = '';
  const scores = getHighScores();
  if (!scores.length) {
    highScoresElement.innerHTML = '<li>No scores yet</li>';
    return;
  }
  scores.forEach(value => {
    const item = document.createElement('li');
    const date = value.date ? ` ${new Date(value.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}` : '';
    item.textContent = `${String(value.score).padStart(6, '0')} ${modes[value.mode]?.label || 'CLASSIC'}${date}`;
    highScoresElement.appendChild(item);
  });
}

function saveHighScore() {
  const scores = [...getHighScores(), { score, mode, date: new Date().toISOString() }].sort((a, b) => b.score - a.score).slice(0, 5);
  localStorage.setItem(highScoreKey, JSON.stringify(scores));
  renderHighScores();
}

function randomPiece() {
  if (!bag.length) bag = shapes.map((_, index) => index).sort(() => Math.random() - 0.5);
  const shape = shapes[bag.pop()];
  return createPiece(shape);
}

function createPiece(matrix) {
  return { matrix: matrix.map(row => [...row]), position: { x: Math.floor(columns / 2) - Math.ceil(matrix[0].length / 2), y: 0 } };
}

function drawCell(targetContext, x, y, color, size) {
  targetContext.fillStyle = color;
  targetContext.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  targetContext.fillStyle = 'rgba(255,255,255,.18)';
  targetContext.fillRect(x * size + 3, y * size + 3, size - 8, 3);
}

function draw() {
  context.fillStyle = '#20292b';
  context.fillRect(0, 0, canvas.width, canvas.height);
  board.forEach((row, y) => row.forEach((value, x) => value && drawCell(context, x, y, colors[value], cellSize)));
  if (currentPiece) drawGhost();
  if (currentPiece) drawMatrix(context, currentPiece.matrix, currentPiece.position, cellSize);
}

function drawGhost() {
  const ghostPosition = { ...currentPiece.position };
  while (!collides({ matrix: currentPiece.matrix, position: { x: ghostPosition.x, y: ghostPosition.y + 1 } })) ghostPosition.y++;
  context.save();
  context.globalAlpha = 0.5;
  currentPiece.matrix.forEach((row, y) => row.forEach((value, x) => {
    if (!value) return;
    context.strokeStyle = colors[value];
    context.lineWidth = 2;
    context.strokeRect((x + ghostPosition.x) * cellSize + 4, (y + ghostPosition.y) * cellSize + 4, cellSize - 8, cellSize - 8);
  }));
  context.restore();
}

function drawMatrix(targetContext, matrix, position, size) {
  matrix.forEach((row, y) => row.forEach((value, x) => value && drawCell(targetContext, x + position.x, y + position.y, colors[value], size)));
}

function drawNext() {
  drawPreview(nextContext, nextCanvas, nextPiece);
}

function drawPreview(targetContext, targetCanvas, piece) {
  targetContext.fillStyle = 'rgba(255,255,255,.25)';
  targetContext.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
  if (!piece) return;
  const size = 24;
  const offsetX = (5 - piece.matrix[0].length) / 2;
  const offsetY = (4 - piece.matrix.length) / 2;
  drawMatrix(targetContext, piece.matrix, { x: offsetX, y: offsetY }, size);
}

function drawHold() {
  drawPreview(holdContext, holdCanvas, heldPiece);
}

function collides(piece) {
  return piece.matrix.some((row, y) => row.some((value, x) => value && (board[y + piece.position.y]?.[x + piece.position.x] !== 0)));
}

function merge() {
  currentPiece.matrix.forEach((row, y) => row.forEach((value, x) => { if (value) board[y + currentPiece.position.y][x + currentPiece.position.x] = value; }));
}

function rotate() {
  const matrix = currentPiece.matrix.map((_, index) => currentPiece.matrix.map(row => row[index]).reverse());
  const previous = currentPiece.matrix;
  const previousX = currentPiece.position.x;
  currentPiece.matrix = matrix;
  for (const [offsetX, offsetY] of wallKicks) {
    currentPiece.position.x = previousX + offsetX;
    currentPiece.position.y += offsetY;
    if (!collides(currentPiece)) { playTone(420, .04); return; }
    currentPiece.position.y -= offsetY;
  }
  currentPiece.position.x = previousX;
  currentPiece.matrix = previous;
}

function move(direction) {
  currentPiece.position.x += direction;
  if (collides(currentPiece)) currentPiece.position.x -= direction;
}

function drop() {
  currentPiece.position.y++;
  if (collides(currentPiece)) {
    currentPiece.position.y--;
    lockCounter += dropCounter;
    if (lockCounter >= lockDelay) lockPiece();
  } else {
    lockCounter = 0;
  }
  dropCounter = 0;
}

function lockPiece() { merge(); clearLines(); playTone(180, .07); spawn(); lockCounter = 0; }
function hardDrop() { let distance = 0; while (!collides(currentPiece)) { currentPiece.position.y++; distance++; } currentPiece.position.y--; score += Math.max(0, distance - 1) * 2; updateStats(); lockPiece(); }

function clearLines() {
  let cleared = 0;
  board = board.filter(row => { if (row.every(Boolean)) { cleared++; return false; } return true; });
  while (board.length < rows) board.unshift(Array(columns).fill(0));
  if (cleared) { lines += cleared; score += [0, 100, 300, 500, 800][cleared] * level; level = Math.floor(lines / 10) + 1; dropInterval = Math.max(100, 800 - (level - 1) * 70); playTone(240 + cleared * 100, .12); updateStats(); checkModeGoal(); }
}

function spawn() {
  currentPiece = nextPiece || randomPiece();
  nextPiece = randomPiece();
  canHold = true;
  drawNext();
  if (collides(currentPiece)) endGame();
}

function updateStats() { scoreElement.textContent = String(score).padStart(6, '0'); linesElement.textContent = String(lines).padStart(2, '0'); levelElement.textContent = String(level).padStart(2, '0'); }
function checkModeGoal() { if (mode === 'sprint' && lines >= modes.sprint.target) endGame('SPRINT COMPLETE'); }
function endGame(result = 'GAME OVER') { running = false; saveHighScore(); statusElement.textContent = result; liveStatus.textContent = `${modes[mode].label} / ${result}`; startButton.textContent = 'Play again'; announce(result); }
function hold() {
  if (!running || paused || !canHold) return;
  const currentMatrix = currentPiece.matrix.map(row => [...row]);
  if (heldPiece) {
    currentPiece = createPiece(heldPiece.matrix);
    heldPiece = createPiece(currentMatrix);
  } else {
    heldPiece = createPiece(currentMatrix);
    currentPiece = nextPiece;
    nextPiece = randomPiece();
    drawNext();
  }
  canHold = false;
  drawHold();
  draw();
}
function startGame() { mode = modeSelect.value; board = createBoard(); score = 0; lines = 0; level = 1; dropInterval = 800; lockCounter = 0; elapsedTime = 0; heldPiece = null; canHold = true; bag = []; nextPiece = randomPiece(); spawn(); drawHold(); updateStats(); running = true; paused = false; statusElement.textContent = 'LIVE'; liveStatus.textContent = `${modes[mode].label} / LIVE`; startButton.textContent = 'Restart'; canvas.focus(); announce(`${modes[mode].label} started`); }
function togglePause() { if (!running) return; paused = !paused; statusElement.textContent = paused ? 'PAUSED' : 'LIVE'; }

function playTone(frequency, duration) { if (muted) return; soundContext ||= new AudioContext(); const oscillator = soundContext.createOscillator(); const gain = soundContext.createGain(); oscillator.frequency.value = frequency; gain.gain.value = .035; oscillator.connect(gain).connect(soundContext.destination); oscillator.start(); oscillator.stop(soundContext.currentTime + duration); }
function announce(message) { liveStatus.textContent = `${modes[mode].label} / ${message}`; }
function loadSettings() { try { const settings = JSON.parse(localStorage.getItem(settingsKey) || '{}'); muted = Boolean(settings.muted); document.body.dataset.theme = settings.theme || 'paper'; } catch { document.body.dataset.theme = 'paper'; } updateSettingsButtons(); }
function saveSettings() { localStorage.setItem(settingsKey, JSON.stringify({ muted, theme: document.body.dataset.theme })); }
function updateSettingsButtons() { muteButton.textContent = muted ? 'Sound off' : 'Sound on'; themeButton.textContent = document.body.dataset.theme === 'night' ? 'Day theme' : 'Night theme'; }
function toggleMute() { muted = !muted; saveSettings(); updateSettingsButtons(); }
function toggleTheme() { document.body.dataset.theme = document.body.dataset.theme === 'night' ? 'paper' : 'night'; saveSettings(); updateSettingsButtons(); }
function toggleFullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); }
function exportScores() { const file = new Blob([JSON.stringify(getHighScores(), null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(file); link.download = 'blockfall-scores.json'; link.click(); URL.revokeObjectURL(link.href); }
function importScores() { fileInput.click(); }
function readScoreFile(event) { const reader = new FileReader(); reader.onload = () => { try { const imported = JSON.parse(reader.result); if (!Array.isArray(imported)) throw new Error('Invalid scores'); const normalized = imported.map(value => typeof value === 'number' ? { score: value, mode: 'classic', date: '' } : value).filter(value => value && Number.isFinite(value.score)).slice(0, 5); if (normalized.length !== imported.length) throw new Error('Invalid scores'); localStorage.setItem(highScoreKey, JSON.stringify(normalized)); renderHighScores(); } catch { announce('SCORE FILE REJECTED'); } }; if (event.target.files[0]) reader.readAsText(event.target.files[0]); }

function update(time = 0) {
  const delta = time - lastTime; lastTime = time;
  if (running && !paused) { dropCounter += delta; elapsedTime += delta / 1000; if (mode === 'time' && elapsedTime >= modes.time.target) endGame('TIME UP'); if (mode === 'time') liveStatus.textContent = `${modes[mode].label} / ${Math.max(0, modes.time.target - Math.floor(elapsedTime))}s`; if (dropCounter > dropInterval) drop(); draw(); }
  requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
  if (!running && event.key !== 'Enter') return;
  if (event.key === 'p' || event.key === 'P') togglePause();
  if (!running) return;
  if (paused) return;
  if (event.key === 'ArrowLeft') move(-1);
  if (event.key === 'ArrowRight') move(1);
  if (event.key === 'ArrowDown') drop();
  if (event.key === 'ArrowUp') rotate();
  if (event.code === 'Space') hardDrop();
  if (event.key === 'c' || event.key === 'C') hold();
  if (event.key === 'm' || event.key === 'M') toggleMute();
  if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(event.code) || event.key.startsWith('Arrow')) event.preventDefault();
  draw();
});

document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => { if (!running || paused) return; const action = button.dataset.action; if (action === 'left') move(-1); if (action === 'right') move(1); if (action === 'rotate') rotate(); if (action === 'drop') hardDrop(); if (action === 'hold') hold(); draw(); }));
startButton.addEventListener('click', startGame);
muteButton.addEventListener('click', toggleMute);
themeButton.addEventListener('click', toggleTheme);
fullscreenButton.addEventListener('click', toggleFullscreen);
exportButton.addEventListener('click', exportScores);
importButton.addEventListener('click', importScores);
fileInput.addEventListener('change', readScoreFile);
nextPiece = randomPiece();
drawNext();
drawHold();
renderHighScores();
loadSettings();
draw();
requestAnimationFrame(update);
