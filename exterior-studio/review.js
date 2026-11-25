// Proofs use the same live vector layers as the editor, with guides omitted.
function nested(svg,x,y,w,h){
  return svg.replace(/<svg /,'<svg x="'+x+'" y="'+y+'" ').replace(/width="[^"]+" height="[^"]+" viewBox=/,'width="'+w+'" height="'+h+'" viewBox=');
}
function reviewBoard(d,scheme){
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
  const placed=d.floors.flatMap(f=>f.photos).filter(p=>p.src).length;
  const note=placed?'已置入 '+placed+' / 8 張校方活動照片。':'照片位置以活動插畫示意，供校方選圖及構圖審閱。';
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
