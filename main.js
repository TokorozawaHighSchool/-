// メニュー切替の基本実装
(function(){
  function hideAll(){ document.querySelectorAll('[data-game-container]').forEach(el=> el.style.display='none'); }
  function showGame(key){
  hideAll();
  // メニューを隠し、ゲームを全面表示
  const menu = document.getElementById('game-menu');
  const lead = document.querySelector('.home-lead');
  if (menu) menu.style.display='none';
  if (lead) lead.style.display='none';
    document.querySelectorAll(`[data-game-container="${key}"]`).forEach(el=> el.style.display='');
    document.querySelectorAll('.action-button-row').forEach(el=>{
      el.style.display = (el.getAttribute('data-game-container')===key) ? '' : 'none';
    });
    // すごろくはセットアップ画面を最初に出す
    if (key === 'sugoroku') {
      const setup = document.getElementById('setup-container');
      const board = document.getElementById('board');
      const info = document.getElementById('player-info');
      const row = document.querySelector('.action-button-row');
      if (setup) setup.style.display='';
      if (board) board.style.display='none';
      if (info) info.style.display='none';
      if (row) row.style.display='none';
    }
  }
  function bindMenu(){
    const menu = document.getElementById('game-menu');
    if (!menu || menu.__bound) return; menu.__bound = true;
    menu.addEventListener('click', (e)=>{
      const btn = e.target.closest('.menu-btn[data-game]');
      if (!btn) return;
      const key = btn.getAttribute('data-game');
      if (!key) return;
      showGame(key);
    });
    // 直接ハンドラも追加
    document.querySelectorAll('.menu-btn[data-game]').forEach(b=>{
      if (b.__bound) return; b.__bound = true;
      b.addEventListener('click', (e)=>{
        e.preventDefault(); e.stopPropagation();
        const key = b.getAttribute('data-game'); if (!key) return;
        showGame(key);
      });
    });
  }
  document.addEventListener('DOMContentLoaded', ()=>{ hideAll(); bindMenu(); });
  if (document.readyState!=='loading'){ hideAll(); bindMenu(); }
})();

// ===== じゃんけん =====
(function(){
  const status = document.getElementById('janken-status');
  const buttons = document.getElementById('janken-buttons');
  const reset = document.getElementById('janken-reset');
  const hands = ['gu','choki','pa'];
  const emoji = { gu:'✊', choki:'✌️', pa:'🖐️' };
  let score = { win:0, lose:0, draw:0 };
  function judge(p,c){ if(p===c) return 'draw'; if((p==='gu'&&c==='choki')||(p==='choki'&&c==='pa')||(p==='pa'&&c==='gu')) return 'win'; return 'lose'; }
  function update(t){ if(status) status.innerHTML = `${t}<br>勝:${score.win} 負:${score.lose} 引:${score.draw}`; }
  if (buttons) buttons.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-hand]'); if(!btn) return;
    const p = btn.getAttribute('data-hand'); const c = hands[Math.floor(Math.random()*hands.length)];
    const r = judge(p,c); score[r]++; update(`あなた ${emoji[p]} vs CPU ${emoji[c]} → ${r==='win'?'勝ち':r==='lose'?'負け':'引き分け'}`);
  });
  if (reset) reset.addEventListener('click', ()=>{ score={win:0,lose:0,draw:0}; update('リセットしました'); });
  update('手を選んでね');
})();

// ===== 反射神経 =====
(function(){
  const status = document.getElementById('reaction-status');
  const start = document.getElementById('reaction-start');
  const stop = document.getElementById('reaction-stop');
  let timer=null, t0=0;
  function setS(x){ if(status) status.textContent=x; }
  function enable(s, p){ if(start) start.disabled=!s; if(stop) stop.disabled=!p; }
  if (start) start.addEventListener('click', ()=>{ enable(false,true); setS('合図を待って…'); const d=600+Math.random()*1800; timer=setTimeout(()=>{ t0=performance.now(); setS('今！止めて！'); }, d); });
  if (stop) stop.addEventListener('click', ()=>{ const now=performance.now(); if(!timer&&!t0){ setS('早押ししすぎ！もう一度'); return; } if(t0){ const ms=Math.round(now-t0); setS(`反応速度: ${ms} ms`);} clearTimeout(timer); timer=null; t0=0; enable(true,false); });
})();

// ===== 数字あて =====
(function(){
  const status = document.getElementById('number-status');
  const input = document.getElementById('number-input');
  const guess = document.getElementById('number-guess');
  const reset = document.getElementById('number-reset');
  let ans = Math.floor(Math.random()*99)+1;
  function setS(x){ if(status) status.textContent=x; }
  function resetGame(){ ans = Math.floor(Math.random()*99)+1; setS('新しいお題：1〜99の数を当ててね'); if(input) input.value=''; }
  if (guess) guess.addEventListener('click', ()=>{ const v=parseInt(input.value,10); if(isNaN(v)||v<1||v>99){ setS('1〜99で入力してね'); return; } if(v===ans){ setS('正解！🎉'); } else if(v<ans){ setS('もっと大きいよ'); } else { setS('もっと小さいよ'); } });
  if (reset) reset.addEventListener('click', resetGame);
})();

// ===== 右上クイックメニュー（FAB） =====
(function(){
  const fab = document.querySelector('.fab-main-btn');
  const panel = document.querySelector('.fab-panel');
  if (!fab || !panel) return;
  fab.addEventListener('click', ()=>{
    panel.classList.toggle('open');
  });
  panel.addEventListener('click', (e)=>{
    const btn = e.target.closest('.menu-action[data-open]');
    if (!btn) return;
    const key = btn.getAttribute('data-open');
    panel.classList.remove('open');
    // 既存の切替ロジックを再利用
    document.querySelectorAll('[data-game-container]').forEach(el=> el.style.display='none');
    document.querySelectorAll(`[data-game-container="${key}"]`).forEach(el=> el.style.display='');
    document.querySelectorAll('.action-button-row').forEach(el=>{
      el.style.display = (el.getAttribute('data-game-container')===key) ? '' : 'none';
    });
  });
})();

// ===== すごろく（簡易） =====
(function(){
  const setup = document.getElementById('setup-container');
  const form = document.getElementById('setup-form');
  const board = document.getElementById('board');
  const info = document.getElementById('player-info');
  const roll = document.getElementById('roll-button');
  const row = document.querySelector('.action-button-row');
  const squares = 26;
  let players=2, cpus=1, positions=[], turn=0;
  function draw(){
    if (!board) return;
    board.innerHTML='';
    for(let i=0;i<squares;i++){
      const s=document.createElement('div'); s.className='square'; s.textContent=String(i+1);
      positions.forEach((p,idx)=>{ if(p===i){ const pe=document.createElement('div'); pe.className='player'; pe.textContent=String(idx+1); s.appendChild(pe); }});
      board.appendChild(s);
    }
    if (info) info.textContent = `ターン: プレイヤー${turn+1} / 位置: ` + positions.map((p,i)=>`P${i+1}:${p+1}`).join('  ');
  }
  function start(){
    positions = Array.from({length:players},()=>0);
  if (setup) setup.style.display='none';
  if (board) board.style.display='';
  if (info) info.style.display='';
  if (row) row.style.display='';
    draw();
  }
  if (form) form.addEventListener('submit',(e)=>{
    e.preventDefault();
    players = parseInt(document.getElementById('player-count-select').value,10)||2;
    cpus = parseInt(document.getElementById('cpu-count-select').value,10)||1;
    start();
  });
  if (roll) roll.addEventListener('click', ()=>{
    const n = 1 + Math.floor(Math.random()*6);
    positions[turn] = Math.min(squares-1, positions[turn] + n);
    draw();
    if (positions[turn] >= squares-1){ alert(`プレイヤー${turn+1}がゴール！`); } else { turn = (turn+1)%players; }
  });
  // ホームボタンで初期状態へ
  document.querySelectorAll('[data-home]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      // すべてのゲーム非表示
      document.querySelectorAll('[data-game-container]').forEach(el=> el.style.display='none');
      document.querySelectorAll('.action-button-row').forEach(el=> el.style.display='none');
      // メニューを表示
      const menu = document.getElementById('game-menu');
      const lead = document.querySelector('.home-lead');
      if (menu) menu.style.display='';
      if (lead) lead.style.display='';
    });
  });
})();
// root script delegates to src/main.js for now
// If deployed as a single-root, copy build step can inline or bundle.
(function(){
  var s = document.createElement('script');
  s.src = 'src/main.js';
  document.head.appendChild(s);
})();
