/* ────────────────────────────────────────────────────────────────
   BingoPick – app.js  (Host view)
   Bingo game engine with Firebase multiplayer room support.
   Falls back to single-player mode if Firebase not configured.
──────────────────────────────────────────────────────────────── */

'use strict';

/* ════════════════════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════════════════════ */
const BINGO_COLS  = ['B','I','N','G','O'];
const COL_RANGES  = { B:[1,15], I:[16,30], N:[31,45], G:[46,60], O:[61,75] };
const SPEED_MAP   = { 1:6000, 2:4000, 3:2500, 4:1500, 5:800 };
const SPEED_LABELS= { 1:'Slow', 2:'Relaxed', 3:'Normal', 4:'Fast', 5:'Turbo' };
const AVATAR_COLORS=['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#f97316'];

/* ════════════════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════════════════ */
let state = {
  mode: 'numbers',
  pool: [],
  remaining: [],
  called: [],
  card: [],
  marked: new Set(),
  pattern: 'line',
  players: [],
  autoCall: false,
  paused: false,
  autoTimer: null,
  speed: 3,
  gameActive: false,
  customPrizes: [],
  currentTheme: null,
  soundEnabled: true,
  // Room
  roomId: null,
  isRoomMode: false,
  fbDbRef: null,
};

/* ════════════════════════════════════════════════════════════════
   DOM REFS
════════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const DOM = {
  confetti:           $('confetti-canvas'),
  numberGrid:         $('number-grid'),
  lastBall:           $('last-ball'),
  lastBallCol:        $('last-ball-col'),
  lastBallNum:        $('last-ball-num'),
  calledBadge:        $('called-count-badge'),
  bingoCard:          $('bingo-card'),
  btnDraw:            $('btn-draw'),
  drawLabel:          $('draw-label'),
  btnNewCard:         $('btn-new-card'),
  chkAutoCall:        $('chk-autocall'),
  btnPause:           $('btn-pause'),
  speedSlider:        $('speed-slider'),
  speedVal:           $('speed-val'),
  statusDot:          $('status-dot'),
  statusText:         $('status-text'),
  btnReset:           $('btn-reset'),
  bingoModal:         $('bingo-modal'),
  modalEmoji:         $('modal-emoji'),
  modalWinner:        $('modal-winner-name'),
  modalPrize:         $('modal-prize'),
  btnContinue:        $('btn-continue'),
  btnCloseModal:      $('btn-close-modal'),
  prizesTextarea:     $('prizes-textarea'),
  btnLoadPrizes:      $('btn-load-prizes'),
  btnDefPrizes:       $('btn-load-default-prizes'),
  prizesHint:         $('prizes-hint'),
  customPanel:        $('custom-prizes-panel'),
  inputPlayer:        $('input-player'),
  btnAddPlayer:       $('btn-add-player'),
  playerList:         $('player-list'),
  emptyPlayers:       $('empty-players'),
  playerCount:        $('player-count'),
  chkAutoMark:        $('chk-auto-mark'),
  chkSound:           $('chk-sound'),
  btnShare:           $('btn-share'),
  shareToast:         $('share-toast'),
  playerCardModal:    $('player-card-modal'),
  playerCardGrid:     $('player-card-grid'),
  playerModalName:    $('player-modal-name'),
  btnClosePlayerModal:$('btn-close-player-modal'),
  btnCallBingo:       $('btn-call-bingo'),
  // Room UI (modal-based)
  btnCreateRoom:      $('btn-create-room'),
  btnRoomBadge:       $('btn-room-badge'),
  hostRoomId:         $('host-room-id'),
  hostPlayerCount:    $('host-player-count'),
  roomModal:          $('room-modal'),
  btnCloseRoomModal:  $('btn-close-room-modal'),
  roomIdDisplay:      $('room-id-display'),
  roomLink:           $('room-link'),
  btnCopyLink:        $('btn-copy-link'),
  copyLinkToast:      $('copy-link-toast'),
  btnStartGame:       $('btn-start-game'),
  roomPlayerList:     $('room-player-list'),
  roomPlayerCount:    $('room-player-count'),
};

/* ════════════════════════════════════════════════════════════════
   AUDIO
════════════════════════════════════════════════════════════════ */
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, type='sine', dur=0.12, vol=0.18) {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}
function playDraw()  { playTone(440,'sine',0.08,0.12); setTimeout(()=>playTone(660,'sine',0.12,0.1),60); }
function playBingo() { [523.25,659.25,783.99,1046.5].forEach((f,i)=>setTimeout(()=>playTone(f,'triangle',0.25,0.25),i*120)); }
function playMark()  { playTone(880,'sine',0.06,0.08); }

/* ════════════════════════════════════════════════════════════════
   CONFETTI
════════════════════════════════════════════════════════════════ */
(function(){
  const canvas = DOM.confetti;
  const ctx = canvas.getContext('2d');
  let parts=[], raf;
  function resize(){ canvas.width=innerWidth; canvas.height=innerHeight; }
  window.addEventListener('resize', resize); resize();
  const COLS=['#7c6aff','#ff5e87','#00d2ff','#ffd166','#06d6a0','#ff9f1c'];
  window.launchConfetti = function(theme){
    const cols=(theme&&theme.ballColors)?theme.ballColors:COLS;
    parts=[];
    for(let i=0;i<180;i++) parts.push({
      x:Math.random()*canvas.width, y:-10,
      r:Math.random()*7+3, dx:(Math.random()-.5)*4, dy:Math.random()*4+2,
      rot:Math.random()*Math.PI*2, drot:(Math.random()-.5)*.15,
      color:cols[Math.floor(Math.random()*cols.length)],
      shape:Math.random()>.5?'rect':'circle', alpha:1,
    });
    if(raf) cancelAnimationFrame(raf); animate();
  };
  function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    parts=parts.filter(p=>p.alpha>0.02);
    parts.forEach(p=>{
      ctx.save(); ctx.globalAlpha=p.alpha;
      ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle=p.color;
      if(p.shape==='circle'){ ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill(); }
      else ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);
      ctx.restore();
      p.x+=p.dx; p.y+=p.dy; p.rot+=p.drot; p.dy+=0.06;
      if(p.y>canvas.height*.75) p.alpha-=0.02;
    });
    if(parts.length>0) raf=requestAnimationFrame(animate);
  }
})();

/* ════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════ */
function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function escHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function genId(len=6){ const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({length:len},()=>chars[Math.floor(Math.random()*chars.length)]).join(''); }

/* ════════════════════════════════════════════════════════════════
   POOL & CARD GENERATION
════════════════════════════════════════════════════════════════ */
function buildNumberPool(){
  const pool=[];
  BINGO_COLS.forEach(col=>{ const[lo,hi]=COL_RANGES[col]; for(let n=lo;n<=hi;n++) pool.push({label:String(n),col,num:n}); });
  return pool;
}
function buildWordsPool(prizes){
  return prizes.map((p,i)=>({label:p,col:BINGO_COLS[i%5],num:i+1}));
}
function generateCard(pool){
  if(state.mode==='numbers'){
    const card=[];
    BINGO_COLS.forEach(col=>{
      const[lo,hi]=COL_RANGES[col];
      card.push(shuffle(Array.from({length:hi-lo+1},(_,i)=>lo+i)).slice(0,5));
    });
    const grid=[];
    for(let r=0;r<5;r++) for(let c=0;c<5;c++) grid.push({label:String(card[c][r]),col:BINGO_COLS[c],num:card[c][r]});
    grid[12]={label:'FREE',col:'FREE',num:-1};
    return grid;
  } else {
    let src=[...pool]; while(src.length<24) src=[...src,...pool];
    const picked=shuffle(src).slice(0,24);
    const grid=[];
    for(let i=0;i<25;i++) grid.push(i===12?{label:'FREE',col:'FREE',num:-1}:picked[i<12?i:i-1]);
    return grid;
  }
}

/* ════════════════════════════════════════════════════════════════
   RENDER
════════════════════════════════════════════════════════════════ */
function renderNumberGrid(){
  DOM.numberGrid.innerHTML='';
  for(let n=1;n<=75;n++){
    const col=BINGO_COLS[Math.floor((n-1)/15)];
    const div=document.createElement('div');
    div.className='ng-cell'; div.dataset.num=n; div.dataset.col=col; div.textContent=n;
    DOM.numberGrid.appendChild(div);
  }
}
function renderBingoCard(card, container, markedSet, isModal=false){
  container.innerHTML='';
  const isWords=state.mode==='words';
  container.classList.toggle('words-mode', isWords);
  card.forEach((cell,idx)=>{
    const div=document.createElement('div');
    div.className='bingo-cell'; div.dataset.idx=idx; div.dataset.num=cell.num; div.dataset.col=cell.col;
    if(cell.label==='FREE'){ div.classList.add('free'); div.textContent='FREE'; }
    else { div.textContent=cell.label; if(markedSet.has(idx)) div.classList.add('marked'); }
    if(!isModal) div.addEventListener('click',()=>onCellClick(idx));
    container.appendChild(div);
  });
}
function updateNumberGrid(){
  const calledNums=new Set(state.called.map(c=>c.num));
  document.querySelectorAll('.ng-cell').forEach(el=>el.classList.toggle('called',calledNums.has(parseInt(el.dataset.num))));
  DOM.calledBadge.textContent=`${state.called.length} / ${state.pool.length}`;
}
function updateLastBall(item){
  if(!item){DOM.lastBallCol.textContent='–';DOM.lastBallNum.textContent='–';return;}
  DOM.lastBallCol.textContent=state.mode==='numbers'?item.col:'🎁';
  DOM.lastBallNum.textContent=state.mode==='numbers'?item.num:'!';
  DOM.lastBall.classList.remove('pop'); void DOM.lastBall.offsetWidth; DOM.lastBall.classList.add('pop');
}
function updateStatus(type,text){ DOM.statusDot.className='status-dot '+type; DOM.statusText.textContent=text; }
function refreshMainCard(){
  renderBingoCard(state.card,DOM.bingoCard,state.marked);
  const win=checkWin(state.card,state.marked,state.pattern);
  if(win.length) applyWinHighlight(DOM.bingoCard,win);
}
function applyWinHighlight(container,indices){
  indices.forEach(idx=>{ const c=container.querySelector(`[data-idx="${idx}"]`); if(c) c.classList.add('winning'); });
}

/* ════════════════════════════════════════════════════════════════
   WIN DETECTION
════════════════════════════════════════════════════════════════ */
function checkWin(card,marked,pattern){
  const m=idx=>idx===12||marked.has(idx);
  const rows=[[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24]];
  const cols=[[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24]];
  const d1=[0,6,12,18,24], d2=[4,8,12,16,20];
  const frame=[0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24];
  const all=Array.from({length:25},(_,i)=>i);
  function lineWin(lines){ for(const l of lines){ if(l.every(m)) return l; } return null; }
  if(pattern==='line') return lineWin([...rows,...cols,d1,d2])||[];
  if(pattern==='x'){ const a=d1.every(m),b=d2.every(m); return(a&&b)?[...new Set([...d1,...d2])]:[];}
  if(pattern==='frame') return frame.every(m)?frame:[];
  if(pattern==='blackout') return all.every(m)?all:[];
  return [];
}

/* ════════════════════════════════════════════════════════════════
   GAME ACTIONS
════════════════════════════════════════════════════════════════ */
function initGame(){
  if(state.mode==='numbers') state.pool=buildNumberPool();
  else state.pool=buildWordsPool(state.customPrizes.length?state.customPrizes:getDefaultPrizes());
  state.remaining=shuffle([...state.pool]);
  state.called=[]; state.card=generateCard(state.pool); state.marked=new Set([12]); state.gameActive=true;
  state.players.forEach(p=>{ p.card=generateCard(state.pool); p.marked=new Set([12]); p.hasBingo=false; });
  renderNumberGrid(); renderBingoCard(state.card,DOM.bingoCard,state.marked);
  updateNumberGrid(); updateLastBall(null);
  updateStatus('ready','Ready to play');
  DOM.btnDraw.disabled=false; DOM.drawLabel.textContent='Draw Ball';
  DOM.btnPause.disabled=true; DOM.btnPause.textContent='⏸ Pause';
  state.paused=false;
  renderPlayerList();
}

function drawBall(){
  if(!state.gameActive||state.paused) return;
  if(state.remaining.length===0){
    stopAutoCall(); updateStatus('done','All numbers called!');
    DOM.btnDraw.disabled=true; DOM.drawLabel.textContent='All Done!'; return;
  }
  const item=state.remaining.pop();
  state.called.push(item);
  playDraw(); updateLastBall(item); updateNumberGrid();
  updateStatus('active',`Called: ${item.col}${state.mode==='numbers'?item.num:' – '+item.label}`);

  // Sync to Firebase room
  if(state.isRoomMode && state.roomId) fbPushCalled(item);

  if(DOM.chkAutoMark.checked){
    autoMarkCard(state.card,state.marked,item); refreshMainCard();
    const win=checkWin(state.card,state.marked,state.pattern);
    if(win.length){ triggerWin('🎊 BINGO!',state.currentTheme,win,DOM.bingoCard); return; }
  }
  state.players.forEach(p=>{
    if(!p.hasBingo){ autoMarkCard(p.card,p.marked,item);
      if(checkWin(p.card,p.marked,state.pattern).length){ p.hasBingo=true; renderPlayerList(); }
    }
  });
}

function autoMarkCard(card,markedSet,item){
  card.forEach((cell,idx)=>{
    if(cell.label==='FREE') return;
    if(state.mode==='numbers'&&cell.num===item.num) markedSet.add(idx);
    if(state.mode==='words'&&cell.label===item.label) markedSet.add(idx);
  });
}
function onCellClick(idx){
  if(!state.gameActive) return;
  if(state.card[idx].label==='FREE') return;
  if(state.marked.has(idx)) state.marked.delete(idx); else { state.marked.add(idx); playMark(); }
  refreshMainCard();
  const win=checkWin(state.card,state.marked,state.pattern);
  if(win.length) triggerWin('🎊 BINGO!',state.currentTheme,win,DOM.bingoCard);
}

function triggerWin(title,theme,winIdx,cardEl){
  stopAutoCall(); state.gameActive=false;
  if(cardEl) applyWinHighlight(cardEl,winIdx);
  updateStatus('done','🎊 BINGO!');
  DOM.btnDraw.disabled=true; DOM.btnPause.disabled=true;
  playBingo(); launchConfetti(theme);
  DOM.modalEmoji.textContent=(theme&&theme.emoji)||'🎊';
  DOM.modalWinner.textContent=title==='🎊 BINGO!'?'BINGO!':title;
  const last=state.called[state.called.length-1];
  DOM.modalPrize.textContent=last?`Last called: ${last.col}${state.mode==='numbers'?last.num:' – '+last.label}`:'';
  DOM.bingoModal.classList.remove('hidden');
}

/* ════════════════════════════════════════════════════════════════
   AUTO-CALLER  (pause / resume)
════════════════════════════════════════════════════════════════ */
function startAutoCall(){
  stopAutoCall();
  state.autoCall=true; state.paused=false;
  DOM.btnPause.disabled=false; DOM.btnPause.textContent='⏸ Pause';
  const delay=SPEED_MAP[state.speed]||2500;
  state.autoTimer=setInterval(()=>{
    if(!state.gameActive||state.remaining.length===0){ stopAutoCall(); return; }
    if(!state.paused) drawBall();
  },delay);
  updateStatus('active','Auto-calling…');
}
function pauseAutoCall(){
  state.paused=true;
  DOM.btnPause.textContent='▶ Resume';
  updateStatus('paused','Paused');
}
function resumeAutoCall(){
  state.paused=false;
  DOM.btnPause.textContent='⏸ Pause';
  updateStatus('active','Auto-calling…');
}
function stopAutoCall(){
  if(state.autoTimer){ clearInterval(state.autoTimer); state.autoTimer=null; }
  state.autoCall=false; state.paused=false;
  DOM.chkAutoCall.checked=false; DOM.btnPause.disabled=true; DOM.btnPause.textContent='⏸ Pause';
}

function resetGame(){
  stopAutoCall(); state.gameActive=false;
  DOM.bingoModal.classList.add('hidden');
  initGame();
}

function getDefaultPrizes(){
  const t=state.currentTheme;
  return(t&&t.prizes)?t.prizes.slice():['🧧 Red Packet $10','🧧 Red Packet $20','🧧 Red Packet $50','🍊 Mandarin Hamper','🥮 Mooncake Box','🍵 Tea Set','💰 Ang Bao $100','🏮 Lantern Gift Set','💝 Dinner Voucher','🎊 Grand Prize $500'];
}

/* ════════════════════════════════════════════════════════════════
   PLAYER MANAGEMENT (local host view)
════════════════════════════════════════════════════════════════ */
let viewingPlayerId=null;
const AVATAR_COLORS_ARR=AVATAR_COLORS;

function addPlayer(name){
  state.players.push({ id:Date.now()+Math.random(), name:name.trim(),
    card:generateCard(state.pool), marked:new Set([12]), hasBingo:false,
    color:AVATAR_COLORS_ARR[state.players.length%AVATAR_COLORS_ARR.length] });
  renderPlayerList();
}
function removePlayer(id){ state.players=state.players.filter(p=>p.id!==id); renderPlayerList(); }

function renderPlayerList(){
  DOM.playerList.innerHTML='';
  DOM.playerCount.textContent=state.players.length;
  DOM.emptyPlayers.style.display=state.players.length?'none':'flex';
  state.players.forEach(p=>{
    const li=document.createElement('li');
    li.className='player-item'+(p.hasBingo?' has-bingo':'');
    li.innerHTML=`<div class="player-avatar" style="background:${p.color}">${escHtml(p.name[0].toUpperCase())}</div>
      <span class="player-name">${escHtml(p.name)}</span>
      <span class="player-bingo-badge">BINGO!</span>
      <button class="player-remove" data-id="${p.id}" title="Remove">✕</button>`;
    li.addEventListener('click',e=>{ if(e.target.closest('.player-remove')) return; openPlayerCard(p.id); });
    li.querySelector('.player-remove').addEventListener('click',e=>{ e.stopPropagation(); removePlayer(p.id); });
    DOM.playerList.appendChild(li);
  });
}
function openPlayerCard(id){
  const p=state.players.find(x=>x.id===id); if(!p) return;
  viewingPlayerId=id; DOM.playerModalName.textContent=p.name+"'s Card";
  renderBingoCard(p.card,DOM.playerCardGrid,p.marked,true);
  const win=checkWin(p.card,p.marked,state.pattern);
  if(win.length) applyWinHighlight(DOM.playerCardGrid,win);
  DOM.playerCardModal.classList.remove('hidden');
}

/* ════════════════════════════════════════════════════════════════
   FIREBASE ROOM  (wrapped — only runs if FIREBASE_ENABLED)
════════════════════════════════════════════════════════════════ */
let db=null;

async function initFirebase(){
  if(!window.FIREBASE_ENABLED) return false;
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { getDatabase, ref, set, push, onValue, update, remove } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
    const app = initializeApp(window.FIREBASE_CONFIG);
    db = getDatabase(app);
    window._fbRef    = ref;
    window._fbSet    = set;
    window._fbPush   = push;
    window._fbOnValue= onValue;
    window._fbUpdate = update;
    window._fbRemove = remove;
    return true;
  } catch(e){ console.warn('Firebase init failed:', e); return false; }
}

async function createRoom(){
  if(!db) return null;
  const roomId = genId(6);
  state.roomId = roomId;
  const meta = {
    hostId: genId(12),
    mode: state.mode,
    pattern: state.pattern,
    prizes: state.customPrizes,
    pool: state.pool,
    active: false,
    createdAt: Date.now(),
  };
  await window._fbSet(window._fbRef(db, `rooms/${roomId}/meta`), meta);
  await window._fbSet(window._fbRef(db, `rooms/${roomId}/called`), []);
  // Listen to players
  window._fbOnValue(window._fbRef(db, `rooms/${roomId}/players`), snap=>{
    const data = snap.val() || {};
    updateRoomPlayerList(data);
  });
  return roomId;
}

function fbPushCalled(item){
  if(!db||!state.roomId) return;
  const calledRef = window._fbRef(db, `rooms/${state.roomId}/called`);
  window._fbPush(calledRef, item);
}

async function fbStartGame(){
  if(!db||!state.roomId) return;
  await window._fbUpdate(window._fbRef(db,`rooms/${state.roomId}/meta`),{active:true,calledPool: state.pool});
}

async function fbResetRoom(){
  if(!db||!state.roomId) return;
  await window._fbSet(window._fbRef(db,`rooms/${state.roomId}/called`),[]);
  await window._fbUpdate(window._fbRef(db,`rooms/${state.roomId}/meta`),{active:false});
  // Reset all player marked arrays
  const snap = await new Promise(res=>window._fbOnValue(window._fbRef(db,`rooms/${state.roomId}/players`),s=>{res(s);},{onlyOnce:true}));
  const players = snap.val()||{};
  for(const pid of Object.keys(players)){
    await window._fbUpdate(window._fbRef(db,`rooms/${state.roomId}/players/${pid}`),{marked:[12],hasBingo:false});
  }
}

/* ════════════════════════════════════════════════════════════════
   ROOM PLAYER MAP  (persistent state to avoid DOM-scraping bugs)
════════════════════════════════════════════════════════════════ */
const roomPlayers = {};  // { playerId: { id, name, locked, hasBingo } }

function updateRoomPlayerList(playersData){
  if(!DOM.roomPlayerList) return;
  // Merge incoming data into persistent map
  Object.assign(roomPlayers, playersData);
  const entries = Object.entries(roomPlayers);
  const count = entries.length;
  if(DOM.roomPlayerCount) DOM.roomPlayerCount.textContent = count;
  if(DOM.hostPlayerCount) DOM.hostPlayerCount.textContent = count === 1 ? '1 player' : `${count} players`;

  DOM.roomPlayerList.innerHTML = '';
  if(count === 0){
    DOM.roomPlayerList.innerHTML = '<li class="room-empty-hint">No players yet. Share the link above.</li>';
  } else {
    entries.forEach(([pid, p])=>{
      const li = document.createElement('li');
      li.className = 'room-player-item';
      li.innerHTML = `
        <span class="room-player-icon">${p.locked ? '🔒' : '⏳'}</span>
        <span class="room-player-name">${escHtml(p.name||'Player')}</span>
        <span class="room-player-status ${p.hasBingo?'has-bingo':''}">${
          p.hasBingo ? '🎊 BINGO!' : p.locked ? 'Ready' : 'Setting up…'
        }</span>
        <button class="kick-btn" data-pid="${escHtml(pid)}" title="Kick player">✕</button>`;
      li.querySelector('.kick-btn').addEventListener('click', ()=>kickPlayer(pid, p.name));
      DOM.roomPlayerList.appendChild(li);
    });
  }
  const anyLocked = entries.some(([,p])=>p.locked);
  if(DOM.btnStartGame) DOM.btnStartGame.disabled = !anyLocked;
}

function kickPlayer(pid, name){
  delete roomPlayers[pid];
  // Notify the player's page
  broadcastMsg({ type:'PLAYER_KICK', targetId: pid });
  // Re-render with updated map
  updateRoomPlayerList({});
}

/* ════════════════════════════════════════════════════════════════
   ROOM UI ACTIONS
════════════════════════════════════════════════════════════════ */
function getPlayerUrl(roomId){
  const base = window.location.href.split('/').slice(0,-1).join('/');
  // Use 'play' (no .html) — static servers redirect play.html → play and drop query params
  return `${base}/play?room=${roomId}`;
}

async function onCreateRoom(){
  if(!window.FIREBASE_ENABLED){
    // Demo mode: BroadcastChannel
    const fakeId = genId(6);
    state.roomId = fakeId; state.isRoomMode = true;
    showRoomInHeader(fakeId);
    setupBroadcastChannel(fakeId);
    return;
  }
  DOM.btnCreateRoom.textContent = '⏳ Creating…'; DOM.btnCreateRoom.disabled=true;
  const ok = await initFirebase();
  if(!ok){
    alert('Firebase not configured yet. See firebase-config.js for setup instructions.');
    DOM.btnCreateRoom.textContent='🚪 Create Room'; DOM.btnCreateRoom.disabled=false;
    return;
  }
  const roomId = await createRoom();
  if(!roomId){ DOM.btnCreateRoom.textContent='🚪 Create Room'; DOM.btnCreateRoom.disabled=false; return; }
  state.isRoomMode = true;
  showRoomInHeader(roomId);
}

function openRoomModal(){
  if(DOM.roomModal) DOM.roomModal.classList.remove('hidden');
}
function closeRoomModal(){
  if(DOM.roomModal) DOM.roomModal.classList.add('hidden');
}

function showRoomInHeader(roomId){
  // Swap Create Room button → host badge
  if(DOM.btnCreateRoom) DOM.btnCreateRoom.classList.add('hidden');
  if(DOM.btnRoomBadge)  DOM.btnRoomBadge.classList.remove('hidden');
  if(DOM.hostRoomId)    DOM.hostRoomId.textContent = roomId;
  // Fill modal fields
  if(DOM.roomIdDisplay) DOM.roomIdDisplay.textContent = roomId;
  const link = getPlayerUrl(roomId);
  if(DOM.roomLink) DOM.roomLink.textContent = link;
  if(DOM.btnStartGame) { DOM.btnStartGame.disabled=true; DOM.btnStartGame.onclick=onStartGame; }
  // Open the modal immediately so user sees it
  openRoomModal();
}

async function onStartGame(){
  initGame();
  if(window.FIREBASE_ENABLED && db) await fbStartGame();
  if(state.isRoomMode && !window.FIREBASE_ENABLED) broadcastMsg({type:'GAME_START', pool:state.pool, mode:state.mode});
  DOM.btnStartGame.textContent='🔄 Restart Game';
}

/* ════════════════════════════════════════════════════════════════
   Networking (Socket.IO Relay)
════════════════════════════════════════════════════════════════ */
const SOCKET_URL = 'https://bingo-backend-relay.azurewebsites.net';
function createSocketChannel(roomId) {
  if(!window.io) return new BroadcastChannel(`bingo-room-${roomId}`);
  const socket = io(SOCKET_URL);
  socket.emit('join-room', roomId);
  const ch = {
    postMessage: (data) => socket.emit('relay', roomId, data),
    close: () => socket.disconnect()
  };
  socket.on('relay', (data) => {
    if (ch.onmessage) ch.onmessage({ data });
  });
  return ch;
}

let broadcastCh = null;
function setupBroadcastChannel(roomId){
  broadcastCh = createSocketChannel(roomId);
  broadcastCh.onmessage = e => {
    const { type, player } = e.data;
    if(type === 'PLAYER_JOIN'){
      // Check for duplicate name (different player ID = different person)
      const nameTaken = Object.values(roomPlayers).some(p => p.name === player.name && p.id !== player.id);
      if(nameTaken){
        broadcastMsg({ type:'JOIN_REJECTED', targetId:player.id, reason:`"${player.name}" is already taken. Please choose a different name.` });
        return;
      }
      broadcastMsg({ type:'JOIN_ACCEPTED', targetId:player.id });
      roomPlayers[player.id] = { id:player.id, name:player.name, locked:false, hasBingo:false };
      updateRoomPlayerList({});
    }
    if(type === 'PLAYER_REJOIN'){
      // Session restore — same player reconnecting. Merge into existing entry or add.
      if(roomPlayers[player.id]){
        roomPlayers[player.id] = { ...roomPlayers[player.id], ...player };
      } else {
        roomPlayers[player.id] = { id:player.id, name:player.name, locked:false, hasBingo:false };
      }
      updateRoomPlayerList({});
    }
    if(type === 'PLAYER_LOCK'){
      if(roomPlayers[player.id]){
        roomPlayers[player.id].locked = true;
        if(player.card) roomPlayers[player.id].card = player.card; // store card
      } else {
        roomPlayers[player.id] = { ...player, locked:true };
      }
      updateRoomPlayerList({});
    }
    if(type === 'REQUEST_STATE'){
      const pid = e.data.playerId;
      const p = roomPlayers[pid];
      if(p){
        broadcastMsg({
          type:'PLAYER_STATE', targetId:pid,
          playerData: p,                          // includes card if locked
          called: state.called,
          gameActive: state.gameActive,
          mode: state.mode,
          pattern: state.pattern,
          pool: state.pool
        });
      }
    }
    if(type === 'PLAYER_BINGO'){
      if(roomPlayers[player.id]) roomPlayers[player.id].hasBingo = true;
      updateRoomPlayerList({});
      triggerWin(`${player.name} – BINGO!`, state.currentTheme, [], null);
      DOM.modalWinner.textContent=`${player.name} wins! 🎊`;
    }
  };
}
function broadcastMsg(msg){
  if(broadcastCh) broadcastCh.postMessage(msg);
}

// Called each time a ball is drawn when in broadcast room mode
const _origDrawBall = drawBall;
function drawBallWithBroadcast(){
  _origDrawBall();
  if(state.isRoomMode && !window.FIREBASE_ENABLED && state.called.length>0){
    broadcastMsg({type:'BALL_DRAWN', item:state.called[state.called.length-1]});
  }
}

/* ════════════════════════════════════════════════════════════════
   EVENT LISTENERS
════════════════════════════════════════════════════════════════ */
function bindEvents(){
  DOM.btnDraw.addEventListener('click',()=>{ if(!state.gameActive) initGame(); drawBallWithBroadcast(); });
  DOM.chkAutoCall.addEventListener('change',()=>{
    if(!state.gameActive) initGame();
    if(DOM.chkAutoCall.checked) startAutoCall(); else stopAutoCall();
  });
  DOM.btnPause.addEventListener('click',()=>{
    if(state.paused) resumeAutoCall(); else pauseAutoCall();
  });
  DOM.speedSlider.addEventListener('input',()=>{
    state.speed=parseInt(DOM.speedSlider.value);
    DOM.speedVal.textContent=SPEED_LABELS[state.speed];
    if(state.autoCall&&!state.paused){ stopAutoCall(); DOM.chkAutoCall.checked=true; startAutoCall(); }
  });
  DOM.btnNewCard.addEventListener('click',()=>{ state.card=generateCard(state.pool); state.marked=new Set([12]); refreshMainCard(); });
  document.querySelectorAll('input[name="pattern"]').forEach(r=>{
    r.addEventListener('change',()=>{ state.pattern=r.value; document.querySelectorAll('.pattern-opt').forEach(e=>e.classList.remove('active')); r.closest('.pattern-opt').classList.add('active'); });
  });
  DOM.btnReset.addEventListener('click',()=>{ resetGame(); if(state.isRoomMode&&!window.FIREBASE_ENABLED) broadcastMsg({type:'GAME_RESET'}); });
  DOM.chkSound.addEventListener('change',()=>{ state.soundEnabled=DOM.chkSound.checked; });
  DOM.btnContinue.addEventListener('click',()=>{ DOM.bingoModal.classList.add('hidden'); state.gameActive=true; DOM.btnDraw.disabled=false; updateStatus('active','Game continued…'); });
  DOM.btnCloseModal.addEventListener('click',()=>{ DOM.bingoModal.classList.add('hidden'); state.gameActive=true; DOM.btnDraw.disabled=false; updateStatus('active','Game continued…'); });
  DOM.bingoModal.addEventListener('click',e=>{ if(e.target===DOM.bingoModal) DOM.btnCloseModal.click(); });

  // Mode tabs
  document.querySelectorAll('.mode-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      document.querySelectorAll('.mode-tab').forEach(t=>t.classList.remove('active')); tab.classList.add('active');
      state.mode=tab.dataset.mode;
      DOM.customPanel.classList.toggle('hidden',state.mode!=='words');
      DOM.numberGrid.style.display=state.mode==='words'?'none':'';
      document.querySelector('.bingo-col-headers').style.display=state.mode==='words'?'none':'';
      DOM.lastBall.parentElement.style.display=state.mode==='words'?'none':'';
      resetGame();
    });
  });
  DOM.btnLoadPrizes.addEventListener('click',()=>{
    const lines=DOM.prizesTextarea.value.split('\n').map(l=>l.trim()).filter(Boolean);
    if(!lines.length) return; state.customPrizes=lines; DOM.prizesHint.textContent=`${lines.length} prizes loaded ✓`; resetGame();
  });
  DOM.btnDefPrizes.addEventListener('click',()=>{
    const d=getDefaultPrizes(); DOM.prizesTextarea.value=d.join('\n'); state.customPrizes=d; DOM.prizesHint.textContent=`${d.length} prizes loaded ✓`; resetGame();
  });
  DOM.btnAddPlayer.addEventListener('click',()=>{ const n=DOM.inputPlayer.value.trim(); if(!n) return; addPlayer(n); DOM.inputPlayer.value=''; DOM.inputPlayer.focus(); });
  DOM.inputPlayer.addEventListener('keydown',e=>{ if(e.key==='Enter') DOM.btnAddPlayer.click(); });
  DOM.btnClosePlayerModal.addEventListener('click',()=>{ DOM.playerCardModal.classList.add('hidden'); viewingPlayerId=null; });
  DOM.playerCardModal.addEventListener('click',e=>{ if(e.target===DOM.playerCardModal){DOM.playerCardModal.classList.add('hidden');viewingPlayerId=null;} });
  DOM.btnCallBingo.addEventListener('click',()=>{
    const p=state.players.find(x=>x.id===viewingPlayerId); if(!p) return;
    const win=checkWin(p.card,p.marked,state.pattern);
    if(!win.length){ DOM.playerModalName.textContent=p.name+' – No bingo yet! 😅'; return; }
    p.hasBingo=true; DOM.playerCardModal.classList.add('hidden');
    triggerWin(`${p.name} wins!`,state.currentTheme,win,null);
    DOM.modalWinner.textContent=`${p.name} wins! 🎊`; renderPlayerList();
  });
  DOM.btnShare.addEventListener('click',()=>{ navigator.clipboard.writeText(window.location.href).then(()=>{ DOM.shareToast.classList.add('show'); setTimeout(()=>DOM.shareToast.classList.remove('show'),2200); }).catch(()=>{}); });

  // Room events
  if(DOM.btnCreateRoom)   DOM.btnCreateRoom.addEventListener('click', onCreateRoom);
  if(DOM.btnRoomBadge)    DOM.btnRoomBadge.addEventListener('click', openRoomModal);
  if(DOM.btnCloseRoomModal) DOM.btnCloseRoomModal.addEventListener('click', closeRoomModal);
  if(DOM.roomModal)       DOM.roomModal.addEventListener('click', e=>{ if(e.target===DOM.roomModal) closeRoomModal(); });
  if(DOM.btnCopyLink) {
    DOM.btnCopyLink.addEventListener('click',()=>{
      const link = DOM.roomLink.textContent;
      navigator.clipboard.writeText(link).then(()=>{
        DOM.copyLinkToast.classList.add('show');
        setTimeout(()=>DOM.copyLinkToast.classList.remove('show'), 2000);
      }).catch(()=>{});
    });
  }

  document.addEventListener('themechange', e=>{ state.currentTheme=e.detail; });
  document.querySelectorAll('input[name="pattern"]').forEach(r=>r.addEventListener('change',()=>{ state.pattern=r.value; }));
}

/* ════════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',()=>{
  populateThemePicker();
  state.currentTheme=getThemeById('cny');
  DOM.speedVal.textContent=SPEED_LABELS[state.speed];
  DOM.btnPause.disabled=true;
  bindEvents();
  initGame();
});
