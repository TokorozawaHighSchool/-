const NUM_SQUARES = 26;
let NUM_PLAYERS = 2;
let NUM_CPUS = 1;
let playerPositions = [];
let currentPlayer = 0;
let playerNames = [];
let isCpuMode = true;

// 女の子の名前リスト
const girlNames = ['さくら', 'あかり', 'ひまり', 'ゆい', 'りん', 'ほのか', 'みお', 'ななみ'];

// プレイヤー名を設定する関数
function assignPlayerNames() {
    playerNames = [];
    for (let i = 0; i < NUM_PLAYERS; i++) {
        if (isCpuMode && i >= NUM_PLAYERS - NUM_CPUS) {
            playerNames.push(girlNames[(i + 1) % girlNames.length] + '（CPU）');
        } else {
            playerNames.push(girlNames[i % girlNames.length]);
        }
    }
}

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
const funButton = document.getElementById('fun-button');
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
    const item = items.splice(itemIdx, 1)[0];

    if (item.type === 'move') {
        playerPositions[playerIdx] = Math.min(NUM_SQUARES - 1, playerPositions[playerIdx] + (item.value || 0));
        showOverlayMessage(`${playerNames[playerIdx]} は ${item.name} を使って ${item.value} マス進んだ！`, 1600);
    } else if (item.type === 'reroll') {
        showOverlayMessage(`${playerNames[playerIdx]} は ${item.name} を使って再振り権を得た！`, 1400);
        setTimeout(() => { rollButton.click(); }, 900);
    } else if (item.type === 'attack') {
        const targetIdx = (playerIdx + 1) % NUM_PLAYERS; // 次のプレイヤーを妨害
        playerPositions[targetIdx] = Math.max(0, playerPositions[targetIdx] - (item.value || 1));
        showOverlayMessage(`${playerNames[playerIdx]} は ${item.name} で ${playerNames[targetIdx]} を妨害した！`, 1600);
    } else if (item.type === 'skip-event') {
        showOverlayMessage(`${playerNames[playerIdx]} は ${item.name} を使って次のイベントを無効化した！`, 1600);
        // 次のイベントをスキップするフラグを設定
        skipNextEvent = true;
    } else if (item.type === 'warp') {
        const targetPosition = prompt('移動したいマス番号を入力してください (1〜26):');
        const pos = parseInt(targetPosition, 10) - 1;
        if (!isNaN(pos) && pos >= 0 && pos < NUM_SQUARES) {
            playerPositions[playerIdx] = pos;
            showOverlayMessage(`${playerNames[playerIdx]} は ${item.name} を使ってマス ${pos + 1} にワープした！`, 1600);
        } else {
            showOverlayMessage('無効な入力です。', 1600);
        }
    }

    drawBoard();
    updatePlayerInfo();
    renderItemList();
}

// 新しいアイテムを追加
const newItems = [
    { name: '妨害コスメ', desc: '相手1人を1マス戻す', type: 'attack', value: 1 },
    { name: 'イベントキャンセラー', desc: '次のイベントを無効化', type: 'skip-event', value: 0 },
    { name: 'ワープシューズ', desc: '任意のマスに移動', type: 'warp', value: 0 }
];

// ジョーク配列のデフォルト（fetchが失敗したときのフォールバック）
let jokes = [
    'サイコロが逃げ出した…追いかけると目が増えた！',
    'プレイヤーA：「僕には運がある」 プレイヤーB：「いや、それはサイコロの話だ」',
    'ゲーム内で最も信頼できるのは…セーブボタンだ（でもここにはない）',
    '運が悪い？いいえ、ただ振りが強いだけです。',
    'ショップで買えるのはアイテムだけじゃない、ユーモアもね。'
];

// 外部の jokes.json を読み込む（存在すれば上書き）
(function loadJokes(){
    fetch('jokes.json').then(r=>{
        if (!r.ok) throw new Error('no jokes.json');
        return r.json();
    }).then(data=>{
        if (Array.isArray(data) && data.length>0) jokes = data;
    }).catch(()=>{
        // フォールバックのまま
    });
})();

// ジョーク表示用のオーバーレイを作る
function showJoke() {
    const text = jokes[Math.floor(Math.random() * jokes.length)];
    // 一時的なモーダル風オーバーレイ
    const el = document.createElement('div');
    el.className = 'joke-overlay';
    el.innerHTML = `<div class="joke-card">✨ ${text} ✨</div>`;
    document.body.appendChild(el);
    // 演出: 背景フラッシュ + コンフェッティ
    flashBackground();
    showCanvasConfetti(1200);
    setTimeout(()=>{ el.classList.add('fade-out'); }, 1000);
    setTimeout(()=>{ el.remove(); }, 1600);
}

function flashBackground() {
    document.documentElement.classList.add('fun-flash');
    setTimeout(()=>{ document.documentElement.classList.remove('fun-flash'); }, 900);
}

if (funButton) {
    funButton.addEventListener('click', (e)=>{
    e.currentTarget.disabled = true;
    playClickSound();
    showJoke();
    setTimeout(()=>{ funButton.disabled = false; }, 1400);
    });
}

// Ripple effect creator for buttons
function createRipple(e) {
    const btn = e.currentTarget || e.target;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    // position relative to button
    const size = Math.max(rect.width, rect.height) * 0.9;
    ripple.style.width = ripple.style.height = size + 'px';
    const left = e.clientX - rect.left - size/2;
    const top = e.clientY - rect.top - size/2;
    ripple.style.left = left + 'px'; ripple.style.top = top + 'px';
    // ensure container class
    if (!btn.classList.contains('ripple-container')) btn.classList.add('ripple-container');
    btn.appendChild(ripple);
    // play sound
    playClickSound();
    setTimeout(() => { ripple.remove(); }, 600);
}

// Attach ripple handlers to primary buttons
['roll-button','use-item-button','fun-button'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', createRipple);
});

// Canvasベースのシンプルな物理コンフェッティ
function showCanvasConfetti(duration = 1500) {
    // すでにある場合は reuse
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0'; canvas.style.left = '0';
        canvas.style.width = '100%'; canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = 600;
        document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);

    const colors = ['#ffb8e6','#b8eaff','#b8ffb8','#ffeab8','#ffd2a6','#f8e7ff'];
    const pieces = [];
    const count = 60;
    for (let i=0;i<count;i++){ pieces.push({
        x: Math.random()*canvas.width,
        y: -Math.random()*canvas.height*0.2,
        vx: (Math.random()-0.5)*4,
        vy: 2 + Math.random()*4,
        size: 6 + Math.random()*10,
        rot: Math.random()*Math.PI*2,
        vr: (Math.random()-0.5)*0.2,
        color: colors[Math.floor(Math.random()*colors.length)]
    }); }

    const start = performance.now();
    function render(now){
        const t = now - start;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        for (const p of pieces) {
            p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.rot += p.vr;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
            ctx.restore();
        }
        if (t < duration) requestAnimationFrame(render);
        else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.remove(); window.removeEventListener('resize', resize); }
    }
    requestAnimationFrame(render);
}

// --- WebAudioによる簡易効果音 ---
let audioCtx = null;
function ensureAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playClickSound() {
    try {
        ensureAudio();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = 900;
        g.gain.value = 0.0001;
        o.connect(g); g.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        o.start(now); o.stop(now + 0.14);
    } catch (e) { /* ブラウザのオートプレイ制限により失敗する可能性がある */ }
}

function playClapSound() {
    try {
        ensureAudio();
        // 白色雑音を短く鳴らして拍手風にする
        const bufferSize = audioCtx.sampleRate * 0.15;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1) * (1 - i/bufferSize);
        const src = audioCtx.createBufferSource();
        src.buffer = buffer;
        const g = audioCtx.createGain(); g.gain.value = 0.6;
        src.connect(g); g.connect(audioCtx.destination);
        src.start();
    } catch (e) { }
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

// ==== Rebuild top-right floating menu & actions (replace stray buttons) ====
// 古い単独ジョークボタンを削除（残っていたら）
(function removeLegacyFloatingButtons(){
  const legacy = document.querySelectorAll('#joke-floating-btn, #color-floating-btn, #numbergame-floating-btn');
  legacy.forEach(el=>el.remove());
  // 既に body 直下に作られている bottom-right ジョークボタンも検知
  document.querySelectorAll('body > button').forEach(b=>{
    if (b.textContent && b.textContent.includes('ジョーク')) b.remove();
  });
})();

// アクション関数（重複生成防止）
function triggerRandomJoke(){
  const randomJoke = jokes[Math.floor(Math.random()*jokes.length)];
  const existing = document.querySelector('.center-joke-display');
  if (existing) existing.remove();
  const jokeDisplay = document.createElement('div');
  jokeDisplay.className = 'center-joke-display';
  Object.assign(jokeDisplay.style, {
    position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',padding:'26px 40px',background:'linear-gradient(135deg,#ffeaff,#eafffa)',color:'#5a1a4a',fontSize:'1.7rem',fontWeight:'bold',textAlign:'center',borderRadius:'20px',boxShadow:'0 10px 36px rgba(180,140,255,.38)',zIndex:1300,maxWidth:'70vw',lineHeight:'1.4'
  });
  jokeDisplay.textContent = randomJoke;
  document.body.appendChild(jokeDisplay);
  setTimeout(()=>{ jokeDisplay.style.transition='opacity .6s'; jokeDisplay.style.opacity='0'; setTimeout(()=>jokeDisplay.remove(),620); }, 3200);
}
function triggerRandomBg(){
  // 元のボディグラデは残しつつ game-container だけ色変化
  const gc = document.getElementById('game-container') || document.body;
  const hue = Math.floor(Math.random()*360);
  gc.style.transition='background 0.9s';
  gc.style.background = `linear-gradient(135deg, hsl(${hue} 90% 94%), hsl(${(hue+40)%360} 95% 88%))`;
}
// openNumberGame は後方に既に定義されているので再利用。

// 既存の古い initFloatingMenu を置き換え（重複防止）
(function initUnifiedMenu(){
  // 旧メニュー消去
  document.querySelectorAll('.fab-menu-wrapper').forEach(w=>w.remove());
  const wrapper = document.createElement('div');
  wrapper.className='fab-menu-wrapper'; // CSS 側で top/right 配置済み

  const mainBtn = document.createElement('button');
  mainBtn.className='fab-main-btn';
  mainBtn.setAttribute('aria-label','クイックメニュー');
  mainBtn.innerHTML = '<div class="bars"><span></span><span></span><span></span></div>';

  const panel = document.createElement('div');
  panel.className='fab-panel';
  panel.innerHTML='<h4>クイックメニュー</h4>';

  function addAction(label, icon, fn){
    const b=document.createElement('button');
    b.className='menu-action';
    b.innerHTML=`<span class="mini-icon">${icon}</span><span>${label}</span>`;
    b.addEventListener('click',()=>{ fn(); panel.classList.remove('open'); mainBtn.classList.remove('active'); });
    panel.appendChild(b);
  }

  addAction('ジョーク','✨', triggerRandomJoke);
  addAction('背景チェンジ','🎨', triggerRandomBg);
  addAction('数字当て','🔢', ()=>openNumberGame());

  mainBtn.addEventListener('click',()=>{
    const open = panel.classList.toggle('open');
    mainBtn.classList.toggle('active', open);
  });
  document.addEventListener('click', e=>{
    if(!wrapper.contains(e.target)) { panel.classList.remove('open'); mainBtn.classList.remove('active'); }
  });

  wrapper.appendChild(mainBtn); wrapper.appendChild(panel);
  document.body.appendChild(wrapper);
})();

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
                // プレイヤー idx を属性として残す（勝利演出で参照するため）
                playerDiv.setAttribute('data-player-idx', String(playerIdx));
                // 表示用に短縮名を作成（最大3文字）
                const fullName = playerNames[playerIdx] || '';
                // 全角・半角混在を考慮して最大表示幅を文字数ベースで調整
                const shortName = fullName.length > 3 ? fullName.slice(0,3) + '…' : fullName;
                playerDiv.textContent = shortName;
                // フルネームはツールチップとして title に設定
                playerDiv.title = fullName;
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

// ミニゲームのロジックを追加
// ミニゲーム: 早押し / スロット / クイズ の複数実装
function startMiniGame(type = 'quick') {
    // type: 'quick' | 'slot' | 'quiz' - ランダム選択も可能
    const gameType = type === 'random' ? ['quick','slot','quiz'][Math.floor(Math.random()*3)] : type;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    const content = document.createElement('div');
    content.className = 'modal-content';

    // ユーティリティ: ゲーム終了処理
    function endGame(winnerIdx, reward) {
            if (winnerIdx != null) {
            const winnerName = playerNames[winnerIdx];
            showOverlayMessage(`${winnerName} がミニゲームに勝利！` , 1600);
            // 勝利演出: コンフェッティ + 対象プレイヤーの pop アニメ
            showConfetti(1400);
            // 対象の player 要素に pop クラスを付与
            setTimeout(()=>{
                const elems = document.querySelectorAll('.player');
                for (let e of elems) {
                    if (e.getAttribute('data-player-idx') === String(winnerIdx)) {
                        e.classList.add('pop');
                        setTimeout(()=>e.classList.remove('pop'), 700);
                        break;
                    }
                }
            }, 80);
            // 報酬: アイテムまたは移動
            if (reward && reward.type === 'move') {
                playerPositions[winnerIdx] = Math.min(NUM_SQUARES-1, playerPositions[winnerIdx] + (reward.value||1));
            } else if (reward && reward.type === 'item') {
                giveItem(winnerIdx, reward.item);
            }
            drawBoard(); updatePlayerInfo();
        }
        modal.remove();
        // ターン進行
        currentPlayer = (currentPlayer + 1) % NUM_PLAYERS;
        if (isCpuMode && currentPlayer >= NUM_PLAYERS - NUM_CPUS) setTimeout(cpTurn, 900);
        else rollButton.disabled = false;
    }

    if (gameType === 'quick') {
        content.innerHTML = `
            <h3>ミニゲーム: 早押し！</h3>
            <p>表示されたボタンをいち早く押した人が勝ち。</p>
            <div id="quick-buttons" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px"></div>
        `;
        modal.appendChild(content);
        document.body.appendChild(modal);
        const container = document.getElementById('quick-buttons');
        let finished = false;
        for (let i=0;i<NUM_PLAYERS;i++){
            const btn = document.createElement('button'); btn.className='choice-btn'; btn.textContent=playerNames[i];
            btn.addEventListener('click', ()=>{ if (finished) return; finished=true; endGame(i, {type:'item', item:{name:'勝利のコスメ', desc:'1マス進む', type:'move', value:1}}); });
            container.appendChild(btn);
        }
        // CPU の反応をランダムでシミュレート
        if (isCpuMode) {
            for (let i=NUM_PLAYERS-NUM_CPUS;i<NUM_PLAYERS;i++){
                ((idx)=>{ setTimeout(()=>{ if (!finished){ finished=true; endGame(idx, {type:'move', value:1}); } }, 600 + Math.random()*900); })(i);
            }
        }
    } else if (gameType === 'slot') {
        content.innerHTML = `
            <h3>ミニゲーム: スロット！</h3>
            <p>レバーを引いてリールを回転させ、揃えば大当たり！</p>
            <div class="slot-reel" style="margin-top:12px">
                <div id="slot-1" class="slot-cell">?</div>
                <div id="slot-2" class="slot-cell">?</div>
                <div id="slot-3" class="slot-cell">?</div>
            </div>
            <div style="margin-top:12px"><button id="slot-pull" class="choice-btn">レバーを引く</button></div>
        `;
        modal.appendChild(content);
        document.body.appendChild(modal);
        const symbols = ['🍒','🍋','🍊','✨','7️⃣'];
        const cells = [document.getElementById('slot-1'), document.getElementById('slot-2'), document.getElementById('slot-3')];
        let spinning = false;
        function spinOnce() {
            // 一時的にランダム表示
            cells.forEach(c=>{ c.textContent = symbols[Math.floor(Math.random()*symbols.length)]; c.classList.add('spin'); c.classList.remove('stop'); });
        }
        let spinIntervals = [];
        document.getElementById('slot-pull').addEventListener('click', ()=>{
            if (spinning) return; spinning = true;
            rollButton.disabled = true;
            // スピン演出: 各リールを別タイミングで止める
            const durations = [900, 1300, 1700];
            // start spinning visuals
            const start = Date.now();
            spinIntervals = cells.map((c, idx) => {
                return setInterval(()=>{ c.textContent = symbols[Math.floor(Math.random()*symbols.length)]; c.classList.add('spin'); }, 80 + Math.random()*40);
            });
            // 停止タイミング
            durations.forEach((d, i)=>{
                setTimeout(()=>{
                    clearInterval(spinIntervals[i]);
                    const final = symbols[Math.floor(Math.random()*symbols.length)];
                    cells[i].textContent = final;
                    cells[i].classList.remove('spin');
                    cells[i].classList.add('stop');
                    // 当たり判定は全て停止した後で
                    if (i === durations.length - 1) {
                        const s1 = cells[0].textContent, s2 = cells[1].textContent, s3 = cells[2].textContent;
                        const isJackpot = (s1===s2 && s2===s3);
                        if (isJackpot) {
                            // 当たり演出
                            showConfetti(1600);
                            // pop 効果を当てる
                            setTimeout(()=>{
                                const elems = document.querySelectorAll('.player');
                                for (let e of elems) { if (e.getAttribute('data-player-idx') === String(currentPlayer)) { e.classList.add('pop'); setTimeout(()=>e.classList.remove('pop'),900); break; } }
                            }, 120);
                            endGame(currentPlayer, {type:'move', value:2});
                        } else {
                            // ハズレ: モーダルを閉じてターン進行
                            modal.remove();
                            currentPlayer = (currentPlayer + 1) % NUM_PLAYERS;
                            if (isCpuMode && currentPlayer >= NUM_PLAYERS - NUM_CPUS) setTimeout(cpTurn, 900);
                            else rollButton.disabled = false;
                        }
                        spinning = false;
                    }
                }, d);
            });
        });
    } else if (gameType === 'quiz') {
        // 簡単なクイズ問題を用意
        const pool = [
            {q:'日本の首都は？', a:'東京'},
            {q:'2+3は？', a:'5'},
            {q:'色の三原色の一つは？', a:'赤'}
        ];
        const item = pool[Math.floor(Math.random()*pool.length)];
        content.innerHTML = `
            <h3>ミニゲーム: クイズ！</h3>
            <p>${item.q}</p>
            <div style="margin-top:12px"><input id="quiz-answer" placeholder="答えを入力" style="padding:8px;font-size:16px"/></div>
            <div style="margin-top:12px"><button id="quiz-submit" class="choice-btn">回答する</button></div>
        `;
        modal.appendChild(content);
        document.body.appendChild(modal);
        document.getElementById('quiz-submit').addEventListener('click', ()=>{
            const val = document.getElementById('quiz-answer').value.trim();
            if (val === item.a) endGame(currentPlayer, {type:'item', item:{name:'知識のコスメ', desc:'1マス進む', type:'move', value:1}});
            else { modal.remove(); currentPlayer = (currentPlayer + 1) % NUM_PLAYERS; if (isCpuMode && currentPlayer >= NUM_PLAYERS - NUM_CPUS) setTimeout(cpTurn, 900); else rollButton.disabled = false; }
        });
    }
}

// 特定のマスでミニゲームを開始
function checkForMiniGame(position) {
    const miniGamePositions = [5, 10, 15]; // ミニゲームが発生するマス
    if (miniGamePositions.includes(position)) {
        // 発生したらランダムでミニゲームを選ぶ
        startMiniGame('random');
    }
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
            checkForMiniGame(playerPositions[playerIdx]); // ミニゲームのチェックを追加
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
            // applyChoiceOption がターン進行やボタン有効化を制御する
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
        // アニメーション後にターンを進める
        animatePlayerMovement(playerIdx, from, playerPositions[playerIdx], ()=>{
            drawBoard();
            updatePlayerInfo();
            // 移動後は通常通りターン交代
            currentPlayer = (currentPlayer + 1) % NUM_PLAYERS;
            // CPUのターンなら自動で開始、そうでなければボタンを有効化
            if (isCpuMode && currentPlayer >= NUM_PLAYERS - NUM_CPUS) {
                setTimeout(cpTurn, 900);
            } else {
                rollButton.disabled = false;
            }
        });
        msg = `${playerNames[playerIdx]} は移動して ${playerPositions[playerIdx] + 1} マス目に到達した。`;
    } else if (opt.effect === 'reroll') {
        msg = `${playerNames[playerIdx]} は再振りを行います。`;
        setTimeout(() => { if (isCpuMode && playerIdx >= NUM_PLAYERS - NUM_CPUS) cpTurn(); else rollButton.click(); }, 600);
    } else if (opt.effect === 'skip') {
        currentPlayer = (currentPlayer + 1) % NUM_PLAYERS;
        msg = `${playerNames[playerIdx]} のターンはスキップされました。`;
        // スキップ後は次のプレイヤー処理
        if (isCpuMode && currentPlayer >= NUM_PLAYERS - NUM_CPUS) {
            setTimeout(cpTurn, 900);
        } else {
            rollButton.disabled = false;
        }
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

// 修正: 早押し制御を追加
function determineTurnOrder() {
    const turnOrderModal = document.createElement('div');
    turnOrderModal.className = 'modal';
    turnOrderModal.style.display = 'flex';
    turnOrderModal.innerHTML = `
        <div class="modal-content">
            <h3>ミニゲーム: ターン順を決めよう！</h3>
            <p>早押しでターン順を決定します！</p>
            <div id="turn-order-buttons"></div>
        </div>
    `;
    document.body.appendChild(turnOrderModal);

    const buttonContainer = document.getElementById('turn-order-buttons');
    const results = [];
    let gameStarted = false;

    for (let i = 0; i < NUM_PLAYERS; i++) {
        const btn = document.createElement('button');
        btn.textContent = playerNames[i];
        btn.className = 'choice-btn';
        btn.addEventListener('click', () => {
            if (!gameStarted) {
                gameStarted = true; // 最初のボタンが押されたら制御開始
                results.push(playerNames[i]);
                alert(`${playerNames[i]} が最初に押しました！`);
                turnOrderModal.remove();
                playerNames = results.concat(playerNames.filter(name => !results.includes(name))); // 順番を更新
                drawBoard();
                updatePlayerInfo();
            }
        });
        buttonContainer.appendChild(btn);
    }
}

// ゲーム開始時にターン順ミニゲームを実行
function setupGame(mode, playerCount, cpuCount) {
    isCpuMode = (mode === "cpu");
    NUM_PLAYERS = playerCount;
    NUM_CPUS = isCpuMode ? cpuCount : 0;
    playerPositions = Array(NUM_PLAYERS).fill(0);
    currentPlayer = 0;
    assignPlayerNames();
    determineTurnOrder(); // ターン順ミニゲームを追加
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

document.querySelector('h1').addEventListener('click', () => {
    alert('すごい！よくできました！');
});

// 旧ジョーク単独ボタン生成ブロックを無効化（既に削除済みだが安全策）
// (function(){ /* removed legacy floating joke button */ })();

// 追加: 汎用ボタンエフェクトユーティリティ
function attachFancyButtonEffects(root=document){
  const btns = root.querySelectorAll('button:not(.fab-main-btn):not(.menu-action-inited)');
  btns.forEach(b=>{
    b.classList.add('menu-action-inited');
    b.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .3s';
    b.addEventListener('pointerenter',()=>{ b.style.transform='translateY(-3px)'; });
    b.addEventListener('pointerleave',()=>{ b.style.transform=''; });
    b.addEventListener('pointerdown',()=>{ b.style.transform='translateY(0) scale(.95)'; });
    b.addEventListener('pointerup',()=>{ b.style.transform='translateY(-3px)'; });
  });
}

// 数字当てゲーム I/F を安全に開くためのラッパ（多重起動防止 & 次フレーム実行）
function safeOpenNumberGame(){
  if (document.getElementById('number-game-screen')) return; // 既に開いている
  requestAnimationFrame(()=>{ openNumberGame(); setTimeout(()=>attachFancyButtonEffects(document.getElementById('number-game-screen')),30); });
}

// メニュー再初期化で openNumberGame を safeOpenNumberGame に変更（既存メニューがあれば差し替え）
(function patchMenuActions(){
  const panel = document.querySelector('.fab-panel');
  if (!panel) return;
  const buttons = Array.from(panel.querySelectorAll('button.menu-action'));
  buttons.forEach(b=>{
    if (b.textContent.includes('数字当て')) { b.replaceWith(b.cloneNode(true)); }
  });
  // 再取得してハンドラ再接続
  const refreshed = Array.from(document.querySelectorAll('.fab-panel button.menu-action'));
  refreshed.forEach(b=>{
    if (b.textContent.includes('ジョーク')) { b.onclick = ()=>{ triggerRandomJoke(); }; }
    else if (b.textContent.includes('背景')) { b.onclick = ()=>{ triggerRandomBg(); }; }
    else if (b.textContent.includes('数字当て')) { b.onclick = ()=>{ safeOpenNumberGame(); }; }
  });
})();

// 初期ボタンエフェクト適用
attachFancyButtonEffects();

// openNumberGame 内末尾でエフェクト適用できるようフックを追加するため openNumberGame を再ラップ
const _originalOpenNumberGame = openNumberGame;
openNumberGame = function(){
  _originalOpenNumberGame();
  attachFancyButtonEffects(document.getElementById('number-game-screen'));
};

// ===== Fix: Ensure openNumberGame reference & menu action binding after all definitions =====
(function ensureNumberGameBinding(){
  // 1) 最新の openNumberGame が存在しなければ何もしない
  if (typeof openNumberGame !== 'function') return;
  // 2) 既存メニューを取得
  const wrapper = document.querySelector('.fab-menu-wrapper');
  const panel = document.querySelector('.fab-panel');
  if (!wrapper || !panel) return;
  // 3) 既存メニュー内の数字当てボタンを探し直す（ラベル部分を正規化）
  const gameBtn = Array.from(panel.querySelectorAll('button.menu-action'))
    .find(b => /数字当て/.test(b.textContent));
  if (gameBtn) {
    // 旧ハンドラ除去
    gameBtn.replaceWith(gameBtn.cloneNode(true));
    const fresh = Array.from(panel.querySelectorAll('button.menu-action'))
      .find(b => /数字当て/.test(b.textContent));
    if (fresh) {
      fresh.addEventListener('click', e => {
        e.stopPropagation();
        if (!document.getElementById('number-game-screen')) {
          // CSS開閉状態解除
          panel.classList.remove('open');
          wrapper.querySelector('.fab-main-btn')?.classList.remove('active');
          // 遅延して起動（閉じるアニメと競合しないよう）
          setTimeout(()=>{ try { openNumberGame(); } catch(err){ console.warn('openNumberGame error', err); } }, 30);
        }
      });
    }
  }
})();

// ===== Add global click debug helper (開発用: 必要ならコメントアウト) =====
// document.addEventListener('click', e => { console.log('click', e.target); });
