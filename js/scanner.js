import {el,download} from './helpers.js';
import {render as proc,blobOf} from './imaging.js';
import {makePdf} from './pdf-writer.js';
import {saveBlob} from './file-manager.js';
export function render(root){
 const pages=[];let sel=-1,stream=null;
 const video=el('video',{autoplay:'',playsinline:'',class:'preview'});video.muted=true;video.hidden=true;
 const box=el('div'),list=el('div'),ctl=el('div');
 const add=b=>{pages.push({bmp:b,mode:'document',b:0,c:1,rot:0});sel=pages.length-1;draw()};
 const stop=()=>{stream?.getTracks().forEach(t=>t.stop());stream=null;video.hidden=true;camB.hidden=false;snap.hidden=true;stopB.hidden=true};
 const camB=el('button',{onclick:async()=>{if(!confirm('Aplikasi meminta izin kamera. Gambar hanya diproses di perangkat ini dan tidak dikirim ke mana pun. Lanjut?'))return;
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});video.srcObject=stream;video.hidden=false;camB.hidden=true;snap.hidden=false;stopB.hidden=false}catch{alert('Kamera tidak bisa diakses (izin ditolak / tidak didukung / bukan HTTPS).')}}},'Buka kamera');
 const snap=el('button',{onclick:async()=>{const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);add(await createImageBitmap(c))}},'Ambil halaman');snap.hidden=true;
 const stopB=el('button',{class:'sec',onclick:stop},'Tutup kamera');stopB.hidden=true;
 const gal=el('input',{type:'file',accept:'image/*',multiple:'',onchange:async e=>{try{for(const f of e.target.files)add(await createImageBitmap(f))}catch{alert('Gambar tidak valid.')}e.target.value=''}});
 addEventListener('hashchange',stop,{once:true});
 const pdf=async()=>{if(!pages.length){alert('Belum ada halaman.');return null}const it=[];for(const p of pages){const cv=proc(p.bmp,p);it.push({jpeg:new Uint8Array(await(await blobOf(cv,'image/jpeg',.85)).arrayBuffer()),iw:cv.width,ih:cv.height})}return makePdf(it)};
 const nm=()=>'scan-'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.pdf';
 const draw=()=>{box.replaceChildren();list.replaceChildren();ctl.replaceChildren();
  pages.forEach((p,i)=>list.append(el('div',{class:'row'},(i===sel?'• ':'')+'Halaman '+(i+1),el('span',{},
   el('button',{class:'sec',onclick:()=>{sel=i;draw()}},'Pilih'),
   el('button',{class:'sec',onclick:()=>{if(i>0){[pages[i-1],pages[i]]=[pages[i],pages[i-1]];sel=i-1;draw()}}},'↑'),
   el('button',{class:'sec',onclick:()=>{if(i<pages.length-1){[pages[i+1],pages[i]]=[pages[i],pages[i+1]];sel=i+1;draw()}}},'↓'),
   el('button',{class:'danger',onclick:()=>{pages.splice(i,1);sel=Math.min(sel,pages.length-1);draw()}},'Hapus')))));
  const p=pages[sel];if(!p)return;const cv=proc(p.bmp,p);cv.className='preview';box.append(cv);
  const up=(k,f)=>e=>{p[k]=f(e.target.value);draw()};
  const mode=el('select',{onchange:up('mode',String)},...[['document','Dokumen'],['original','Asli'],['bw','Hitam Putih'],['gray','Abu-abu'],['enhanced','Enhanced'],['contrast','Kontras Tinggi']].map(([v,t])=>{const o=el('option',{value:v},t);if(p.mode===v)o.selected=true;return o}));
  ctl.append(mode,'Kecerahan',el('input',{type:'range',min:-60,max:60,value:p.b,onchange:up('b',Number)}),'Kontras',el('input',{type:'range',min:.5,max:2,step:.1,value:p.c,onchange:up('c',Number)}),
   el('button',{class:'sec',onclick:()=>{p.rot=(p.rot+90)%360;draw()}},'Putar 90°'),
   el('button',{class:'sec',onclick:async()=>download('halaman-'+(sel+1)+'.png',await blobOf(proc(p.bmp,p),'image/png'))},'Unduh gambar'))};
 root.append(el('h2',{},'Scanner'),el('div',{class:'card'},video,camB,snap,stopB,el('p',{class:'meta'},'Atau pilih foto dari galeri:'),gal),box,ctl,el('div',{class:'card'},list),
  el('div',{class:'card'},el('button',{onclick:async()=>{const b=await pdf();if(b){await saveBlob(nm(),b);alert('PDF disimpan ke Berkas.')}}},'Simpan PDF ke Berkas'),el('button',{class:'sec',onclick:async()=>{const b=await pdf();if(b)download(nm(),b)}},'Unduh PDF'),
  el('p',{class:'meta'},'Filter dilakukan lokal. Deteksi tepi otomatis, koreksi perspektif, dan reduksi noise belum ada.')))}
