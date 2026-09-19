const KEY="gambling-log-v3";
let entries=JSON.parse(localStorage.getItem(KEY)||"[]");
function normalizeEntry(e){
  if(!e||typeof e!=="object")return e;
  const out={...e};
  if(!Object.prototype.hasOwnProperty.call(out,"investmentCash")&&!Object.prototype.hasOwnProperty.call(out,"investmentHold")){
    if(out.investType==="hold") { out.investmentCash=0; out.investmentHold=Number(out.invest)||0; }
    else { out.investmentCash=Number(out.invest)||0; out.investmentHold=0; }
  }
  if(!Object.prototype.hasOwnProperty.call(out,"returnCash")&&!Object.prototype.hasOwnProperty.call(out,"returnHold")){
    if(out.returnType==="hold") { out.returnCash=0; out.returnHold=Number(out.return)||0; }
    else { out.returnCash=Number(out.return)||0; out.returnHold=0; }
  }
  return out;
}
entries=Array.isArray(entries)?entries.map(normalizeEntry):[];
let viewDate=new Date();
let reportDate=new Date();
let editingId=null;
let selectedMachine="";

// 2026/09/11時点のP-WORLD機種情報をベースにした初期リスト。
// 既存データは機種名文字列のまま保持するため、過去データとの互換性があります。
const MACHINE_DATA={
  "パチスロ":[
    "スマスロ 快盗天使ツインエンジェル2","L魔法少女にあこがれて","L アカマター","スマスロ ゼーガペインETR","スマート沖スロ ハイハイシオサイRe","L転生王女と天才令嬢の魔法革命","スマスロ ラグナドール","Lパチスロ 彼女、お借りします","LBトリプルクラウンX-300","L聖闘士星矢 黄金十二宮","L ソードアート・オンライン オルタナティブ ガンゲイル・オンライン","スマスロ ストリートファイター6","Lパチスロ 喰霊-零-Re","L青春ブタ野郎はバニーガール先輩の夢を見ない","モグモグ風林火山 大海戦の巻","スマスロ 獣王","スマスロパリピ孔明","スロット ワールドダイスター","スマスロ とある魔術の禁書目録2","L ULTRAMAN 最終決戦","スマスロ タコスロ","ヤバチバ","スマスロ リコリス・リコイル","パチスロ見える子ちゃん","L邪神ちゃんドロップキック","Lすーぱぁびん娘","スマスロ とんでもスキルで異世界放浪メシ","ローティス","スマスロ やじきた道中記参る！","L南国育ち SPECIAL","Lパチスロ からくりサーカス2","スロット ソードアート・オンラインII","スマスロ ケロット5BT","LBスロットGALFY","L戦国乙女5 業火を穿つ宿焔の双刃","戦国コレクション6","Lパチスロ 機動戦士ガンダムユニコーン 覚醒DRIVE","スマート沖スロ ダークハイビ","Lタクトオーパス デスティニー","スマスロ BIRDIE WING -Golf Girls' Story-","LBトリプルクラウンセブン","スマスロスーパーリオエース2","真打 吉宗","スマスロ ビッグドリーム THE GOLDEN PUSHER","スマスロ バイオハザード RE:3","L虚構推理","スマスロヨルムンガンド","アニマルスロットドッチ","A-SLOT+ 異世界かるてっとBT","スマスロ ミリオンゴッド-神々の軌跡-","マイジャグラーV","ネオアイムジャグラーEX","L東京喰種","スマスロ 甲鉄城のカバネリ 海門決戦","ゴーゴージャグラー3","スマスロ 北斗の拳","スマスロ モンキーターンV","スマスロ ゴッドイーター リザレクション","Lパチスロ 炎炎ノ消防隊2","スマスロ モンスターハンターライズ","スマスロ 東京リベンジャーズ","スマスロ 攻殻機動隊","スマスロ バジリスク～甲賀忍法帖～絆2 天膳 BLACK EDITION","スマスロ 鬼武者3","スマスロ かぐや様は告らせたい","L ToLOVEるダークネス","スマスロ ゴールデンカムイ"
  ],
  "パチンコ":[
    "PA大海物語Withアグネス・ラム Premium Edition","PHはねもの ハネ釈迦","e アサルトリリィ","eタクトオーパス デスティニー","e 甲鉄城のカバネリ2 輪廻の果報119ver.","e魔女と野獣","eF炎炎ノ消防隊2 99ver.","e ソードアート・オンライン アリシゼーション 夜空","eF機動戦士ガンダムSEED クライマックス","PA愛の不時着 99スイート ver.","e 東京喰種","新世紀エヴァンゲリオン～未来への咆哮～","PA大海物語5 Withアグネス・ラム","P大海物語5","e 新世紀エヴァンゲリオン～はじまりの記憶～","e シン・ウルトラマン 79ver.","Pうしおととら～神のせSPEC～100ver.","e リコリス・リコイル","P Re:ゼロから始める異世界生活 鬼がかり2","e Re:ゼロから始める異世界生活 鬼がかり2","e ソードアート・オンライン","e 東京リベンジャーズ"
  ]
};

const MACHINE_DATA_KEY="gambling-machine-data-v3";
const MACHINE_CUSTOM_KEY="gambling-machine-custom-v1";
const MACHINE_UPDATED_KEY="gambling-machine-updated-at";
const MACHINE_VERSION_KEY="gambling-machine-data-version";
const MACHINE_REMOTE_URL="machine-data.json";
const MACHINE_UPDATE_SESSION_KEY="gambling-machine-update-session-v1";
const STORE_REMOTE_URL="store-data.json";
const STORE_RATES_REMOTE_URL="store-rates.json";
const STORE_DATA_KEY="gambling-store-data-v1";
const STORE_RATES_KEY="gambling-store-rates-v1";
const STORE_RATES_CUSTOM_KEY="gambling-store-rates-custom-v1";
const STORE_CUSTOM_KEY="gambling-store-custom-v1";
let STORE_DATA={stores:[]};
let STORE_RATES={version:1,stores:{}};
let STORE_RATES_CUSTOM={};

const APP_VERSION="8.45";

function loadMachineData(){
  try{
    const cached=JSON.parse(localStorage.getItem(MACHINE_DATA_KEY)||"null");
    if(cached&&Array.isArray(cached.パチスロ)&&Array.isArray(cached.パチンコ)){
      MACHINE_DATA.パチスロ=cached.パチスロ;
      MACHINE_DATA.パチンコ=cached.パチンコ;
    }
  }catch(e){}
  mergeCustomMachines();
}
function getCustomMachines(){try{const x=JSON.parse(localStorage.getItem(MACHINE_CUSTOM_KEY)||"{}" );return {パチスロ:Array.isArray(x.パチスロ)?x.パチスロ:[],パチンコ:Array.isArray(x.パチンコ)?x.パチンコ:[]};}catch(e){return {パチスロ:[],パチンコ:[]}}}
function mergeCustomMachines(){const c=getCustomMachines();for(const g of ["パチスロ","パチンコ"]){const set=new Set(MACHINE_DATA[g]||[]);for(const m of c[g])if(m&&!set.has(m)){MACHINE_DATA[g].push(m);set.add(m)}}}
function rememberCustomMachine(genre,name){if(!["パチスロ","パチンコ"].includes(genre)||!name)return;const c=getCustomMachines();if(!c[genre].includes(name))c[genre].push(name);localStorage.setItem(MACHINE_CUSTOM_KEY,JSON.stringify(c));mergeCustomMachines();updateCustomMachineCount()}
function updateCustomMachineCount(){const el=$("#customMachineCount");if(!el)return;const c=getCustomMachines();el.textContent=`ユーザー追加：${c.パチスロ.length+c.パチンコ.length}機種`;}
function setMachineStatus(text,cls="neutral"){const el=$("#machineSyncStatus"); if(el){el.textContent=text;el.className="smallText "+cls}}
function machineUpdatedText(){const v=localStorage.getItem(MACHINE_UPDATED_KEY);return v?new Date(v).toLocaleString("ja-JP")+"（v"+(localStorage.getItem(MACHINE_VERSION_KEY)||"?")+"）":"未更新"}
function updateMachineUpdatedUI(){const el=$("#machineUpdatedAt");if(el)el.textContent=machineUpdatedText()}
function validMachineData(data){return data&&Array.isArray(data.パチスロ)&&Array.isArray(data.パチンコ)}
async function updateMachineData(silent=false){
  if(!navigator.onLine){if(!silent)setMachineStatus("オフライン：保存済みデータを使用","neutral");return false}
  if(!silent)setMachineStatus("最新の機種データを確認中…","syncing");
  try{
    const res=await fetch(MACHINE_REMOTE_URL+"?v="+Date.now(),{cache:"no-store",headers:{"Cache-Control":"no-cache"}});
    if(!res.ok)throw new Error("HTTP "+res.status);
    const data=await res.json();
    if(!validMachineData(data))throw new Error("機種データ形式が不正です");
    const version=String(data.version||data.updatedAt||new Date().toISOString());
    const oldVersion=localStorage.getItem(MACHINE_VERSION_KEY)||"";
    MACHINE_DATA.パチスロ=[...new Set(data.パチスロ.filter(Boolean))];
    MACHINE_DATA.パチンコ=[...new Set(data.パチンコ.filter(Boolean))];
    mergeCustomMachines();
    // 保存するのはリモートの純粋なマスター。ユーザー追加分は別キーで保持。
    localStorage.setItem(MACHINE_DATA_KEY,JSON.stringify({version,updatedAt:data.updatedAt||new Date().toISOString(),source:data.source||"remote",パチスロ:data.パチスロ,パチンコ:data.パチンコ}));
    localStorage.setItem(MACHINE_UPDATED_KEY,data.updatedAt||new Date().toISOString());
    localStorage.setItem(MACHINE_VERSION_KEY,version);
    updateMachineUpdatedUI();
    if(!silent){
      const changed=oldVersion!==version;
      setMachineStatus(changed?"機種データを更新しました":"最新データです","ok");
      populateMachines($("#machineSearch")?.value||"");
    }
    return true;
  }catch(e){
    console.warn("機種データ更新失敗",e);
    if(!silent)setMachineStatus("更新できません：保存済みデータを使用","error");
    return false
  }
}
function autoMachineUpdate(){
  updateMachineUpdatedUI();
  // 起動ごとに1回だけオンライン確認。Service Workerはmachine-data.jsonをネット優先にするため、
  // 24時間キャッシュで新台を取りこぼす問題を避けます。
  if(navigator.onLine&&!sessionStorage.getItem(MACHINE_UPDATE_SESSION_KEY)){
    sessionStorage.setItem(MACHINE_UPDATE_SESSION_KEY,"1");
    updateMachineData(true);
  }
}

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function loadStoreData(){
 try{const cached=JSON.parse(localStorage.getItem(STORE_DATA_KEY)||"null");if(cached?.stores)STORE_DATA=cached}catch(e){}
 try{const cached=JSON.parse(localStorage.getItem(STORE_RATES_KEY)||"null");if(cached?.stores)STORE_RATES=cached}catch(e){}
 try{STORE_RATES_CUSTOM=JSON.parse(localStorage.getItem(STORE_RATES_CUSTOM_KEY)||"{}")||{}}catch(e){STORE_RATES_CUSTOM={}}
}
function validStoreData(d){return !!d&&Array.isArray(d.stores)&&d.stores.every(x=>x&&x.prefecture&&x.city&&x.store)}
function validStoreRates(d){return !!d&&typeof d.stores==='object'&&d.stores!==null}
async function updateStoreData(silent=true){
 if(!navigator.onLine)return false;
 try{
   const res=await fetch(STORE_REMOTE_URL+"?v="+Date.now(),{cache:"no-store"});
   if(!res.ok)throw new Error("HTTP "+res.status);
   const data=await res.json();
   if(!validStoreData(data))throw new Error("店舗データ形式が不正です");
   STORE_DATA=data;
   localStorage.setItem(STORE_DATA_KEY,JSON.stringify(data));
   return true
 }catch(e){console.warn("店舗データ更新失敗",e);return false}
}
async function updateStoreRates(silent=true){
 if(!navigator.onLine)return false;
 try{
   const res=await fetch(STORE_RATES_REMOTE_URL+"?v="+Date.now(),{cache:"no-store"});
   if(!res.ok)throw new Error("HTTP "+res.status);
   const data=await res.json();
   if(!validStoreRates(data))throw new Error("店舗レートデータ形式が不正です");
   STORE_RATES=data;
   localStorage.setItem(STORE_RATES_KEY,JSON.stringify(data));
   return true
 }catch(e){console.warn("店舗レートデータ更新失敗",e);return false}
}
function storeRateKey(e){return storeKey(e)}
function getStoreRateProfile(store,genre,rate){
 if(!store||!genre)return null;
 const key=storeRateKey(store);
 const custom=STORE_RATES_CUSTOM?.[key]?.[genre]?.[String(rate)];
 if(custom)return custom;
 const remote=STORE_RATES?.stores?.[key]?.[genre]?.[String(rate)];
 if(remote)return remote;
 const master=allStores().find(x=>storeKey(x)===key);
 const candidates=(master?.rates||[]).filter(x=>x&&x.genre===genre&&Number(x.loanUnits)>0&&Number(x.loanYen)>0);
 if(!candidates.length)return null;
 const target=Number(rate);
 let best=null,bestDiff=Infinity;
 for(const x of candidates){
   const actual=Number(x.rate)||0;
   if(!actual)continue;
   const diff=Math.abs(actual-target)/Math.max(target,0.0001);
   if(diff<bestDiff){bestDiff=diff;best=x;}
 }
 // 「20円」に対して21.7円相当の46枚貸など、P-WORLDの実表示を代表レートへ紐付ける。
 // 大きく離れた特殊レートは誤紐付けしない。
 if(!best||bestDiff>0.15)return null;
 return {loanUnits:Number(best.loanUnits),loanYen:Number(best.loanYen),source:'p-world',actualRate:Number(best.rate)||0};
}
function setStoreRateProfile(store,genre,rate,profile){
 if(!store||!genre||!rate)return;
 const key=storeRateKey(store);
 if(!STORE_RATES_CUSTOM[key])STORE_RATES_CUSTOM[key]={};
 if(!STORE_RATES_CUSTOM[key][genre])STORE_RATES_CUSTOM[key][genre]={};
 STORE_RATES_CUSTOM[key][genre][String(rate)]={...profile,updatedAt:new Date().toISOString(),source:'user'};
 localStorage.setItem(STORE_RATES_CUSTOM_KEY,JSON.stringify(STORE_RATES_CUSTOM));
}
function deleteStoreRateProfile(store,genre,rate){
 const key=storeRateKey(store);if(STORE_RATES_CUSTOM?.[key]?.[genre]){delete STORE_RATES_CUSTOM[key][genre][String(rate)];localStorage.setItem(STORE_RATES_CUSTOM_KEY,JSON.stringify(STORE_RATES_CUSTOM));}
}
function allRateProfilesForStore(store){
 const key=storeRateKey(store),out=[];
 const merged={};
 for(const src of [STORE_RATES?.stores?.[key]||{},STORE_RATES_CUSTOM?.[key]||{}]){
   for(const [g,rs] of Object.entries(src)){
     merged[g]??={};for(const [r,p] of Object.entries(rs||{}))merged[g][r]={...merged[g][r],...p};
   }
 }
 const master=allStores().find(x=>storeKey(x)===key);
 for(const p of (master?.rates||[])){
   if(!p?.genre||!p?.loanUnits||!p?.loanYen)continue;
   const nominal=(p.genre==='パチスロ'?[20,10,5]:[4,2,1,0.5]).reduce((best,r)=>Math.abs((Number(p.rate)||0)-r)<Math.abs((Number(p.rate)||0)-best)?r:best,(p.genre==='パチスロ'?20:4));
   const k=String(nominal);merged[p.genre]??={};merged[p.genre][k]={...p,...merged[p.genre][k]};
 }
 for(const [g,rs] of Object.entries(merged))for(const [r,p] of Object.entries(rs||{}))out.push({genre:g,rate:Number(r),...p,store});
 return out.sort((a,b)=>a.genre.localeCompare(b.genre,'ja')||a.rate-b.rate);
}
function loanValueForProfile(profile){return Number(profile?.loanUnits)||0}
function exchangeValueForProfile(profile){return Number(profile?.exchangeUnits)||0}
function allStores(){
 const seen=new Set(),out=[];
 for(const x of [...(STORE_DATA.stores||[]),...getCustomStores()]){
  if(!x?.prefecture||!x?.city||!x?.store)continue;
  const k=storeKey(x); if(seen.has(k))continue; seen.add(k); out.push(x);
 }
 return out;
}
function getCustomStores(){try{const d=JSON.parse(localStorage.getItem(STORE_CUSTOM_KEY)||"[]");return Array.isArray(d)?d:[]}catch(e){return []}}
function rememberStore(e){
 if(!e?.prefecture||!e?.city||!e?.store)return;
 const key=storeKey(e);
 if((STORE_DATA.stores||[]).some(x=>storeKey(x)===key))return;
 const custom=getCustomStores();
 if(!custom.some(x=>storeKey(x)===key)){
  custom.push({prefecture:e.prefecture,city:e.city,store:e.store,url:e.url||""});
  localStorage.setItem(STORE_CUSTOM_KEY,JSON.stringify(custom));
 }
}
function storeKey(e){return [e?.prefecture||"",e?.city||"",e?.store||""].join(" / ")}
function storeLabel(e){return e?.store?`${e.store}（${e.prefecture||""}・${e.city||""}）`:"未選択"}
function recentStores(){const seen=new Set(),out=[];for(const e of entries.slice().sort((a,b)=>b.date.localeCompare(a.date))){if(!e.store||!e.prefecture)continue;const k=storeKey(e);if(!seen.has(k)){seen.add(k);out.push({prefecture:e.prefecture,city:e.city||"",store:e.store,url:e.storeUrl||""})}if(out.length>=6)break}return out}
function storeSuggestions(q){const query=q.trim().toLowerCase();if(!query)return [];return allStores().filter(x=>`${x.store} ${x.city} ${x.prefecture}`.toLowerCase().includes(query)).sort((a,b)=>a.store.localeCompare(b.store,"ja")).slice(0,10)}
// 市区郡の漢字だけでは正確な50音順にできないため、自治体名と読み仮名の公開データを利用する。
const CITY_KANA_URL="https://code4fukui.github.io/localgovjp/localgovjp.json";
let cityKanaMap=null;
let cityKanaPromise=null;
function normalizeCityName(v){return String(v||"").replace(/[\s　]/g,"").replace(/（.*?）/g,"");}
function loadCityKanaMap(){
  if(cityKanaMap)return Promise.resolve(cityKanaMap);
  if(cityKanaPromise)return cityKanaPromise;
  cityKanaPromise=fetch(CITY_KANA_URL,{cache:"force-cache"}).then(r=>{if(!r.ok)throw new Error("city kana fetch failed");return r.json()}).then(rows=>{
    const map={};
    for(const r of rows||[]){
      const name=normalizeCityName(r.city),kana=String(r.citykana||"").replace(/[\s　]/g,"");
      if(name&&kana&&!map[name])map[name]=kana;
    }
    cityKanaMap=map;
    try{localStorage.setItem("cityKanaMapV1",JSON.stringify(map))}catch(e){}
    return map;
  }).catch(()=>{
    try{cityKanaMap=JSON.parse(localStorage.getItem("cityKanaMapV1")||"null")||{}}catch(e){cityKanaMap={}}
    return cityKanaMap;
  });
  return cityKanaPromise;
}
try{cityKanaMap=JSON.parse(localStorage.getItem("cityKanaMapV1")||"null")||null}catch(e){cityKanaMap=null}
const cityKanaCollator=new Intl.Collator("ja-JP",{sensitivity:"base",numeric:true});
function citySortKey(city){return cityKanaMap?.[normalizeCityName(city)]||normalizeCityName(city);}
function sortCities(cities){return cities.sort((a,b)=>{const c=cityKanaCollator.compare(citySortKey(a),citySortKey(b));return c||cityKanaCollator.compare(a,b)})}
function rateProfileText(store,genre,rate){
 const p=getStoreRateProfile(store,genre,rate);
 if(!p)return '<span class="rateUnset">貸出・交換条件未設定</span>';
 const loan=p.loanUnits&&p.loanYen?`貸出 ${Number(p.loanYen).toLocaleString()}円 → ${Number(p.loanUnits).toLocaleString()}${unitFor(genre)}`:'貸出条件未設定';
 const ex=p.exchangeUnits&&p.exchangeYen?`交換 ${Number(p.exchangeUnits).toLocaleString()}${unitFor(genre)} → ${Number(p.exchangeYen).toLocaleString()}円`:'交換条件未設定';
 return `<span>${loan}</span><span>${ex}</span>`;
}
function refreshEntryRateInfo(div){
 const genre=div.querySelector('.rowGenre')?.value,rate=Number(div.querySelector('.rowRate')?.value||1),store=collectStore(div),box=div.querySelector('.rateProfileInfo');
 if(!box)return;
 box.innerHTML=rateProfileText(store,genre,rate);
 const edit=div.querySelector('.rateProfileEditor');
 if(edit&&!edit.classList.contains('hiddenField')) loadEntryRateEditor(div);
}
function loadEntryRateEditor(div){
 const genre=div.querySelector('.rowGenre')?.value,rate=Number(div.querySelector('.rowRate')?.value||1),store=collectStore(div),p=getStoreRateProfile(store,genre,rate);
 if(!div.querySelector('.rateProfileEditor'))return;
 div.querySelector('.rowLoanUnits').value=p?.loanUnits??'';
 div.querySelector('.rowLoanYen').value=p?.loanYen??1000;
 div.querySelector('.rowExchangeUnits').value=p?.exchangeUnits??'';
 div.querySelector('.rowExchangeYen').value=p?.exchangeYen??1000;
}
function setupEntryRateEditor(div){
 const toggle=div.querySelector('.editRateProfileBtn'),editor=div.querySelector('.rateProfileEditor'),saveBtn=div.querySelector('.saveEntryRateProfile'),deleteBtn=div.querySelector('.deleteEntryRateProfile');
 if(!toggle||!editor)return;
 toggle.onclick=()=>{editor.classList.toggle('hiddenField');toggle.textContent=editor.classList.contains('hiddenField')?'条件を変更':'条件を閉じる';if(!editor.classList.contains('hiddenField'))loadEntryRateEditor(div)};
 saveBtn?.addEventListener('click',()=>{
   const store=collectStore(div),genre=div.querySelector('.rowGenre')?.value,rate=Number(div.querySelector('.rowRate')?.value||1);
   if(!store){alert('先に店舗を選択してください');return}
   const loanUnits=Number(div.querySelector('.rowLoanUnits').value),loanYen=Number(div.querySelector('.rowLoanYen').value),exchangeUnits=Number(div.querySelector('.rowExchangeUnits').value),exchangeYen=Number(div.querySelector('.rowExchangeYen').value);
   if(!(loanUnits>0&&loanYen>0&&exchangeUnits>0&&exchangeYen>0)){alert('貸出・交換の数量と金額をすべて入力してください');return}
   setStoreRateProfile(store,genre,rate,{loanUnits,loanYen,exchangeUnits,exchangeYen});
   refreshEntryRateInfo(div);updateRowPreview(div);updateBatchTotal();
   alert('この店舗・レートの貸出・交換条件を保存しました。');
 });
 deleteBtn?.addEventListener('click',()=>{
   const store=collectStore(div),genre=div.querySelector('.rowGenre')?.value,rate=Number(div.querySelector('.rowRate')?.value||1);
   if(!store){alert('店舗を選択してください');return}
   deleteStoreRateProfile(store,genre,rate);loadEntryRateEditor(div);refreshEntryRateInfo(div);updateRowPreview(div);updateBatchTotal();
   alert('ユーザー設定を削除しました。P-WORLD由来の貸出情報があればそちらを使用します。');
 });
}
function settingsStoreFromKey(key){return allStores().find(x=>storeKey(x)===key)||null}
function settingsRateOptionsHtml(genre,current){
 const rates=RATE_OPTIONS[genre]||[];return rates.map(r=>`<option value="${r}" ${Number(current)===r?'selected':''}>${r}円</option>`).join('');
}
function setupStoreRateManager(){
 const pref=$('#rateStorePref'),city=$('#rateStoreCity'),name=$('#rateStoreName'),search=$('#rateStoreSearch'),suggestions=$('#rateStoreSuggestions');
 if(!pref||!city||!name)return;
 const stores=allStores();
 const PREF_ORDER=["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];
 let selected=null;
 const setSelected=(x)=>{selected=x||null;if(selected){pref.value=selected.prefecture||'';renderCities();city.value=selected.city||'';renderNames();name.value=selected.store||'';search.value=selected.store||'';loadManagerProfile(selected)}else{search.value='';pref.value='';renderCities();loadManagerProfile(null)}};
 const renderCities=()=>{const cities=sortCities([...new Set(stores.filter(x=>x.prefecture===pref.value).map(x=>x.city))]);city.innerHTML='<option value="">選択してください</option>'+cities.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('');city.disabled=!pref.value;name.innerHTML='<option value="">選択してください</option>';name.disabled=true;if(city.value)renderNames()};
 const renderNames=()=>{const list=stores.filter(x=>x.prefecture===pref.value&&x.city===city.value).sort((a,b)=>a.store.localeCompare(b.store,'ja'));name.innerHTML='<option value="">選択してください</option>'+list.map(x=>`<option value="${escapeHtml(x.store)}">${escapeHtml(x.store)}</option>`).join('');name.disabled=!city.value};
 const chooseFromSelect=()=>{const x=stores.find(x=>x.prefecture===pref.value&&x.city===city.value&&x.store===name.value);if(x)setSelected(x)};
 const loadManagerProfile=(store)=>{const genre=$('#rateGenre')?.value,rate=Number($('#rateRate')?.value);const p=store?getStoreRateProfile(store,genre,rate):null;$('#rateLoanUnits').value=p?.loanUnits??'';$('#rateLoanYen').value=p?.loanYen??1000;$('#rateExchangeUnits').value=p?.exchangeUnits??'';$('#rateExchangeYen').value=p?.exchangeYen??1000;};
 const refreshRateOptions=()=>{const g=$('#rateGenre')?.value,r=$('#rateRate')?.value;$('#rateRate').innerHTML=settingsRateOptionsHtml(g,r);if(!$('#rateRate').value)$('#rateRate').value=String((RATE_OPTIONS[g]||[1])[0]);loadManagerProfile(selected)};
 const prefSet=new Set(stores.map(x=>x.prefecture));const prefs=PREF_ORDER.filter(x=>prefSet.has(x));for(const x of prefSet)if(!PREF_ORDER.includes(x))prefs.push(x);pref.innerHTML='<option value="">選択してください</option>'+prefs.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('');
 pref.onchange=()=>{selected=null;search.value='';renderCities();loadManagerProfile(null)};city.onchange=()=>{selected=null;search.value='';renderNames();loadManagerProfile(null)};name.onchange=chooseFromSelect;
 const renderSearch=()=>{const q=search.value.trim();if(!q){suggestions.innerHTML='';return}const list=storeSuggestions(q).slice(0,8);suggestions.innerHTML=list.length?list.map(x=>`<button type="button" class="storeSuggestion rateStoreSuggestion" data-key="${escapeHtml(storeKey(x))}"><span>${escapeHtml(x.store)}</span><small>${escapeHtml(x.prefecture)}・${escapeHtml(x.city)}</small></button>`).join(''):'<div class="suggestionEmpty">該当する店舗がありません</div>';suggestions.querySelectorAll('.rateStoreSuggestion').forEach(b=>b.onclick=()=>{const x=settingsStoreFromKey(b.dataset.key);if(x){setSelected(x);suggestions.innerHTML=''}})};
 search.oninput=()=>{selected=null;renderSearch()};
 $('#saveStoreRate')?.addEventListener('click',()=>{if(!selected){alert('店舗を選択してください');return}const genre=$('#rateGenre').value,rate=Number($('#rateRate').value),loanUnits=Number($('#rateLoanUnits').value),loanYen=Number($('#rateLoanYen').value),exchangeUnits=Number($('#rateExchangeUnits').value),exchangeYen=Number($('#rateExchangeYen').value);if(!(loanUnits>0&&loanYen>0&&exchangeUnits>0&&exchangeYen>0)){alert('貸出・交換の数量と金額をすべて入力してください');return}setStoreRateProfile(selected,genre,rate,{loanUnits,loanYen,exchangeUnits,exchangeYen});loadManagerProfile(selected);alert('店舗の貸出・交換条件を保存しました。')});
 $('#deleteStoreRate')?.addEventListener('click',()=>{if(!selected){alert('店舗を選択してください');return}deleteStoreRateProfile(selected,$('#rateGenre').value,Number($('#rateRate').value));loadManagerProfile(selected);alert('この店舗・レートのユーザー設定を削除しました。P-WORLD由来の貸出情報があればそちらを使用します。')});
 $('#rateGenre')?.addEventListener('change',refreshRateOptions);$('#rateRate')?.addEventListener('change',()=>loadManagerProfile(selected));
 loadCityKanaMap().then(()=>{if(pref.value)renderCities()});
 refreshRateOptions();
}
function storePickerHtml(){return `<div class="storePicker"><label>店舗検索<input class="storeSearch" placeholder="店舗名・市区郡・都道府県で検索…" autocomplete="off"><button type="button" class="clearStoreSearch">×</button></label><div class="storeSuggestions"></div><div class="recentLabel">最近使った店舗</div><div class="rowRecent recentStores"></div><div class="storeSelectGrid"><label>都道府県<select class="storePref"><option value="">選択してください</option></select></label><label>市区郡<select class="storeCity" disabled><option value="">都道府県を先に選択</option></select></label><label>店舗名<select class="storeName" disabled><option value="">市区郡を先に選択</option></select></label></div><button type="button" class="ghost full clearStoreBtn">店舗を未選択にする</button></div>`}
function fillStorePicker(div,data={}){const pref=div.querySelector('.storePref'),city=div.querySelector('.storeCity'),name=div.querySelector('.storeName'),search=div.querySelector('.storeSearch');const stores=allStores();const PREF_ORDER=[
  "北海道",
  "青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"
];
const prefSet=new Set(stores.map(x=>x.prefecture));
 loadCityKanaMap().then(()=>{if(pref.value)renderCities()});
const prefs=PREF_ORDER.filter(x=>prefSet.has(x));
for(const x of prefSet)if(!PREF_ORDER.includes(x))prefs.push(x);pref.innerHTML='<option value="">選択してください</option>'+prefs.map(x=>`<option>${escapeHtml(x)}</option>`).join('');
 const renderCities=()=>{const cities=sortCities([...new Set(stores.filter(x=>x.prefecture===pref.value).map(x=>x.city))]);city.innerHTML='<option value="">選択してください</option>'+cities.map(x=>`<option>${escapeHtml(x)}</option>`).join('');city.disabled=!pref.value;name.innerHTML='<option value="">選択してください</option>';name.disabled=true;if(city.value)renderNames()};
 const renderNames=()=>{const list=stores.filter(x=>x.prefecture===pref.value&&x.city===city.value).sort((a,b)=>a.store.localeCompare(b.store,"ja"));name.innerHTML='<option value="">選択してください</option>'+list.map(x=>`<option value="${escapeHtml(x.store)}">${escapeHtml(x.store)}</option>`).join('');name.disabled=!city.value;};
 pref.onchange=renderCities;city.onchange=renderNames;name.onchange=()=>{const x=stores.find(x=>x.prefecture===pref.value&&x.city===city.value&&x.store===name.value);if(x){div.dataset.store=JSON.stringify(x);search.value=x.store;div.querySelector('.storeSuggestions').innerHTML='';}};
 search.oninput=()=>{const q=search.value.trim(),box=div.querySelector('.storeSuggestions');if(!q){box.innerHTML='';return}const list=storeSuggestions(q);box.innerHTML=list.length?list.map(x=>`<button type="button" class="storeSuggestion" data-store="${escapeHtml(storeKey(x))}"><span>${escapeHtml(x.store)}</span><small>${escapeHtml(x.prefecture)}・${escapeHtml(x.city)}</small></button>`).join(''):'<div class="suggestionEmpty">該当する店舗がありません</div>';box.querySelectorAll('.storeSuggestion').forEach(b=>b.onclick=()=>{const x=allStores().find(x=>storeKey(x)===b.dataset.store);if(x){div.dataset.store=JSON.stringify(x);search.value=x.store;pref.value=x.prefecture;renderCities();city.value=x.city;renderNames();name.value=x.store;box.innerHTML='';refreshEntryRateInfo(div);updateRowPreview(div);updateBatchTotal();}})};
 div.querySelector('.clearStoreSearch').onclick=()=>{search.value='';div.querySelector('.storeSuggestions').innerHTML='';search.focus()};
 div.querySelector('.clearStoreBtn').onclick=()=>{div.dataset.store='';search.value='';pref.value='';renderCities();city.value='';name.value='';refreshEntryRateInfo(div);};
 const recent=div.querySelector('.recentStores'),rs=recentStores();recent.innerHTML=rs.length?rs.map(x=>`<button type="button" class="recentStore" data-store="${escapeHtml(storeKey(x))}">${escapeHtml(x.store)}</button>`).join(''):'<span class="neutral">まだありません</span>';recent.querySelectorAll('.recentStore').forEach(b=>b.onclick=()=>{const x=allStores().find(x=>storeKey(x)===b.dataset.store);if(x){div.dataset.store=JSON.stringify(x);search.value=x.store;pref.value=x.prefecture;renderCities();city.value=x.city;renderNames();name.value=x.store;refreshEntryRateInfo(div);updateRowPreview(div);updateBatchTotal();}});
 if(data.store){const x={prefecture:data.prefecture||'',city:data.city||'',store:data.store,url:data.storeUrl||''};div.dataset.store=JSON.stringify(x);search.value=x.store;pref.value=x.prefecture;renderCities();city.value=x.city;renderNames();name.value=x.store;}
}
function collectStore(div){try{return JSON.parse(div.dataset.store||"null")||null}catch(e){return null}}
const THEME_KEY="gambling-theme-v1";
const NET_DISPLAY_KEY="gambling-net-display-v1";
function applyTheme(theme){
  const light=theme==='light';
  document.body.classList.toggle('lightTheme',light);
  const meta=$('#themeColorMeta'); if(meta)meta.setAttribute('content',light?'#f4f6fb':'#0b1020');
  const label=$('#themeLabel'); if(label)label.textContent=light?'ライト':'ダーク';
  const dark=$('#themeDark'), lite=$('#themeLight');
  if(dark)dark.classList.toggle('active',!light);
  if(lite)lite.classList.toggle('active',light);
  localStorage.setItem(THEME_KEY,light?'light':'dark');
}
function loadTheme(){applyTheme(localStorage.getItem(THEME_KEY)==='light'?'light':'dark')}
const yen=n=>"¥"+Math.round(n||0).toLocaleString("ja-JP");
function netYen(n){
  const value=Number(n)||0;
  if(!netDisplayEnabled())return yen(value);
  const rounded=Math.trunc(value/100)*100;
  return "¥"+(rounded).toLocaleString("ja-JP");
}
function netDisplayEnabled(){return localStorage.getItem(NET_DISPLAY_KEY)==="hundreds"}
// 収支を表示単位に切り捨てた値。100円単位設定時は、この値を合計にも使う。
function displayNetValue(n){
  const value=Number(n)||0;
  return netDisplayEnabled()?Math.trunc(value/100)*100:value;
}
function applyNetDisplaySetting(){
  const enabled=netDisplayEnabled();
  const el=$("#netDisplayHundreds");
  if(el)el.checked=enabled;
  const label=$("#netDisplayLabel");
  if(label)label.textContent=enabled?"100円単位":"1円単位";
}
const RATE_OPTIONS={"パチスロ":[20,10,5],"パチンコ":[4,2,1,0.5]};
function unitFor(genre){return genre==='パチスロ'?'枚':genre==='パチンコ'?'玉':'円'}
function rateFor(e){return Number(e.rate)||((e.genre==='パチスロ')?20:(e.genre==='パチンコ'?4:1))}
// 旧記録の表示互換用。新規の持ち玉計算では店舗条件を必須にする。
function legacyHoldYen(amount,genre,rate){return Number(amount||0)*Number(rate||1)}
function holdYenFromProfile(amount,profile,kind,genre,rate){
 const units=Number(amount||0);
 if(!units)return 0;
 const key=kind==='return'?'exchangeUnits':'loanUnits';
 const yenKey=kind==='return'?'exchangeYen':'loanYen';
 const u=Number(profile?.[key]), y=Number(profile?.[yenKey]);
 if(u>0&&y>0)return units*(y/u);
 return null;
}
// 現金入力は「千円単位」で簡略入力（1=1,000円 / 11.5=11,500円）。内部保存は従来どおり円。
function cashInputValue(yen){return Number(yen||0)/1000}
function inputValueToYen(type,value){return type==='cash'?Number(value||0)*1000:Number(value||0)}
function calcInputYen(type,value,genre,rate,profile,kind='investment'){return type==='hold'?holdYenFromProfile(value,profile,kind,genre,rate):Number(value||0)*1000}
function inputStep(type){return type==='cash'?'0.1':'1'}
function inputPlaceholder(type){return type==='cash'?'例：1 = 1,000円':'金額を入力'}
function sideYen(e,kind){
 const cash=Number(kind==='investment'?e.investmentCash:e.returnCash)||0;
 const hold=Number(kind==='investment'?e.investmentHold:e.returnHold)||0;
 const holdYen=hold?holdYenFromProfile(hold,e.rateProfile,kind,e.genre,e.rate):0;
 if(holdYen===null)return null;
 return cash+(holdYen||0);
}
function invYen(e){const v=sideYen(e,'investment');return v===null?0:v}
function retYen(e){const v=sideYen(e,'return');return v===null?0:v}
const rawNet=e=>retYen(e)-invYen(e);
function personalNet(e){return rawNet(e)}
function dayPersonalNet(es){
  const nori=es.find(e=>e?.noriuchi && Number.isFinite(Number(e.settlement)));
  if(!nori) return es.reduce((a,e)=>a+rawNet(e),0);
  // ノリ打ち時の自分の投資額は「投資」に入力した現金分だけ。持ち玉投資は除外。
  const personalInvest=es.reduce((a,e)=>{
    return a+Number(e.investmentCash||0);
  },0);
  // 精算額は最終的に受け取った（または支払った）金額。収支 = 精算額 - 自分の現金投資額。
  return Number(nori.settlement)-personalInvest;
}
const net=personalNet;
function displayMoneyOrUnit(type,amount,genre,rate){return type==='hold'?`${Number(amount||0).toLocaleString()}${unitFor(genre)}`:yen(Number(amount||0))}
function save(){localStorage.setItem(KEY,JSON.stringify(entries));renderAll()}
function newId(){return (typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')?crypto.randomUUID():`e-${Date.now()}-${Math.random().toString(36).slice(2)}`} 
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function parseDate(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function formatDateJP(s){return s.replace(/-/g,"/")}
function renderAll(){renderCalendar();renderReport();renderStats()}
function renderMonthJump(){
 const sel=$("#monthTitle");
 if(!sel)return;
 const months=[...new Set(entries.map(e=>e.date).filter(Boolean).map(d=>d.slice(0,7)))].sort().reverse();
 const current=`${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,"0")}`;
 const list=months.length?months:[current];
 if(!list.includes(current))list.push(current);
 sel.innerHTML=list.map(v=>{const [yy,mm]=v.split("-");return `<option value="${v}">${yy}年${Number(mm)}月</option>`}).join("");
 sel.value=current;
}

function renderCalendar(){
 const y=viewDate.getFullYear(),m=viewDate.getMonth();
 renderMonthJump();
 const first=new Date(y,m,1).getDay(),last=new Date(y,m+1,0).getDate(),map={}; entries.forEach(e=>(map[e.date]??=[]).push(e));
 let html="";for(let i=0;i<first;i++)html+='<div class="empty"></div>';
 let total=0,inv=0,wins=0,loss=0;
 for(let d=1;d<=last;d++){
  let k=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,arr=map[k]||[],n=dayPersonalNet(arr),displayN=displayNetValue(n);
  // 100円単位表示時は、各日の収支を先に切り捨ててから月合計する。
  total+=displayN;inv+=arr.reduce((a,e)=>a+invYen(e),0);if(n>0)wins++;if(n<0)loss++;
  let cls=n>0?"win":n<0?"lose":"zero",today=k===dateKey(new Date())?" today":"";
  html+=`<button class="day ${cls}${today}" data-date="${k}"><span class="date">${d}</span><span class="daynet ${n>0?"pos":n<0?"neg":"neutral"}">${arr.length?netYen(displayN):"—"}</span></button>`;
 }
 $("#calendar").innerHTML=html;$("#monthNet").textContent=netYen(total);$("#monthNet").className=total>0?"pos":total<0?"neg":"neutral";$("#winDays").textContent=wins;$("#loseDays").textContent=loss;$("#monthInvest").textContent=yen(inv);
 $$("#calendar .day").forEach(b=>b.onclick=()=>{reportDate=parseDate(b.dataset.date);switchPage("report");renderReport()});
 drawChart($("#calendarChart"),dailySeries(y,m));
}
function dailySeries(y,m){let last=new Date(y,m+1,0).getDate(),map={};entries.forEach(e=>{if(e.date.startsWith(`${y}-${String(m+1).padStart(2,"0")}`))(map[e.date]??=[]).push(e)});let cum=0,a=[{label:"開始",value:0}];for(let d=1;d<=last;d++){let k=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,n=displayNetValue(dayPersonalNet(map[k]||[]));cum+=n;a.push({label:d,value:cum})}return a}
function deleteCounterDaily(date,machine){
 const logsKey='gambling-counter-daily-v1';
 let logs={};try{const x=JSON.parse(localStorage.getItem(logsKey)||'{}');if(x&&typeof x==='object')logs=x}catch(e){}
 const key=`${date}\u0000${machine||'未設定'}`;
 if(!Object.prototype.hasOwnProperty.call(logs,key))return;
 if(!confirm(`${date.replaceAll('-','/')} の「${machine||'未設定'}」のカウンター情報を削除しますか？`))return;
 delete logs[key];
 localStorage.setItem(logsKey,JSON.stringify(logs));
 renderCounterDailyReport(date);
}
window.deleteCounterDaily=deleteCounterDaily;

function renderCounterDailyReport(date){
 const card=document.getElementById('reportCounterCard'),box=document.getElementById('reportCounters'),countEl=document.getElementById('reportCounterCount');
 if(!card||!box)return;
 let logs={};try{const x=JSON.parse(localStorage.getItem('gambling-counter-daily-v1')||'{}');if(x&&typeof x==='object')logs=x}catch(e){}
 const list=Object.values(logs).filter(x=>x&&x.date===date).sort((a,b)=>(a.machine||'').localeCompare(b.machine||'','ja'));
 if(countEl)countEl.textContent=`${list.length}件`;
 if(!list.length){box.innerHTML='<div class="emptyState counterReportEmpty">この日に保存されたカウンターはありません</div>';return}
 box.innerHTML=list.map(log=>`<div class="counterReportBlock"><div class="counterReportHead"><div><h4>${escapeHtml(log.machine||'未設定')}</h4><span class="smallText">総ゲーム数 ${Number(log.games||0).toLocaleString()}G</span></div><div class="counterReportHeadActions"><span class="smallText neutral">${log.updatedAt?new Date(log.updatedAt).toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):''}</span><button type="button" class="danger small counterReportDelete" data-date="${escapeHtml(log.date||date)}" data-machine="${escapeHtml(log.machine||'未設定')}">削除</button></div></div><div class="counterReportGrid">${(Array.isArray(log.counters)?log.counters:[]).map(c=>`<div class="counterReportItem"><span>${escapeHtml(c.name||'項目')}</span><b>${Number(c.count||0).toLocaleString()}</b><small>${escapeHtml(c.rate||'—')}</small></div>`).join('')}</div></div>`).join('');
 box.querySelectorAll('.counterReportDelete').forEach(btn=>btn.addEventListener('click',()=>deleteCounterDaily(btn.dataset.date,btn.dataset.machine)));
}
function renderReport(){
 const key=dateKey(reportDate),es=entries.filter(e=>e.date===key),n=dayPersonalNet(es),inv=es.reduce((a,e)=>a+invYen(e),0),ret=es.reduce((a,e)=>a+retYen(e),0);
 $("#reportDate").textContent=formatDateJP(key);$("#reportNet").textContent=netYen(n);$("#reportNet").className=n>0?"pos":n<0?"neg":"neutral";$("#reportInvest").textContent=yen(inv);$("#reportReturn").textContent=yen(ret);$("#reportWins").textContent=es.filter(e=>rawNet(e)>0).length;$("#reportLosses").textContent=es.filter(e=>rawNet(e)<0).length;$("#reportCount").textContent=es.length+"件";
 renderCounterDailyReport(key);
 const groups={};es.forEach(e=>(groups[e.machine]??=[]).push(e));
 const machineArr=Object.entries(groups).sort((a,b)=>b[1].reduce((x,e)=>x+rawNet(e),0)-a[1].reduce((x,e)=>x+rawNet(e),0));
 $("#reportMachines").innerHTML=machineArr.length?machineArr.map(([machine,list])=>{let total=list.reduce((a,e)=>a+rawNet(e),0);return `<button class="reportMachine" data-machine="${escapeHtml(machine)}"><div><b>${escapeHtml(machine)}</b><small>${escapeHtml(list[0].genre)} ・ ${list[0].rate?list[0].rate+"円":""} ・ ${list.length}件</small></div><strong class="${total>=0?"pos":"neg"}">${netYen(total)}</strong></button>`}).join(""):"<div class='emptyState'>この日の記録はありません。<br>右上の「＋ 記録」から追加できます。</div>";
 $$(".reportMachine").forEach(b=>b.onclick=()=>{const m=b.dataset.machine;const first=es.find(e=>e.machine===m);if(first)openForm(key,first.id)});
 $("#reportEntries").innerHTML=es.length?es.map(e=>`<div class="entryCard"><div class="entryTop"><div><b>${escapeHtml(e.machine)}</b><small>${escapeHtml(e.genre)} ・ ${e.rate?e.rate+"円":""} / 投資 現金${yen(Number(e.investmentCash)||0)} + 持ち玉${Number(e.investmentHold||0).toLocaleString()}${unitFor(e.genre)} / 回収 現金${yen(Number(e.returnCash)||0)} + 持ち玉${Number(e.returnHold||0).toLocaleString()}${unitFor(e.genre)}</small></div><strong class="${rawNet(e)>=0?"pos":"neg"}">${netYen(rawNet(e))}</strong></div>${e.memo?`<p class="memo">${escapeHtml(e.memo)}</p>`:""}<div class="entryActions"><button onclick="editEntry('${e.id}')">編集</button><button class="danger" onclick="deleteById('${e.id}')">削除</button></div></div>`).join(""):"<div class='emptyState'>記録なし</div>";
}
function periodRange(type){
 const now=new Date();
 if(type==="month"){
  const v=$("#periodMonth").value || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const [y,m]=v.split("-").map(Number);
  return [dateKey(new Date(y,m-1,1)),dateKey(new Date(y,m,0))];
 }
 if(type==="year"){
  const y=Number($("#periodYear").value)||now.getFullYear();
  return [dateKey(new Date(y,0,1)),dateKey(new Date(y,11,31))];
 }
 if(!entries.length)return ["9999-01-01","9999-01-01"];
  const dates=entries.map(e=>e.date).filter(Boolean).sort();
  return [dates[0],dates[dates.length-1]];
}
function setupPeriodSelectors(){
 const now=new Date(),month=$("#periodMonth"),year=$("#periodYear");
 if(month&&!month.value)month.value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
 if(year){
  const years=new Set([now.getFullYear(),...entries.map(e=>Number(e.date.slice(0,4))).filter(Boolean)]);
  year.innerHTML=[...years].sort((a,b)=>b-a).map(y=>`<option value="${y}">${y}年</option>`).join("");
  year.value=String(now.getFullYear());
 }
 updatePeriodControls();
}
function updatePeriodControls(){
 const type=$("#period").value;
 $("#periodMonth").classList.toggle("hiddenField",type!=="month");
 $("#periodYear").classList.toggle("hiddenField",type!=="year");
}

function inPeriod(e,r){return e.date>=r[0]&&e.date<=r[1]}
function renderStats(){let r=periodRange($("#period").value),es=entries.filter(e=>inPeriod(e,r)),byDate={};es.forEach(e=>(byDate[e.date]??=[]).push(e));let total=Object.values(byDate).reduce((a,arr)=>a+displayNetValue(dayPersonalNet(arr)),0),inv=es.reduce((a,e)=>a+invYen(e),0),ret=es.reduce((a,e)=>a+retYen(e),0),win=es.filter(e=>net(e)>0).length;$("#statNet").textContent=netYen(total);$("#statNet").className=total>0?"pos":total<0?"neg":"neutral";$("#statInvest").textContent=yen(inv);$("#statReturn").textContent=yen(ret);$("#statWinRate").textContent=(es.length?(win/es.length*100):0).toFixed(1)+"%";
 const group=$("#group").value; const target=$("#analysisTarget")?.value||"";
 updateAnalysisTargetOptions(es,group);
 const selectedTarget=$("#analysisTarget")?.value||target;
 if(group==="store"){
   const targetEntries=selectedTarget?es.filter(e=>e.store===selectedTarget):[];
   renderStoreGroups(targetEntries,selectedTarget);
   $("#statsList").innerHTML=selectedTarget?`<p class='smallText neutral'>${escapeHtml(selectedTarget)} の集計結果です。</p>`:"<p class='smallText neutral'>対象の店舗を選択してください。</p>";
   drawChart($("#statsChart"),periodSeries(targetEntries,r,$("#period").value,$("#chartMode")?.value||"calendar",rawNet));return;
 }
 let targetEntries=es;
 if(group==="machine"||group==="genre")targetEntries=selectedTarget?es.filter(e=>(group==="machine"?e.machine:e.genre)===selectedTarget):[];
 if(group==="rate")targetEntries=selectedTarget?es.filter(e=>String(Number(e.rate))===String(selectedTarget)):[];
 $("#detailStats").innerHTML=(group==="machine"||group==="genre")&&selectedTarget?machineCard(selectedTarget,targetEntries):group==="rate"&&selectedTarget?machineCard(rateLabel(Number(selectedTarget)),targetEntries):"";
 renderStatsList(targetEntries);drawChart($("#statsChart"),periodSeries(targetEntries,r,$("#period").value,$("#chartMode")?.value||"calendar",rawNet));}
function groupedStats(list,keyFn){const m=new Map();for(const e of list){const k=keyFn(e);if(!m.has(k))m.set(k,[]);m.get(k).push(e)}return [...m.entries()].map(([key,arr])=>({key,arr,net:arr.reduce((a,e)=>a+rawNet(e),0),invest:arr.reduce((a,e)=>a+invYen(e),0),ret:arr.reduce((a,e)=>a+retYen(e),0),count:arr.length})).sort((a,b)=>b.net-a.net)}
function renderStoreGroups(es,target="") {
 const gs=groupedStats(es,e=>e.store?storeKey(e):"未選択");
 if(!gs.length){$("#detailStats").innerHTML=`<div class="card emptyState">${target?"この店舗のデータがありません":"店舗を選択してください"}</div>`;return;}
 $("#detailStats").innerHTML=gs.map(g=>`<div class="machineCard"><div class="storeStatTop"><div><h3>${escapeHtml(g.key)}</h3><span class="smallText">${g.count}件</span></div><strong class="${g.net>=0?'pos':'neg'}">${netYen(g.net)}</strong></div><div class="statsGrid"><div><span>総投資</span><b>${yen(g.invest)}</b></div><div><span>総回収</span><b>${yen(g.ret)}</b></div><div><span>平均収支</span><b>${netYen(g.net/g.count)}</b></div></div></div>`).join("");
}
function renderStoreMachineGroups(es){const gs=groupedStats(es,e=>(e.store?storeKey(e):"未選択")+" × "+(e.machine||"未選択"));$("#detailStats").innerHTML=gs.length?gs.map(g=>`<div class="machineCard"><div class="storeStatTop"><div><h3>${escapeHtml(g.key)}</h3><span class="smallText">${g.count}件</span></div><strong class="${g.net>=0?'pos':'neg'}">${netYen(g.net)}</strong></div><div class="statsGrid"><div><span>総投資</span><b>${yen(g.invest)}</b></div><div><span>総回収</span><b>${yen(g.ret)}</b></div><div><span>平均収支</span><b>${netYen(g.net/g.count)}</b></div></div></div>`).join(""):"<div class='card emptyState'>店舗×機種データがありません</div>"}
function renderStatsList(es){
 const sort=$("#detailSort")?.value||"dateDesc";
 const list=es.slice().sort((a,b)=>{
   if(sort==="dateAsc")return a.date.localeCompare(b.date);
   if(sort==="netDesc")return rawNet(b)-rawNet(a)||b.date.localeCompare(a.date);
   if(sort==="netAsc")return rawNet(a)-rawNet(b)||b.date.localeCompare(a.date);
   if(sort==="investDesc")return invYen(b)-invYen(a)||b.date.localeCompare(a.date);
   if(sort==="investAsc")return invYen(a)-invYen(b)||b.date.localeCompare(a.date);
   if(sort==="returnDesc")return retYen(b)-retYen(a)||b.date.localeCompare(a.date);
   if(sort==="returnAsc")return retYen(a)-retYen(b)||b.date.localeCompare(a.date);
   return b.date.localeCompare(a.date);
 });
 $("#statsList").innerHTML=list.length?list.map(e=>`<div class="entryCard"><div class="entryTop"><div><b>${escapeHtml(e.machine)}</b><small>${formatDateJP(e.date)} ・ ${escapeHtml(e.genre)} ・ ${e.rate?e.rate+"円":""}</small></div><strong class="${rawNet(e)>=0?"pos":"neg"}">${netYen(rawNet(e))}</strong></div><div class="smallText">投資 現金${yen(Number(e.investmentCash)||0)} + 持ち玉${Number(e.investmentHold||0).toLocaleString()}${unitFor(e.genre)} / 回収 現金${yen(Number(e.returnCash)||0)} + 持ち玉${Number(e.returnHold||0).toLocaleString()}${unitFor(e.genre)}</div>${e.memo?`<p class="memo">${escapeHtml(e.memo)}</p>`:""}<div class="entryActions"><button onclick="editEntry('${e.id}')">編集</button><button class="danger" onclick="deleteById('${e.id}')">削除</button></div></div>`).join(""):"<p class='neutral'>データがありません</p>";
}
function rateLabel(rate){const n=Number(rate);if(!Number.isFinite(n))return "未設定";return `${n.toLocaleString("ja-JP",{maximumFractionDigits:4})}円`;}
function updateAnalysisTargetOptions(es,group){
 const sel=$("#analysisTarget");if(!sel)return;
 const needs=group==="machine"||group==="genre"||group==="store"||group==="rate";
 sel.classList.toggle("hiddenField",!needs);
 if(!needs){sel.innerHTML='<option value="">対象を選択</option>';return;}
 const prev=sel.value;
 if(group==="store"){
   const counts=new Map();
   es.map(e=>e.store).filter(Boolean).forEach(v=>counts.set(v,(counts.get(v)||0)+1));
   const vals=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"ja"));
   sel.innerHTML='<option value="">対象を選択してください</option>'+vals.map(([v])=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
   if(vals.some(([v])=>v===prev))sel.value=prev;else if(vals.length===1)sel.value=vals[0];
   return;
 }
 if(group==="rate"){
   const counts=new Map();
   for(const e of es){
     const r=Number(e.rate);
     if(!Number.isFinite(r))continue;
     const key=String(r);
     counts.set(key,(counts.get(key)||0)+1);
   }
   const vals=[...counts.entries()].sort((a,b)=>b[1]-a[1]||Number(a[0])-Number(b[0]));
   sel.innerHTML='<option value="">対象を選択してください</option>'+vals.map(([v])=>`<option value="${escapeHtml(v)}">${escapeHtml(rateLabel(Number(v)))}</option>`).join("");
   if(vals.some(([v])=>v===prev))sel.value=prev;else if(vals.length===1)sel.value=vals[0][0];
   return;
 }
 if(group==="machine"){
   const genreOrder=["パチスロ","パチンコ"];
   const byGenre=new Map();
   for(const e of es){
     if(!e.machine)continue;
     const genre=genreOrder.includes(e.genre)?e.genre:"その他";
     if(!byGenre.has(genre))byGenre.set(genre,new Map());
     const m=byGenre.get(genre);m.set(e.machine,(m.get(e.machine)||0)+1);
   }
   const extra=[...byGenre.keys()].filter(g=>!genreOrder.includes(g)).sort((a,b)=>a.localeCompare(b,"ja"));
   const genres=[...genreOrder,...extra];
   let html='<option value="">対象を選択してください</option>';
   for(const genre of genres){
     const counts=byGenre.get(genre);if(!counts||!counts.size)continue;
     const vals=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"ja"));
     html+=`<optgroup label="ー${escapeHtml(genre)}ー">`+vals.map(([v])=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("")+"</optgroup>";
   }
   sel.innerHTML=html;
   const all=[...byGenre.values()].flatMap(m=>[...m.keys()]);
   if(all.includes(prev))sel.value=prev;else if(all.length===1)sel.value=all[0];
   return;
 }
 const counts=new Map();
 es.map(e=>e.genre).filter(Boolean).forEach(v=>counts.set(v,(counts.get(v)||0)+1));
 const vals=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"ja"));
 sel.innerHTML='<option value="">対象を選択してください</option>'+vals.map(([v])=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
 if(vals.some(([v])=>v===prev))sel.value=prev;else if(vals.length===1)sel.value=vals[0];
}
function machineCard(key,es){let n=es.map(rawNet),wins=n.filter(x=>x>0).length,invest=es.reduce((a,e)=>a+invYen(e),0),ret=es.reduce((a,e)=>a+retYen(e),0),sum=n.reduce((a,x)=>a+x,0);let avg=es.length?sum/es.length:0,max=Math.max(...n,0),min=Math.min(...n,0);return `<div class="machineCard"><h3>${escapeHtml(key)}</h3><div class="statsGrid machineDetailStats"><div class="stat-invest"><span>総投資</span><b>${yen(invest)}</b></div><div class="stat-maxwin"><span>最高勝ち額</span><b class="pos">${netYen(max)}</b></div><div class="stat-avg"><span>平均収支</span><b class="${avg>=0?"pos":"neg"}">${netYen(avg)}</b></div><div class="stat-return"><span>総回収</span><b>${yen(ret)}</b></div><div class="stat-maxloss"><span>最高負け額</span><b class="neg">${netYen(min)}</b></div><div class="stat-winrate"><span>勝率</span><b>${es.length?(wins/es.length*100).toFixed(1):0}%</b></div></div></div>`}
function periodSeries(es,r,type,mode="calendar",valueFn=net){
 // 収支推移：開始点を0円にし、各記録について「投資→回収」の順で累積する。
 // 投資・回収は現金/持ち玉を円換算した値を使うため、途中経過も実際の資金移動に沿って表示する。
 if(!r||!r[0]||!r[1])return [];
 const filtered=es.filter(e=>e&&e.date&&inPeriod(e,r)).slice().sort((a,b)=>a.date.localeCompare(b.date));
 if(!filtered.length)return [];
 const groups={};
 filtered.forEach(e=>(groups[e.date]??=[]).push(e));
 let dates;
 if(mode==="continuous") dates=[...new Set(filtered.map(e=>e.date))].sort();
 else{
   const start=parseDate(r[0]),end=parseDate(r[1]);
   dates=[];
   for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1))dates.push(dateKey(d));
 }
 let cum=0;
 const out=[{label:"開始",value:0,date:null,tickUnit:type}];
 dates.forEach(k=>{
   const day=groups[k]||[];
   day.forEach((e,idx)=>{
     const inv=invYen(e),ret=retYen(e);
     // 投資で一度下がり、その後の回収で上がる動きを明示する。
     if(inv){cum-=inv;out.push({label:"",value:cum,date:k,tickUnit:type,phase:"invest"});}
     if(ret){cum+=ret;out.push({label:idx===day.length-1?periodLabelFor(k,type):"",value:cum,date:k,tickUnit:type,phase:"return"});}
     if(!inv&&!ret)out.push({label:idx===day.length-1?periodLabelFor(k,type):"",value:cum,date:k,tickUnit:type,phase:"none"});
   });
   // 通常表示では記録のない日も軸上に残す。記録がある日は上の投資/回収点を使用する。
   if(!day.length && mode!=="continuous")out.push({label:periodLabelFor(k,type),value:cum,date:k,tickUnit:type,phase:"empty"});
 });
 return out;
}
function periodLabelFor(k,type){
 const d=parseDate(k);
 if(type==="year") return d.getDate()===1?`${d.getMonth()+1}月`:"";
 if(type==="all") return d.getDate()===1&&d.getMonth()===0?`${d.getFullYear()}年`:"";
 return `${d.getMonth()+1}/${d.getDate()}`;
}

function chartScale(vals){
 const finite=vals.filter(Number.isFinite);
 if(!finite.length)return {min:-10000,max:10000,step:10000};
 let lo=Math.min(0,...finite),hi=Math.max(0,...finite);
 const steps=[10000,20000,50000,100000,200000,500000,1000000];
 const span=Math.max(hi-lo,10000);
 let step=steps.find(s=>span/s<=8)||1000000;
 let min=Math.floor(lo/step)*step,max=Math.ceil(hi/step)*step;
 if(min===max){min-=step;max+=step;}
 return {min,max,step};
}

function drawChart(canvas,data){
 if(!canvas)return;
 const dpr=2,cssW=Math.max(canvas.clientWidth||600,280),h=250;
 canvas.width=cssW*dpr;canvas.height=h*dpr;
 const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cssW,h);
 if(!data.length){ctx.fillStyle="#8793aa";ctx.font="12px system-ui";ctx.fillText("データがありません",12,28);return;}
 const padL=66,padR=14,padT=16,padB=30,w=cssW;
 const vals=data.map(x=>x.value),scale=chartScale(vals),min=scale.min,max=scale.max,step=scale.step;
 const plotW=w-padL-padR,plotH=h-padT-padB;
 const x=i=>padL+plotW*(data.length===1?0.5:i/(data.length-1));
 const y=v=>padT+plotH*(max-v)/(max-min);
 // 1万円/2万円刻みの水平ライン
 ctx.font="10px system-ui";ctx.textAlign="right";
 for(let v=min;v<=max;v+=step){
   const yy=y(v);
   ctx.beginPath();ctx.moveTo(padL,yy);ctx.lineTo(w-padR,yy);
   if(v===0){
     ctx.setLineDash([]);ctx.strokeStyle="#66738c";ctx.lineWidth=1.4;
   }else{
     ctx.setLineDash([2,4]);ctx.strokeStyle="#445066";ctx.lineWidth=1;
   }
   ctx.stroke();
   ctx.fillStyle="#8793aa";ctx.fillText(netYen(v),padL-7,yy+3);
 }
 // 推移線
 ctx.setLineDash([]);
 ctx.beginPath();data.forEach((p,i)=>i?ctx.lineTo(x(i),y(p.value)):ctx.moveTo(x(i),y(p.value)));
 ctx.strokeStyle="#8b7cf6";ctx.lineWidth=2;ctx.stroke();
 // データ点は常に日ごと。横軸ラベルだけ期間の指定単位に合わせる。
 ctx.textAlign="center";ctx.fillStyle="#8793aa";
 const labeled=data.map((p,i)=>({p,i})).filter(o=>o.p.label);
 if(labeled.length<=10){labeled.forEach(({p,i})=>ctx.fillText(p.label,x(i),h-8));}
 else{
  const every=Math.max(1,Math.ceil(labeled.length/8));
  const candidates=labeled.filter((o,j)=>j===0||j===labeled.length-1||j%every===0);
  const minLabelGap=Math.max(42,Math.min(70,plotW/7));
  const placed=[];
  candidates.forEach((o)=>{
    if(!placed.length || x(o.i)-x(placed[placed.length-1].i)>=minLabelGap) placed.push(o);
    else if(o===candidates[candidates.length-1]){
      placed.pop();
      if(!placed.length || x(o.i)-x(placed[placed.length-1].i)>=minLabelGap) placed.push(o);
    }
  });
  placed.forEach(({p,i})=>ctx.fillText(p.label,x(i),h-8));
}
}

function exportBackup(){
  let counterDaily={};try{const x=JSON.parse(localStorage.getItem("gambling-counter-daily-v1")||"{}");if(x&&typeof x==="object")counterDaily=x}catch(e){}
  const payload={version:2,exportedAt:new Date().toISOString(),entries,machineData:MACHINE_DATA,counterDaily};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`収支管理バックアップ_${dateKey(new Date())}.json`;a.click();URL.revokeObjectURL(a.href);
}
function importBackup(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{try{const data=JSON.parse(reader.result);if(!Array.isArray(data.entries))throw new Error("収支データがありません");if(!confirm("現在の収支データをバックアップ内容で置き換えますか？"))return;entries=data.entries;localStorage.setItem(KEY,JSON.stringify(entries));if(data.counterDaily&&typeof data.counterDaily==="object")localStorage.setItem("gambling-counter-daily-v1",JSON.stringify(data.counterDaily));if(data.machineData?.パチスロ&&data.machineData?.パチンコ){MACHINE_DATA.パチスロ=data.machineData.パチスロ;MACHINE_DATA.パチンコ=data.machineData.パチンコ;localStorage.setItem(MACHINE_DATA_KEY,JSON.stringify(MACHINE_DATA));}renderAll();alert("バックアップを復元しました");}catch(e){alert("バックアップの読み込みに失敗しました");}};reader.readAsText(file);
}

function recentMachines(genre){return [...new Set(entries.slice().sort((a,b)=>b.date.localeCompare(a.date)).filter(e=>!genre||e.genre===genre).map(e=>e.machine).filter(Boolean))].slice(0,6)}
function machineOptions(genre,filter=""){const q=filter.trim().toLowerCase();return [...new Set((MACHINE_DATA[genre]||[]).filter(x=>x.toLowerCase().includes(q)))]}
function rowMachinePickerHtml(i){return `<div class="machinePicker"><div class="machineSearchRow"><input class="rowSearch" data-row="${i}" placeholder="機種名を検索…" autocomplete="off"><button type="button" class="clearRowSearch" data-row="${i}">×</button></div><div class="machineSuggestions" data-row="${i}"></div><select class="rowMachine hiddenField" data-row="${i}"><option value="">機種を選択してください</option></select><div class="recentLabel">最近使った機種</div><div class="rowRecent recentMachines" data-row="${i}"></div><button type="button" class="ghost full customRowBtn" data-row="${i}">機種リストにない場合は手入力</button><input class="rowCustom hiddenField" data-row="${i}" placeholder="機種名を入力"></div>`}
function rateOptionsHtml(genre,current){const rates=RATE_OPTIONS[genre]||[];return rates.map(r=>`<option value="${r}" ${Number(current)===r?'selected':''}>${r}円</option>`).join('')}
function addEntryRow(data={}){
 const wrap=$("#entryRows"),i=Date.now()+Math.floor(Math.random()*1000);
 const div=document.createElement("div");div.className="entryRow card";div.dataset.row=i;
 const genre0=data.genre||'パチスロ', rate0=Number(data.rate)||RATE_OPTIONS[genre0]?.[0]||1;
 const invCash0=Object.prototype.hasOwnProperty.call(data,'investmentCash')?Number(data.investmentCash||0):((data.investType==='cash')?Number(data.invest||0):0);
 const invHold0=Object.prototype.hasOwnProperty.call(data,'investmentHold')?Number(data.investmentHold||0):((data.investType==='hold')?Number(data.invest||0):0);
 const retCash0=Object.prototype.hasOwnProperty.call(data,'returnCash')?Number(data.returnCash||0):((data.returnType==='cash')?Number(data.return||0):0);
 const retHold0=Object.prototype.hasOwnProperty.call(data,'returnHold')?Number(data.returnHold||0):((data.returnType==='hold')?Number(data.return||0):0);
 const blankOrCash=v=>v===0?'':String(cashInputValue(v));
 const blankOrUnit=v=>v===0?'':String(v);
 div.innerHTML=`<div class="rowHead"><div><span class="entryRowKicker">入力 ${wrap.children.length+1}</span><h3>機種 ${wrap.children.length+1}</h3></div><button type="button" class="removeRow danger" data-row="${i}">削除</button></div><section class="entrySection storeSection"><div class="entrySectionTitle"><span>🏪</span><b>店舗</b><small>どこで遊技したか</small></div>${storePickerHtml()}</section><section class="entrySection conditionSection"><div class="entrySectionTitle"><span>🎰</span><b>遊技条件</b><small>ジャンル・レート</small></div><label>ジャンル<select class="rowGenre" data-row="${i}"><option>パチスロ</option><option>パチンコ</option><option>競馬</option><option>競艇</option><option>その他</option></select></label><label>レート<select class="rowRate" data-row="${i}">${rateOptionsHtml(genre0,rate0)}</select></label><div class="rateProfileInfo"></div><button type="button" class="ghost full editRateProfileBtn">貸出・交換条件を変更</button><div class="rateProfileEditor hiddenField"><div class="two"><label>貸出数量（枚・玉）<input class="rowLoanUnits" type="number" min="0" step="1" placeholder="例：49"></label><label>貸出金額（円）<input class="rowLoanYen" type="number" min="0" step="1" value="1000"></label></div><div class="two"><label>交換数量（枚・玉）<input class="rowExchangeUnits" type="number" min="0" step="1" placeholder="例：50"></label><label>交換金額（円）<input class="rowExchangeYen" type="number" min="0" step="1" value="1000"></label></div><div class="storeRateActions"><button type="button" class="primary saveEntryRateProfile">この条件を保存</button><button type="button" class="danger deleteEntryRateProfile">ユーザー設定を削除</button></div></div></section><section class="entrySection machineSection"><div class="entrySectionTitle"><span>🎮</span><b>機種</b><small>対象を選択</small></div>${rowMachinePickerHtml(i)}</section><section class="entrySection moneySection"><div class="entrySectionTitle"><span>💰</span><b>投資・回収</b><small>現金と持ち玉を分離して記録</small></div><div class="moneySplitHead"><span></span><b>現金（千円）</b><b>持ち玉（${unitFor(genre0)}）</b></div><div class="moneySplitRow"><strong>投資</strong><input class="rowInvestmentCash" data-row="${i}" type="number" min="0" step="0.1" placeholder="例：1 = 1,000円" value="${blankOrCash(invCash0)}"><input class="rowInvestmentHold" data-row="${i}" type="number" min="0" step="1" placeholder="数量" value="${blankOrUnit(invHold0)}"></div><div class="moneySplitRow"><strong>回収</strong><input class="rowReturnCash" data-row="${i}" type="number" min="0" step="0.1" placeholder="例：1 = 1,000円" value="${blankOrCash(retCash0)}"><input class="rowReturnHold" data-row="${i}" type="number" min="0" step="1" placeholder="数量" value="${blankOrUnit(retHold0)}"></div><button type="button" class="ghost full carryBtn">← 前の機種の持ち玉を引き継ぐ</button><div class="netPreview">収支（円換算） <strong class="rowNet" data-row="${i}">¥0</strong><small class="rowUnitPreview"></small></div></section><section class="entrySection memoSection"><div class="entrySectionTitle"><span>📝</span><b>メモ</b><small>任意</small></div><label>メモ<textarea class="rowMemo" data-row="${i}" rows="2">${escapeHtml(data.memo||"")}</textarea></label></section>`;
 wrap.appendChild(div); fillStorePicker(div,data);
 const genre=div.querySelector('.rowGenre'),rate=div.querySelector('.rowRate');
 genre.value=genre0;
 const search=div.querySelector('.rowSearch'),select=div.querySelector('.rowMachine'),custom=div.querySelector('.rowCustom');
 const inputs=[...div.querySelectorAll('.rowInvestmentCash,.rowInvestmentHold,.rowReturnCash,.rowReturnHold')];
 function refreshRate(){const old=rate.value;rate.innerHTML=rateOptionsHtml(genre.value,old);if(!rate.value)rate.value=RATE_OPTIONS[genre.value]?.[0]||1;const u=unitFor(genre.value);div.querySelector('.moneySplitHead').innerHTML=`<span></span><b>現金（千円）</b><b>持ち玉（${u}）</b>`;div.querySelector('.rowInvestmentHold').placeholder=`${u}数量`;div.querySelector('.rowReturnHold').placeholder=`${u}数量`;refreshEntryRateInfo(div);}
 function populate(){const query=search.value.trim(),list=query?machineOptions(genre.value,query):[],current=div.dataset.machine||data.machine||select.value,suggestions=div.querySelector('.machineSuggestions');select.innerHTML='<option value="">機種を選択してください</option>'+list.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("");if(query&&list.length){const limited=list.slice(0,10);suggestions.innerHTML=limited.map(x=>`<button type="button" class="machineSuggestion" data-machine="${escapeHtml(x)}"><span>${escapeHtml(x)}</span><small>${escapeHtml(genre.value)}</small></button>`).join("");if(list.length>10)suggestions.insertAdjacentHTML('beforeend',`<div class="suggestionMore">${list.length-10}件は入力を続けるとさらに絞り込めます</div>`)}else if(query)suggestions.innerHTML='<div class="suggestionEmpty">該当する機種がありません</div>';else suggestions.innerHTML='';suggestions.querySelectorAll('.machineSuggestion').forEach(b=>b.onclick=()=>{const value=b.dataset.machine;div.dataset.machine=value;search.value=value;select.value=value;custom.value='';custom.classList.add('hiddenField');suggestions.innerHTML='';updateRowPreview(div)});if(list.includes(current)){select.value=current;custom.classList.add('hiddenField');div.dataset.machine=current}else if(current){custom.classList.remove('hiddenField');custom.value=current;select.value='';div.dataset.machine=current}renderRowRecent(div);updateRowPreview(div)}
 genre.onchange=()=>{div.dataset.machine='';search.value='';custom.value='';custom.classList.add('hiddenField');refreshRate();populate();updateBatchTotal()};
 rate.onchange=()=>{refreshEntryRateInfo(div);updateRowPreview(div);updateBatchTotal()};
 search.oninput=populate;
 div.querySelector('.clearRowSearch').onclick=()=>{search.value='';div.dataset.machine='';select.value='';populate();search.focus()};
 select.onchange=()=>{div.dataset.machine=select.value;search.value=select.value;custom.value='';custom.classList.add('hiddenField');div.querySelector('.machineSuggestions').innerHTML='';updateRowPreview(div)};
 div.querySelector('.customRowBtn').onclick=()=>{custom.classList.toggle('hiddenField');if(!custom.classList.contains('hiddenField')){select.value='';div.dataset.machine='';custom.focus()}else{custom.value='';updateRowPreview(div)}};custom.oninput=()=>{div.dataset.machine=custom.value.trim();updateRowPreview(div)};
 div.querySelector('.carryBtn').onclick=()=>{const prev=div.previousElementSibling;if(!prev)return alert('前の機種がありません');const p=prev.querySelector('.rowReturnHold');if(!p)return;const v=p.value.trim();if(!v)return alert('前の機種の回収「持ち玉」が入力されていません');const pg=prev.querySelector('.rowGenre').value,pr=Number(prev.querySelector('.rowRate').value||1);if(pg!==genre.value){genre.value=pg;refreshRate();populate()}rate.value=String(pr);div.querySelector('.rowInvestmentHold').value=v;updateRowPreview(div);updateBatchTotal()};
 div.querySelector('.removeRow').onclick=()=>{if(wrap.children.length<=1){alert('少なくとも1台は入力してください');return}div.remove();renumberRows();updateBatchTotal()};
 inputs.forEach(x=>x.oninput=x.onchange=()=>{updateRowPreview(div);updateBatchTotal()});
 refreshRate();setupEntryRateEditor(div);
 if(data.machine){div.dataset.machine=data.machine;if(machineOptions(genre.value).includes(data.machine)){search.value=data.machine;custom.value='';custom.classList.add('hiddenField')}else{search.value='';custom.classList.remove('hiddenField');custom.value=data.machine}}
 populate();refreshEntryRateInfo(div);updateRowPreview(div);updateBatchTotal();
}
function renderRowRecent(div){
 const wrap=div.querySelector('.recentMachines'),rs=recentMachines(div.querySelector('.rowGenre')?.value);
 wrap.innerHTML=rs.length?rs.map(x=>`<button type="button" class="recentMachine" data-machine="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join(""):'<span class="neutral">まだありません</span>';
 wrap.querySelectorAll('.recentMachine').forEach(b=>b.onclick=()=>{
   const value=b.dataset.machine;
   const found=entries.slice().reverse().find(e=>e.machine===value);
   const genre=div.querySelector('.rowGenre'),rate=div.querySelector('.rowRate');
   if(found?.genre && genre.value!==found.genre){genre.value=found.genre;genre.dispatchEvent(new Event('change',{bubbles:true}));}
   if(found?.rate){rate.value=String(found.rate);rate.dispatchEvent(new Event('change',{bubbles:true}));}
   const q=div.querySelector('.rowSearch'),c=div.querySelector('.rowCustom');
   q.value=value;c.value='';c.classList.add('hiddenField');
   q.dispatchEvent(new Event('input',{bubbles:true}));
 });
}
function rowInputYen(div,kind){
 const genre=div.querySelector('.rowGenre').value,rate=Number(div.querySelector('.rowRate').value||1),profile=getStoreRateProfile(collectStore(div),genre,rate);
 const cash=Number(div.querySelector(kind==='investment'?'.rowInvestmentCash':'.rowReturnCash').value||0)*1000;
 const hold=Number(div.querySelector(kind==='investment'?'.rowInvestmentHold':'.rowReturnHold').value||0);
 if(hold){const v=holdYenFromProfile(hold,profile,kind,genre,rate);if(v===null)return null;return cash+v;}
 return cash;
}
function updateRowPreview(div){const inv=rowInputYen(div,'investment'),ret=rowInputYen(div,'return'),missing=inv===null||ret===null,n=missing?0:ret-inv,el=div.querySelector('.rowNet');el.textContent=missing?'条件未設定':netYen(n);el.className='rowNet '+(missing?'neutral':n>0?'pos':n<0?'neg':'neutral');div.querySelector('.rowUnitPreview').textContent=missing?'持ち玉／持ちメダルを入力した場合は貸出・交換条件が必要':`投資 現金 ${yen(Number(div.querySelector('.rowInvestmentCash').value||0)*1000)} + 持ち玉 ${Number(div.querySelector('.rowInvestmentHold').value||0).toLocaleString()}${unitFor(div.querySelector('.rowGenre').value)} ／ 回収 現金 ${yen(Number(div.querySelector('.rowReturnCash').value||0)*1000)} + 持ち玉 ${Number(div.querySelector('.rowReturnHold').value||0).toLocaleString()}${unitFor(div.querySelector('.rowGenre').value)}`}
function updateBatchTotal(){
 let inv=0,ret=0,raw=0,personalInv=0,missing=false;
 $$('#entryRows .entryRow').forEach(d=>{const i=rowInputYen(d,'investment'),r=rowInputYen(d,'return');if(i===null||r===null)missing=true;else{inv+=i;ret+=r;raw+=r-i}personalInv+=Number(d.querySelector('.rowInvestmentCash').value||0)*1000});
 const nori=!!$("#batchNori")?.checked;
 if(missing){$("#batchNet").textContent='条件未設定';$("#batchNet").className='neutral';$("#batchInvest").textContent='—';$("#batchReturn").textContent='—';return}
 const settlementRaw=$("#batchSettlement")?.value.trim()||'',settlement=settlementRaw===''?0:Number(settlementRaw),n=nori?settlement-personalInv:raw;
 $("#batchInvest").textContent=yen(nori?personalInv:inv);$("#batchInvestLabel").textContent=nori?'自分の投資額（現金のみ）':'合計投資';$("#batchReturn").textContent=yen(ret);$("#batchNet").textContent=netYen(n);$("#batchNet").className=n>0?'pos':n<0?'neg':'neutral';
}
function renumberRows(){$$('#entryRows .entryRow').forEach((d,i)=>d.querySelector('.rowHead h3').textContent=`機種 ${i+1}`)}
function collectRow(div){
 const custom=div.querySelector('.rowCustom'),select=div.querySelector('.rowMachine');
 const machine=custom.classList.contains('hiddenField')?(select.value||div.dataset.machine||''):custom.value.trim();
 const st=collectStore(div),genre=div.querySelector('.rowGenre').value,rate=Number(div.querySelector('.rowRate').value||1);
 const profile=getStoreRateProfile(st,genre,rate)||null;
 const investmentCash=Number(div.querySelector('.rowInvestmentCash').value||0)*1000;
 const investmentHold=Number(div.querySelector('.rowInvestmentHold').value||0);
 const returnCash=Number(div.querySelector('.rowReturnCash').value||0)*1000;
 const returnHold=Number(div.querySelector('.rowReturnHold').value||0);
 return {date:$("#entryDate").value,genre,rate,machine,investmentCash,investmentHold,returnCash,returnHold,memo:div.querySelector('.rowMemo').value.trim(),prefecture:st?.prefecture||"",city:st?.city||"",store:st?.store||"",storeUrl:st?.url||"",rateProfile:profile?{loanUnits:Number(profile.loanUnits)||0,loanYen:Number(profile.loanYen)||1000,exchangeUnits:Number(profile.exchangeUnits)||0,exchangeYen:Number(profile.exchangeYen)||1000}:null};
}
function openForm(date=dateKey(new Date()),id=null){
 const dialog=$("#entryDialog");
 if(!dialog){alert("入力画面の読み込みに失敗しました。ページを再読み込みしてください。");return;}
 editingId=id;
 const form=$("#entryForm");
 if(form)form.reset();
 $("#batchNori").checked=false;
 $("#batchSettlement").value='';
 $("#batchSettlement").disabled=true;
 $("#batchSettlementWrap").classList.add('hiddenField');
 $("#entryId").value=id||'';
 $("#entryDate").value=date||dateKey(new Date());
 $("#dialogTitle").textContent=id?'収支を編集':'収支をまとめて入力';
 $("#deleteEntry").style.display=id?'block':'none';
 $("#entryRows").innerHTML='';
 if(id){const e=entries.find(x=>x.id===id);if(e){$("#entryDate").value=e.date;addEntryRow(e);if(e.noriuchi){$("#batchNori").checked=true;$("#batchSettlement").value=e.settlement!=null?Number(e.settlement):'';$("#batchSettlement").disabled=false;$("#batchSettlementWrap").classList.remove('hiddenField')}}}else addEntryRow({date:$("#entryDate").value});
 $("#addEntryRow").style.display=id?'none':'block';
 updateBatchTotal();
 try{ if(typeof dialog.showModal==='function') dialog.showModal(); else dialog.setAttribute('open',''); }catch(err){ dialog.setAttribute('open',''); }
}
function editEntry(id){openForm('',id)}
function deleteById(id){if(confirm('この記録を削除しますか？')){entries=entries.filter(e=>e.id!==id);save();renderReport()}}
function switchPage(name){$$('.tab').forEach(x=>x.classList.toggle('active',x.dataset.page===name));$$('.page').forEach(x=>x.classList.toggle('active',x.id===name+'Page'));window.scrollTo({top:0,behavior:'smooth'})}

$("#batchNori").onchange=()=>{const on=$("#batchNori").checked;$("#batchSettlementWrap").classList.toggle('hiddenField',!on);$("#batchSettlement").disabled=!on;if(!on)$("#batchSettlement").value='';updateBatchTotal()};
$("#batchSettlement").oninput=()=>updateBatchTotal();
$("#entryForm").onsubmit=e=>{
 e.preventDefault();
 const rows=$$('#entryRows .entryRow');
 if(!rows.length){alert('記録する機種がありません');return}
 const objs=rows.map(collectRow);
 if(objs.some(x=>!x.date)){alert('日付を入力してください');return}
 if(objs.some(x=>!x.machine)){alert('機種・対象を選択または入力してください');return}
 const missingRateProfile=rows.some(d=>{const genre=d.querySelector('.rowGenre').value,rate=Number(d.querySelector('.rowRate').value||1),profile=getStoreRateProfile(collectStore(d),genre,rate);const ih=Number(d.querySelector('.rowInvestmentHold').value||0),rh=Number(d.querySelector('.rowReturnHold').value||0);return (ih>0&&!(profile?.loanUnits>0&&profile?.loanYen>0))||(rh>0&&!(profile?.exchangeUnits>0&&profile?.exchangeYen>0));});
 if(missingRateProfile){alert('持ち玉・持ちメダルを使用する場合は、店舗＋ジャンル＋レートの貸出・交換条件を設定してください。');return}
 if(objs.some(x=>[x.investmentCash,x.investmentHold,x.returnCash,x.returnHold].some(v=>!Number.isFinite(v)||v<0))){alert('投資・回収は0以上の数値を入力してください');return}
 const nori=!!$("#batchNori")?.checked;
 const settlementRaw=$("#batchSettlement")?.value.trim()||'';
 if(nori && (settlementRaw==='' || !Number.isFinite(Number(settlementRaw)))){alert('ノリ打ちの場合は「自分の最終精算額」を入力してください');$("#batchSettlement").focus();return}
 if(editingId){
   const obj={...objs[0],id:editingId};
   if(nori){obj.noriuchi=true;obj.settlement=Number(settlementRaw)}else{delete obj.noriuchi;delete obj.settlement}
   entries=entries.map(x=>x.id===editingId?obj:x);
   rememberCustomMachine(obj.genre,obj.machine); rememberStore(obj);
 }else{
   objs.forEach((x,idx)=>{const obj={...x,id:newId()};if(nori&&idx===0){obj.noriuchi=true;obj.settlement=Number(settlementRaw)}entries.push(obj); rememberCustomMachine(x.genre,x.machine); rememberStore(x)});
 }
 localStorage.setItem(KEY,JSON.stringify(entries));
 const d=objs[0].date;
 $("#entryDialog").close();
 reportDate=parseDate(d);viewDate=parseDate(d);
 renderAll();switchPage('report');
};
$("#deleteEntry").onclick=()=>{if(editingId&&confirm('この記録を削除しますか？')){entries=entries.filter(e=>e.id!==editingId);$("#entryDialog").close();save()}};
$("#cancelDialog").onclick=$("#closeDialog").onclick=()=>$("#entryDialog").close();
$("#prevMonth").onclick=()=>{viewDate.setMonth(viewDate.getMonth()-1);renderCalendar()};
$("#nextMonth").onclick=()=>{viewDate.setMonth(viewDate.getMonth()+1);renderCalendar()};
$("#monthTitle").onchange=()=>{const v=$("#monthTitle").value;if(v){const [yy,mm]=v.split("-").map(Number);viewDate=new Date(yy,mm-1,1);renderCalendar()}};
$("#todayBtn").onclick=()=>{viewDate=new Date();renderCalendar()};
$("#reportPrev").onclick=()=>{reportDate.setDate(reportDate.getDate()-1);renderReport()};$("#reportNext").onclick=()=>{reportDate.setDate(reportDate.getDate()+1);renderReport()};
$("#period").onchange=()=>{updatePeriodControls();renderStats()};$("#periodMonth").onchange=renderStats;$("#periodYear").onchange=renderStats;$("#group").onchange=()=>{renderStats();};$("#analysisTarget").onchange=renderStats;$("#detailSort").onchange=renderStats;$("#chartMode").onchange=renderStats;
$$('.tab').forEach(b=>b.onclick=()=>{switchPage(b.dataset.page);renderAll();if(b.dataset.page==='settings')updateMachineUpdatedUI()});
$("#updateMachines").onclick=()=>updateMachineData(false);$("#updateStores").onclick=async()=>{const ok=await updateStoreData(false);await updateStoreRates(false);alert(ok?"店舗データを更新しました。次回の入力から最新店舗が候補に表示されます。":"店舗データを更新できませんでした。現在の保存済み店舗データを使用します。");};$("#exportData").onclick=exportBackup;$("#importData").onchange=e=>importBackup(e.target.files[0]);
$("#themeDark").onclick=()=>applyTheme('dark');$("#themeLight").onclick=()=>applyTheme('light');
$("#netDisplayHundreds").onchange=e=>{localStorage.setItem(NET_DISPLAY_KEY,e.target.checked?"hundreds":"yen");applyNetDisplaySetting();renderAll()};
window.addEventListener('online',()=>setMachineStatus('オンライン','ok'));window.addEventListener('offline',()=>setMachineStatus('オフライン：保存済みデータを使用','neutral'));
// 8.2: 初期描画より先にイベントを登録。初期描画中に別処理が失敗しても「＋ 記録」が無反応にならないようにします。
loadTheme();
applyNetDisplaySetting();
loadStoreData();
updateStoreData(true);
updateStoreRates(true);
loadMachineData();
updateCustomMachineCount();
setupPeriodSelectors();
setupStoreRateManager();
$("#reportAdd").onclick=()=>openForm(dateKey(reportDate));
$("#reportAdd2").onclick=()=>openForm(dateKey(reportDate));
$("#addFromStats").onclick=()=>openForm();
$("#addEntryRow").onclick=()=>{const prev=$("#entryRows .entryRow:last-child");let storeData={};if(prev){const st=collectStore(prev);if(st?.prefecture||st?.city||st?.store)storeData={prefecture:st.prefecture||"",city:st.city||"",store:st.store||"",storeUrl:st.url||""};}addEntryRow(storeData)};
updateMachineUpdatedUI();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");
try{renderAll();}catch(err){console.error("初期描画エラー:",err);}
autoMachineUpdate();
