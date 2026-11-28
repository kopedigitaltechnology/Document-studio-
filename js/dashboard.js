import {el,fmtSize,fmtDate} from './helpers.js';
import {allFiles} from './database.js';
import {state} from './state.js';
import {icon} from './icons.js';
import {avatarUrl} from './avatar.js';
const TOOLS=[['upload','Impor Berkas','files','cg'],['scan','Pindai Dokumen','scan','ct'],['edit','Edit PDF','pdf','ca'],['text','Teks ke PDF','text','ca'],['link','Gabung PDF','merge','cp'],['scissors','Potong PDF','split','cr'],['compress','Kompres PDF','compress','cr'],['pen','Tanda Tangan','sign','cp'],['convert','Konversi Format','convert','ca'],['pages','Atur Halaman','pages','cb'],['ocr','Gambar ke Teks (OCR)',0,'ct']];
const ico=t=>t==='application/pdf'?['pdf','cr']:t.startsWith('image/')?['image','cg']:['file','cb'];
export async function render(root){
 const fs=(await allFiles()).sort((a,b)=>b.added-a.added),est=navigator.storage?.estimate?await navigator.storage.estimate():{},url=await avatarUrl();
 const q=el('input',{type:'search',placeholder:'Cari dokumen, alat, atau aktivitas…',oninput:()=>draw()}),tiles=el('div',{class:'grid tiles'}),docs=el('div');
 const fill=el('div',{class:'fill'});fill.style.width=(est.quota?Math.max(1,Math.min(100,est.usage/est.quota*100)):0)+'%';
 const h=new Date().getHours(),sapa=h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam';
 const stat=(ic,t,v,tc)=>{const d=el('div',{class:'card statc'},el('span',{class:'li'},icon(ic)),el('div',{},el('b',{},v),el('small',{},t)));d.style.setProperty('--tc',tc);return d};
 const draw=()=>{const s=q.value.toLowerCase();
  tiles.replaceChildren(...TOOLS.filter(t=>t[1].toLowerCase().includes(s)).map(([i,l,r,c])=>{const b=el('button',{class:'tile'+(r?'':' off'),...(r?{onclick:()=>{location.hash='#'+r}}:{disabled:''})},el('span',{class:'ti '+c},icon(i)),el('span',{},l));if(!r)b.append(el('small',{},'Segera'));return b}));
  const m=fs.filter(f=>f.name.toLowerCase().includes(s)).slice(0,6);
  docs.replaceChildren(...(m.length?m.map(f=>el('div',{class:'doc'},el('span',{class:'di '+ico(f.type)[1]},icon(ico(f.type)[0])),el('div',{},el('b',{},f.name),el('div',{class:'meta'},fmtSize(f.size)+' · '+fmtDate(f.added)))))
   :[el('div',{class:'empty'},icon('folder'),el('p',{},fs.length?'Tidak ada hasil.':'Belum ada dokumen.'),el('button',{onclick:()=>{location.hash='#files'}},icon('upload'),' Impor sekarang'))]))};
 root.append(el('div',{class:'hero'},el('div',{class:'hrow'},el('div',{class:'avatar sm'},url?el('img',{src:url,alt:''}):icon('user')),el('div',{},el('div',{class:'meta'},sapa),el('h2',{},state.name),el('div',{class:'meta'},'Dokumen Anda diproses 100% lokal di perangkat ini.'))),
   el('div',{class:'bar light'},fill),el('div',{class:'meta'},'Penyimpanan: '+fmtSize(est.usage||0)+' / '+(est.quota?fmtSize(est.quota):'?')+' (IndexedDB)')),
  q,el('div',{class:'grid'},stat('file','Total berkas',String(fs.length),'#22b8cf'),stat('star','Berbintang',String(fs.filter(f=>f.star).length),'#f5b73b'),stat('lock','Terkunci',String(fs.filter(f=>f.locked).length),'#8b7cf6'),stat('db','Penyimpanan',fmtSize(est.usage||0),'#34d399')),
  el('div',{class:'stitle'},icon('bolt'),'Aksi cepat'),el('div',{class:'card'},tiles),
  el('div',{class:'two'},el('div',{},el('div',{class:'stitle'},icon('file'),'Dokumen terbaru'),el('div',{class:'card'},docs)),
   el('div',{},el('div',{class:'stitle'},icon('shield'),'Status keamanan'),el('div',{class:'card'},...[['PBKDF2-SHA256 · hash PIN',1],['AES-256-GCM · enkripsi berkas',1],['pdf-lib + pdf.js · PDF lokal',1],['Kunci PIN',!!state.pin],['Biometrik',!!state.bio]].map(([t,on])=>el('div',{class:'row'},t,el('span',{class:on?'ok':'meta'},on?'Aktif':'Nonaktif')))))));draw()}
