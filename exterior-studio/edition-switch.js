// Ordinary edition links open each editor's own draft. Photo comparisons use a separate local draft.
const classicStudio=document.documentElement.dataset.edition==='classic';
const comparingEditions=new URLSearchParams(location.search).get('view')==='compare';
function editionDraftKey(classic,base,comparison=false){
  return (comparison?'compare:':'')+(classic?'':'brand:')+base;
}
function readEditionDraft(database,key){
  return new Promise((resolve,reject)=>{
    const read=database.transaction('drafts').objectStore('drafts').get(key);
    read.onsuccess=()=>resolve(read.result);
    read.onerror=()=>reject(read.error);
  });
}
function otherEditionURL(){
  const url=new URL(classicStudio?'index.html':'classic.html',location.href);
  if(trialName)url.searchParams.set('trial',trialName);
  url.searchParams.set('scheme',scheme);
  if(scheme==='B')url.searchParams.set('title',classicStudio?'sweep':'reference');
  if(scheme==='C')url.searchParams.set('title',draft.cTitle||'fold');
  return url;
}
function updateEditionLinks(){
  document.getElementById('otherEdition').href=otherEditionURL().href;
}
async function compareEditionPhotos(){
  const button=document.getElementById('compareEdition');
  button.disabled=true;
  try{
    const targetClassic=!classicStudio;
    const key=editionDraftKey(targetClassic,baseDraftKey);
    const existing=await readEditionDraft(db,key);
    const target=existing||newDraft();
    if(!existing){
      delete target.brandEdition;
      delete target.faceByEdition;
      target.floors.forEach(f=>delete f.elements);
      if(targetClassic&&referenceTrial)target.faceByEdition={B:'song'};
    }
    target.floors.forEach((f,i)=>{f.photos=draft.floors[i].photos;});
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('drafts','readwrite');
      tx.objectStore('drafts').put(target,editionDraftKey(targetClassic,baseDraftKey,true));
      tx.oncomplete=resolve;
      tx.onabort=tx.onerror=()=>reject(tx.error);
    });
    const url=otherEditionURL();
    url.searchParams.set('view','compare');
    location.assign(url);
  }catch{
    status('未能在本機建立比較稿。可下載草稿 JSON，再於另一版本載入。');
    button.disabled=false;
  }
}
document.getElementById('compareEdition').addEventListener('click',compareEditionPhotos);
