/* 収支管理PWA内蔵：小役・ボーナス・示唆カウンター */
const COUNTER_KEY='gambling-counter-v1';
const COUNTER_PRESET_KEY='gambling-counter-presets-v1';

const COUNTER_INITIAL_PRESETS={
  'スマスロ モンキーターンV':['弱チェリー','強チェリー','ボート','弱チャンス目','強チャンス目','究極目'],
  'Lパチスロ からくりサーカス2':['弱チェリー','強チェリー','スイカ','チャンスベル','チャンス目'],
  'L 東京喰種':['弱チェリー','強チェリー','スイカ','チャンス目A','チャンス目B','確定チェリー','喰図柄揃い'],
  'スマスロ 北斗の拳 転生の章2':['弱チェリーA','弱チェリーB','弱チェリー合算','強チェリーA','強チェリーB','強チェリー合算','確定チェリー','スイカ','チャンス目','勝舞揃い'],
  'マイジャグラーV':['BIG','REG','合算','ブドウ','チェリー','単独REG','チェリーREG'],
  'アイムジャグラーEX':['BIG','REG','合算','ブドウ','チェリー','単独REG','チェリーREG'],
  'ゴーゴージャグラー3':['BIG','REG','合算','ブドウ','チェリー'],
  'ハナハナホウオウ～天翔～':['BIG','REG','合算','ベル','スイカ'],
  'ドラゴンハナハナ～閃光～':['BIG','REG','合算','ベル','スイカ'],
  '示唆系・汎用':['設定2以上示唆','設定4以上示唆','設定6以上示唆','高設定示唆','終了画面A','終了画面B','特殊ボイス','その他示唆']
};

let counterState=JSON.parse(localStorage.getItem(COUNTER_KEY)||'null')||{machine:'',games:0,counters:[]};
function counterId(){return 'c-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function normalizeCounterState(){
  counterState.games=Math.max(0,Number(counterState.games)||0);
  counterState.counters=(Array.isArray(counterState.counters)?counterState.counters:[]).map(c=>({id:c.id||counterId(),name:String(c.name||'項目'),count:Math.max(0,Number(c.count)||0),type:c.type==='derived'?'derived':'manual',sources:Array.isArray(c.sources)?c.sources:[]}));
  const oldIndexIds=counterState.counters.map(c=>c.id);
  counterState.counters.forEach(c=>{if(c.type==='derived'){c.sources=c.sources.map(s=>{if(typeof s==='number')return oldIndexIds[s]||null;return s}).filter(Boolean)}});
}
normalizeCounterState();
function counterSave(){localStorage.setItem(COUNTER_KEY,JSON.stringify(counterState))}
function counterEsc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function counterFind(id){return counterState.counters.find(c=>c.id===id)}
function counterCount(c,seen=new Set()){
  if(!c||seen.has(c.id))return 0;
  if(c.type!=='derived')return Number(c.count)||0;
  const next=new Set(seen);next.add(c.id);
  return (c.sources||[]).reduce((sum,id)=>sum+counterCount(counterFind(id),next),0);
}
function counterRate(c){const n=counterCount(c);return n>0&&counterState.games>0?'1 / '+(counterState.games/n).toFixed(1):'—'}
function counterSourceChoices(excludeId){return counterState.counters.filter(c=>c.id!==excludeId).map((c,i)=>({c,i}))}

function counterRender(){
  const machine=document.getElementById('counterMachine');
  const games=document.getElementById('counterGames');
  const box=document.getElementById('counterRows');
  if(!machine||!games||!box)return;
  counterState.machine=machine.value;
  counterState.games=Math.max(0,Number(games.value)||0);
  box.innerHTML='';
  counterState.counters.forEach(c=>{
    const wrap=document.createElement('div');wrap.className='counter-wrap';wrap.dataset.id=c.id;
    const count=counterCount(c),rate=counterRate(c),derived=c.type==='derived';
    wrap.innerHTML=`<div class="counter-swipe-actions"><button type="button" class="counter-delete-btn">削除</button></div>
      <div class="counter-row ${derived?'counter-derived':''}">
        <button type="button" class="counter-drag-handle" aria-label="並べ替え" title="ドラッグして順番変更">☷</button>
        <div class="counter-main-info" tabindex="0"><div class="counter-name">${counterEsc(c.name)}</div><div class="counter-rate">出現率 ${rate}</div></div>
        <div class="counter-count">${count}</div>
        <div class="counter-actions">${derived?'<button type="button" class="counter-minus counter-disabled" disabled>−</button><button type="button" class="counter-plus counter-disabled" disabled>＋</button>':'<button type="button" class="counter-minus">−</button><button type="button" class="counter-plus">＋</button>'}</div>
      </div>`;
    box.appendChild(wrap);
    const info=wrap.querySelector('.counter-main-info');
    info.onclick=()=>derived?counterEditAggregate(c.id):counterStartNameEdit(c.id);
    info.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();info.click()}};
    wrap.querySelector('.counter-delete-btn').onclick=()=>counterDelete(c.id);
    if(!derived){wrap.querySelector('.counter-minus').onclick=()=>counterChange(c.id,-1);wrap.querySelector('.counter-plus').onclick=()=>counterChange(c.id,1)}
    counterSetupSwipe(wrap);counterSetupReorder(wrap);
  });
  counterSave();
}

function counterStartNameEdit(id){
  const wrap=document.querySelector(`.counter-wrap[data-id="${CSS.escape(id)}"]`);if(!wrap)return;
  const info=wrap.querySelector('.counter-main-info');if(info.dataset.editing)return;
  const c=counterFind(id),old=c.name;info.dataset.editing='1';
  info.innerHTML=`<input class="counter-inline-name" value="${counterEsc(old)}" aria-label="項目名">`;
  const input=info.querySelector('input');input.focus();input.select();
  const finish=save=>{if(!info.dataset.editing)return;delete info.dataset.editing;const v=save?input.value.trim():old;if(v)c.name=v;counterRender()};
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();finish(true)}if(e.key==='Escape'){e.preventDefault();finish(false)}});
  input.addEventListener('blur',()=>finish(true));
}
function counterSetupSwipe(wrap){
  const row=wrap.querySelector('.counter-row');let sx=0,sy=0,moving=false;
  row.addEventListener('touchstart',e=>{if(e.target.closest('.counter-drag-handle')||e.target.closest('button')||e.target.closest('input'))return;const t=e.touches[0];if(!t)return;sx=t.clientX;sy=t.clientY;moving=true},{passive:true});
  row.addEventListener('touchmove',e=>{if(!moving)return;const t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dy)>Math.abs(dx)+8){moving=false;return}if(dx<-20)row.style.transform=`translateX(${Math.max(dx,-68)}px)`;else if(dx>20)row.style.transform=`translateX(${Math.min(0,-68+dx)}px)`},{passive:true});
  row.addEventListener('touchend',()=>{if(!moving)return;const m=row.style.transform.match(/-?[\d.]+/);const x=m?Number(m[0]):0;row.style.transform=x<-35?'translateX(-68px)':'translateX(0)';moving=false});
}
function counterSetupReorder(wrap){
  const handle=wrap.querySelector('.counter-drag-handle');let active=false,raf=0;
  handle.addEventListener('pointerdown',e=>{e.preventDefault();active=true;wrap.classList.add('counter-dragging');handle.setPointerCapture?.(e.pointerId);
    const move=ev=>{if(!active)return;
      const box=wrap.parentElement,rows=[...box.querySelectorAll('.counter-wrap')].filter(x=>x!==wrap);
      let target=null;
      for(const r of rows){const b=r.getBoundingClientRect();if(ev.clientY<b.top+b.height/2){target=r;break}}
      if(target)box.insertBefore(wrap,target);else box.appendChild(wrap);
      // 画面端まで掴んでいったら自動スクロール
      const edge=72, speed=14;
      if(raf)cancelAnimationFrame(raf);
      const scroll=()=>{
        if(!active)return;
        if(ev.clientY<edge)window.scrollBy(0,-speed);
        else if(ev.clientY>window.innerHeight-edge)window.scrollBy(0,speed);
        raf=requestAnimationFrame(scroll);
      };
      raf=requestAnimationFrame(scroll);
    };
    const up=()=>{if(!active)return;active=false;if(raf)cancelAnimationFrame(raf);wrap.classList.remove('counter-dragging');const ids=[...document.querySelectorAll('#counterRows .counter-wrap')].map(x=>x.dataset.id);counterState.counters=ids.map(id=>counterFind(id)).filter(Boolean);counterRender();document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up)};
    document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});
  });
}

function counterChange(id,n){const c=counterFind(id);if(!c||c.type==='derived')return;c.count=Math.max(0,(Number(c.count)||0)+n);counterRender()}
function counterChangeGames(n){counterState.games=Math.max(0,counterState.games+n);const el=document.getElementById('counterGames');if(el)el.value=counterState.games;counterRender()}
function counterAdd(){const el=document.getElementById('counterNewName'),name=el?.value.trim();if(!name)return;counterState.counters.push({id:counterId(),name,count:0,type:'manual',sources:[]});el.value='';counterRender()}
function counterAddAggregate(){
  if(!counterState.counters.length){alert('先に合算元の項目を追加してください');return}
  const name=prompt('合算名を入力してください','合算');if(!name?.trim())return;
  const choices=counterSourceChoices('').map(({c},i)=>`${i+1}. ${c.name}`).join('\n');
  const raw=prompt('合算する項目の番号をカンマ区切りで入力してください。\n\n'+choices+'\n\n例：1,2');if(raw===null)return;
  const list=counterSourceChoices('').map(x=>x.c);const nums=[...new Set(raw.split(/[,、\s]+/).map(v=>Number(v)-1).filter(i=>Number.isInteger(i)&&i>=0&&i<list.length))];
  if(!nums.length){alert('合算元を1つ以上選択してください');return}
  counterState.counters.push({id:counterId(),name:name.trim(),count:0,type:'derived',sources:nums.map(i=>list[i].id)});counterRender();
}
function counterEditAggregate(id){
  const c=counterFind(id);if(!c||c.type!=='derived')return;
  const name=prompt('合算名',c.name);if(name===null)return;
  const list=counterSourceChoices(id).map(x=>x.c);const choices=list.map((x,i)=>`${i+1}. ${x.name}`).join('\n');
  const current=(c.sources||[]).map(s=>{const i=list.findIndex(x=>x.id===s);return i>=0?i+1:null}).filter(Boolean).join(',');
  const raw=prompt('合算する項目の番号をカンマ区切りで入力してください。\n\n'+choices,current);if(raw===null)return;
  const nums=[...new Set(raw.split(/[,、\s]+/).map(v=>Number(v)-1).filter(i=>Number.isInteger(i)&&i>=0&&i<list.length))];
  if(!nums.length){alert('合算元を1つ以上選択してください');return}
  c.name=name.trim()||c.name;c.sources=nums.map(i=>list[i].id);counterRender();
}
function counterDelete(id){const c=counterFind(id);if(!c)return;if(!confirm(`「${c.name}」を削除しますか？`))return;counterState.counters=counterState.counters.filter(x=>x.id!==id);counterState.counters.forEach(x=>{if(x.type==='derived')x.sources=(x.sources||[]).filter(s=>s!==id)});counterRender()}
function counterReset(){if(!confirm('カウンターをすべてリセットしますか？'))return;counterState.games=0;counterState.counters.forEach(c=>{if(c.type!=='derived')c.count=0});counterRender()}

function counterPresets(){
  const saved=JSON.parse(localStorage.getItem(COUNTER_PRESET_KEY)||'null');
  if(saved)return saved;
  const initial={};Object.entries(COUNTER_INITIAL_PRESETS).forEach(([k,names])=>initial[k]=names.map(name=>({id:counterId(),name,count:0,type:'manual',sources:[]})));
  localStorage.setItem(COUNTER_PRESET_KEY,JSON.stringify(initial));return initial;
}
function counterRefreshPresets(){const el=document.getElementById('counterPreset');if(!el)return;const p=counterPresets();el.innerHTML='<option value="">選択してください</option>';Object.keys(p).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k;el.appendChild(o)})}
function counterSavePreset(){const machine=document.getElementById('counterMachine')?.value.trim();if(!machine){alert('機種名を入力してください');return}const p=counterPresets();p[machine]=counterState.counters.map(c=>({id:counterId(),name:c.name,count:0,type:c.type,sources:[]}));const idByName=new Map(p[machine].map(x=>[x.name,x.id]));counterState.counters.forEach((c,i)=>{if(c.type==='derived')p[machine][i].sources=(c.sources||[]).map(id=>counterFind(id)?.name).map(name=>idByName.get(name)).filter(Boolean)});localStorage.setItem(COUNTER_PRESET_KEY,JSON.stringify(p));counterRefreshPresets();document.getElementById('counterPreset').value=machine;alert('カウンター設定を保存しました')}
function counterDeletePreset(){const el=document.getElementById('counterPreset'),k=el?.value;if(!k)return;const p=counterPresets();if(!confirm(`「${k}」の設定を削除しますか？`))return;delete p[k];localStorage.setItem(COUNTER_PRESET_KEY,JSON.stringify(p));counterRefreshPresets()}
function counterLoadPreset(k){const p=counterPresets(),src=p[k];if(!src)return;const oldIds={};counterState.counters=src.map(c=>{const id=counterId();oldIds[c.id]=id;return {id,name:c.name,count:0,type:c.type==='derived'?'derived':'manual',sources:[]}});src.forEach((c,i)=>{if(c.type==='derived')counterState.counters[i].sources=(c.sources||[]).map(id=>oldIds[id]).filter(Boolean)});counterState.machine=k;const machine=document.getElementById('counterMachine');if(machine)machine.value=k;counterRender()}

function initCounterTool(){
  const root=document.getElementById('counterTool');if(!root)return;
  normalizeCounterState();
  const machine=document.getElementById('counterMachine'),games=document.getElementById('counterGames');
  machine.value=counterState.machine;games.value=counterState.games;
  counterRefreshPresets();counterRender();
  document.getElementById('counterPreset').onchange=e=>{if(e.target.value)counterLoadPreset(e.target.value)};
  machine.oninput=()=>{counterState.machine=machine.value;counterSave()};
  games.oninput=()=>{counterState.games=Math.max(0,Number(games.value)||0);counterRender()};
  document.getElementById('counterSavePreset').onclick=counterSavePreset;
  document.getElementById('counterDeletePreset').onclick=counterDeletePreset;
  document.getElementById('counterGameM100').onclick=()=>counterChangeGames(-100);
  document.getElementById('counterGameM1').onclick=()=>counterChangeGames(-1);
  document.getElementById('counterGameP1').onclick=()=>counterChangeGames(1);
  document.getElementById('counterGameP100').onclick=()=>counterChangeGames(100);
  document.getElementById('counterAdd').onclick=counterAdd;
  document.getElementById('counterAddAggregate').onclick=counterAddAggregate;
  document.getElementById('counterReset').onclick=counterReset;
  document.getElementById('counterNewName').onkeydown=e=>{if(e.key==='Enter')counterAdd()};
}
window.initCounterTool=initCounterTool;

document.addEventListener('DOMContentLoaded',()=>{
  const toggle=document.getElementById('counterToolToggle');
  const body=document.getElementById('counterToolBody');
  const root=document.getElementById('counterTool');
  if(toggle&&body&&root){
    toggle.onclick=()=>{
      const open=root.classList.toggle('open');
      toggle.setAttribute('aria-expanded',String(open));
      body.hidden=!open;
    };
  }
  initCounterTool();
});
