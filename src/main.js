
const NUM_SQUARES = 26;
let NUM_PLAYERS = 2;
let NUM_CPUS = 1;
let playerPositions = [];
let currentPlayer = 0;
let playerNames = [];
let isCpuMode = true;

// イベント一覧（理由付きの構造化データ）
// effect: "none" | "move" | "reroll" | "skip"
// value: move の場合の移動量（正: 進む、負: 戻る）
const events = [
    { text: "Diorのリップが折れる…メイク直しで遅刻、1マス戻る", effect: "move", value: -1 },
    { text: "新しいアイシャドウが大当たり！テンション上がって2マス進む", effect: "move", value: 2 },
    { text: "ヘアアレンジが大失敗…顔が見えない、1マス戻る", effect: "move", value: -1 },
    { text: "朝のランニングで気分爽快！1マス進む", effect: "move", value: 1 },
    { text: "友達に褒められた！自信が出てもう一度サイコロを振れる", effect: "reroll", value: 0 },
    { text: "新作スカートが届いたけどサイズが合わない…試着で時間かかって2マス戻る", effect: "move", value: -2 },
    { text: "ネイルがキレイに決まった！気分上昇で2マス進む", effect: "move", value: 2 },
    { text: "メイク落としが切れた…今日はお休み、次のターンをスキップ", effect: "skip", value: 0 },
    { text: "カフェで運命の出会い…舞い上がって1マス進む", effect: "move", value: 1 },
    { text: "撮影リハーサルで好感触！もっと頑張れる、1マス進む", effect: "move", value: 1 },
    { text: "新しいヘアピンが折れた…ショックで1マス戻る", effect: "move", value: -1 },
    { text: "友達とメイク会でテクを盗めた！2マス進む", effect: "move", value: 2 },
    { text: "コスメがセール！運良くゲットして1マス進む", effect: "move", value: 1 },
    { text: "靴擦れ…歩きづらくて1マス戻る", effect: "move", value: -1 },
    { text: "モデルのオーディションで良い評価！もう一度サイコロを振れる", effect: "reroll", value: 0 },
    { text: "動画がバズった！注目を浴びて2マス進む", effect: "move", value: 2 },
    { text: "撮影で衣装トラブル…修正に時間がかかり2マス戻る", effect: "move", value: -2 },
    { text: "メイクアップアーティストに褒められた！気分上々で1マス進む", effect: "move", value: 1 },
    { text: "ナイトケアを忘れた…肌トラブルで次のターンをスキップ", effect: "skip", value: 0 },
    { text: "何も起こらない — 今日は静かな日。", effect: "none", value: 0 },
    { text: "メイクブラシを忘れた！代用品で手間取り1マス戻る", effect: "move", value: -1 },
    { text: "スタイリストに褒められてやる気UP、1マス進む", effect: "move", value: 1 }
];

// ストーリー性のある固定イベントマス（0ベースのインデックス）
const fixedEvents = {
    4: { text: "一次オーディション通過！運気上昇で2マス進む", effect: "move", value: 2 },
    11: { text: "投稿がバズって注目を集める！2マス進む", effect: "move", value: 2 },
    17: { text: "ヘアサロンで大失敗…挫折して2マス戻る", effect: "move", value: -2 },
    22: { text: "雑誌撮影の大仕事！準備で次のターンをスキップ", effect: "skip", value: 0 }
};

// ランダム割り当てだが、固定イベントを優先して配置。残りマスには重複なしで events を割り当てる。
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function generateSquareEvents() {
    const slots = new Array(NUM_SQUARES);
    // 固定イベントを配置
    Object.keys(fixedEvents).forEach(k => { const idx = Number(k); if (idx >= 0 && idx < NUM_SQUARES) slots[idx] = fixedEvents[k]; });
    // 空きインデックスを取得
    const emptyIdxs = [];
    for (let i = 0; i < NUM_SQUARES; i++) if (!slots[i]) emptyIdxs.push(i);
    // events をシャッフルして重複なしで割り当て
    let pool = shuffle(events.slice());
    if (pool.length < emptyIdxs.length) {
        // 予期せぬ場合は pool を拡張して重複を防げるように循環コピーする
        while (pool.length < emptyIdxs.length) {
            pool = pool.concat(shuffle(events.slice()));
        }
    }
    emptyIdxs.forEach((idx, i) => { slots[idx] = pool[i]; });
    return slots;
}

const squareEvents = generateSquareEvents();

// イベントに対応する絵文字アイコンを返す
function getEventIcon(event) {
    if (!event || !event.text) return "";
    // テキストに含まれるキーワードで優先的に決める
    if (event.text.includes("リップ") || event.text.includes("メイク")) return "💄";
    if (event.text.includes("アイシャドウ") || event.text.includes("ネイル")) return "💅";
    if (event.text.includes("スカート") || event.text.includes("試着") || event.text.includes("衣装")) return "👗";
    if (event.text.includes("出会い") || event.text.includes("褒められ")) return "💖";
    if (event.text.includes("オーディション") || event.text.includes("モデル")) return "🎤";
    if (event.text.includes("バズ") || event.text.includes("投稿")) return "🔥";
    if (event.text.includes("撮影") || event.text.includes("撮影リハーサル")) return "📸";
    if (event.text.includes("靴") || event.text.includes("靴擦れ")) return "👠";
    if (event.text.includes("肌") || event.text.includes("ナイトケア")) return "🧴";
    // effect ベースのフォールバック
    if (event.effect === "move") return event.value > 0 ? "✨" : "😭";
    if (event.effect === "reroll") return "🎲";
    if (event.effect === "skip") return "😴";
    return "🌸";
}


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
    board.style.gridTemplateColumns = "repeat(13, 1fr)";
    board.style.gridTemplateRows = "repeat(2, 1fr)";
    for (let i = 0; i < NUM_SQUARES; i++) {
    const square = document.createElement("div");
    square.className = "square";
    // マス中央にイベントのアイコンを表示（数字の代わり）
    const centerIcon = document.createElement("div");
    centerIcon.className = "square-center-icon";
    centerIcon.textContent = getEventIcon(squareEvents[i]);
    square.appendChild(centerIcon);
    // マス説明を data 属性にセットし、ツールチップ要素を追加
    square.setAttribute("data-description", squareEvents[i].text || "");
    const tooltip = document.createElement("div");
    tooltip.className = "square-tooltip";
    tooltip.textContent = squareEvents[i].text || "";
    square.appendChild(tooltip);
        // 1〜13マス目は1行目、14〜26マス目は2行目
        square.style.gridRow = (i < 13) ? "1" : "2";
        square.style.gridColumn = (i < 13) ? (i + 1) : (i - 12);
        // 同じマスにいるプレイヤーを集め、被らないように配置する
        const playersHere = [];
        playerPositions.forEach((pos, idx) => { if (pos === i) playersHere.push(idx); });
    // 右上バッジは不要になったため削除（中央アイコンを表示）
        if (playersHere.length > 0) {
            const pSize = 56; // .player の想定サイズ(px)
            const sSize = 120; // .square の想定サイズ(px)
            const padding = 8;
            playersHere.forEach((playerIdx, pIdx) => {
                const playerDiv = document.createElement("div");
                playerDiv.className = "player";
                playerDiv.textContent = playerNames[playerIdx];
                // 色分け
                const colors = ["#ffb8e6", "#b8eaff", "#b8ffb8", "#ffeab8"];
                playerDiv.style.background = colors[playerIdx % colors.length];
                // 位置を計算（最大4人は2x2、それ以上は少しずらして積む）
                if (playersHere.length <= 4) {
                    const col = pIdx % 2;
                    const row = Math.floor(pIdx / 2);
                    const horizontalGap = sSize - (2 * padding) - pSize; // 例: 48
                    const verticalGap = horizontalGap;
                    const top = padding + row * verticalGap;
                    const left = padding + col * horizontalGap;
                    playerDiv.style.top = top + "px";
                    playerDiv.style.left = left + "px";
                } else {
                    // 5人以上は少しずつ重ねる
                    const offset = pIdx * 6;
                    playerDiv.style.top = (padding + offset) + "px";
                    playerDiv.style.left = (padding + offset) + "px";
                }
                square.appendChild(playerDiv);
            });
        }
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
    let msg = event.text || "";
    if (event.effect === "move") {
        playerPositions[playerIdx] = Math.max(0, Math.min(playerPositions[playerIdx] + event.value, NUM_SQUARES - 1));
    } else if (event.effect === "reroll") {
        // 再振り: ターン交代しないで即座にもう一度
        drawBoard();
        updatePlayerInfo();
        setTimeout(() => {
            if (isCpuMode && playerIdx >= NUM_PLAYERS - NUM_CPUS) {
                cpTurn();
            } else {
                rollButton.click();
            }
        }, 800);
        resultDiv.textContent = msg;
        return false; // ターン交代しない
    } else if (event.effect === "skip") {
        // スキップ: 次のプレイヤーにターンを渡す追加のインクリメント
        msg += "（次のターンをスキップ）";
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
        const icon = getEventIcon(event);
        showOverlayMessage(`止まったマスのイベント:\n${icon} ${event.text}`, 2000);
        resultDiv.textContent = `止まったマスのイベント: ${icon} ${event.text}`;
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
        const icon = getEventIcon(event);
        showOverlayMessage(`止まったマスのイベント:\n${icon} ${event.text}`, 2000);
        resultDiv.textContent = `止まったマスのイベント: ${icon} ${event.text}`;
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
            // CPUモード時は必ずCPU人数は1以上にする（0は選べない）
            cpuCountSelect.disabled = false;
            Array.from(cpuCountSelect.options).forEach(opt => {
                if (opt.value === "0") opt.disabled = true; else opt.disabled = false;
            });
            if (parseInt(cpuCountSelect.value) < 1) cpuCountSelect.value = "1";
        } else {
            // PvPモード：CPU選択を無効化し、値は0に戻す（0オプションは有効にする）
            Array.from(cpuCountSelect.options).forEach(opt => { if (opt.value === "0") opt.disabled = false; });
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
        if (mode === "cpu") {
            if (cpuCount < 1) {
                alert("CPU対戦を選んだ場合、CPU人数は最低1にしてください。");
                return;
            }
            if (cpuCount >= playerCount) {
                alert("CPU人数はプレイヤー人数未満にしてください");
                return;
            }
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
    // 初期状態: CPUモードで0を選べないように0オプションを無効化し、デフォルトを1に
    Array.from(cpuCountSelect.options).forEach(opt => { if (opt.value === "0") opt.disabled = true; });
    if (parseInt(cpuCountSelect.value) < 1) cpuCountSelect.value = "1";
    board.style.display = "none";
    playerInfoDiv.style.display = "none";
    rollButton.style.display = "none";
} else {
    // フォームがなければ従来通り2人(CPU1)で開始
    setupGame("cpu", 2, 1);
}
