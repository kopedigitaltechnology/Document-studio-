import {el,download} from './helpers.js';
import {blobOf} from './imaging.js';
import {makePdf} from './pdf-writer.js';
import {saveBlob} from './file-manager.js';
import {bytesOf,pdfToImages,pdfText} from './pdf-service.js';
const OPS={jpg2png:['JPG → PNG','image/jpeg'],png2jpg:['PNG → JPG','image/png'],img2pdf:['Gambar → PDF','image/*'],txt2pdf:['TXT → PDF','text/plain'],pdf2png:['PDF → PNG','application/pdf'],pdf2jpg:['PDF → JPG','application/pdf'],pdf2txt:['PDF → TXT','application/pdf']};
export function render(root){
 let op='jpg2png';const out=el('div'),inp=el('input',{type:'file',multiple:'',accept:OPS[op][1]});
 const sel=el('select',{onchange:e=>{op=e.target.value;inp.accept=OPS[op][1]}},...Object.entries(OPS).map(([k,[t]])=>el('option',{value:k},t)));
 const add=(name,blob)=>out.append(el('div',{class:'row'},name,el('span',{},el('button',{class:'sec',onclick:()=>download(name,blob)},'Unduh'),el('button',{class:'sec',onclick:async e=>{await saveBlob(name,blob);e.target.disabled=true;e.target.textContent='Tersimpan'}},'Simpan ke Berkas'))));
 const cvs=async f=>{const b=await createImageBitmap(f),c=document.createElement('canvas');c.width=b.width;c.height=b.height;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(b,0,0);return c};
 const base=f=>f.name.replace(/\.[^.]+$/,'');
 const go=async()=>{out.replaceChildren();const fs=[...inp.files];if(!fs.length)return alert('Pilih berkas dulu.');
  try{if(op==='jpg2png'||op==='png2jpg'){const png=op==='jpg2png';for(const f of fs)add(base(f)+(png?'.png':'.jpg'),await blobOf(await cvs(f),png?'image/png':'image/jpeg',.92))}
  else if(op==='img2pdf'){const it=[];for(const f of fs){const c=await cvs(f);it.push({jpeg:new Uint8Array(await(await blobOf(c,'image/jpeg',.88)).arrayBuffer()),iw:c.width,ih:c.height})}add('gambar.pdf',makePdf(it))}
  else if(op==='txt2pdf')for(const f of fs)add(base(f)+'.pdf',makePdf([{text:await f.text()}]));
  else for(const f of fs){const by=await bytesOf(f);if(op==='pdf2txt')add(base(f)+'.txt',new Blob([(await pdfText(by)).map((t,i)=>'--- Halaman '+(i+1)+' ---\n'+t).join('\n\n')],{type:'text/plain'}));else for(const r of await pdfToImages(by,op==='pdf2png'?'png':'jpeg'))add(base(f)+'-'+r.name,r.blob)}}catch{alert('Konversi gagal. Pastikan berkas valid.')}};
 root.append(el('h2',{},'Konversi'),el('div',{class:'card'},sel,inp,el('button',{onclick:go},'Konversi'),el('p',{class:'meta'},'TXT→PDF: huruf di luar Latin-1 menjadi "?". PDF→TXT hanya untuk PDF yang punya teks (hasil scan butuh OCR). DOCX→PDF dan HTML→PDF belum didukung.')),out)}
