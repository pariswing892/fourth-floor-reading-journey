// Proofs use the same live vector layers as the editor, with guides omitted.
function nested(svg,x,y,w,h){
  return svg.replace(/<svg /,'<svg x="'+x+'" y="'+y+'" ').replace(/width="[^"]+" height="[^"]+" viewBox=/,'width="'+w+'" height="'+h+'" viewBox=');
}
function reviewBoard(d,scheme){
  const compareTitles=scheme==='C'&&d.cTitle==='press';
  const width=1800,height=width*420/297,left=70,inner=1660,col=810,mid=920,ink='#29283A';
  const txt=(x,y,s,size=26,extra='')=>'<text x="'+x+'" y="'+y+'" fill="'+ink+'" font-size="'+size+'" '+extra+'>'+textEscape(s)+'</text>';
  const line=(x,y,w)=>'<path d="M'+x+' '+y+'h'+w+'" stroke="#CAC7D1"/>';
  let out='<rect width="1800" height="'+height+'" fill="#F8F8F4"/>';
  FLOORS.forEach((f,i)=>{out+='<rect x="'+i*450+'" width="450" height="10" fill="'+palette(i,d.floors[i].tone,scheme).main+'"/>';});
  out+=txt(left,72,'校園環境設計　／　第一階段',23)+txt(left,155,'四層外牆橫額',68,'font-weight="800"')+txt(1730,106,'校長審閱圖',34,'text-anchor="end" font-weight="700"')+txt(1730,152,'每層 774 × 58 吋',24,'text-anchor="end"')+line(left,185,inner);
  out+=txt(left,240,'四層總覽',34,'font-weight="750"')+txt(1730,240,compareTitles?'C2　活字海報　／　'+FACE_NAMES[d.faceByEdition.C2]+'・微凸字版':'方案 '+scheme+'　'+SCHEMES[scheme]+(scheme==='B'?'　／　'+B_TITLES[d.bTitle||'sweep']:''),26,'text-anchor="end"');
  d.floors.forEach((f,i)=>{
    const top=291+i*211,p=palette(i,f.tone,scheme);
    out+='<circle cx="80" cy="'+(top+12)+'" r="8" fill="'+p.main+'"/>'+txt(101,top+20,FLOORS[i].name+'　'+f.title+'　／　'+FLOORS[i].color,23);
    out+=nested(banner(d,i,scheme),left,top+45,inner,inner*H/W);
  });
  out+=line(left,1136,inner)+txt(left,1218,'方案對照與局部放大',38,'font-weight="750"');
  out+=txt(left,1270,scheme==='B'?(d.bTitle==='reference'?'同一組照片及筆鋒過渡，比較暖白題字與樓層色題字。':'同層對照原版白字與揮筆題字，各欄下方放大中央標語。'):'各欄上方為全幅，下方並列左側照片、中央標語與右側照片的放大細節。',23);
  const pair=scheme==='B'?['B','B']:compareTitles?['C','C']:scheme==='C'||scheme==='D'?['C','D']:['A','B'];
  pair.forEach((s,j)=>{
    const x=j?mid:left, cTitle=compareTitles?(j?'press':'fold'):'fold';
    const bTitle=scheme==='B'?(j?'sweep':d.bTitle==='reference'?'reference':'plain'):d.bTitle;
    const label=scheme==='B'?'B　'+B_TITLES[bTitle]:compareTitles?'C'+(j+1)+'　'+C_TITLES[cTitle]:s+'　'+SCHEMES[s];
    out+=txt(x,1360,label,32,'font-weight="750"')+line(x,1382,col);
    d.floors.forEach((f,i)=>{
      const y=1413+257*i;
      out+=txt(x,y+16,FLOORS[i].name+'　'+f.title,20);
      out+=nested(banner(d,i,s,{cTitle,bTitle}),x,y+34,col,col*H/W);
      // Three enlarged windows from the very same artwork, with narrow gutters.
      const positions=scheme==='B'?[[450,648,col]]:[[135,220,205],[507,534,384],[1175,220,205]];
      let px=x;
      for(const [vx,vw,slot] of positions){
        const cut=banner(d,i,s,{cTitle,bTitle}).replace('viewBox="0 0 1548 116"','viewBox="'+vx+' 0 '+vw+' '+H+'"');
        out+=nested(cut,px,y+103,slot,slot*H/vw);px+=slot+8;
      }
    });
  });
  const placed=d.floors.flatMap(visiblePhotos).filter(p=>p.src).length;
  const note=placed?'已置入 '+placed+' 張校方活動照片。':'本稿尚未置入活動照片。';
  out+=line(left,height-100,inner)+txt(left,height-58,note,20)+txt(width-left,height-58,'A3 直向　／　297 × 420 mm',20,'text-anchor="end"');
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'" font-family="'+FONTS+'" role="img" aria-label="校長審閱圖">'+out+'</svg>';
}
function loadImage(src){
  const im=new Image();im.src=src;return im.decode().then(()=>im);
}
function canvasBlob(canvas,type='image/png'){
  return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('無法建立審閱影像')),type,0.97));
}
async function raster(svg,width,type='image/png'){
  const xml=new DOMParser().parseFromString(svg,'image/svg+xml');
  const root=xml.documentElement;
  embedSekiFont(root);
  const ratio=Number(root.getAttribute('height'))/Number(root.getAttribute('width'));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.round(width*ratio);
  root.setAttribute('width',canvas.width);root.setAttribute('height',canvas.height);
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)],{type:'image/svg+xml;charset=utf-8'}));
  try{canvas.getContext('2d').drawImage(await loadImage(url),0,0);return await canvasBlob(canvas,type);}
  finally{URL.revokeObjectURL(url);}
}
// Canvas PNG encoders generally default to 96 dpi. Give only the A3 review sheet
// a physical print size by inserting the standard 300 dpi PNG density record.
async function a3ReviewPng(d,scheme){
  const png=await raster(reviewBoard(d,scheme),3508);
  const data=new DataView(await png.arrayBuffer());
  // pHYs payload: 11811 pixels per metre on both axes, unit metre, followed by its CRC.
  const density=Uint8Array.of(0,0,0,9,112,72,89,115,0,0,46,35,0,0,46,35,1,120,165,63,118);
  let offset=8;
  while(offset+12<=data.byteLength){
    const length=data.getUint32(offset),type=data.getUint32(offset+4);
    if(type===0x70485973||type===0x49444154){ // pHYs or first IDAT
      const next=type===0x70485973?offset+length+12:offset;
      return new Blob([png.slice(0,offset),density,png.slice(next)],{type:'image/png'});
    }
    offset+=length+12;
  }
  throw Error('未能設定 A3 審閱圖的列印尺寸。');
}
// The PDF uses the same 300 dpi proof as the PNG, on a page measured in PDF points.
async function a3ReviewPdf(d,scheme){
  const width=3508,height=Math.round(width*420/297);
  const image=await raster(reviewBoard(d,scheme),width,'image/jpeg');
  if(image.type!=='image/jpeg')throw Error('瀏覽器未能建立 PDF 所需的 JPEG 影像。');
  const pageWidth=(297*72/25.4).toFixed(5),pageHeight=(420*72/25.4).toFixed(5);
  const draw=`q
${pageWidth} 0 0 ${pageHeight} 0 0 cm
/Proof Do
Q
`;
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /PrintScaling /None >> >>',
    '<< /Type /Pages /Count 1 /Kids [3 0 R] >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Proof 4 0 R >> >> /Contents 5 0 R >>`,
    new Blob([`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.size} >>
stream
`,image,'\nendstream']),
    `<< /Length ${draw.length} >>
stream
${draw}endstream`
  ];
  const header=new Blob(['%PDF-1.4\n',Uint8Array.of(37,226,227,207,211,10)]);
  const parts=[header],offsets=[0];
  let offset=header.size;
  objects.forEach((body,index)=>{
    offsets.push(offset);
    const object=new Blob([`${index+1} 0 obj
`,body,'\nendobj\n']);
    parts.push(object);offset+=object.size;
  });
  const entries=offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');
  parts.push(`xref
0 ${offsets.length}
0000000000 65535 f 
${entries}trailer
<< /Size ${offsets.length} /Root 1 0 R >>
startxref
${offset}
%%EOF
`);
  return new Blob(parts,{type:'application/pdf'});
}
function save(blob,name){
  const link=document.createElement('a'),url=URL.createObjectURL(blob);
  link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
