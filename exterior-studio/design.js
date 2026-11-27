// Design units are half an inch. The trim canvas is independent of proof guides.
const W = 1548, H = 116, FRAME = 446;
const FONTS = "'PingFang HK','Noto Sans CJK HK','Microsoft JhengHei',sans-serif";
const SONG_FONTS = "'Songti TC','Noto Serif CJK HK','Noto Serif TC','PMingLiU',serif";
const SEKI_FAMILY='GenSekiGothic2 TC';
function embedSekiFont(root){
  const titles=[...root.querySelectorAll('text[data-face="seki"]')];
  if(!titles.length)return;
  const standard=titles.every(t=>[...t.textContent].every(ch=>SEKI_DATA.characters.includes(ch)));
  const style=root.ownerDocument.createElementNS(root.namespaceURI,'style');
  style.textContent=`@font-face{font-family:"${SEKI_FAMILY}";font-weight:700;src:url("${standard?SEKI_DATA.standard:SEKI_DATA.full}") format("woff2")}`;
  const license=root.ownerDocument.createElementNS(root.namespaceURI,'metadata');
  license.textContent=SEKI_DATA.license;
  root.prepend(style,license);
}
const FLOORS = [
  {name:'第一層', title:'貢獻所長', color:'紫色', paperTones:['#7035AF','#5F279B','#8146BD'], tones:['#7951AB','#694496','#9063B8'], accent:'#F7CE68', subjects:['音樂演奏','藝術創作']},
  {name:'第二層', title:'團結力量', color:'橙色', paperTones:['#FF9521','#EC8117','#FFA938'], tones:['#DA742A','#C36220','#E68B38'], accent:'#B2DBCC', subjects:['團體運動','合作學習']},
  {name:'第三層', title:'朝著目標', color:'藍色', paperTones:['#0563B5','#00549F','#1272C3'], tones:['#347BB3','#286799','#438CC2'], accent:'#F1C858', subjects:['科學探究','比賽練習']},
  {name:'第四層', title:'共同進發', color:'紅色', paperTones:['#C32840','#AD1C33','#CD3549'], tones:['#CC4D50','#B83E45','#DA5B54'], accent:'#B7D6EC', subjects:['校園活動','集體成果']}
];
const ELEMENT_NAMES={english:'英文副標語',keywords:'輔助關鍵詞',unity:'團結詞牌',note:'自訂詞牌',left:'左側照片',right:'右側照片',accents:'裝飾線條'};
const THEME_COPY=[
  ['Contribute Our Strengths','群策群力','Pool Our Talents','發揮才能・各展所長・彼此欣賞'],
  ['Unity is Strength','團結一心','United as One','同心同行・互相支持・凝聚力量'],
  ['Move Towards Our Goals','並肩努力','Side by Side','堅持信念・攜手前行・追求卓越'],
  ['Moving Forward Together','攜手同行','Hand in Hand','並肩同行・共創未來・一起成長']
];
function defaultElements(title){
  const copy=THEME_COPY[FLOORS.findIndex(f=>f.title===title)];
  const items={left:true,right:true,accents:true};
  if(copy){items.english=copy[0];items.keywords=copy[3];}
  return items;
}
function visiblePhotos(f){
  const elements=f.elements??defaultElements(f.title);
  return f.photos.filter((_,side)=>elements[side?'right':'left']);
}
function headlineSize(f){
  return f.elements?.keywords?f.size*.64:f.elements?.english?f.size*.70:f.size;
}
const copyMeasure=document.createElement('canvas').getContext('2d');
function fittedType(value,size,limit){
  copyMeasure.font='700 '+size+'px Arial,"PingFang HK",sans-serif';
  const width=copyMeasure.measureText(value).width;
  const ratio=Math.min(1,limit/Math.max(1,width));
  return {size:size*ratio,width:width*ratio};
}
function captionLayers(elements,p,brandInk){
  const font='Arial, PingFang HK, sans-serif';
  let svg='';
  for(const [key,x] of [['unity',516],['note',1032]]){
    const tag=elements[key];
    if(!tag||(!tag.zh&&!tag.en))continue;
    const double=tag.zh&&tag.en;
    const line=(value,y,size)=>`<text x="0" y="${y}" font-size="${fittedType(value,size,108).size}" fill="${p.ink}">${textEscape(value)}</text>`;
    svg+=`<g data-layer="${key}" transform="translate(${x} 58)" font-family="${font}" font-weight="700" text-anchor="middle">
      <rect x="-67" y="-23" width="134" height="46" rx="4" fill="#fff8e9" stroke="${p.ink}" stroke-width="1.5"/>
      <path d="M-58 -15v30" stroke="${p.main}" stroke-width="3"/>
      ${tag.zh?line(tag.zh,double?-1:6,18):''}${tag.en?line(tag.en,double?15:5,double?13:16):''}</g>`;
  }
  if(brandInk){
    const en=elements.english||'', kw=elements.keywords||'';
    const enType=fittedType(en,22,300), kwType=fittedType(kw,14,220);
    const gap=en&&kw?34:0, start=W/2-(enType.width+kwType.width+gap)/2;
    const split=start+enType.width+gap/2;
    const text=(key,value,x,type,weight)=>`<g data-layer="${key}"><text x="${x}" y="105" font-family="${font}" font-weight="${weight}" font-size="${type.size}" fill="${brandInk}">${textEscape(value)}</text></g>`;
    if(en)svg+=text('english',en,start,enType,700);
    if(kw)svg+=text('keywords',kw,start+enType.width+gap,kwType,500);
    if(gap)svg+=`<path d="M${split} 91v15" stroke="${brandInk}" opacity=".48"/>`;
    return svg;
  }
  const ink='#fffaf0';
  const compact=Boolean(elements.keywords&&elements.english);
  function line(key,baseline,size){
    const text=elements[key];
    if(!text)return '';
    const type=fittedType(text,size,420);
    const back=`<rect x="${-type.width/2-9}" y="${-size}" width="${type.width+18}" height="${size+4}" rx="3" fill="${p.ink}"/>`;
    return `<g data-layer="${key}" transform="translate(774 ${baseline})">${back}<text text-anchor="middle" font-family="${font}" font-weight="${key==='english'?700:500}" font-size="${type.size}" fill="${ink}">${textEscape(text)}</text></g>`;
  }
  svg+=line('english',compact?96:105,compact?20:22);
  svg+=line('keywords',compact?112:103,13);
  return svg;
}

const SCHEMES = {A:'品牌典雅版',B:'活力升級版',C:'紙上展廊',D:'跑道節拍'};
const DEFAULT_FACES={A:'song',B:'sans',C1:'sans',C2:'seki',D:'sans'};
const FACE_NAMES={seki:'源石黑體（丹版）',song:'繁體粗宋',sans:'原版粗黑'};
function titleEdition(scheme,cTitle){
  return scheme==='C'?(cTitle==='press'?'C2':'C1'):scheme;
}
const REGIONS = [[0,540],[450,648],[1008,540]];
const REGION_NAMES=['左側照片','中央標語','右側照片'];
const textEscape = s => s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function newDraft(){
  return {version:1,brandEdition:2,pressEdition:2,faceByEdition:{...DEFAULT_FACES},safe:2,bleed:1, floors:FLOORS.map(f=>({title:f.title,elements:defaultElements(f.title),tone:0,size:80,spacing:10,
    photos:[null,null].map(()=>({src:'',width:0,height:0,x:50,y:50,zoom:1}))}))};
}
function tint(a,b,weight){
  const hex=[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-weight)+parseInt(b.slice(i,i+2),16)*weight).toString(16).padStart(2,'0'));
  return '#'+hex.join('');
}
function palette(i,level,scheme){
  const paper=scheme==='C', brand=scheme==='A'||scheme==='B';
  const hues=['#7545AD','#D66616','#166BA8','#C7384D'];
  const base=hues[i];
  const main=brand?[base,tint(base,'#25192F',.17),tint(base,'#FFF6DB',.15)][level]:(paper?FLOORS[i].paperTones:FLOORS[i].tones)[level];
  return {main, ink:tint(main,'#17132A',.61), dark:tint(main,'#20112D',.38),
    pale:tint(main,'#FFF9EC',paper ? .54 : .75),mist:tint(main,'#FFFCF3',paper ? .81 : .93),accent:FLOORS[i].accent};
}
// Read font metrics from the same SVG engine used to display the editable text.
const titleMetrics=new Map();
function titleSpacing(f,scheme){return f.spacing+(scheme==='C'?20:0);}
function titleLayer(f,fill,scheme,inks,face){
  const paper=scheme==='C', spacing=titleSpacing(f,scheme);
  const seki=face==='seki', song=face==='song';
  const family=seki?SEKI_FAMILY:song?SONG_FONTS:FONTS;
  const attrs='data-face="'+face+'" text-rendering="geometricPrecision" font-family="'+family+'" font-size="'+f.size+'" font-weight="'+(seki||song?700:900)+'" letter-spacing="'+(paper?0:spacing)+'"'+(paper?' dx="0 '+[spacing,spacing,spacing].join(' ')+'"':'');
  const key=[f.title,f.size,spacing,paper,family].join('/');
  if(!titleMetrics.has(key)){
    const host=document.getElementById('measure');
    host.innerHTML='<text '+attrs+'>'+textEscape(f.title)+'</text>';
    const {x,y,width,height}=host.firstChild.getBBox();
    titleMetrics.set(key,[x+width/2,y+height/2]);
  }
  const [x,y]=titleMetrics.get(key);
  const letters=inks?Array.from(f.title,(ch,j)=>'<tspan fill="'+inks[j]+'" stroke="'+inks[j]+'">'+textEscape(ch)+'</tspan>').join(''):textEscape(f.title);
  return '<g data-layer="headline" transform="translate(774 58)"><text x="'+(-x)+'" y="'+(-y)+'" '+attrs+' fill="'+fill+'" stroke="'+fill+'" stroke-width="'+(seki?0:song?.95:paper?1.25:.85)+'" stroke-linejoin="round" paint-order="stroke">'+letters+'</text></g>';
}
function photoTransform(photo,aperture){
  // The C mounts use only this portion of the photo layer; old drafts keep their original crop.
  const box=aperture??{x:0,y:0,w:FRAME,h:H};
  const scale=Math.max(box.w/photo.width,box.h/photo.height)*photo.zoom;
  const width=photo.width*scale, height=photo.height*scale;
  return {width,height,x:box.x+(box.w-width)*photo.x/100,y:box.y+(box.h-height)*photo.y/100};
}
const photoContours={
  A:'M0 0H439C406 13 444 50 409 78Q386 103 352 116H0Z',
  B:'M0 0H444L340 116H0Z',
  C:'M20 13L369 4L395 24L403 99L27 111Z',
  D:'M0 12H359C401 12 427 33 427 58S401 104 359 104H0Z'
};
// Blend only the margins into the stock colour. The people and their work keep the source colours.
function photoField(s,p){
  if(s==='A')return p.mist;
  if(s==='C')return tint(p.pale,'#F8EACF',.42);
  return s==='D'?p.ink:p.main;
}
function photoSurface(i,j,s,p,photo,id,box){
  const {x,y,w,h}=box, field=photoField(s,p);
  let material;
  if(photo.src){
    const im=photoTransform(photo,box);
    material=`<image x="${im.x}" y="${im.y}" width="${im.width}" height="${im.height}" preserveAspectRatio="xMidYMid meet" href="${photo.src}"/>`;
  }else{
    material=`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 446 116" preserveAspectRatio="xMidYMid slice"><rect width="446" height="116" fill="${tint(p.pale,p.mist,.45)}"/><g data-layer="activity-study">${activityArt(i,j,p)}</g></svg>`;
  }
  const gradient=`<linearGradient id="${id}ink" x1="${j?'100%':'0%'}" x2="${j?'0%':'100%'}" y1="0%" y2="${s==='B'?'12%':'0%'}">
      <stop stop-color="white"/><stop offset=".12" stop-color="white"/>
      <stop offset=".74" stop-color="white"/>
      <stop offset="1" stop-color="black"/></linearGradient>`;
  return `<defs>${gradient}<mask id="${id}mask" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}ink)"/></mask></defs><g mask="url(#${id}mask)">${material}</g>`;
}
function photoBox(side,scheme,photo,i=0){
  if(scheme==='A'||scheme==='B')return brandBox(i,side,scheme);
  let box={x:0,y:0,w:FRAME,h:H};
  // A shorter photographic spread keeps action visible within the ultra-wide end panels.
  // Preserve saved custom crops from older drafts. Their original aperture remains editable.
  if(scheme==='C'&&photo.framing==='mount')box={x:side?43:20,y:side?5:4,w:383,h:107};
  if(scheme!=='B'&&photo.src&&(photo.framing==='mount'||photo.framing==='spread')&&photo.width/photo.height>=1.15&&photo.width/photo.height<2.4){
    const paper=scheme==='C', w=side?342:285, inset=paper?20:0;
    box={x:side?FRAME-w-inset:inset,y:paper?5:0,w,h:paper?106:H};
  }
  return box;
}
function picture(i,side,scheme,p,photo,id){
  const field=photoField(scheme,p), box=photoBox(side,scheme,photo);
  const content=`<rect width="${FRAME}" height="${H}" fill="${field}"/>`+photoSurface(i,side,scheme,p,photo,id,box);
  const flip=side?'translate(1548 116) rotate(180)':'', offset=side?W-FRAME:0;
  return `<defs><clipPath id="${id}"><path transform="${flip}" d="${photoContours[scheme]}"/></clipPath></defs><g data-layer="photo-${side?'right':'left'}" clip-path="url(#${id})"><g transform="translate(${offset} 0)">${content}</g></g>`;
}
// Folded mounting paper, a fine page edge and a contrasting triangular turn.
function paperWing(p){
  return `<path d="M0 0H426L460 27L429 96L453 116H0Z" fill="${p.main}"/>
    <path d="M0 0H152L60 116H0Z" fill="${p.dark}"/>
    <path d="M381 -5L444 13L420 116L375 112Z" fill="${p.accent}"/>
    <path d="M407 0L441 13L426 79Z" fill="${p.mist}"/>
    <path d="M10 10L370 -2L407 20L416 105L22 119Z" fill="${p.ink}" opacity=".55"/>
    <path d="M12 8L370 -3L402 21L410 103L20 118Z" fill="${tint(p.pale,'#FFF4E1',.45)}"/> `;
}
function paperCreases(p){
  return `<path d="M366 3L393 25L371 22Z" fill="${p.accent}"/>
    <path d="M371 22L393 25L374 29Z" fill="${p.ink}" opacity=".36"/>`;
}
// Four small blind-stamped emblems in the left margin of the folded title sheet.
const paperSeals=[
  '<path d="M0 -17Q2 -3 15 0Q2 2 0 17Q-2 2 -15 0Q-2 -3 0 -17Z" fill="currentColor"/><path d="M13 -14v6m-3-3h6"/>',
  '<g transform="rotate(-33)"><rect x="-17" y="-7" width="21" height="14" rx="7"/><rect x="-4" y="-7" width="21" height="14" rx="7"/></g>',
  '<circle r="13"/><circle r="6"/><path d="M0 0L15 -15m-7 0h7v7"/>',
  '<path d="M-15 12V4h9v-7h9v-8h12M-10 14H16"/>'
];
function paperTitlePanel(p,i){
  const edge=tint(p.main,'#FFF6DF',.40);
  const fold=tint(p.main,p.ink,.43);
  return `<g data-layer="title-panel">
    <path d="M421 13L498 22V105L438 93L448 57Z" fill="${edge}"/>
    <path d="M421 13L484 34L498 22Z" fill="${p.pale}"/>
    <path d="M438 93L484 77L498 105Z" fill="${fold}"/>
    <path d="M1051 16L1126 29L1103 61L1115 103L1050 91Z" fill="${edge}"/>
    <path d="M1051 16L1070 41L1126 29Z" fill="${p.ink}"/>
    <path d="M478 12L1037 7L1073 20L1063 112L496 118L476 103Z" fill="${p.ink}" opacity=".65"/>
    <path d="M473 11L1040 7L1068 22L1059 109L493 115L471 101Z" fill="#FFF0D4"/>
    <path d="M474 8L1041 4L1070 18L1058 105L492 111L471 98Z" fill="${p.main}"/>
    <path d="M1041 4L1070 18L1038 28Z" fill="${p.accent}"/>
    <path d="M1038 28L1070 18L1035 34Z" fill="${fold}"/>
    <path d="M484 15L1026 11M505 105L548 104.5M1009 99L1049 98.5" fill="none" stroke="${edge}" stroke-width="1.4"/>
    <g transform="translate(518 58)" color="${p.pale}" opacity=".84">
      <circle r="23" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round" stroke-width="2.1">${paperSeals[i]}</g>
    </g>
  </g>`;
}
const C_TITLES={fold:'摺紙題簽',press:'活字海報'};
// Each tile follows the editable type's advance. All four characters share one baseline.
function letterpressPanel(f,p){
  const pitch=f.size+titleSpacing(f,'C'), w=pitch-5, h=99;
  const plates=[p.main,p.pale,p.main,p.mist];
  const shapes=[
    `M0 ${h}V35Q0 0 35 0H${w}V${h}Z`,
    `M0 0H${w-15}L${w} 15V${h}H0Z`,
    `M0 0H${w}V${h-32}Q${w} ${h} ${w-32} ${h}H0Z`,
    `M0 14L14 0H${w}V${h}H0Z`
  ];
  const ridges=[
    `M.65 ${h-1}V35Q.65 .65 35 .65H${w-1}`,
    `M.65 ${h-1}V.65H${w-15}L${w-.65} 15`,
    `M.65 ${h-1}V.65H${w-1}`,
    `M.65 ${h-1}V14L14 .65H${w-1}`
  ];
  const tiles=shapes.map((shape,j)=>{
    const cx=W/2+(j-1.5)*pitch, y=j%2?6:10;
    return `<g transform="translate(${cx-w/2} ${y})"><path d="${shape}" fill="${p.ink}" transform="translate(3 3)"/><path d="${shape}" fill="${plates[j]}"/><path d="${ridges[j]}" fill="none" stroke="#FFF4DB" stroke-width="1.3" opacity=".85"/></g>`;
  }).join('');
  // Short arcs at the outer ends repeat the curve of the first and third pieces of type.
  const lines=`<path d="M476 19C504 19 523 36 523 58S504 97 476 97M476 29C498 29 511 41 511 58S498 87 476 87M476 39C491 39 499 47 499 58S491 77 476 77" fill="none" stroke="${p.pale}" stroke-width="2.8"/>`;
  return `<g data-layer="title-panel" data-layout="press" data-relief="raised">${lines}<g transform="translate(1548 116) rotate(180)">${lines}</g>${tiles}</g>`;
}
// The four parallel lane markings curve around each photo end. The middle stays clear.
function trackWing(p){
  const tracks=[0,1,2,3].map(lane=>{
    const x=437+lane*11, end=330+lane*10;
    return `<path d="M-12 ${-28-lane*9}H${end}C${x-40} ${-28-lane*9} ${x} 9 ${x} 58S${x-40} ${144+lane*9} ${end} ${144+lane*9}H-12" />`;
  }).join('');
  return `<path d="M0 0H494Q556 58 494 116H0Z" fill="${p.main}"/>
    <path d="M0 3H353C400 3 434 28 434 58S400 113 353 113H0Z" fill="${tint(p.ink,p.main,.47)}"/>
    <g fill="none" stroke="${p.pale}" stroke-width="2.5" opacity=".9">${tracks}</g>
    <path d="M480 0H540L504 30L482 30L515 6H480Z" fill="${p.accent}"/>
    <path d="M488 116L536 91H551L514 116Z" fill="${p.accent}"/> `;
}
function trackMarks(p){
  return `<g transform="translate(476 44)" fill="${p.accent}">
      <path d="M0 0H14L30 14L14 28H0L15 14Z"/>
      <path d="M25 0H35L51 14L35 28H25L40 14Z"/>
    </g>
    <g stroke="${p.pale}" fill="none" stroke-width="1.5" opacity=".82">
      <path d="M548 8H771m-215 0v5m12-5v3m12-3v3m12-3v5"/>
      <path d="M547 108H771"/>
    </g>`;
}
const B_TITLES={plain:'深墨',sweep:'主題色',reference:'暖白'};
// Aperture coordinates are in the banner's own coordinate system so dragging,
// full-width output and detail proofs share exactly the same crop.
function brandBox(i,side,scheme){
  const lead=side===(i%2===0?1:0);
  const calm=scheme==='A';
  const w=calm?(lead?414:274):(lead?467:333);
  const h=calm&&!lead?94:H;
  const inset=calm&&!lead?26:0;
  return {x:side?W-w-inset:inset,y:(H-h)/2,w,h};
}
function brandEnd(f,i,side,s,p,id){
  const {x,y,w,h}=brandBox(i,side,s);
  const right=side===1, edge=right?x:x+w;
  // Frame geometry is drawn outer edge first; photographs keep their orientation.
  const axis=right?(s==='B'?'translate('+W+' '+H+') rotate(180)':'translate('+W+' 0) scale(-1 1)'):'';
  const reach=right?W-edge:edge, inset=right?W-x-w:x;
  const a=s==='A',bottom=y+h;
  const boundary=a?`V${y+h*.59}L${reach-h*.41} ${bottom}`:
    `C${reach-18} 22 ${reach+6} 63 ${reach-104} 116`;
  const shape=`M${inset} ${y}H${reach} ${boundary}H${inset}Z`;
  const band=(shift,fill)=>`<path transform="translate(${shift} 0)" d="${shape}" fill="${fill}"/>`;
  const key=right?'right':'left';
  const bands=`<g data-layer="ribbon-${key}" transform="${axis}">${band(a?29:84,a?p.main:p.dark)}${band(a?7:46,a?p.pale:p.main)}${band(a?3:14,a?'#FFF9ED':p.accent)}</g>`;
  if(!f.elements[key])return bands;
  return bands+`<defs><clipPath id="${id}cut"><path transform="${axis}" d="${shape}"/></clipPath></defs>
    <g data-layer="photo-${key}" clip-path="url(#${id}cut)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${a?p.pale:p.main}"/>
    ${photoSurface(i,side,s,p,f.photos[side],id,{x,y,w,h})}</g>`;
}
function brandArtwork(d,i,s,bTitle,p,id){
  const f=d.floors[i],e=f.elements??defaultElements(f.title),a=s==='A';
  const light=a||bTitle==='reference';
  const ink=light?p.ink:'#FFFAF1',paper=a?'#FFFCF4':'#FFF7E8';
  const base=a?paper:light?p.mist:bTitle==='plain'?p.ink:tint(p.main,p.ink,.42);
  const outer=a?tint(p.mist,p.main,.16):light?p.pale:tint(p.main,p.dark,.28);
  const grad=id+'stock';
  const ground=`<defs><linearGradient id="${grad}"><stop stop-color="${outer}"/><stop offset=".36" stop-color="${base}"/><stop offset=".64" stop-color="${base}"/><stop offset="1" stop-color="${outer}"/></linearGradient></defs>
  <rect data-layer="ground" width="1548" height="116" fill="url(#${grad})"/>`;
  const relief=a?
    `<path d="M0 113H562Q490 112 471 108H0ZM1548 3h-545q49 1 78 5h467Z" fill="${p.main}"/>`:
    `<path d="M0 0h650c-91 0-135 40-206 58C330 88 169 60 0 99Z" fill="${p.main}" opacity=".66"/>
    <path d="M1548 116H892c111-3 162-49 254-67 162-32 262-4 402-42Z" fill="${p.main}" opacity=".68"/>`;
  const signature=`<g fill="none" stroke="${light?p.main:p.pale}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M697 14h52m50 0h52" stroke-width="1" opacity=".52"/>
    <path d="M754 9q12-2 20 5 8-7 20-5m-40 5q12-2 20 5 8-7 20-5" stroke-width="1.8"/></g>`;
  const ends=[0,1].map(side=>brandEnd({...f,elements:e},i,side,s,p,id+side)).join('');
  const title=titleLayer({...f,size:headlineSize({...f,elements:e})},ink,s,null,d.faceByEdition[s]);
  return ground+`<g data-layer="title-panel">${relief}</g>`+ends+(e.accents?`<g data-layer="accents">${signature}</g>`:'')+
    title+captionLayers(e,p,ink);
}

let scope=0;
function banner(d,i,scheme,{region=null,safety=false,center=false,cTitle=d.cTitle||'fold',bTitle=d.bTitle||'sweep'}={}){
  const f=d.floors[i],p=palette(i,f.tone,scheme),light=scheme==='A',prefix='v'+(++scope);
  const extra=safety?d.bleed*2:0;
  let x=-extra,y=-extra,w=W+2*extra,h=H+2*extra;
  if(region!==null){[x,w]=REGIONS[region];if(region===0)x-=extra;if(region!==1)w+=extra;}
  // C uses a darker backing sheet to separate the raised title face from the photo mounts.
  const edge=light?p.pale:p.main;
  const middle=scheme==='C'?tint(p.main,p.dark,.64):scheme==='D'?p.ink:light?p.mist:p.dark;
  const edgeTone=scheme==='C'?tint(p.main,'#FFFFFF',.18):edge;
  const defs=`<defs><linearGradient id="${prefix}bg" x2="1" y2=".24" gradientUnits="objectBoundingBox"><stop stop-color="${edgeTone}"/><stop offset=".33" stop-color="${middle}"/><stop offset=".70" stop-color="${light?'#FFFBF0':middle}"/><stop offset="1" stop-color="${edgeTone}"/></linearGradient><clipPath id="${prefix}trim"><rect width="${W}" height="${H}"/></clipPath></defs>`;
  let art;
  if(scheme==='A'||scheme==='B'){
    art=brandArtwork(d,i,scheme,bTitle,p,prefix);
  }else{
    const paper=scheme==='C',press=paper&&cTitle==='press';
    const elements=f.elements??defaultElements(f.title);
    const typeFloor={...f,size:headlineSize({...f,elements})};
    const fill=paper&&i===1?'#321B09':'#FFFCF2';
    const inks=press?[fill,p.ink,fill,p.ink]:null;
    const mirror=part=>part+'<g transform="translate(1548 116) rotate(180)">'+part+'</g>';
    const slots=f.photos.map((photo,j)=>elements[j?'right':'left']?picture(i,j,scheme,p,photo,prefix+(j?'r':'l')):'').join('');
    const seam=paper?`<path d="M13 107l146-5 59 1-194 12Z" fill="${photoField(scheme,p)}"/><path d="M20 110l173-8" stroke="${p.main}" opacity=".6"/>`:
      `<path d="M0 110h253c74 0 113-7 158-35 29-18 40-42 49-73" fill="none" stroke="${p.pale}" stroke-width="2"/>`;
    art=`<rect data-layer="ground" width="${W}" height="${H}" fill="url(#${prefix}bg)"/>`+
      '<g data-layer="ribbons">'+mirror(paper?paperWing(p):trackWing(p))+'</g>'+slots+
      (elements.accents?'<g data-layer="accents">'+mirror((paper?paperCreases(p):trackMarks(p))+seam)+'</g>':'')+
      (press?letterpressPanel(typeFloor,p):paper?paperTitlePanel(p,i):'')+
      titleLayer(typeFloor,fill,scheme,inks,d.faceByEdition[titleEdition(scheme,cTitle)])+captionLayers(elements,p);
  }
  const design='<g clip-path="url(#'+prefix+'trim)">'+art+'</g>';
  const m=d.safe*2,guide=safety?'<g data-guide="production" fill="none" stroke-width="1.5"><rect x="'+(-extra+.5)+'" y="'+(-extra+.5)+'" width="'+(W+2*extra-1)+'" height="'+(H+2*extra-1)+'" stroke="#B62868"/><rect x=".5" y=".5" width="1547" height="115" stroke="#28374A"/><rect x="'+m+'" y="'+m+'" width="'+(W-2*m)+'" height="'+(H-2*m)+'" stroke="#087A69" stroke-dasharray="7 4"/></g>':'';
  return '<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+textEscape(f.title)+'　方案 '+scheme+'" width="'+w+'" height="'+h+'" viewBox="'+[x,y,w,h].join(' ')+'">'+defs+(extra?'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="#FAE4ED"/>':'')+design+guide+(center?'<path data-guide="center" d="M774 0v116M0 58h1548" stroke="#04A9B7" stroke-width="1.5" stroke-dasharray="6 3"/>':'')+'</svg>';
}

function layeredPreview(d,i,scheme){
  const doc=new DOMParser().parseFromString(banner(d,i,scheme),'image/svg+xml');
  const root=doc.documentElement,ns=root.namespaceURI;
  root.setAttribute('data-trim-width-in','774');root.setAttribute('data-trim-height-in','58');
  const title=doc.createElementNS(ns,'title');title.textContent=FLOORS[i].name+' '+d.floors[i].title+'｜方案 '+scheme+(scheme==='B'?' '+B_TITLES[d.bTitle||'sweep']:scheme==='C'?' '+C_TITLES[d.cTitle||'fold']:'')+'｜螢幕審閱初稿';
  root.prepend(title);
  const labels={...ELEMENT_NAMES,'ribbon-left':'左色帶','ribbon-right':'右色帶',ground:'主題漸層',ribbons:'照片邊緣色帶','photo-left':'左側活動照片','photo-right':'右側活動照片',accents:'裝飾線條','title-panel':scheme==='A'||scheme==='B'?'主題色帶':C_TITLES[d.cTitle||'fold'],headline:'中央四字標語'};
  for(const node of root.querySelectorAll('[data-layer]')){
    const key=node.getAttribute('data-layer');if(!labels[key])continue;
    const group=doc.createElementNS(ns,'g');
    group.setAttribute('id','layer-'+key);
    group.setAttributeNS('http://www.inkscape.org/namespaces/inkscape','inkscape:groupmode','layer');
    group.setAttributeNS('http://www.inkscape.org/namespaces/inkscape','inkscape:label',labels[key]);
    node.replaceWith(group);group.append(node);
  }
  embedSekiFont(root);
  return new XMLSerializer().serializeToString(root);
}
