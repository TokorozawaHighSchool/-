
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

// テスト用：いくつかのマスを choice 型にして選択肢を追加
fixedEvents[6] = {
    text: "フォトシュートで2つの提案が来た！",
    effect: "choice",
    options: [
        { text: "大胆にポーズして2マス進む", effect: "move", value: 2 },
        { text: "安全に小幅進行（1マス）", effect: "move", value: 1 }
    ]
};
fixedEvents[10] = {
    text: "コラボの話が来た。時間がかかるかも…",
    effect: "choice",
    options: [
        { text: "即決で参加→1マス進む", effect: "move", value: 1 },
        { text: "熟考して機会を逃す→1マス戻る", effect: "move", value: -1 }
    ]
};
fixedEvents[14] = {
    text: "シークレットアイテムを見つけた！使う？",
    effect: "choice",
    options: [
        { text: "使って一気に3マス進む", effect: "move", value: 3 },
        { text: "温存して再振り権を得る", effect: "reroll", value: 0 }
    ]
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

// 簡易コンフェッティ: ゴール時に短時間表示
function showConfetti(duration = 1800) {
    const colors = ['#ffb8e6','#b8eaff','#b8ffb8','#ffeab8'];
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'fixed';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = 500;
    document.body.appendChild(confettiContainer);
    const count = 30;
    for (let i=0;i<count;i++){
        const dot = document.createElement('div');
        const size = 8 + Math.random()*12;
        dot.style.width = size+'px';
        dot.style.height = size+'px';
        dot.style.borderRadius = '50%';
        dot.style.background = colors[Math.floor(Math.random()*colors.length)];
        dot.style.position = 'absolute';
        dot.style.left = (20 + Math.random()*60) + '%';
        dot.style.top = '-5%';
        dot.style.opacity = '0.95';
        dot.style.transform = `translateY(0) rotate(${Math.random()*360}deg)`;
        dot.style.transition = `transform ${0.9+Math.random()*1.2}s cubic-bezier(.2,.8,.2,1), top ${0.9+Math.random()*1.2}s linear, opacity 0.5s ease ${0.2+Math.random()*0.6}s`;
        confettiContainer.appendChild(dot);
        setTimeout(()=>{ dot.style.top = (60 + Math.random()*40) + '%'; dot.style.transform = `translateY(0) rotate(${Math.random()*720}deg) translateX(${(-50+Math.random()*100)}px)`; }, 20+i*10);
    }
    setTimeout(()=>{ confettiContainer.remove(); }, duration);
}

// マスにイベントバッジを付ける: drawBoardで使用
function addEventBadgesToSquare(squareEl, idx) {
    const ev = squareEvents[idx];
    if (!ev || (!ev.text && !ev.options)) return;
    const badge = document.createElement('div');
    badge.className = 'event-badge';
    badge.textContent = getEventIcon(ev) || '✦';
    squareEl.appendChild(badge);
}

// プレイヤーの移動を滑らかにするためのヘルパー
function animatePlayerMovement(playerIdx, fromIdx, toIdx, cb) {
    // ステップで移動をアニメ化する
    const dir = toIdx >= fromIdx ? 1 : -1;
    const steps = Math.abs(toIdx - fromIdx);
    if (steps === 0) { if (cb) cb(); return; }
    let cur = fromIdx;
    let i = 0;
    const tick = () => {
        cur += dir;
        playerPositions[playerIdx] = cur;
        drawBoard();
        i++;
        if (i < steps) setTimeout(tick, 160);
        else { if (cb) setTimeout(cb, 120); }
    };
    tick();
}

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
const choiceModal = document.getElementById("choice-modal");
const choiceText = document.getElementById("choice-text");
const choiceButtons = document.getElementById("choice-buttons");
const diceEl = document.getElementById('dice');
const setupContainer = document.getElementById("setup-container");
const setupForm = document.getElementById("setup-form");
const modeSelect = document.getElementById("mode-select");
const playerCountSelect = document.getElementById("player-count-select");
const cpuCountSelect = document.getElementById("cpu-count-select");
const useItemButton = document.getElementById('use-item-button');
const itemModal = document.getElementById('item-modal');
const itemListDiv = document.getElementById('item-list');
const closeItemModal = document.getElementById('close-item-modal');
const targetModal = document.getElementById('target-modal');
const targetListDiv = document.getElementById('target-list');
const closeTargetModal = document.getElementById('close-target-modal');

// アイテム管理: 各プレイヤーは配列で所持
let playerItems = [];

function giveItem(playerIdx, item) {
    playerItems[playerIdx] = playerItems[playerIdx] || [];
    playerItems[playerIdx].push(item);
    updatePlayerInfo();
}

function openItemModal() {
    itemModal.style.display = 'flex';
    renderItemList();
}

function closeItemModalFn() { itemModal.style.display = 'none'; }

function renderItemList() {
    itemListDiv.innerHTML = '';
    const items = playerItems[currentPlayer] || [];
    if (items.length === 0) {
        itemListDiv.textContent = '所持しているアイテムはありません';
        return;
    }
    items.forEach((it, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex'; row.style.gap = '8px'; row.style.alignItems='center';
        row.innerHTML = `<div style="flex:1">${it.name}: ${it.desc}</div>`;
        const btn = document.createElement('button');
        btn.className = 'choice-btn'; btn.textContent = '使う';
        btn.addEventListener('click', ()=>{ useItem(currentPlayer, idx); });
        row.appendChild(btn);
        itemListDiv.appendChild(row);
    });
}

function useItem(playerIdx, itemIdx) {
    const items = playerItems[playerIdx] || [];
    if (!items[itemIdx]) return;
    const item = items.splice(itemIdx,1)[0];
    // 簡易効果: 種類に応じて適用
    if (item.type === 'move') {
        playerPositions[playerIdx] = Math.min(NUM_SQUARES-1, playerPositions[playerIdx] + (item.value||0));
        showOverlayMessage(`${playerNames[playerIdx]} は ${item.name} を使って ${item.value} マス進んだ！`,1600);
    } else if (item.type === 'reroll') {
        showOverlayMessage(`${playerNames[playerIdx]} は ${item.name} を使って再振り権を得た！`,1400);
        setTimeout(()=>{ rollButton.click(); }, 900);
    } else if (item.type === 'attack') {
        // 人間が使う場合はターゲット選択モーダルを出す
        const isHuman = !(isCpuMode && playerIdx >= NUM_PLAYERS - NUM_CPUS);
        if (isHuman) {
            // 元の位置にアイテムを戻す（まだ消費しない）
            playerItems[playerIdx] = playerItems[playerIdx] || [];
            playerItems[playerIdx].splice(itemIdx, 0, item);
            // 表示
            targetListDiv.innerHTML = '';
            for (let i=0;i<NUM_PLAYERS;i++) {
                if (i === playerIdx) continue;
                const btn = document.createElement('button');
                btn.className = 'target-btn';
                btn.textContent = `${playerNames[i]} (${playerPositions[i]+1})`;
                btn.addEventListener('click', ()=>{
                    // 消費して効果適用
                    const removed = playerItems[playerIdx].splice(playerItems[playerIdx].indexOf(item),1);
                    playerPositions[i] = Math.max(0, playerPositions[i] - (item.value||1));
                    drawBoard(); updatePlayerInfo();
                    showOverlayMessage(`${playerNames[playerIdx]} は ${item.name} で ${playerNames[i]} を妨害した！`,1600);
                    targetModal.style.display = 'none';
                    renderItemList();
                });
                targetListDiv.appendChild(btn);
            }
            targetModal.style.display = 'flex';
        } else {
            // CPUはランダムに選択
            const targets = [];
            for (let i=0;i<NUM_PLAYERS;i++) if (i!==playerIdx && playerPositions[i] < NUM_SQUARES-1) targets.push(i);
            if (targets.length>0) {
                const t = targets[Math.floor(Math.random()*targets.length)];
                playerPositions[t] = Math.max(0, playerPositions[t] - (item.value||1));
                showOverlayMessage(`${playerNames[playerIdx]} は ${item.name} で ${playerNames[t]} を妨害した！`,1600);
            } else {
                showOverlayMessage(`${item.name} を使ったが対象がいない…`,1200);
            }
        }
    }
    drawBoard(); updatePlayerInfo(); renderItemList();
}

// アイテムを与える小イベントの追加（数カ所）
function maybeGrantItem(playerIdx) {
    if (Math.random() < 0.25) {
        // 3種のアイテムをランダムで落とす
        const pool = [
            { name:'スピードシューズ', desc:'2マス進む', type:'move', value:2 },
            { name:'リセットチャンス', desc:'再振り権', type:'reroll', value:0 },
            { name:'妨害コスメ', desc:'相手1人を1マス戻す', type:'attack', value:1 }
        ];
        const it = pool[Math.floor(Math.random()*pool.length)];
        giveItem(playerIdx, it);
        showOverlayMessage(`${playerNames[playerIdx]} は ${it.name} を手に入れた！`, 1600);
    }
}

if (useItemButton) useItemButton.addEventListener('click', openItemModal);
if (closeItemModal) closeItemModal.addEventListener('click', closeItemModalFn);
if (closeTargetModal) closeTargetModal.addEventListener('click', ()=>{ targetModal.style.display='none'; renderItemList(); });


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
        const count = (playerItems[i] || []).length;
        html += `<span style="color:${colors[i % colors.length]};margin-right:18px;">${playerNames[i]}：${playerPositions[i] + 1} マス目 ${count>0?`(アイテム:${count})`:''}</span>`;
    }
    html += `<br>現在のターン：<b style="color:${colors[currentPlayer % colors.length]}">${playerNames[currentPlayer]}</b>`;
    playerInfoDiv.innerHTML = html;
}

// イベント実行
function executeEvent(event, playerIdx) {
    let msg = event.text || "";
    // choiceイベント: プレイヤーに2つの選択肢を出す。{options: [{text, effect, value}, ...]}
    if (event.effect === "choice") {
        return handleChoiceEvent(event.options || [], playerIdx);
    }
    if (event.effect === "move") {
        const from = playerPositions[playerIdx];
        playerPositions[playerIdx] = Math.max(0, Math.min(playerPositions[playerIdx] + event.value, NUM_SQUARES - 1));
        animatePlayerMovement(playerIdx, from, playerPositions[playerIdx], ()=>{
            // 移動後にポップ効果
            const elems = document.getElementsByClassName('player');
            for (let e of elems) { e.classList.add('pop'); setTimeout(()=>e.classList.remove('pop'), 520); }
        });
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
    // reroll の場合も稀にアイテムを付与
    maybeGrantItem(playerIdx);
        return false; // ターン交代しない
    } else if (event.effect === "skip") {
        // スキップ: 次のプレイヤーにターンを渡す追加のインクリメント
        msg += "（次のターンをスキップ）";
        currentPlayer = (currentPlayer + 1) % NUM_PLAYERS;
    }
    drawBoard();
    updatePlayerInfo();
    // イベント後に稀にアイテムを与える
    maybeGrantItem(playerIdx);
    if (msg) resultDiv.textContent = msg;
    return true; // ターン交代する
}

// choiceイベントのハンドラ: モーダルを表示して選択を処理する
function handleChoiceEvent(options, playerIdx) {
    if (!options || options.length === 0) return true;
    // 選択肢のラベルから「数字＋マス」表記を消す
    function sanitizeChoiceLabel(text) {
        if (!text) return '';
    // 例: "2マス進む" "1マス戻る" や "進む"/"戻る" を除去
    let t = text;
    t = t.replace(/\d+\s*マス/g, '');
    t = t.replace(/→\s*\d+\s*マス/g, '');
    t = t.replace(/進む|進|戻る|戻/g, '');
    t = t.replace(/\s{2,}/g, ' ');
    return t.trim();
    }
    // モーダル表示（選択肢の内容は隠し、中立ラベルを表示する）
    choiceText.textContent = `どちらを選びますか？`;
    choiceButtons.innerHTML = "";
    // プレイヤーかCPUかで処理を分ける
    const isCpu = isCpuMode && playerIdx >= NUM_PLAYERS - NUM_CPUS;
    if (isCpu) {
        // CPUはランダムに選ぶ
        const idx = Math.floor(Math.random() * options.length);
        applyChoiceOption(options[idx], playerIdx);
        const cpuLabel = `選択 ${String.fromCharCode(65 + idx)}`;
        resultDiv.textContent = `CPUが選択: ${cpuLabel}`;
        return true;
    }
    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn' + (idx === 1 ? ' secondary' : '');
        const label = `選択 ${String.fromCharCode(65 + idx)}`;
        btn.textContent = label;
        btn.addEventListener('click', () => {
            applyChoiceOption(opt, playerIdx);
            choiceModal.style.display = 'none';
            // applyChoiceOption will update resultDiv with what actually happened
            // ターンを継続させたい場合は true を返す代わりに rollButton を有効にする流れで制御
            rollButton.disabled = false;
        });
        choiceButtons.appendChild(btn);
    });
    choiceModal.style.display = 'flex';
    // プレイヤーが選ぶまでターンの交代はしない
    return false;
}

function applyChoiceOption(opt, playerIdx) {
    if (!opt) return;
    let msg = '';
    if (opt.effect === 'move') {
        const from = playerPositions[playerIdx];
        playerPositions[playerIdx] = Math.max(0, Math.min(playerPositions[playerIdx] + (opt.value || 0), NUM_SQUARES - 1));
        msg = `${playerNames[playerIdx]} は移動して ${playerPositions[playerIdx] + 1} マス目に到達した。`;
    } else if (opt.effect === 'reroll') {
        msg = `${playerNames[playerIdx]} は再振りを行います。`;
        setTimeout(() => { if (isCpuMode && playerIdx >= NUM_PLAYERS - NUM_CPUS) cpTurn(); else rollButton.click(); }, 600);
    } else if (opt.effect === 'skip') {
        currentPlayer = (currentPlayer + 1) % NUM_PLAYERS;
        msg = `${playerNames[playerIdx]} のターンはスキップされました。`;
    }
    drawBoard();
    updatePlayerInfo();
    if (msg) resultDiv.textContent = msg;
}


rollButton.addEventListener("click", () => {
    if (playerPositions[currentPlayer] >= NUM_SQUARES - 1) return;
    // CPUモード: 人間のターンのみボタン有効
    if (isCpuMode && currentPlayer >= NUM_PLAYERS - NUM_CPUS) return;
    // PvPモード: 現在のプレイヤーのターンのみボタン有効（currentPlayer 自身が押すのは許可）
    // 以前の実装は `currentPlayer !== 0` で固定してしまっていたため、プレイヤー2以降が振れない不具合があった。
    // ここでは PvP 時は何もしない（currentPlayer が常に有効なため）、CPUモードのチェックのみ残す。
    rollButton.disabled = true;
    const dice = Math.floor(Math.random() * 6) + 1;
    // ダイスアニメ
    if (diceEl) {
        diceEl.classList.add('pop');
        setTimeout(()=>diceEl.classList.remove('pop'),420);
        diceEl.textContent = String(dice);
    }
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
    // アイテム初期化
    playerItems = Array(NUM_PLAYERS).fill(0).map(()=>[]);
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
