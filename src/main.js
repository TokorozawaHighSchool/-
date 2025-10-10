
const NUM_SQUARES = 30;
let NUM_PLAYERS = 2;
let NUM_CPUS = 1;
let playerPositions = [];
let currentPlayer = 0;
let playerNames = [];
let isCpuMode = true;

// イベント一覧
const events = [
    "何も起こらない",
    "1マス進む！",
    "1マス戻る…",
    "もう一度サイコロ！",
    "休憩…次のターンはスキップ",
    "2マス進む！",
    "2マス戻る…"
];
const squareEvents = Array.from({length: NUM_SQUARES}, () => events[Math.floor(Math.random() * events.length)]);


const board = document.getElementById("board");
const playerInfoDiv = document.getElementById("player-info");
const rollButton = document.getElementById("roll-button");
const resultDiv = document.getElementById("result");
const overlayMessage = document.getElementById("overlay-message");
const setupContainer = document.getElementById("setup-container");
const setupForm = document.getElementById("setup-form");
const modeSelect = document.getElementById("mode-select");
const playerCountSelect = document.getElementById("player-count-select");
const cpuCountSelect = document.getElementById("cpu-count-select");

// オーバーレイ表示関数
function showOverlayMessage(text, duration = 2000) {
    overlayMessage.textContent = text;
    overlayMessage.style.display = "block";
    setTimeout(() => {
        overlayMessage.style.display = "none";
    }, duration);
}

// ボード描画
function drawBoard() {
    board.innerHTML = "";
    board.style.display = "grid";
    board.style.gridTemplateColumns = "repeat(15, 1fr)";
    board.style.gridTemplateRows = "repeat(2, 1fr)";
    for (let i = 0; i < NUM_SQUARES; i++) {
        const square = document.createElement("div");
        square.className = "square";
        square.textContent = i + 1;
        // 1〜15マス目は1行目、16〜30マス目は2行目
        square.style.gridRow = (i < 15) ? "1" : "2";
        square.style.gridColumn = (i < 15) ? (i + 1) : (i - 14);
        playerPositions.forEach((pos, idx) => {
            if (pos === i) {
                const playerDiv = document.createElement("div");
                playerDiv.className = "player";
                playerDiv.textContent = playerNames[idx];
                // 色分け
                const colors = ["#ffb8e6", "#b8eaff", "#b8ffb8", "#ffeab8"];
                playerDiv.style.background = colors[idx % colors.length];
                square.appendChild(playerDiv);
            }
        });
        board.appendChild(square);
    }
}

// プレイヤー情報表示
function updatePlayerInfo() {
    let html = `<h2>プレイヤー情報</h2>`;
    const colors = ["#ffb8e6", "#b8eaff", "#b8ffb8", "#ffeab8"];
    for (let i = 0; i < playerNames.length; i++) {
        html += `<span style="color:${colors[i % colors.length]};margin-right:18px;">${playerNames[i]}：${playerPositions[i] + 1} マス目</span>`;
    }
    html += `<br>現在のターン：<b style="color:${colors[currentPlayer % colors.length]}">${playerNames[currentPlayer]}</b>`;
    playerInfoDiv.innerHTML = html;
}

// イベント実行
function executeEvent(event, playerIdx) {
    let msg = "";
    if (event === "1マス進む！") {
        playerPositions[playerIdx] = Math.min(playerPositions[playerIdx] + 1, NUM_SQUARES - 1);
        msg = "さらに1マス進みます！";
    } else if (event === "1マス戻る…") {
        playerPositions[playerIdx] = Math.max(playerPositions[playerIdx] - 1, 0);
        msg = "1マス戻ります…";
    } else if (event === "2マス進む！") {
        playerPositions[playerIdx] = Math.min(playerPositions[playerIdx] + 2, NUM_SQUARES - 1);
        msg = "さらに2マス進みます！";
    } else if (event === "2マス戻る…") {
        playerPositions[playerIdx] = Math.max(playerPositions[playerIdx] - 2, 0);
        msg = "2マス戻ります…";
    } else if (event === "もう一度サイコロ！") {
        msg = "もう一度サイコロを振ります！";
        drawBoard();
        updatePlayerInfo();
        setTimeout(() => {
            if (playerIdx === 1) {
                cpTurn();
            } else {
                rollButton.click();
            }
        }, 800);
        return false; // ターン交代しない
    } else if (event === "休憩…次のターンはスキップ") {
        msg = "次のターンはスキップします。";
        currentPlayer = (currentPlayer + 1) % NUM_PLAYERS;
    }
    drawBoard();
    updatePlayerInfo();
    if (msg) resultDiv.textContent = msg;
    return true; // ターン交代する
}


rollButton.addEventListener("click", () => {
    if (playerPositions[currentPlayer] >= NUM_SQUARES - 1) return;
    // CPUモード: 人間のターンのみボタン有効
    if (isCpuMode && currentPlayer >= NUM_PLAYERS - NUM_CPUS) return;
    // PvPモード: 現在のプレイヤーのターンのみボタン有効
    if (!isCpuMode && currentPlayer !== 0) return;
    rollButton.disabled = true;
    const dice = Math.floor(Math.random() * 6) + 1;
    showOverlayMessage(`${playerNames[currentPlayer]} のサイコロの目: ${dice}`, 1200);
    resultDiv.textContent = `${playerNames[currentPlayer]} のサイコロの目: ${dice}`;
    playerPositions[currentPlayer] += dice;
    if (playerPositions[currentPlayer] >= NUM_SQUARES - 1) {
        playerPositions[currentPlayer] = NUM_SQUARES - 1;
        drawBoard();
        updatePlayerInfo();
        showOverlayMessage(`${playerNames[currentPlayer]} ゴール！おめでとう！`, 2200);
        resultDiv.textContent = `${playerNames[currentPlayer]} ゴール！おめでとう！`;
        rollButton.disabled = true;
        return;
    }
    drawBoard();
    updatePlayerInfo();
    const event = squareEvents[playerPositions[currentPlayer]];
    setTimeout(() => {
        showOverlayMessage(`止まったマスのイベント:\n${event}`, 2000);
        resultDiv.textContent = `止まったマスのイベント: ${event}`;
        setTimeout(() => {
            const shouldChangeTurn = executeEvent(event, currentPlayer);
            if (playerPositions[currentPlayer] >= NUM_SQUARES - 1) {
                showOverlayMessage(`${playerNames[currentPlayer]} ゴール！おめでとう！`, 2200);
                resultDiv.textContent = `${playerNames[currentPlayer]} ゴール！おめでとう！`;
                rollButton.disabled = true;
                drawBoard();
                updatePlayerInfo();
                return;
            }
            if (shouldChangeTurn) {
                currentPlayer = (currentPlayer + 1) % NUM_PLAYERS;
                if (isCpuMode && currentPlayer >= NUM_PLAYERS - NUM_CPUS) {
                    setTimeout(cpTurn, 1200);
                } else {
                    rollButton.disabled = false;
                }
            } else {
                rollButton.disabled = false;
            }
        }, 2000);
    }, 1200);
});


// CPUのターン（自動でサイコロを振る）
function cpTurn() {
    if (playerPositions[currentPlayer] >= NUM_SQUARES - 1) return;
    rollButton.disabled = true;
    const dice = Math.floor(Math.random() * 6) + 1;
    showOverlayMessage(`${playerNames[currentPlayer]} のサイコロの目: ${dice}`, 1200);
    resultDiv.textContent = `${playerNames[currentPlayer]} のサイコロの目: ${dice}`;
    playerPositions[currentPlayer] += dice;
    if (playerPositions[currentPlayer] >= NUM_SQUARES - 1) {
        playerPositions[currentPlayer] = NUM_SQUARES - 1;
        drawBoard();
        updatePlayerInfo();
        showOverlayMessage(`${playerNames[currentPlayer]} ゴール！おめでとう！`, 2200);
        resultDiv.textContent = `${playerNames[currentPlayer]} ゴール！おめでとう！`;
        rollButton.disabled = true;
        return;
    }
    drawBoard();
    updatePlayerInfo();
    const event = squareEvents[playerPositions[currentPlayer]];
    setTimeout(() => {
        showOverlayMessage(`止まったマスのイベント:\n${event}`, 2000);
        resultDiv.textContent = `止まったマスのイベント: ${event}`;
        setTimeout(() => {
            const shouldChangeTurn = executeEvent(event, currentPlayer);
            if (playerPositions[currentPlayer] >= NUM_SQUARES - 1) {
                showOverlayMessage(`${playerNames[currentPlayer]} ゴール！おめでとう！`, 2200);
                resultDiv.textContent = `${playerNames[currentPlayer]} ゴール！おめでとう！`;
                rollButton.disabled = true;
                drawBoard();
                updatePlayerInfo();
                return;
            }
            if (shouldChangeTurn) {
                currentPlayer = (currentPlayer + 1) % NUM_PLAYERS;
                if (currentPlayer >= NUM_PLAYERS - NUM_CPUS) {
                    setTimeout(cpTurn, 1200);
                } else {
                    rollButton.disabled = false;
                }
            } else {
                rollButton.disabled = false;
            }
        }, 2000);
    }, 1200);
}


// ゲーム初期化
function setupGame(mode, playerCount, cpuCount) {
    isCpuMode = (mode === "cpu");
    NUM_PLAYERS = playerCount;
    NUM_CPUS = isCpuMode ? cpuCount : 0;
    playerPositions = Array(NUM_PLAYERS).fill(0);
    currentPlayer = 0;
    playerNames = [];
    for (let i = 0; i < NUM_PLAYERS; i++) {
        if (isCpuMode && i >= NUM_PLAYERS - NUM_CPUS) {
            playerNames.push(`CP${i - (NUM_PLAYERS - NUM_CPUS) + 1}`);
        } else {
            playerNames.push(`P${i + 1}`);
        }
    }
    drawBoard();
    updatePlayerInfo();
    resultDiv.textContent = "";
    rollButton.disabled = false;
}

// セットアップフォームの制御
if (setupForm) {
    // モード選択でCPU人数の有効/無効を切り替え
    modeSelect.addEventListener("change", () => {
        if (modeSelect.value === "cpu") {
            cpuCountSelect.disabled = false;
        } else {
            cpuCountSelect.value = "0";
            cpuCountSelect.disabled = true;
        }
    });
    // プレイヤー数・CPU数の整合性を保つ
    playerCountSelect.addEventListener("change", () => {
        const maxCpu = parseInt(playerCountSelect.value) - 1;
        Array.from(cpuCountSelect.options).forEach(opt => {
            opt.disabled = parseInt(opt.value) > maxCpu;
        });
        if (parseInt(cpuCountSelect.value) > maxCpu) {
            cpuCountSelect.value = String(maxCpu);
        }
    });
    // ゲーム開始
    setupForm.addEventListener("submit", e => {
        e.preventDefault();
        const mode = modeSelect.value;
        const playerCount = parseInt(playerCountSelect.value);
        const cpuCount = parseInt(cpuCountSelect.value);
        if (mode === "cpu" && cpuCount >= playerCount) {
            alert("CPU人数はプレイヤー人数未満にしてください");
            return;
        }
    setupContainer.style.display = "none";
    board.style.display = "block";
    playerInfoDiv.style.display = "block";
    rollButton.style.display = "block";
        setupGame(mode, playerCount, cpuCount);
        // CPU先攻の場合
        if (isCpuMode && currentPlayer >= NUM_PLAYERS - NUM_CPUS) {
            setTimeout(cpTurn, 1000);
        }
    });
    // 初期状態
    cpuCountSelect.disabled = false;
    board.style.display = "none";
    playerInfoDiv.style.display = "none";
    rollButton.style.display = "none";
} else {
    // フォームがなければ従来通り2人(CPU1)で開始
    setupGame("cpu", 2, 1);
}
