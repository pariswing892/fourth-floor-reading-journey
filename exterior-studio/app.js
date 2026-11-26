const el=id=>document.getElementById(id);
const trialName=new URLSearchParams(location.search).get('trial');
const referenceTrial=trialName==='reference';
const goalTrial=trialName==='goal';
const draftKey=referenceTrial?'b-reference-selected-photos-v1':goalTrial?'goal-photo-trial':'current';
const initialScheme=new URLSearchParams(location.search).get('scheme');
let draft=newDraft(), floor=0, scheme=Object.hasOwn(SCHEMES,initialScheme)?initialScheme:'A',mode='overview',region=1,zoom=1;
const validTitle=s=>typeof s==='string'&&/^\p{Script=Han}{4}$/u.test(s);
const range=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
const status=s=>{el('status').textContent=s;};
const rasterData=/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/;
function validate(d){
  if(!d||d.version!==1||!range(d.safe,0,20)||!range(d.bleed,0,10)||!Array.isArray(d.floors)||d.floors.length!==4)throw Error('請選擇四層外牆工程的草稿。');
  for(const f of d.floors){
    if(!validTitle(f.title)||![0,1,2].includes(f.tone)||!range(f.size,64,86)||!range(f.spacing,4,17)||!Array.isArray(f.photos)||f.photos.length!==2)throw Error('草稿的文字或版面數值有誤。');
    for(const p of f.photos){
      if(!p||typeof p.src!=='string'||(p.src&&!rasterData.test(p.src))||!range(p.zoom,1,4)||!range(p.x,0,100)||!range(p.y,0,100))throw Error('草稿的照片資料有誤。');
      delete p.rightY;
      if(p.src&&(!range(p.width,1,100000)||!range(p.height,1,100000)))throw Error('照片尺寸有誤。');
    }
  }
  if(d.bTitle!==undefined&&!Object.hasOwn(B_TITLES,d.bTitle))throw Error('B 版中央構圖設定有誤。');
  delete d.gFrame;
  if(d.cTitle!==undefined&&!Object.hasOwn(C_TITLES,d.cTitle))throw Error('中央構圖設定有誤。');
  if(d.pressFace!==undefined&&!Object.hasOwn(FACE_NAMES,d.pressFace))throw Error('C2 字體設定有誤。');
  const faces=d.faceByEdition??{};
  if(typeof faces!=='object'||Array.isArray(faces))throw Error('款式字體設定有誤。');
  // Older drafts include font preferences for the four retired designs.
  for(const retired of ['E','F','G','H'])delete faces[retired];
  if(Object.entries(faces).some(([k,v])=>!Object.hasOwn(DEFAULT_FACES,k)||!Object.hasOwn(FACE_NAMES,v)))throw Error('款式字體設定有誤。');
  d.faceByEdition={...DEFAULT_FACES,C2:d.pressFace??DEFAULT_FACES.C2,...faces};
  delete d.pressFace;
  return d;
}
let db;
async function openDraft(){
  db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('campus-exterior-studio-v1',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('drafts');
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  return new Promise((resolve,reject)=>{
    const req=db.transaction('drafts').objectStore('drafts').get(draftKey);
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
function persist(){
  try{
    if(!db)throw Error();
    const tx=db.transaction('drafts','readwrite');
    tx.objectStore('drafts').put(draft,draftKey);
    tx.onabort=()=>status('本機儲存失敗。請下載草稿以保存修改。');
  }catch{status('此瀏覽器暫無法自動儲存。請下載草稿以保存修改。');}
}
let selection;
function applyPhotoSet(name){
  selection[name].forEach((pair,i)=>{
    const previous=draft.floors[i].photos;
    draft.floors[i].photos=pair.map(id=>previous.find(p=>p.id===id)||
      {...selection.photos[i].find(p=>p.id===id)});
  });
}
function photoMenu(j){
  if(!selection)return '';
  const current=draft.floors[floor].photos[j].id;
  const options=selection.photos[floor].map(p=>'<option value="'+p.id+'" '+(current===p.id?'selected':'')+'>'+p.id+'　'+textEscape(p.caption)+'</option>').join('');
  return '<label>已選活動相片<select aria-label="'+slotName(j)+'已選活動相片" data-selected-photo="'+j+'"><option value="" disabled '+(current?'':'selected')+'>選取相片</option>'+options+'</select></label>';
}
function slotName(j){return ['左側','右側'][j];}
function photoCaption(i,j){
  const p=draft.floors[i].photos[j];
  return textEscape(p.src&&typeof p.caption==='string'?p.caption:FLOORS[i].subjects[j]);
}
function swatch(i){return '<i class="swatch" style="--tone:'+palette(i,draft.floors[i].tone,scheme).main+'"></i>';}
function render(){
  const f=draft.floors[floor], overview=mode==='overview',detail=mode==='detail';
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===mode));
  document.querySelectorAll('[data-scheme]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.scheme===scheme));
  el('bTitles').hidden=scheme!=='B';
  el('photoSets').hidden=!selection;
  if(selection)document.querySelectorAll('[data-photo-set]').forEach(button=>{
    const matches=selection[button.dataset.photoSet].every((pair,i)=>pair.every((id,j)=>draft.floors[i].photos[j].id===id));
    button.setAttribute('aria-pressed',String(matches));
  });
  document.querySelectorAll('[data-b-title]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.bTitle===(draft.bTitle||'sweep')));
  el('cTitles').hidden=scheme!=='C';
  el('titleFace').value=draft.faceByEdition[titleEdition(scheme,draft.cTitle)];
  document.querySelectorAll('[data-c-title]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.cTitle===(draft.cTitle||'fold')));
  el('viewTitle').textContent=overview?'四層立面　／　方案 '+scheme:FLOORS[floor].name+'　'+f.title+'　／　'+(detail?REGION_NAMES[region]:'全幅');
  const opts={safety:el('safety').checked,center:el('center').checked,region:detail?region:null};
  const rows=(overview?[0,1,2,3]:[floor]).map(i=>{
    const svg=banner(draft,i,scheme,opts);
    if(!overview)return '<div class="artView">'+svg+'</div>';
    return '<div class="floorRow"><div class="rowMeta"><span>'+swatch(i)+FLOORS[i].name+'　／　'+FLOORS[i].color+'</span><small>'+[0,1].map(j=>photoCaption(i,j)).join('　·　')+'</small></div><button class="artButton" data-floor="'+i+'" aria-label="查看'+FLOORS[i].name+'全幅">'+svg+'</button></div>';
  }).join('');
  el('view').innerHTML='<div class="sheet" style="width:'+zoom*100+'%">'+rows+'</div>';
  el('scale').textContent=zoom*100+'%';el('minus').disabled=zoom<=1;el('plus').disabled=zoom>=4;
  el('viewHint').textContent=overview?'由上至下排列　·　點選橫額查看全幅':detail?'分區放大　·　'+REGION_NAMES[region]:'全幅　·　774 × 58 吋';
  const visiblePhotos=(overview?draft.floors:[f]).flatMap(v=>v.photos);
  const placed=visiblePhotos.filter(p=>p.src).length;
  el('guideHint').textContent=opts.safety?'綠虛線：安全 '+draft.safe+' 吋　｜　粉紅線：出血 '+draft.bleed+' 吋':(placed?'已置入活動照片　'+placed+' / '+visiblePhotos.length:'活動插畫為待換照片位置');
  el('floors').innerHTML=draft.floors.map((v,i)=>'<button data-floor="'+i+'" aria-pressed="'+(!overview&&floor===i)+'">'+swatch(i)+'<small>'+FLOORS[i].name+'</small>'+textEscape(v.title)+'</button>').join('');
  el('regions').hidden=!detail;
  el('regions').innerHTML=REGION_NAMES.map((s,j)=>'<button aria-pressed="'+(j===region)+'" data-region="'+j+'">'+s+'</button>').join('');
  if(!el('boardPanel').hidden)el('boardView').innerHTML=reviewBoard(draft,scheme);
}
function populateEditor(){
  const f=draft.floors[floor];
  el('level').innerHTML=draft.floors.map((v,i)=>'<option value="'+i+'">'+FLOORS[i].name+'　'+textEscape(v.title)+'</option>').join('');
  el('level').value=floor;el('headline').value=f.title;el('titleHint').textContent='';
  el('tone').innerHTML=['標準','濃調','亮調'].map((s,j)=>'<option value="'+j+'">'+FLOORS[floor].color+'　·　'+s+'</option>').join('');
  el('tone').value=f.tone;el('font').value=f.size;el('fontOut').value=f.size/2+' 吋';el('track').value=f.spacing;el('trackOut').value=titleSpacing(f,scheme)/2+' 吋';
  el('margin').value=draft.safe;el('bleed').value=draft.bleed;
  el('photoEditors').innerHTML=f.photos.map((p,j)=>{
    const sliders=[['zoom','裁切倍率',1,4,.05],['x','水平位置',0,100,1],['y','垂直位置',0,100,1]];
    return '<div class="photoCard"><h4>'+slotName(j)+'　／　'+photoCaption(floor,j)+'</h4>'+photoMenu(j)+'<label>替換'+slotName(j)+'照片<input data-upload="'+j+'" type="file" accept="image/png,image/jpeg,image/webp"></label>'+sliders.map(([k,label,min,max,step])=>'<label>'+label+' <output>'+p[k]+(k==='zoom'?'×':'%')+'</output><input type="range" aria-label="'+slotName(j)+label+'" data-photo="'+j+'" data-field="'+k+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+p[k]+'" '+(p.src?'':'disabled')+'></label>').join('')+'<button data-clear="'+j+'" '+(p.src?'':'disabled')+'>恢復活動佔位圖</button></div>';
  }).join('');
}
function selectFloor(i){floor=i;mode=mode==='detail'?'detail':'full';zoom=1;render();populateEditor();}
function changed(){render();persist();}
function panToCenter(){const v=el('view');v.scrollLeft=(v.scrollWidth-v.clientWidth)/2;}
function toggle(button,panel){
  const show=el(panel).hidden;el(panel).hidden=!show;el(button).setAttribute('aria-expanded',show);return show;
}
function readData(file){
  return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file);});
}
async function takePhoto(input){
  const file=input.files[0],dest=floor,j=Number(input.dataset.upload),target=draft.floors[dest];
  if(!file)return;
  try{
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('請選用 JPEG、PNG 或 WebP。');
    const im=await loadImage(await readData(file)),c=document.createElement('canvas');
    const s=Math.min(1,2400/Math.max(im.naturalWidth,im.naturalHeight));
    c.width=Math.max(1,Math.round(im.naturalWidth*s));c.height=Math.max(1,Math.round(im.naturalHeight*s));
    const g=c.getContext('2d');g.fillStyle='white';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);
    target.photos[j]={src:c.toDataURL('image/jpeg',.92),width:c.width,height:c.height,framing:'spread',x:50,y:50,zoom:1};
    status(FLOORS[dest].name+slotName(j)+'照片已替換。');changed();populateEditor();
  }catch(e){status(e.message||'無法讀取圖片。');}
}
async function deliver(kind){
  const edition=scheme==='C'&&draft.cTitle==='press'?'C2':scheme==='B'?'B-'+B_TITLES[draft.bTitle||'sweep']:scheme;
  const name='外牆-'+edition+'-'+FLOORS[floor].name+'-'+draft.floors[floor].title;
  try{
    if(kind==='draft')save(new Blob([JSON.stringify(draft)],{type:'application/json'}),'四層外牆-可編輯草稿.json');
    else if(kind==='layers')save(new Blob([layeredPreview(draft,floor,scheme)],{type:'image/svg+xml;charset=utf-8'}),name+'-分層初稿.svg');
    else if(kind==='board')save(await raster(reviewBoard(draft,scheme),2700),'校長審閱-方案'+edition+'總覽.png');
    else{
      const detail=kind==='detail';
      save(await raster(banner(draft,floor,scheme,{region:detail?region:null}),detail?REGIONS[region][1]*3:W*3),name+'-'+(detail?REGION_NAMES[region]:'全幅')+'.png');
    }
    status('已匯出。');
  }catch(e){status('匯出失敗。'+e.message);}
}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.photoSet&&selection){
    applyPhotoSet(b.dataset.photoSet);changed();populateEditor();
  }
  if(b.dataset.mode){mode=b.dataset.mode;zoom=1;render();}
  if(b.dataset.scheme){scheme=b.dataset.scheme;render();populateEditor();}
  if(b.dataset.bTitle){
    draft.bTitle=b.dataset.bTitle;
    const url=new URL(location.href);
    if(url.searchParams.get('scheme')==='B'&&url.searchParams.has('title')){
      url.searchParams.set('title',draft.bTitle);
      history.replaceState(null,'',url);
    }
    changed();
  }
  if(b.dataset.cTitle){draft.cTitle=b.dataset.cTitle;changed();}
  if(b.dataset.floor!==undefined)selectFloor(Number(b.dataset.floor));
  if(b.dataset.region!==undefined){region=Number(b.dataset.region);zoom=1;render();}
  if(b.dataset.export)deliver(b.dataset.export);
  if(b.dataset.clear!==undefined){draft.floors[floor].photos[Number(b.dataset.clear)]=newDraft().floors[0].photos[0];changed();populateEditor();}
  if(b.id==='minus'||b.id==='plus'){zoom=Math.max(1,Math.min(4,zoom+(b.id==='plus'?.5:-.5)));render();panToCenter();}
  if(b.id==='exportToggle')toggle(b.id,'exports');
  if(b.id==='editToggle'&&toggle(b.id,'editor'))populateEditor();
  if(b.id==='boardToggle'&&toggle(b.id,'boardPanel')){render();el('boardPanel').scrollIntoView({block:'start'});}
});
el('titleFace').onchange=e=>{draft.faceByEdition[titleEdition(scheme,draft.cTitle)]=e.target.value;changed();};
el('level').onchange=e=>selectFloor(Number(e.target.value));
el('center').onchange=render;el('safety').onchange=render;
function updateTitle(){
  const value=el('headline').value.trim();
  if(!validTitle(value)){el('titleHint').textContent='請輸入四個中文字。畫布保留最近的四字標語。';return;}
  el('titleHint').textContent='';draft.floors[floor].title=value;
  el('level').selectedOptions[0].textContent=FLOORS[floor].name+'　'+value;changed();
}
el('headline').oninput=e=>{if(!e.isComposing)updateTitle();};el('headline').oncompositionend=updateTitle;
el('tone').onchange=e=>{draft.floors[floor].tone=Number(e.target.value);changed();};
for(const [id,key,out] of [['font','size','fontOut'],['track','spacing','trackOut']]){
  el(id).oninput=e=>{const v=Number(e.target.value);draft.floors[floor][key]=v;el(out).value=(key==='spacing'?titleSpacing(draft.floors[floor],scheme):v)/2+' 吋';changed();};
}
for(const [id,key] of [['margin','safe'],['bleed','bleed']]){
  el(id).onchange=e=>{const n=e.target.valueAsNumber;if(!Number.isFinite(n)||!e.target.validity.valid){e.target.value=draft[key];status('請使用欄位所示範圍與步距。');return;}draft[key]=n;el('safety').checked=true;changed();};
}
el('photoEditors').oninput=e=>{
  const input=e.target,k=input.dataset.field;if(!k)return;
  draft.floors[floor].photos[Number(input.dataset.photo)][k]=Number(input.value);
  input.parentNode.querySelector('output').value=input.value+(k==='zoom'?'×':'%');changed();
};
el('photoEditors').onchange=e=>{
  if(e.target.dataset.upload!==undefined)takePhoto(e.target);
  if(e.target.dataset.selectedPhoto===undefined||!selection)return;
  const j=Number(e.target.dataset.selectedPhoto),photos=draft.floors[floor].photos;
  const pick=selection.photos[floor].find(p=>p.id===e.target.value);
  if(!pick)return;
  if(photos[1-j].id===pick.id)[photos[j],photos[1-j]]=[photos[1-j],photos[j]];
  else photos[j]={...pick};
  changed();populateEditor();
};
el('restore').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const d=validate(JSON.parse(await file.text()));
    await Promise.all(d.floors.flatMap(f=>f.photos.filter(p=>p.src).map(async p=>{
      const im=await loadImage(p.src);if(p.width!==im.naturalWidth||p.height!==im.naturalHeight)throw Error('草稿與照片原比例不符。');
    })));
    draft=d;status('已載入草稿。');changed();populateEditor();
  }catch(err){status('未能載入草稿。'+err.message);}finally{e.target.value='';}
};
(async()=>{
  const face=new FontFace(SEKI_FAMILY,`url("${SEKI_DATA.full}") format("woff2")`,{weight:'700'});
  try{document.fonts.add(await face.load());}
  catch{status('源石黑體未能載入，請重新開啟完整工程。');}
  let local;
  try{local=await openDraft();if(local)draft=validate(local);}
  catch{status('此瀏覽器未能讀取本機草稿，可使用 JSON 儲存及載入。');}
  if(referenceTrial){
    scheme=Object.hasOwn(SCHEMES,initialScheme)?initialScheme:'B';mode='overview';
    try{
      const res=await fetch('trials/selected-photos-v1.json');
      if(!res.ok)throw Error();
      selection=await res.json();
      if(!local){
        draft.faceByEdition.B='song';draft.bTitle='reference';
        applyPhotoSet('main');
      }
    }catch{status('已選活動相片未能載入，請重新整理，或載入已下載的草稿。');}
  }
  if(goalTrial){
    scheme=Object.hasOwn(SCHEMES,initialScheme)?initialScheme:'C';floor=2;mode='full';
    if(!local||(draft.goalCropVersion??0)<3){
      try{
        const res=await fetch('trials/朝著目標-試相.json',{cache:'no-cache'});
        if(!res.ok)throw Error();
        const preset=validate(await res.json());
        if(!local){draft=preset;}
        else{
          draft.floors[2].photos.forEach((photo,side)=>{
            const revised=preset.floors[2].photos[side];
            if(photo.src!==revised.src)return;
            if(!draft.goalCropVersion)photo.y=revised.y;
          });
          draft.goalCropVersion=preset.goalCropVersion;
          persist();
        }
      }catch{status('請從「載入草稿 JSON」開啟 trials 資料夾內的「朝著目標-試相.json」。');}
    }
  }
  const requested=new URLSearchParams(location.search).get('title');
  if(scheme==='B'&&Object.hasOwn(B_TITLES,requested))draft.bTitle=requested;
  if(scheme==='C'&&Object.hasOwn(C_TITLES,requested))draft.cTitle=requested;
  render();populateEditor();
})();
