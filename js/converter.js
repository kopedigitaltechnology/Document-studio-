import {el} from './helpers.js';
import {blobOf} from './imaging.js';
import {makePdf} from './pdf-writer.js';
import {bytesOf,pdfToImages,pdfText,textToPdf} from './pdf-service.js';
import {htmlBlocks,mdBlocks,docxBlocks} from './doc-convert.js';
import {dropzone} from './ui.js';
import {icon} from './icons.js';
import {addResult} from './results.js';
import {shell,mi,mh} from './shell.js';
const OPS={jpg2png:['JPG','PNG','image/jpeg','image'],png2jpg:['PNG','JPG','image/png','image'],img2pdf:['Gambar','PDF','image/*','pdf'],txt2pdf:['TXT','PDF','text/plain,.txt','text'],md2pdf:['Markdown','PDF','.md,.markdown,text/markdown,text/plain','text'],html2pdf:['HTML','PDF (dasar)','.html,.htm,text/html','globe'],docx2pdf:['DOCX','PDF (teks saja)','.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document','file'],pdf2png:['PDF','PNG','application/pdf','image'],pdf2jpg:['PDF','JPG','application/pdf','image'],pdf2txt:['PDF','TXT','application/pdf','text']};
const CL=['#22b8cf','#f5b73b','#8b7cf6','#f2575d','#5b8def','#34d399'];
export function render(root){
 let op='jpg2png';const out=el('div'),inp=dropzone({multiple:true,accept:OPS[op][2],label:'Pilih berkas untuk dikonversi'}),head=el('div',{class:'hero'}),btn=el('button',{class:'cta wide'},icon('convert'),' Konversi');
 const sh=shell(root,{title:'Konversi',cls:'pad',menu:close=>el('div',{},mh('Pilih jenis konversi'),...Object.entries(OPS).map(([k,[a,b,,ic]],i)=>mi(ic,a+' → '+b,()=>{op=k;pick();close()},{on:k===op,tc:CL[i%6]})))});
 const pick=()=>{const[a,b,acc,ic]=OPS[op];inp.accept=acc;out.replaceChildren();sh.setTitle(a+' → '+b);head.replaceChildren(el('div',{class:'hrow'},el('span',{class:'avatar sm'},icon(ic)),el('div',{},el('h2',{},a+' → '+b),el('div',{class:'meta'},'Diproses di perangkat Anda'))),el('div',{class:'tb'},el('button',{class:'sec',onclick:sh.open},icon('more'),' Ganti jenis (menu ⋮)')))};
 const cvs=async f=>{const b=await createImageBitmap(f),c=document.createElement('canvas');c.width=b.width;c.height=b.height;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(b,0,0);return c};
 const base=f=>f.name.replace(/\.[^.]+$/,'');
 btn.onclick=async()=>{out.replaceChildren();const fs=[...inp.files];if(!fs.length)return alert('Pilih berkas dulu.');btn.disabled=true;
  try{if(op==='jpg2png'||op==='png2jpg'){const png=op==='jpg2png';for(const f of fs)addResult(out,base(f)+(png?'.png':'.jpg'),await blobOf(await cvs(f),png?'image/png':'image/jpeg',.92))}
  else if(op==='img2pdf'){const it=[];for(const f of fs){const c=await cvs(f);it.push({jpeg:new Uint8Array(await(await blobOf(c,'image/jpeg',.9)).arrayBuffer()),iw:c.width,ih:c.height})}addResult(out,'gambar.pdf',makePdf(it))}
  else if(['txt2pdf','html2pdf','md2pdf','docx2pdf'].includes(op))for(const f of fs){const bl=op==='txt2pdf'?[{text:await f.text()}]:op==='html2pdf'?htmlBlocks(await f.text()):op==='md2pdf'?await mdBlocks(await f.text()):await docxBlocks(await bytesOf(f));addResult(out,base(f)+'.pdf',await textToPdf(bl,{}))}
  else for(const f of fs){const by=await bytesOf(f);if(op==='pdf2txt')addResult(out,base(f)+'.txt',new Blob([(await pdfText(by)).map((t,i)=>'--- Halaman '+(i+1)+' ---\n'+t).join('\n\n')],{type:'text/plain'}));else for(const r of await pdfToImages(by,op==='pdf2png'?'png':'jpeg'))addResult(out,base(f)+'-'+r.name,r.blob)}
  }catch(e){alert('Konversi gagal: '+(e.message||'pastikan berkas valid.'))}btn.disabled=false};
 sh.body.append(head,inp,btn,out,el('p',{class:'meta'},'HTML dan DOCX dikonversi hanya teks dan struktur dasarnya (judul, paragraf, daftar), tanpa gambar, tabel, dan tata letak asli. PDF→TXT hanya untuk PDF yang punya teks (hasil scan butuh OCR).'));pick()}
