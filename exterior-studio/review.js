// Proofs use the same live vector layers as the editor, with guides omitted.
function nested(svg,x,y,w,h){
  return svg.replace(/<svg /,'<svg x="'+x+'" y="'+y+'" ').replace(/width="[^"]+" height="[^"]+" viewBox=/,'width="'+w+'" height="'+h+'" viewBox=');
}
// Screen proofs reuse the artwork, including photo transforms and live copy.
function proofSheet(d,scheme,kind){
  const width=1800,margin=52,inner=width-2*margin,barH=inner*H/W;
  const titles={overview:'四層外牆總覽',details:'四層局部放大',compare:'新版 A／B 對照',board:'校長審閱圖'};
  const step=kind==='compare'?336:kind==='details'?230:184;
  const lower=170+4*step;
  const height=lower+(kind==='board'?841:35);
  const ink='#262E32',muted='#586267';
  const txt=(x,y,value,size,weight=500,color=ink,end=false)=>`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${end?'end':'start'}">${textEscape(value)}</text>`;
  const rule=(x,y,w)=>`<path d="M${x} ${y}h${w}" fill="none" stroke="#C9C8C0"/>`;
  let out=`<rect width="${width}" height="${height}" fill="#FAF9F4"/>`;
  out+=txt(margin,44,'大埔舊墟公立學校',18,650,muted)+txt(margin,107,titles[kind],48,800);
  const edition=kind==='compare'?'A　品牌典雅版　／　B　活力升級版':scheme+'　'+SCHEMES[scheme];
  out+=txt(width-margin,69,edition,27,700,ink,true)+txt(width-margin,101,'每層 774 × 58 吋',20,500,muted,true)+rule(margin,128,inner);
  const place=(i,s,x,y,w,h,window)=>{
    let art=banner(d,i,s);
    if(window)art=art.replace('viewBox="0 0 1548 116"','viewBox="'+window.join(' ')+'"');
    return nested(art,x,y,w,h);
  };
  for(let i=0;i<4;i++){
    const y=160+i*step,f=d.floors[i],color=palette(i,f.tone,scheme).main;
    out+=`<rect x="${margin}" y="${y-15}" width="28" height="6" fill="${color}"/>`+
      txt(margin+42,y,FLOORS[i].name+'　'+f.title,20,650);
    if(kind==='compare'){
      for(const [j,s] of ['A','B'].entries()){
        const yy=y+10+j*147;
        out+=txt(margin,yy+67,s,29,750);
        const w=inner-46;
        out+=place(i,s,margin+46,yy,w,w*H/W);
      }
    }else if(kind==='details'){
      const gap=14,windows=[347,600,347],scale=(inner-2*gap)/windows.reduce((a,b)=>a+b,0),h=H*scale;
      let x=margin;
      for(const [j,label] of REGION_NAMES.entries()){
        const vw=windows[j],w=vw*scale;
        const box=photoBox(j===2?1:0,scheme,f.photos[j===2?1:0],i);
        const cx=j===1?W/2:(scheme==='A'||scheme==='B'?box.x+box.w/2:j===0?FRAME/2:W-FRAME/2);
        const start=Math.min(W-vw,Math.max(0,cx-vw/2));
        out+=place(i,scheme,x,y+10,w,h,[start,0,vw,H])+txt(x,y+h+32,label,15,550,muted);
        x+=w+gap;
      }
    }else out+=place(i,scheme,margin,y+12,inner,barH);
  }
  if(kind==='board'){
    out+=rule(margin,lower-12,inner)+txt(margin,lower+45,'兩款構圖與中央文字',34,700);
    const w=(inner-32)/2;
    ['A','B'].forEach((s,j)=>{
      const x=margin+j*(w+32);
      out+=txt(x,lower+94,s+'　'+SCHEMES[s],25,700);
      d.floors.forEach((f,i)=>{
        const y=lower+122+i*170;
        out+=txt(x,y,FLOORS[i].name+'　'+f.title,16,650,muted)+place(i,s,x,y+9,w,w*H/W)+
          place(i,s,x+(w-600*84/H)/2,y+78,600*84/H,84,[474,0,600,H]);
      });
    });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${FONTS}" role="img" aria-label="${titles[kind]}">${out}</svg>`;
}

function reviewBoard(d,scheme){
  if(scheme==='A'||scheme==='B')return proofSheet(d,scheme,'board');
  const compareTitles=scheme==='C'&&d.cTitle==='press';
  const width=1800,height=2005,left=70,inner=1660,col=810,mid=920,ink='#29283A';
  const txt=(x,y,s,size=26,extra='')=>'<text x="'+x+'" y="'+y+'" fill="'+ink+'" font-size="'+size+'" '+extra+'>'+textEscape(s)+'</text>';
  const line=(x,y,w)=>'<path d="M'+x+' '+y+'h'+w+'" stroke="#CAC7D1"/>';
  let out='<rect width="1800" height="'+height+'" fill="#F8F8F4"/>';
  FLOORS.forEach((f,i)=>{out+='<rect x="'+i*450+'" width="450" height="10" fill="'+palette(i,d.floors[i].tone,scheme).main+'"/>';});
  out+=txt(left,72,'校園環境設計　／　第一階段',23)+txt(left,155,'四層外牆橫額',68,'font-weight="800"')+txt(1730,106,'校長審閱圖',34,'text-anchor="end" font-weight="700"')+txt(1730,152,'每層 774 × 58 吋',24,'text-anchor="end"')+line(left,185,inner);
  out+=txt(left,240,'四層總覽',34,'font-weight="750"')+txt(1730,240,compareTitles?'C2　活字海報　／　'+FACE_NAMES[d.faceByEdition.C2]+'・微凸字版':'方案 '+scheme+'　'+SCHEMES[scheme]+(scheme==='B'?'　／　'+B_TITLES[d.bTitle||'sweep']:''),26,'text-anchor="end"');
  d.floors.forEach((f,i)=>{
    const top=268+i*177,p=palette(i,f.tone,scheme);
    out+='<circle cx="80" cy="'+(top+12)+'" r="8" fill="'+p.main+'"/>'+txt(101,top+20,FLOORS[i].name+'　'+f.title+'　／　'+FLOORS[i].color,23);
    out+=nested(banner(d,i,scheme),left,top+32,inner,inner*H/W);
  });
  out+=line(left,993,inner)+txt(left,1052,'方案對照與局部放大',38,'font-weight="750"');
  out+=txt(left,1093,scheme==='B'?(d.bTitle==='reference'?'同一組照片及筆鋒過渡，比較暖白題字與樓層色題字。':'同層對照原版白字與揮筆題字，各欄下方放大中央標語。'):'各欄上方為全幅，下方並列左側照片、中央標語與右側照片的放大細節。',23);
  const pair=scheme==='B'?['B','B']:compareTitles?['C','C']:scheme==='C'||scheme==='D'?['C','D']:['A','B'];
  pair.forEach((s,j)=>{
    const x=j?mid:left, cTitle=compareTitles?(j?'press':'fold'):'fold';
    const bTitle=scheme==='B'?(j?'sweep':d.bTitle==='reference'?'reference':'plain'):d.bTitle;
    const label=scheme==='B'?'B　'+B_TITLES[bTitle]:compareTitles?'C'+(j+1)+'　'+C_TITLES[cTitle]:s+'　'+SCHEMES[s];
    out+=txt(x,1154,label,32,'font-weight="750"')+line(x,1170,col);
    d.floors.forEach((f,i)=>{
      const y=1190+192*i;
      out+=txt(x,y+16,FLOORS[i].name+'　'+f.title,20);
      out+=nested(banner(d,i,s,{cTitle,bTitle}),x,y+23,col,col*H/W);
      // Three enlarged windows from the very same artwork, with narrow gutters.
      const positions=scheme==='B'?[[460,628,610]]:[[135,235,154],[507,534,345],[1175,235,154]];
      const pad=scheme==='B'?100:76, factor=scheme==='B'?.76:.65;
      let px=x+pad;
      for(const [vx,vw,slot] of positions){
        const cut=banner(d,i,s,{cTitle,bTitle}).replace('viewBox="0 0 1548 116"','viewBox="'+vx+' 4 '+vw+' 108"');
        out+=nested(cut,px,y+89,slot,108*factor);px+=slot+4;
      }
    });
  });
  const placed=d.floors.flatMap(visiblePhotos).filter(p=>p.src).length;
  const note=placed?'已置入 '+placed+' 張校方活動照片。':'本稿尚未置入活動照片。';
  out+=line(left,1944,inner)+txt(left,1981,note,20);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'" font-family="'+FONTS+'" role="img" aria-label="校長審閱圖">'+out+'</svg>';
}
function loadImage(src){
  const im=new Image();im.src=src;return im.decode().then(()=>im);
}
function canvasBlob(canvas){
  return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('無法建立 PNG')),'image/png'));
}
async function raster(svg,width){
  const xml=new DOMParser().parseFromString(svg,'image/svg+xml');
  const root=xml.documentElement;
  embedSekiFont(root);
  const ratio=Number(root.getAttribute('height'))/Number(root.getAttribute('width'));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.round(width*ratio);
  root.setAttribute('width',canvas.width);root.setAttribute('height',canvas.height);
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)],{type:'image/svg+xml;charset=utf-8'}));
  try{canvas.getContext('2d').drawImage(await loadImage(url),0,0);return await canvasBlob(canvas);}
  finally{URL.revokeObjectURL(url);}
}
function save(blob,name){
  const link=document.createElement('a'),url=URL.createObjectURL(blob);
  link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
