const NUM_SQUARES = 30;
const NUM_PLAYERS = 2;
let playerPositions = [0, 0];
let currentPlayer = 0;
const playerNames = ["あなた", "ゆめかわCP"];

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
    for (let i = 0; i < NUM_SQUARES; i++) {
        const square = document.createElement("div");
        square.className = "square";
        square.textContent = i + 1;
        playerPositions.forEach((pos, idx) => {
            if (pos === i) {
                const playerDiv = document.createElement("div");
                playerDiv.className = "player";
                playerDiv.textContent = idx === 0 ? "P1" : "CP";
                playerDiv.style.background = idx === 0 ? "#ffb8e6" : "#b8eaff";
                square.appendChild(playerDiv);
            }
        });
        board.appendChild(square);
    }
}

// プレイヤー情報表示
function updatePlayerInfo() {
    playerInfoDiv.innerHTML = `
        <h2>プレイヤー情報</h2>
        <span style="color:#ffb8e6;">${playerNames[0]}：${playerPositions[0] + 1} マス目</span>
        <span style="margin-left:24px;color:#b8eaff;">${playerNames[1]}：${playerPositions[1] + 1} マス目</span>
        <br>現在のターン：<b style="color:${currentPlayer === 0 ? '#ffb8e6' : '#b8eaff'}">${playerNames[currentPlayer]}</b>
    `;
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

// サイコロを振る（あなたのターン）
rollButton.addEventListener("click", () => {
    if (playerPositions[0] >= NUM_SQUARES - 1 || playerPositions[1] >= NUM_SQUARES - 1) return;
    if (currentPlayer !== 0) return; // あなたのターンのみボタン有効
    rollButton.disabled = true;
    const dice = Math.floor(Math.random() * 6) + 1;
    showOverlayMessage(`${playerNames[0]} のサイコロの目: ${dice}`, 1200);
    resultDiv.textContent = `${playerNames[0]} のサイコロの目: ${dice}`;
    playerPositions[0] += dice;
    if (playerPositions[0] >= NUM_SQUARES - 1) {
        playerPositions[0] = NUM_SQUARES - 1;
        drawBoard();
        updatePlayerInfo();
        showOverlayMessage(`${playerNames[0]} ゴール！おめでとう！`, 2200);
        resultDiv.textContent = `${playerNames[0]} ゴール！おめでとう！`;
        rollButton.disabled = true;
        return;
    }
    drawBoard();
    updatePlayerInfo();
    const event = squareEvents[playerPositions[0]];
    setTimeout(() => {
        showOverlayMessage(`止まったマスのイベント:\n${event}`, 2000);
        resultDiv.textContent = `止まったマスのイベント: ${event}`;
        setTimeout(() => {
            const shouldChangeTurn = executeEvent(event, 0);
            if (playerPositions[0] >= NUM_SQUARES - 1) {
                showOverlayMessage(`${playerNames[0]} ゴール！おめでとう！`, 2200);
                resultDiv.textContent = `${playerNames[0]} ゴール！おめでとう！`;
                rollButton.disabled = true;
                drawBoard();
                updatePlayerInfo();
                return;
            }
            if (shouldChangeTurn) {
                currentPlayer = 1;
                setTimeout(cpTurn, 1200);
            }
            rollButton.disabled = false;
        }, 2000);
    }, 1200);
});

// CPのターン（自動でサイコロを振る）
function cpTurn() {
    if (playerPositions[0] >= NUM_SQUARES - 1 || playerPositions[1] >= NUM_SQUARES - 1) return;
    rollButton.disabled = true;
    const dice = Math.floor(Math.random() * 6) + 1;
    showOverlayMessage(`${playerNames[1]} のサイコロの目: ${dice}`, 1200);
    resultDiv.textContent = `${playerNames[1]} のサイコロの目: ${dice}`;
    playerPositions[1] += dice;
    if (playerPositions[1] >= NUM_SQUARES - 1) {
        playerPositions[1] = NUM_SQUARES - 1;
        drawBoard();
        updatePlayerInfo();
        showOverlayMessage(`${playerNames[1]} ゴール！おめでとう！`, 2200);
        resultDiv.textContent = `${playerNames[1]} ゴール！おめでとう！`;
        rollButton.disabled = true;
        return;
    }
    drawBoard();
    updatePlayerInfo();
    const event = squareEvents[playerPositions[1]];
    setTimeout(() => {
        showOverlayMessage(`止まったマスのイベント:\n${event}`, 2000);
        resultDiv.textContent = `止まったマスのイベント: ${event}`;
        setTimeout(() => {
            const shouldChangeTurn = executeEvent(event, 1);
            if (playerPositions[1] >= NUM_SQUARES - 1) {
                showOverlayMessage(`${playerNames[1]} ゴール！おめでとう！`, 2200);
                resultDiv.textContent = `${playerNames[1]} ゴール！おめでとう！`;
                rollButton.disabled = true;
                drawBoard();
                updatePlayerInfo();
                return;
            }
            if (shouldChangeTurn) {
                currentPlayer = 0;
                rollButton.disabled = false;
            }
        }, 2000);
    }, 1200);
}

// 初期表示
drawBoard();
updatePlayerInfo();
