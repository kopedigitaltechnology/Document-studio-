// OCR memakai Tesseract.js (dimuat lokal dari folder libraries/, tanpa CDN). Lihat libraries/README.md untuk berkas yang dibutuhkan.
import {el,download,loadScript} from './helpers.js';
import {pdfLib,safe} from './pdf-service.js';
import {toast,progressDlg} from './ui.js';
const D='libraries';
export const LANGS=[['ind+eng','Indonesia + Inggris'],['ind','Indonesia'],['eng','Inggris']];
let W=null,WL='',cb=null;
const MISSING='OCR belum aktif: berkas Tesseract.js belum ada di folder libraries/. Lihat libraries/README.md.';
export async function available(){try{const r=await fetch(D+'/tesseract.min.js',{method:'HEAD'});return r.ok&&!/html/.test(r.headers.get('content-type')||'')}catch{return false}}
async function engine(lang){
 if(W&&WL===lang)return W;if(W){await W.terminate().catch(()=>{});W=null}
 if(!await available())throw new Error(MISSING);
 const T=await loadScript(D+'/tesseract.min.js','Tesseract');
 try{W=await T.createWorker(lang.split('+'),1,{workerPath:D+'/worker.min.js',corePath:D,langPath:D,workerBlobURL:false,gzip:true,logger:m=>cb&&cb(m)});WL=lang;return W}
 catch(e){W=null;throw new Error('Gagal memuat mesin OCR: '+(e.message||e)+'. Pastikan berkas bahasa (mis. ind.traineddata.gz) ada di libraries/.')}}
export function wordsOf(data){if(data.words?.length)return data.words;const o=[];for(const b of data.blocks||[])for(const p of b.paragraphs||[])for(const l of p.lines||[])for(const w of l.words||[])o.push(w);return o}
function fit(cv,max=3200){const r=Math.min(1,max/Math.max(cv.width,cv.height));if(r===1)return{cv,r};const c=document.createElement('canvas');c.width=Math.round(cv.width*r);c.height=Math.round(cv.height*r);c.getContext('2d').drawImage(cv,0,0,c.width,c.height);return{cv:c,r}}
// Mengembalikan {text,words,confidence}; koordinat kata mengikuti ukuran canvas asli.
export async function recognize(canvas,lang='ind+eng',onProg){
 const w=await engine(lang),{cv,r}=fit(canvas);cb=m=>{if(m.status==='recognizing text')onProg?.(m.progress)};
 const{data}=await w.recognize(cv,{},{text:true,blocks:true});cb=null;
 const words=wordsOf(data).filter(x=>x.text&&x.text.trim()&&x.bbox).map(x=>({text:x.text,bbox:{x0:x.bbox.x0/r,y0:x.bbox.y0/r,x1:x.bbox.x1/r,y1:x.bbox.y1/r}}));
 return{text:(data.text||'').trim(),words,confidence:data.confidence}}
// pages: [{jpeg:Uint8Array,iw,ih,words}] -> Blob PDF dengan lapisan teks tak terlihat (bisa dicari & disalin)
export async function buildSearchable(pages,L){const{PDFDocument,StandardFonts}=L||await pdfLib(),d=await PDFDocument.create(),f=await d.embedFont(StandardFonts.Helvetica);
 for(const p of pages){const k=Math.min(595/p.iw,842/p.ih),W=p.iw*k,H=p.ih*k,pg=d.addPage([W,H]);pg.drawImage(await d.embedJpg(p.jpeg),{x:0,y:0,width:W,height:H});
  for(const w of p.words){const t=safe(w.text).trim();if(!t)continue;const bw=(w.bbox.x1-w.bbox.x0)*k,bh=(w.bbox.y1-w.bbox.y0)*k,tw=f.widthOfTextAtSize(t,1);if(!(tw>0&&bw>0))continue;
   pg.drawText(t,{x:w.bbox.x0*k,y:H-w.bbox.y1*k,size:Math.max(1,Math.min(bw/tw,bh*1.6)),font:f,opacity:0})}}
 return new Blob([await d.save()],{type:'application/pdf'})}
export const jpegOf=async(cv,q=.85)=>new Uint8Array(await(await new Promise(r=>cv.toBlob(r,'image/jpeg',q))).arrayBuffer());
// OCR beberapa canvas dengan dialog kemajuan. Mengembalikan array hasil, atau null bila gagal.
export async function runAll(canvases,lang,title='Mengenali teks (OCR)'){const dlg=progressDlg(title),out=[];
 try{for(let i=0;i<canvases.length;i++){dlg.set('Halaman '+(i+1)+' dari '+canvases.length+' — pertama kali bisa lebih lama (memuat mesin)',i/canvases.length);
   out.push(await recognize(canvases[i],lang,p=>dlg.set('Halaman '+(i+1)+' dari '+canvases.length+' · '+Math.round(p*100)+'%',(i+p)/canvases.length)))}
  dlg.close();return out}catch(e){dlg.close();alert(e.message||String(e));return null}}
export function textDialog(title,text,fname){const ta=el('textarea',{});ta.value=text||'(Tidak ada teks terdeteksi)';
 const d=el('dialog',{class:'dlg wide'},el('h3',{},title),ta,el('div',{class:'tb'},
  el('button',{onclick:async()=>{try{await navigator.clipboard.writeText(ta.value);toast('Teks disalin')}catch{ta.select();toast('Pilih teks lalu salin manual')}}},'Salin'),
  el('button',{class:'sec',onclick:()=>download(fname,new Blob([ta.value],{type:'text/plain'}))},'Unduh .txt'),
  el('button',{class:'sec',onclick:()=>{d.close();d.remove()}},'Tutup')));document.body.append(d);d.showModal()}
