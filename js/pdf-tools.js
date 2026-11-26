import {el} from './helpers.js';
import * as S from './pdf-service.js';
import {addResult} from './results.js';
const OPS={merge:'Gabung PDF',split:'Pisah PDF',extract:'Ambil halaman',delete:'Hapus halaman',rotate:'Putar halaman',reorder:'Atur ulang / duplikat halaman',blank:'Sisipkan halaman kosong',meta:'Metadata PDF',watermark:'Watermark',numbers:'Nomor halaman, header & footer',compress:'Kompres (render ulang jadi gambar)',flatten:'Flatten (jadikan gambar)',repair:'Perbaiki PDF',compare:'Bandingkan 2 PDF'};
const PRE={merge:'merge',split:'split',compress:'compress',pages:'reorder'};
export function render(root){
 let op=PRE[location.hash.slice(1)]||'merge';const F={},out=el('div'),par=el('div'),inp=el('input',{type:'file',accept:'application/pdf'});
 const sel=el('select',{onchange:e=>{op=e.target.value;form()}},...Object.entries(OPS).map(([k,t])=>{const o=el('option',{value:k},t);if(k===op)o.selected=true;return o}));
 const fld=(k,lb,p={})=>{F[k]=el('input',{type:'text',...p});par.append(lb,F[k])};
 const dd=(k,lb,opts)=>{F[k]=el('select',{},...opts.map(([v,t])=>el('option',{value:v},t)));par.append(lb,F[k])};
 const form=()=>{par.replaceChildren();inp.multiple=op==='merge'||op==='compare';
  if(op==='split')fld('range','Grup dipisah ";" (contoh 1-3;4-6). Kosong = tiap halaman jadi satu berkas.');
  if(op==='extract'||op==='delete')fld('range','Halaman (contoh 1-3,5)');
  if(op==='rotate'){fld('range','Halaman (kosong = semua)');dd('deg','Sudut',[[90,'90° searah jarum jam'],[180,'180°'],[270,'270°']])}
  if(op==='reorder')fld('order','Urutan baru (contoh 3,1,2,2 — angka berulang = duplikat)');
  if(op==='blank')fld('pos','Sisipkan sebelum halaman nomor',{value:'1'});
  if(op==='meta'){for(const[k,l]of[['title','Judul'],['author','Penulis'],['subject','Subjek'],['keywords','Kata kunci (pisah koma)']])fld(k,l);
   par.append(el('button',{class:'sec',onclick:async()=>{if(!inp.files[0])return alert('Pilih PDF dulu.');try{const m=await S.getMeta(await S.bytesOf(inp.files[0]));for(const k of['title','author','subject','keywords'])F[k].value=m[k];alert('Jumlah halaman: '+m.pages)}catch(e){alert('Gagal: '+e.message)}}},'Baca metadata'))}
  if(op==='watermark'){fld('text','Teks watermark',{value:'RAHASIA'});dd('op','Kepekatan',[[.15,'Tipis'],[.3,'Sedang'],[.5,'Tebal']])}
  if(op==='numbers'){fld('header','Header (opsional)');fld('footer','Footer (opsional)');F.num=el('input',{type:'checkbox',checked:''});par.append(el('label',{},F.num,' Nomor halaman'))}
  if(op==='compress')dd('q','Kualitas',[['0.5,1.2','Rendah (file kecil)'],['0.7,1.5','Sedang'],['0.85,2','Tinggi']]);
  par.append(el('p',{class:'meta'},({compress:'Halaman dirender ulang jadi gambar JPEG. Efektif untuk PDF hasil scan/foto; untuk PDF berisi teks, ukuran justru bisa membesar. Teks tidak lagi bisa dipilih/dicari.',flatten:'Semua isi (termasuk anotasi) dijadikan gambar; teks tidak bisa dipilih lagi.',repair:'Memuat ulang dan menyimpan ulang struktur PDF. Tidak bisa menyelamatkan semua kerusakan. PDF yang diberi kata sandi tidak didukung.',watermark:'Watermark teks Latin saja (huruf di luar Latin-1 menjadi "?").'})[op]||''))};
 const run=async()=>{out.replaceChildren();const fs=[...inp.files];if(!fs.length)return alert('Pilih berkas PDF dulu.');if((op==='compare')&&fs.length<2)return alert('Pilih 2 PDF.');btn.disabled=true;btn.textContent='Memproses…';
  try{const bs=[];for(const f of fs)bs.push(await S.bytesOf(f));const b=bs[0],base=fs[0].name.replace(/\.pdf$/i,''),n=op==='merge'||op==='compare'?0:await S.pageCount(b),v=k=>F[k].value;
   if(op==='merge'){if(bs.length<2)throw new Error('Pilih minimal 2 PDF (tahan untuk pilih banyak).');addResult(out,'gabungan.pdf',await S.merge(bs))}
   else if(op==='split'){const g=v('range').trim()?v('range').split(';'):Array.from({length:n},(_,i)=>String(i+1));let i=0;for(const r of g)addResult(out,base+'-bagian'+(++i)+'.pdf',await S.pick(b,S.parseRange(r,n)))}
   else if(op==='extract')addResult(out,base+'-halaman.pdf',await S.pick(b,S.parseRange(v('range'),n)));
   else if(op==='delete')addResult(out,base+'-dihapus.pdf',await S.remove(b,S.parseRange(v('range'),n)));
   else if(op==='rotate')addResult(out,base+'-putar.pdf',await S.rotate(b,v('range').trim()?S.parseRange(v('range'),n):Array.from({length:n},(_,i)=>i),+v('deg')));
   else if(op==='reorder')addResult(out,base+'-urut.pdf',await S.pick(b,S.parseRange(v('order'),n)));
   else if(op==='blank'){const p=parseInt(v('pos'));if(!(p>=1&&p<=n+1))throw new Error('Posisi 1-'+(n+1));addResult(out,base+'-kosong.pdf',await S.insertBlank(b,p))}
   else if(op==='meta')addResult(out,base+'-meta.pdf',await S.setMeta(b,{title:v('title'),author:v('author'),subject:v('subject'),keywords:v('keywords')}));
   else if(op==='watermark'){if(!v('text').trim())throw new Error('Teks kosong');addResult(out,base+'-watermark.pdf',await S.watermark(b,v('text'),+v('op')))}
   else if(op==='numbers')addResult(out,base+'-nomor.pdf',await S.stamps(b,{numbers:F.num.checked,header:v('header'),footer:v('footer')}));
   else if(op==='compress'){const[q,sc]=v('q').split(',').map(Number);const r=await S.rasterize(b,sc,q);addResult(out,base+'-kompres.pdf',r);out.append(el('p',{class:'meta'},'Ukuran: '+Math.round(b.length/1024)+' KB → '+Math.round(r.size/1024)+' KB'))}
   else if(op==='flatten')addResult(out,base+'-flat.pdf',await S.rasterize(b,2,.9));
   else if(op==='repair')addResult(out,base+'-perbaikan.pdf',await S.repair(b));
   else if(op==='compare'){const r=await S.compare(bs[0],bs[1]);out.append(el('div',{class:'card'},el('p',{},'Halaman A: '+r.pagesA+' · Halaman B: '+r.pagesB),el('p',{},r.diff.length?'Teks berbeda pada halaman: '+r.diff.join(', '):'Teks semua halaman sama.'),el('p',{class:'meta'},'Perbandingan hanya pada teks, bukan tampilan visual.')))}
  }catch(e){alert('Gagal: '+(e.message||e))}btn.disabled=false;btn.textContent='Jalankan'};
 const btn=el('button',{onclick:run},'Jalankan');
 root.append(el('h2',{},'Alat PDF'),el('div',{class:'card'},sel,inp,par,btn,el('p',{class:'meta'},'Semua diproses di perangkat Anda. Proteksi kata sandi PDF belum didukung library ini; gunakan "Kunci" di menu Berkas (AES-256-GCM).')),out);form()}
