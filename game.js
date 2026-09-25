const canvas = document.querySelector('#board');
const context = canvas.getContext('2d');
const nextCanvas = document.querySelector('#next');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const linesElement = document.querySelector('#lines');
const levelElement = document.querySelector('#level');
const statusElement = document.querySelector('#status');
const startButton = document.querySelector('#start');

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

let board = createBoard();
let currentPiece;
let nextPiece;
let score = 0;
let lines = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = 800;
let lastTime = 0;
let running = false;
let paused = false;

function createBoard() {
  return Array.from({ length: rows }, () => Array(columns).fill(0));
}

function randomPiece() {
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  return { matrix: shape.map(row => [...row]), position: { x: Math.floor(columns / 2) - Math.ceil(shape[0].length / 2), y: 0 } };
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
  if (currentPiece) drawMatrix(context, currentPiece.matrix, currentPiece.position, cellSize);
}

function drawMatrix(targetContext, matrix, position, size) {
  matrix.forEach((row, y) => row.forEach((value, x) => value && drawCell(targetContext, x + position.x, y + position.y, colors[value], size)));
}

function drawNext() {
  nextContext.fillStyle = 'rgba(255,255,255,.25)';
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  const size = 24;
  const offsetX = (5 - nextPiece.matrix[0].length) / 2;
  const offsetY = (4 - nextPiece.matrix.length) / 2;
  drawMatrix(nextContext, nextPiece.matrix, { x: offsetX, y: offsetY }, size);
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
  currentPiece.matrix = matrix;
  if (collides(currentPiece)) currentPiece.matrix = previous;
}

function move(direction) {
  currentPiece.position.x += direction;
  if (collides(currentPiece)) currentPiece.position.x -= direction;
}

function drop() {
  currentPiece.position.y++;
  if (collides(currentPiece)) {
    currentPiece.position.y--;
    merge();
    clearLines();
    spawn();
  }
  dropCounter = 0;
}

function hardDrop() { while (!collides(currentPiece)) currentPiece.position.y++; currentPiece.position.y--; drop(); }

function clearLines() {
  let cleared = 0;
  board = board.filter(row => { if (row.every(Boolean)) { cleared++; return false; } return true; });
  while (board.length < rows) board.unshift(Array(columns).fill(0));
  if (cleared) { lines += cleared; score += [0, 100, 300, 500, 800][cleared] * level; level = Math.floor(lines / 10) + 1; dropInterval = Math.max(100, 800 - (level - 1) * 70); updateStats(); }
}

function spawn() {
  currentPiece = nextPiece || randomPiece();
  nextPiece = randomPiece();
  drawNext();
  if (collides(currentPiece)) endGame();
}

function updateStats() { scoreElement.textContent = String(score).padStart(6, '0'); linesElement.textContent = String(lines).padStart(2, '0'); levelElement.textContent = String(level).padStart(2, '0'); }
function endGame() { running = false; statusElement.textContent = 'GAME OVER'; startButton.textContent = 'Play again'; }
function startGame() { board = createBoard(); score = 0; lines = 0; level = 1; dropInterval = 800; nextPiece = randomPiece(); spawn(); updateStats(); running = true; paused = false; statusElement.textContent = 'LIVE'; startButton.textContent = 'Restart'; canvas.focus(); }
function togglePause() { if (!running) return; paused = !paused; statusElement.textContent = paused ? 'PAUSED' : 'LIVE'; }

function update(time = 0) {
  const delta = time - lastTime; lastTime = time;
  if (running && !paused) { dropCounter += delta; if (dropCounter > dropInterval) drop(); draw(); }
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
  if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(event.code) || event.key.startsWith('Arrow')) event.preventDefault();
  draw();
});

document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => { if (!running || paused) return; const action = button.dataset.action; if (action === 'left') move(-1); if (action === 'right') move(1); if (action === 'rotate') rotate(); if (action === 'drop') hardDrop(); draw(); }));
startButton.addEventListener('click', startGame);
nextPiece = randomPiece();
drawNext();
draw();
requestAnimationFrame(update);
