const el=id=>document.getElementById(id);
const trialName=new URLSearchParams(location.search).get('trial');
const referenceTrial=trialName==='reference';
const goalTrial=trialName==='goal';
const baseDraftKey=referenceTrial?'b-reference-selected-photos-v1':goalTrial?'goal-photo-trial':'current';
const draftKey=editionDraftKey(classicStudio,baseDraftKey,comparingEditions);
const initialScheme=new URLSearchParams(location.search).get('scheme');
let draft=newDraft(), floor=0, scheme=Object.hasOwn(SCHEMES,initialScheme)?initialScheme:'A',mode='overview',region=1,zoom=1;
const validTitle=s=>typeof s==='string'&&/^\p{Script=Han}{4}$/u.test(s);
const range=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
const status=s=>{el('status').textContent=s;};
const rasterData=/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/;
function validate(d){
  if(!d||d.version!==1||!range(d.safe,0,20)||!range(d.bleed,0,10)||!Array.isArray(d.floors)||d.floors.length!==4)throw Error('請選擇四層外牆工程的草稿。');
  const oldEnglish=['Share Our Talents','Strength in Unity','Work Towards Our Goals','Move Forward Together'];
  for(const f of d.floors){
    if(!validTitle(f.title)||![0,1,2].includes(f.tone)||!range(f.size,64,86)||!range(f.spacing,4,17)||!Array.isArray(f.photos)||f.photos.length!==2)throw Error('草稿的文字或版面數值有誤。');
    if(f.elements===undefined)f.elements=defaultElements(f.title);
    const items=f.elements;
    const short=(value,max)=>typeof value==='string'&&value.length<=max;
    if(!items||typeof items!=='object'||Array.isArray(items))throw Error('設計元素格式有誤。');
    const theme=FLOORS.findIndex(t=>t.title===f.title);
    if(d.brandEdition!==2&&theme>=0){
      const [english,zh,en,keywords]=THEME_COPY[theme];
      if(items.english===oldEnglish[theme])items.english=english;
      if(items.unity?.zh===zh&&items.unity?.en===en)delete items.unity;
      if(!Object.hasOwn(items,'keywords'))items.keywords=keywords;
    }
    for(const [key,value] of Object.entries(items)){
      if(!Object.hasOwn(ELEMENT_NAMES,key))throw Error('未能辨認設計元素。');
      const valid=(key==='english'||key==='keywords')?short(value,48):key==='unity'||key==='note'?
        value&&short(value.zh,8)&&short(value.en,26):value===true;
      if(!valid)throw Error('設計元素內容有誤。');
    }
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
  delete d.pressFace;d.brandEdition=2;
  return d;
}
let db;
async function openDraft(){
  db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('campus-exterior-studio-v1',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('drafts');
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  const own=await readEditionDraft(db,draftKey);
  if(own||comparingEditions)return own;
  return readEditionDraft(db,baseDraftKey);
}
// Element edits are small. Journal them while IndexedDB writes the photo-heavy draft.
const pendingKey='exterior-elements:'+draftKey;
function elementSnapshot(){
  return JSON.stringify(draft.floors.map(f=>({brandEdition:2,title:f.title,elements:f.elements})));
}
function persist(elementEdit=false){
  let pending;
  try{
    if(elementEdit)localStorage.setItem(pendingKey,elementSnapshot());
    pending=localStorage.getItem(pendingKey);
  }catch{}
  try{
    if(!db)throw Error();
    const tx=db.transaction('drafts','readwrite');
    tx.objectStore('drafts').put(draft,draftKey);
    tx.oncomplete=()=>{
      try{if(pending&&pending===localStorage.getItem(pendingKey))localStorage.removeItem(pendingKey);}catch{}
    };
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
function sharedPhotos(){
  const groups=(selection?.photos||[]).map((photos,i)=>({
    label:FLOORS[i].name+'　'+FLOORS[i].title,
    entries:photos.map(photo=>({key:photo.id,label:photo.id+'　'+photo.caption,photo}))
  }));
  const known=new Set(groups.flatMap(g=>g.entries.map(e=>e.photo.src)));
  const extra=[];
  draft.floors.forEach((f,i)=>f.photos.forEach((photo,j)=>{
    if(!photo.src||known.has(photo.src))return;
    known.add(photo.src);
    const label=FLOORS[i].name+'・'+slotName(j)+(typeof photo.caption==='string'?'　'+photo.caption:'');
    extra.push({key:'slot-'+i+'-'+j,label,photo});
  }));
  if(extra.length)groups.push({label:'目前草稿的其他相片',entries:extra});
  return groups;
}
function photoMenu(j,groups){
  if(!groups.length)return '';
  const src=draft.floors[floor].photos[j].src;
  const options=groups.map(g=>'<optgroup label="'+textEscape(g.label)+'">'+g.entries.map(({key,label,photo})=>
    '<option value="'+key+'" '+(photo.src===src?'selected':'')+'>'+textEscape(label)+'</option>'
  ).join('')+'</optgroup>').join('');
  return '<label>已選活動相片（四層共用）<select aria-label="'+slotName(j)+'已選活動相片" data-selected-photo="'+j+'"><option value="" disabled '+(src?'':'selected')+'>選取相片</option>'+options+'</select></label>';
}
function slotName(j){return ['左側','右側'][j];}
function photoCaption(i,j){
  const p=draft.floors[i].photos[j];
  return textEscape(p.src&&typeof p.caption==='string'?p.caption:FLOORS[i].subjects[j]);
}
function swatch(i){return '<i class="swatch" style="--tone:'+palette(i,draft.floors[i].tone,scheme).main+'"></i>';}
function render(){
  updateEditionLinks();el('compareHint').hidden=!comparingEditions;
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
  const visiblePhotosInView=(overview?draft.floors:[f]).flatMap(visiblePhotos);
  const placed=visiblePhotosInView.filter(p=>p.src).length;
  if(placed && (!detail||region!==1))el('viewHint').textContent+='　·　左右拖動相片調整取景';
  el('guideHint').textContent=opts.safety?'綠虛線：安全 '+draft.safe+' 吋　｜　粉紅線：出血 '+draft.bleed+' 吋':(placed?'已置入活動照片　'+placed+' / '+visiblePhotosInView.length:visiblePhotosInView.length?'活動插畫為待換照片位置':'本層已移除照片框');
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
  el('tone').value=f.tone;el('font').value=f.size;el('fontOut').value=Number((headlineSize(f)/2).toFixed(1))+' 吋';el('track').value=f.spacing;el('trackOut').value=titleSpacing(f,scheme)/2+' 吋';
  el('margin').value=draft.safe;el('bleed').value=draft.bleed;
  elementControls(f);
  const groups=sharedPhotos();
  el('photoEditors').innerHTML=f.photos.map((p,j)=>{
    if(!f.elements[j?'right':'left'])return '';
    const sliders=[['zoom','裁切倍率',1,4,.05],['x','水平位置',0,100,1],['y','垂直位置',0,100,1]];
    return '<div class="photoCard"><h4>'+slotName(j)+'　／　'+photoCaption(floor,j)+'</h4>'+ (p.src?'<div class="actions"><button data-nudge="-1" data-side="'+j+'" aria-label="'+slotName(j)+'照片向左移">← 向左移</button><button data-nudge="1" data-side="'+j+'" aria-label="'+slotName(j)+'照片向右移">向右移 →</button></div>':'')+photoMenu(j,groups)+'<label>替換'+slotName(j)+'照片<input data-upload="'+j+'" type="file" accept="image/png,image/jpeg,image/webp"></label>'+sliders.map(([k,label,min,max,step])=>'<label>'+label+' <output>'+Number(p[k].toFixed(k==='zoom'?2:0))+(k==='zoom'?'×':'%')+'</output><input type="range" aria-label="'+slotName(j)+label+'" data-photo="'+j+'" data-field="'+k+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+p[k]+'" '+(p.src?'':'disabled')+'></label>').join('')+'<button data-clear="'+j+'" '+(p.src?'':'disabled')+'>恢復活動佔位圖</button></div>';
  }).join('');
}
function elementControls(f){
  const missing=Object.keys(ELEMENT_NAMES).filter(k=>!Object.hasOwn(f.elements,k));
  el('elementType').innerHTML=missing.length?missing.map(k=>'<option value="'+k+'">'+ELEMENT_NAMES[k]+'</option>').join(''):'<option>本層已加入所有元素</option>';
  el('addElement').disabled=el('elementType').disabled=!missing.length;
  function field(key,part,label,value,max){
    return '<label>'+label+'<input aria-label="'+ELEMENT_NAMES[key]+label+'" data-element="'+key+'" data-part="'+part+'" maxlength="'+max+'" value="'+textEscape(value)+'"></label>';
  }
  el('elementList').innerHTML=Object.entries(ELEMENT_NAMES).filter(([k])=>Object.hasOwn(f.elements,k)).map(([k,name])=>{
    const item=f.elements[k];
    let fields='';
    if(k==='english'||k==='keywords')fields=field(k,'',k==='english'?'英文':'詞組（以 ・ 分隔）',item,48);
    if(k==='unity'||k==='note')fields=field(k,'zh','中文',item.zh,8)+field(k,'en','英文',item.en,26);
    return '<div class="elementRow"><strong>'+name+'</strong><div class="elementFields">'+fields+'</div><button data-remove-element="'+k+'" aria-label="移除'+name+'">移除</button></div>';
  }).join('');
}
function refreshElements(){
  changed(true);populateEditor();
}
el('addElement').onclick=()=>{
  const f=draft.floors[floor],k=el('elementType').value;
  if(!Object.hasOwn(ELEMENT_NAMES,k)||Object.hasOwn(f.elements,k))return;
  const defaults=defaultElements(f.title);
  f.elements[k]=defaults[k]??(k==='english'?'Our Shared Goal':k==='keywords'?'同心同行・互相支持':{zh:'同心同行',en:'Walk Together'});
  refreshElements();
  el('elementList').querySelector('[data-element="'+k+'"]')?.focus();
};
el('elementList').onclick=e=>{
  const b=e.target.closest('[data-remove-element]');
  if(!b)return;
  const k=b.dataset.removeElement;
  delete draft.floors[floor].elements[k];
  refreshElements();el('elementType').value=k;
};
el('elementList').oninput=e=>{
  const {element:k,part}=e.target.dataset;
  if(!k)return;
  const f=draft.floors[floor];
  if(part)f.elements[k][part]=e.target.value;
  else f.elements[k]=e.target.value;
  el('fontOut').value=Number((headlineSize(f)/2).toFixed(1))+' 吋';
  changed(true);
};

function selectFloor(i){floor=i;mode=mode==='detail'?'detail':'full';zoom=1;render();populateEditor();}
function changed(elementEdit=false){render();persist(elementEdit);}
function panToCenter(){const v=el('view');v.scrollLeft=(v.scrollWidth-v.clientWidth)/2;}
function toggle(button,panel){
  const show=el(panel).hidden;el(panel).hidden=!show;el(button).setAttribute('aria-expanded',show);return show;
}
// Offset is the requested movement of the photo centre in banner units.
function horizontalCrop(start,box,dx){
  const im=photoTransform(start,box);
  const offset=im.x+im.width/2-box.x-box.w/2+dx;
  const baseWidth=im.width/start.zoom;
  const zoom=Math.min(4,Math.max(start.zoom,(box.w+2*Math.abs(offset))/baseWidth));
  const overflow=baseWidth*zoom-box.w;
  const x=overflow>0.001?Math.max(0,Math.min(100,50-100*offset/overflow)):start.x;
  return {x,zoom};
}
const preview=el('view');
let drag=null;
preview.addEventListener('pointerdown',e=>{
  const image=e.target.closest('[data-layer^="photo-"] image');
  if(!image||!e.isPrimary||e.button!==0||drag)return;
  const side=Number(image.closest('[data-layer]').dataset.layer==='photo-right');
  const row=image.closest('[data-floor]');
  const targetFloor=row?Number(row.dataset.floor):floor;
  const photo=draft.floors[targetFloor].photos[side];
  drag={pointer:e.pointerId,photo,start:{...photo},box:photoBox(side,scheme,photo,targetFloor),image,
    clientX:e.clientX,scale:image.getScreenCTM().a,moved:false};
  // Capture on the image so a tap still reaches its original floor button.
  image.setPointerCapture(e.pointerId);
});
preview.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;
  const dx=e.clientX-drag.clientX;
  if(!drag.moved&&Math.abs(dx)<4)return;
  drag.moved=true;
  Object.assign(drag.photo,horizontalCrop(drag.start,drag.box,dx/drag.scale));
  const im=photoTransform(drag.photo,drag.box);
  for(const [key,value] of Object.entries(im))drag.image.setAttribute(key,value);
});
function finishDrag(e){
  if(!drag||e.pointerId!==drag.pointer)return;
  const last=drag;drag=null;
  if(!last.moved)return;
  if(e.type==='pointercancel')Object.assign(last.photo,last.start);
  else persist();
  render();populateEditor();
}
preview.addEventListener('pointerup',finishDrag);
preview.addEventListener('pointercancel',finishDrag);
preview.addEventListener('lostpointercapture',finishDrag);
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
    else if(['overview','details','compare'].includes(kind)){
      const names={overview:'四層總覽',details:'四層局部放大',compare:'新版A與B對照'};
      save(await raster(proofSheet(draft,scheme,kind),3000),'外牆-'+(kind==='compare'?'':scheme+'-')+names[kind]+'.png');
    }
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
  if(b.dataset.nudge){
    const side=Number(b.dataset.side), photo=draft.floors[floor].photos[side];
    const box=photoBox(side,scheme,photo,floor);
    Object.assign(photo,horizontalCrop(photo,box,Number(b.dataset.nudge)*box.w*.025));
    changed();populateEditor();
    el('photoEditors').querySelector('[data-side="'+side+'"][data-nudge="'+b.dataset.nudge+'"]').focus({preventScroll:true});
  }
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
  if(e.target.dataset.selectedPhoto===undefined)return;
  const j=Number(e.target.dataset.selectedPhoto),photos=draft.floors[floor].photos;
  const pick=sharedPhotos().flatMap(g=>g.entries).find(entry=>entry.key===e.target.value)?.photo;
  if(!pick)return;
  if(photos[1-j].src===pick.src)[photos[j],photos[1-j]]=[photos[1-j],photos[j]];
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
  catch{local=null;status('此瀏覽器未能讀取本機草稿，可使用 JSON 儲存及載入。');}
  if(referenceTrial){
    scheme=Object.hasOwn(SCHEMES,initialScheme)?initialScheme:'B';mode='overview';
    try{
      const res=await fetch('trials/selected-photos-v1.json');
      if(!res.ok)throw Error();
      selection=await res.json();
      if(!local){
        draft.bTitle='sweep';
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
  try{
    const saved=JSON.parse(localStorage.getItem(pendingKey));
    if(saved?.length===4&&saved.every((v,i)=>v.title===draft.floors[i].title)){
      const floors=draft.floors.map((f,i)=>({...f,elements:saved[i].elements}));
      draft=validate({...draft,brandEdition:saved.every(v=>v.brandEdition===2)?2:undefined,floors});persist();
    }
  }catch{}
  const requested=new URLSearchParams(location.search).get('title');
  if(scheme==='B'&&Object.hasOwn(B_TITLES,requested))draft.bTitle=requested;
  if(scheme==='C'&&Object.hasOwn(C_TITLES,requested))draft.cTitle=requested;
  render();populateEditor();
})();
