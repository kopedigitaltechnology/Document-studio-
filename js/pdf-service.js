import {makePdf} from './pdf-writer.js';
let L,J;
export async function pdfLib(){if(!L){await new Promise((ok,no)=>{const s=document.createElement('script');s.src='libraries/pdf-lib.min.js';s.onload=ok;s.onerror=()=>no(new Error('pdf-lib.min.js belum ada di folder libraries/'));document.head.append(s)});L=window.PDFLib}return L}
export async function pdfjs(){if(!J){J=await import('../libraries/pdf.min.mjs');J.GlobalWorkerOptions.workerSrc='libraries/pdf.worker.min.mjs'}return J}
export async function openDoc(bytes){const j=await pdfjs();return j.getDocument({data:bytes.slice(),isEvalSupported:false}).promise}
const blob=b=>new Blob([b],{type:'application/pdf'});
export const bytesOf=f=>f.arrayBuffer().then(b=>new Uint8Array(b));
export function parseRange(s,n){const out=[];for(const p of s.split(',')){const t=p.trim();if(!t)continue;const m=t.match(/^(\d*)\s*-\s*(\d*)$/);let a,b;if(m){a=+m[1]||1;b=+m[2]||n}else if(/^\d+$/.test(t))a=b=+t;else throw new Error('Format halaman salah: '+t);if(a<1||b>n||a>b)throw new Error('Halaman di luar rentang 1-'+n);for(let i=a;i<=b;i++)out.push(i-1)}if(!out.length)throw new Error('Rentang halaman kosong');return out}
async function load(b,o={}){const{PDFDocument}=await pdfLib();return PDFDocument.load(b,{updateMetadata:false,...o})}
export async function pageCount(b){return(await load(b)).getPageCount()}
export async function merge(list){const{PDFDocument}=await pdfLib();const out=await PDFDocument.create();for(const b of list){const d=await load(b);(await out.copyPages(d,d.getPageIndices())).forEach(p=>out.addPage(p))}return blob(await out.save())}
export async function pick(b,idx){const{PDFDocument}=await pdfLib();const d=await load(b),out=await PDFDocument.create();(await out.copyPages(d,idx)).forEach(p=>out.addPage(p));return blob(await out.save())}
export async function remove(b,idx){const d=await load(b);[...new Set(idx)].sort((x,y)=>y-x).forEach(i=>d.removePage(i));if(!d.getPageCount())throw new Error('Tidak boleh menghapus semua halaman');return blob(await d.save())}
export async function rotate(b,idx,deg){const{degrees}=await pdfLib();const d=await load(b);for(const i of idx){const p=d.getPage(i);p.setRotation(degrees((p.getRotation().angle+deg)%360))}return blob(await d.save())}
export async function insertBlank(b,pos){const d=await load(b);const n=d.getPageCount(),i=Math.min(Math.max(pos-1,0),n),{width,height}=d.getPage(Math.min(i,n-1)).getSize();d.insertPage(i,[width,height]);return blob(await d.save())}
export async function getMeta(b){const d=await load(b);return{title:d.getTitle()||'',author:d.getAuthor()||'',subject:d.getSubject()||'',keywords:d.getKeywords()||'',pages:d.getPageCount()}}
export async function setMeta(b,m){const d=await load(b);d.setTitle(m.title);d.setAuthor(m.author);d.setSubject(m.subject);d.setKeywords(m.keywords?m.keywords.split(',').map(s=>s.trim()):[]);return blob(await d.save())}
export async function repair(b){const d=await load(b,{ignoreEncryption:true,throwOnInvalidObject:false});return blob(await d.save())}
const safe=s=>[...s].map(c=>{const k=c.charCodeAt(0);return(k>=32&&k<127)||(k>=160&&k<256)?c:'?'}).join('');
export async function watermark(b,text,opacity){const{StandardFonts,rgb,degrees}=await pdfLib();const d=await load(b),f=await d.embedFont(StandardFonts.HelveticaBold),t=safe(text);
 for(const p of d.getPages()){const{width:w,height:h}=p.getSize();const size=Math.min(120,100*.7*Math.hypot(w,h)/f.widthOfTextAtSize(t,100)),tw=f.widthOfTextAtSize(t,size),a=Math.PI/4;
  p.drawText(t,{x:w/2-tw/2*Math.cos(a)+size*.3*Math.sin(a),y:h/2-tw/2*Math.sin(a)-size*.3*Math.cos(a),size,font:f,color:rgb(.5,.5,.5),opacity,rotate:degrees(45)})}return blob(await d.save())}
export async function stamps(b,{numbers,header,footer}){const{StandardFonts,rgb}=await pdfLib();const d=await load(b),f=await d.embedFont(StandardFonts.Helvetica),n=d.getPageCount(),c=rgb(.2,.2,.2);
 d.getPages().forEach((p,i)=>{const{width:w,height:h}=p.getSize();const put=(t,x,y)=>p.drawText(safe(t),{x,y,size:10,font:f,color:c});
  if(header)put(header,w/2-f.widthOfTextAtSize(safe(header),10)/2,h-28);
  if(footer)put(footer,36,22);
  if(numbers){const t=(i+1)+' / '+n;put(t,footer?w-36-f.widthOfTextAtSize(t,10):w/2-f.widthOfTextAtSize(t,10)/2,22)}});return blob(await d.save())}
export async function renderTo(pg,canvas,scale){const vp=pg.getViewport({scale}),x=canvas.getContext('2d');canvas.width=vp.width;canvas.height=vp.height;x.fillStyle='#fff';x.fillRect(0,0,canvas.width,canvas.height);return pg.render({canvasContext:x,canvas,viewport:vp}).promise}
const toBlob=(c,t,q)=>new Promise(r=>c.toBlob(r,t,q));
export async function rasterize(b,scale,q){const doc=await openDoc(b),items=[];for(let i=1;i<=doc.numPages;i++){const c=document.createElement('canvas');await renderTo(await doc.getPage(i),c,scale);const jb=await toBlob(c,'image/jpeg',q);items.push({jpeg:new Uint8Array(await jb.arrayBuffer()),iw:c.width,ih:c.height});c.width=c.height=0}return makePdf(items)}
export async function pdfToImages(b,fmt,scale=2){const doc=await openDoc(b),out=[];for(let i=1;i<=doc.numPages;i++){const c=document.createElement('canvas');await renderTo(await doc.getPage(i),c,scale);out.push({name:'halaman-'+i+(fmt==='png'?'.png':'.jpg'),blob:await toBlob(c,'image/'+(fmt==='png'?'png':'jpeg'),.9)});c.width=c.height=0}return out}
export async function pdfText(b){const doc=await openDoc(b),out=[];for(let i=1;i<=doc.numPages;i++)out.push((await(await doc.getPage(i)).getTextContent()).items.map(x=>x.str).join(' '));return out}
export async function compare(a,b){const[x,y]=await Promise.all([pdfText(a),pdfText(b)]),n=s=>s.replace(/\s+/g,' ').trim(),diff=[];for(let i=0;i<Math.max(x.length,y.length);i++)if(n(x[i]||'')!==n(y[i]||''))diff.push(i+1);return{pagesA:x.length,pagesB:y.length,diff}}
const hex=h=>{const n=parseInt(h.slice(1),16);return{r:(n>>16&255)/255,g:(n>>8&255)/255,b:(n&255)/255}};
function wrapP(f,t,size,maxW){const o=[];for(const para of t.split('\n')){let l='';for(const w of para.split(' ')){const tr=l?l+' '+w:w;if(l&&f.widthOfTextAtSize(tr,size)>maxW){o.push(l);l=w}else l=tr}o.push(l)}return o}
export async function applyAnnotations(b,anns){const{StandardFonts,rgb}=await pdfLib();const d=await load(b),f=await d.embedFont(StandardFonts.Helvetica),col=c=>{const k=hex(c||'#000000');return rgb(k.r,k.g,k.b)};
 for(const a of anns){const pg=d.getPage(a.p),{width:W,height:H}=pg.getSize(),X=v=>v*W,Y=v=>H-v*H;
  if(a.t==='pen')for(let i=1;i<a.pts.length;i++)pg.drawLine({start:{x:X(a.pts[i-1][0]),y:Y(a.pts[i-1][1])},end:{x:X(a.pts[i][0]),y:Y(a.pts[i][1])},thickness:a.lw*W,color:col(a.c),lineCap:1});
  else if(a.t==='hl')pg.drawRectangle({x:X(a.x),y:Y(a.y+a.h),width:a.w*W,height:a.h*H,color:rgb(1,.92,0),opacity:.35});
  else if(a.t==='ln')pg.drawLine({start:{x:X(a.x),y:Y(a.y)},end:{x:X(a.x+a.w),y:Y(a.y)},thickness:a.lw*W,color:col(a.c)});
  else if(a.t==='rect')pg.drawRectangle({x:X(a.x),y:Y(a.y+a.h),width:a.w*W,height:a.h*H,borderColor:col(a.c),borderWidth:a.lw*W});
  else if(a.t==='text'||a.t==='note'){const fs=a.sz*W*(a.t==='note'?.8:1),pad=a.t==='note'?.008*W:0,lines=a.t==='note'?wrapP(f,safe(a.s),fs,.32*W-2*pad):safe(a.s).split('\n');
   if(a.t==='note')pg.drawRectangle({x:X(a.x),y:Y(a.y)-lines.length*fs*1.2-2*pad,width:.32*W,height:lines.length*fs*1.2+2*pad,color:rgb(.99,.9,.54)});
   lines.forEach((l,k)=>pg.drawText(l,{x:X(a.x)+pad,y:Y(a.y)-pad-k*1.2*fs-.8*fs,size:fs,font:f,color:a.t==='note'?rgb(.1,.1,.1):col(a.c)}))}
  else if(a.t==='img'){const im=a.type==='image/png'?await d.embedPng(a.bytes):await d.embedJpg(a.bytes),w=a.w*W,h=w*a.ar;pg.drawImage(im,{x:X(a.x),y:Y(a.y)-h,width:w,height:h})}}
 return blob(await d.save())}
