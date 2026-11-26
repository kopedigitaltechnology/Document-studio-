import {el,fmtSize,fmtDate} from './helpers.js';
import {allFiles} from './database.js';
import {state} from './state.js';
import {icon} from './icons.js';
const TOOLS=[['scan','Pindai Dokumen','scan','ct'],['edit','Edit PDF','pdf','ca'],['link','Gabung PDF','merge','cp'],['scissors','Potong PDF','split','cr'],['compress','Kompres PDF','compress','cr'],['pen','Tanda Tangan','sign','cp'],['ocr','Gambar ke Teks (OCR)',0,'ct'],['pages','Atur Halaman','pages','cb'],['convert','Konversi Format','convert','ca'],['folder','Kelola Berkas','files','cb']];
const ico=t=>t==='application/pdf'?['pdf','cr']:t.startsWith('image/')?['image','cg']:['file','cb'];
export async function render(root){
 const fs=(await allFiles()).sort((a,b)=>b.added-a.added);const est=navigator.storage?.estimate?await navigator.storage.estimate():{};
 const q=el('input',{type:'search',placeholder:'Cari dokumen, alat, atau aktivitas…',oninput:()=>draw()});
 const tiles=el('div',{class:'grid tiles'}),docs=el('div');
 const fill=el('div',{class:'fill'});fill.style.width=(est.quota?Math.max(1,Math.min(100,est.usage/est.quota*100)):0)+'%';
 const draw=()=>{const s=q.value.toLowerCase();
  tiles.replaceChildren(...TOOLS.filter(t=>t[1].toLowerCase().includes(s)).map(([i,l,r,c])=>{const b=el('button',{class:'tile'+(r?'':' off'),...(r?{onclick:()=>{location.hash='#'+r}}:{disabled:''})},el('span',{class:'ti '+c},icon(i)),el('span',{},l));if(!r)b.append(el('small',{},'Segera'));return b}));
  const m=fs.filter(f=>f.name.toLowerCase().includes(s)).slice(0,8);
  docs.replaceChildren(...(m.length?m.map(f=>el('div',{class:'doc'},el('span',{class:'di '+ico(f.type)[1]},icon(ico(f.type)[0])),el('div',{},el('b',{},f.locked?icon('lock'):'',' '+f.name),el('div',{class:'meta'},fmtSize(f.size)+' · '+fmtDate(f.added))))):[el('p',{class:'meta'},fs.length?'Tidak ada hasil.':'Belum ada dokumen. Impor atau pindai dulu.')]))};
 root.append(q,el('h2',{},'Selamat Datang di Document Studio'),el('p',{class:'meta'},'Data Anda, Privasi Anda. Dokumen diproses 100% lokal.'),
  el('div',{class:'bar'},fill),el('p',{class:'meta'},'Penyimpanan: '+fmtSize(est.usage||0)+' / '+(est.quota?fmtSize(est.quota):'?')+' (IndexedDB)'),
  el('div',{class:'card'},el('b',{},'Aksi Cepat'),tiles),
  el('div',{class:'two'},el('div',{class:'card'},el('b',{},'Dokumen Terbaru'),docs),
   el('div',{class:'card'},el('b',{},'Status Keamanan & Sistem'),...[['PBKDF2-SHA256 (hash PIN)',1],['pdf-lib + pdf.js (PDF lokal)',1],['AES-256-GCM (enkripsi berkas)',1],['Kunci PIN',!!state.pin],['Biometrik',!!state.bio]].map(([t,on])=>el('div',{class:'row'},t,el('span',{class:on?'ok':'meta'},on?'Aktif':'Nonaktif'))))));draw()}
