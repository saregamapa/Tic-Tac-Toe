const cells = Array.from(document.querySelectorAll(".cell"));
const boardEl = document.getElementById("board");
const currentTurnEl = document.getElementById("current-turn");
const statusEl = document.getElementById("status");
const xScoreEl = document.getElementById("x-score");
const oScoreEl = document.getElementById("o-score");
const drawScoreEl = document.getElementById("draw-score");
const restartBtn = document.getElementById("restart-btn");
const resetBtn = document.getElementById("reset-btn");
const winLineEl = document.getElementById("win-line");

const WIN_COMBOS = [
  { combo: [0, 1, 2], type: "row", index: 0 },
  { combo: [3, 4, 5], type: "row", index: 1 },
  { combo: [6, 7, 8], type: "row", index: 2 },
  { combo: [0, 3, 6], type: "col", index: 0 },
  { combo: [1, 4, 7], type: "col", index: 1 },
  { combo: [2, 5, 8], type: "col", index: 2 },
  { combo: [0, 4, 8], type: "diag", index: 0 },
  { combo: [2, 4, 6], type: "diag", index: 1 },
];

const state = {
  board: Array(9).fill(null),
  currentPlayer: "X",
  gameOver: false,
  scores: {
    X: 0,
    O: 0,
    draws: 0,
  },
};

const sounds = {
  move: new Audio("sounds/move.wav"),
  win: new Audio("sounds/win.wav"),
  draw: new Audio("sounds/draw.wav"),
  reset: new Audio("sounds/reset.wav"),
};

const soundController = {
  init() {
    Object.values(sounds).forEach((audio) => {
      audio.preload = "auto";
      audio.volume = 0.6;
      audio.load();
    });
  },
  play(key) {
    const audio = sounds[key];
    if (!audio) return;
    audio.currentTime = 0;
    audio
      .play()
      .then(() => {})
      .catch(() => {});
  },
};

const ui = {
  updateTurn() {
    currentTurnEl.textContent = state.currentPlayer;
  },
  updateStatus(message) {
    statusEl.textContent = message;
  },
  updateScores() {
    xScoreEl.textContent = state.scores.X;
    oScoreEl.textContent = state.scores.O;
    drawScoreEl.textContent = state.scores.draws;
  },
  clearBoard() {
    cells.forEach((cell) => {
      cell.className = "cell";
      cell.innerHTML = "";
      cell.style.removeProperty("--rot");
      cell.style.removeProperty("--jit-x");
      cell.style.removeProperty("--jit-y");
    });
    winLineEl.classList.remove("active");
    winLineEl.style.removeProperty("top");
    winLineEl.style.removeProperty("left");
    winLineEl.style.removeProperty("transform");
  },
  renderMove(index, player) {
    const cell = cells[index];
    const mark = document.createElement("span");
    mark.className = "mark";
    mark.textContent = player;
    const rotation = `${randomBetween(-8, 8)}deg`;
    const jitterX = `${randomBetween(-2, 2)}px`;
    const jitterY = `${randomBetween(-2, 2)}px`;
    cell.style.setProperty("--rot", rotation);
    cell.style.setProperty("--jit-x", jitterX);
    cell.style.setProperty("--jit-y", jitterY);
    cell.classList.add("filled", player.toLowerCase());
    cell.appendChild(mark);
  },
  setBoardDisabled(disabled) {
    boardEl.classList.toggle("disabled", disabled);
  },
  showWinLine({ type, index }) {
    const offset = 16.5 + index * 33.5;
    if (type === "row") {
      winLineEl.style.top = `${offset}%`;
      winLineEl.style.left = "5%";
      winLineEl.style.transform = "rotate(0deg)";
    } else if (type === "col") {
      winLineEl.style.left = `${offset}%`;
      winLineEl.style.top = "5%";
      winLineEl.style.transform = "rotate(90deg)";
    } else {
      winLineEl.style.top = "5%";
      winLineEl.style.left = "5%";
      winLineEl.style.transform = index === 0 ? "rotate(45deg)" : "rotate(-45deg)";
    }
    winLineEl.classList.add("active");
  },
  highlightCombo(combo) {
    combo.forEach((idx) => cells[idx].classList.add("win"));
  },
  clearHighlights() {
    cells.forEach((cell) => cell.classList.remove("win"));
  },
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function findWinner(board) {
  for (const line of WIN_COMBOS) {
    const [a, b, c] = line.combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

function isDraw(board) {
  return board.every((cell) => cell !== null);
}

function switchPlayer() {
  state.currentPlayer = state.currentPlayer === "X" ? "O" : "X";
  ui.updateTurn();
}

function resetRound() {
  state.board = Array(9).fill(null);
  state.gameOver = false;
  state.currentPlayer = "X";
  ui.clearBoard();
  ui.clearHighlights();
  ui.setBoardDisabled(false);
  ui.updateTurn();
  ui.updateStatus("Fresh wall. Make your move.");
}

function resetScores() {
  state.scores = { X: 0, O: 0, draws: 0 };
  ui.updateScores();
  ui.updateStatus("Scores wiped clean.");
  soundController.play("reset");
}

function handleCellClick(event) {
  const cell = event.currentTarget;
  const index = Number(cell.dataset.index);
  if (state.gameOver || state.board[index]) return;

  state.board[index] = state.currentPlayer;
  ui.renderMove(index, state.currentPlayer);
  soundController.play("move");

  const winnerData = findWinner(state.board);
  if (winnerData) {
    state.gameOver = true;
    state.scores[state.currentPlayer] += 1;
    ui.updateScores();
    ui.updateStatus(`${state.currentPlayer} owns the block!`);
    ui.highlightCombo(winnerData.line.combo);
    ui.showWinLine(winnerData.line);
    ui.setBoardDisabled(true);
    soundController.play("win");
    return;
  }

  if (isDraw(state.board)) {
    state.gameOver = true;
    state.scores.draws += 1;
    ui.updateScores();
    ui.updateStatus("It's a draw. No tags this round.");
    ui.setBoardDisabled(true);
    soundController.play("draw");
    return;
  }

  switchPlayer();
  ui.updateStatus(`${state.currentPlayer}'s turn to spray.`);
}

function init() {
  soundController.init();
  ui.updateScores();
  ui.updateTurn();
  ui.updateStatus("Tag the wall to start.");
  cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
  restartBtn.addEventListener("click", () => {
    resetRound();
    soundController.play("reset");
  });
  resetBtn.addEventListener("click", () => {
    resetScores();
    resetRound();
  });
}

init();
