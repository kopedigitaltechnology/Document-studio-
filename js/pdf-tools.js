import {el} from './helpers.js';
import * as S from './pdf-service.js';
import {addResult} from './results.js';
import {dropzone} from './ui.js';
import {icon} from './icons.js';
import {shell,mi,mh} from './shell.js';
import * as OCR from './ocr.js';
import {ask} from './ui.js';
const OPS={merge:'Gabung PDF',split:'Pisah PDF',extract:'Ambil halaman',delete:'Hapus halaman',rotate:'Putar halaman',reorder:'Atur ulang / duplikat halaman',blank:'Sisipkan halaman kosong',meta:'Metadata PDF',watermark:'Watermark',numbers:'Nomor halaman, header & footer',compress:'Kompres (render ulang jadi gambar)',flatten:'Flatten (jadikan gambar)',repair:'Perbaiki PDF',compare:'Bandingkan 2 PDF',protect:'Kunci PDF dengan kata sandi',unlock:'Buka kunci PDF',ocr:'OCR PDF scan (bisa dicari)'};
const PRE={merge:'merge',split:'split',compress:'compress',pages:'reorder'};
const IC={merge:'link',split:'scissors',extract:'file',delete:'trash',rotate:'rotate',reorder:'pages',blank:'plus',meta:'info',watermark:'layers',numbers:'text',compress:'compress',flatten:'layers',repair:'bolt',compare:'sliders',protect:'lock',unlock:'unlock',ocr:'ocr'},
 DS={merge:'Satukan beberapa PDF',split:'Pecah jadi beberapa berkas',extract:'Ambil halaman tertentu',delete:'Buang halaman tertentu',rotate:'Putar halaman',reorder:'Urutkan & duplikat',blank:'Tambah halaman kosong',meta:'Judul, penulis, subjek',watermark:'Teks diagonal',numbers:'Nomor, header, footer',compress:'Perkecil ukuran',flatten:'Jadikan gambar',repair:'Perbaiki struktur',compare:'Bandingkan teks',protect:'Enkripsi AES-256',unlock:'Hapus kata sandi',ocr:'Kenali teks dari gambar'},CL=['#22b8cf','#f5b73b','#8b7cf6','#f2575d','#5b8def','#34d399'];
export function render(root){
 let op=PRE[location.hash.slice(1)]||'merge';const F={},out=el('div'),par=el('div',{class:'card'}),head=el('div',{class:'hero'}),inp=dropzone({accept:'application/pdf',label:'Pilih PDF'});
 const sh=shell(root,{title:'Alat PDF',cls:'pad',menu:close=>el('div',{},mh('Pilih alat'),...Object.entries(OPS).map(([k,t],i)=>mi(IC[k],t,()=>{op=k;form();close()},{sub:DS[k],on:k===op,tc:CL[i%6]})))});
 const fld=(k,lb,p={})=>{F[k]=el('input',{type:'text',...p});par.append(el('span',{class:'lbl'},lb),F[k])};
 const dd=(k,lb,opts)=>{F[k]=el('select',{},...opts.map(([v,t])=>el('option',{value:v},t)));par.append(el('span',{class:'lbl'},lb),F[k])};
 const form=()=>{par.replaceChildren();out.replaceChildren();inp.multiple=op==='merge'||op==='compare';sh.setTitle(OPS[op]);
  head.replaceChildren(el('div',{class:'hrow'},el('span',{class:'avatar sm'},icon(IC[op])),el('div',{},el('h2',{},OPS[op]),el('div',{class:'meta'},DS[op]))),el('div',{class:'tb'},el('button',{class:'sec',onclick:sh.open},icon('more'),' Ganti alat (menu ⋮)')));
  if(op==='split')fld('range','Grup dipisah ";" (contoh 1-3;4-6). Kosong = tiap halaman jadi satu berkas.');
  if(op==='extract'||op==='delete')fld('range','Halaman (contoh 1-3,5)');
  if(op==='rotate'){fld('range','Halaman (kosong = semua)');dd('deg','Sudut',[[90,'90° searah jarum jam'],[180,'180°'],[270,'270°']])}
  if(op==='reorder')fld('order','Urutan baru (contoh 3,1,2,2 — angka berulang = duplikat)');
  if(op==='blank')fld('pos','Sisipkan sebelum halaman nomor',{value:'1'});
  if(op==='meta'){for(const[k,l]of[['title','Judul'],['author','Penulis'],['subject','Subjek'],['keywords','Kata kunci (pisah koma)']])fld(k,l);
   par.append(el('button',{class:'sec',onclick:async()=>{if(!inp.files[0])return alert('Pilih PDF dulu.');try{const m=await S.getMeta(await S.bytesOf(inp.files[0]));for(const k of['title','author','subject','keywords'])F[k].value=m[k];alert('Jumlah halaman: '+m.pages)}catch(e){alert('Gagal: '+e.message)}}},'Baca metadata'))}
  if(op==='watermark'){fld('text','Teks watermark',{value:'RAHASIA'});dd('op','Kepekatan',[[.15,'Tipis'],[.3,'Sedang'],[.5,'Tebal']])}
  if(op==='numbers'){fld('header','Header (opsional)');fld('footer','Footer (opsional)');F.num=el('input',{type:'checkbox',checked:''});par.append(el('label',{},F.num,' Nomor halaman'))}
  if(op==='protect'){fld('pw','Kata sandi untuk membuka PDF',{type:'password',autocomplete:'off'});fld('pw2','Ulangi kata sandi',{type:'password',autocomplete:'off'});fld('own','Kata sandi pemilik (opsional, untuk izin)',{type:'password',autocomplete:'off'});
   for(const[k,l,c]of[['aprint','Izinkan cetak',1],['acopy','Izinkan salin teks',1],['aedit','Izinkan ubah / anotasi',1]]){F[k]=el('input',{type:'checkbox',...(c?{checked:''}:{})});par.append(el('label',{},F[k],' '+l))}}
  if(op==='unlock')fld('pw','Kata sandi PDF',{type:'password',autocomplete:'off'});
  if(op==='ocr')dd('lang','Bahasa',OCR.LANGS);
  if(op==='compress')dd('q','Kualitas',[['0.5,1.2','Rendah (file kecil)'],['0.7,1.5','Sedang'],['0.85,2','Tinggi']]);
  if(!par.children.length)par.append(el('p',{class:'meta'},'Tidak ada opsi tambahan. Pilih berkas lalu tekan Jalankan.'));
  par.append(el('p',{class:'meta'},({compress:'Halaman dirender ulang jadi gambar JPEG. Efektif untuk PDF hasil scan/foto; untuk PDF berisi teks, ukuran justru bisa membesar. Teks tidak lagi bisa dipilih/dicari.',flatten:'Semua isi (termasuk anotasi) dijadikan gambar; teks tidak bisa dipilih lagi.',repair:'Memuat ulang dan menyimpan ulang struktur PDF. Tidak bisa menyelamatkan semua kerusakan. PDF berkata sandi: buka kunci dulu.',protect:'Enkripsi AES-256 (standar PDF 2.0) dijalankan di perangkat. Kata sandi yang hilang tidak bisa dipulihkan. Izin cetak/salin/ubah dihormati pembaca PDF utama, tetapi tidak semua aplikasi mematuhinya.',unlock:'Perlu kata sandi yang benar. Jika struktur berkas tidak bisa dibuka langsung, tersedia opsi render ulang menjadi gambar.',ocr:'Halaman dirender ulang jadi gambar lalu diberi lapisan teks tak terlihat sehingga bisa dicari/disalin. Butuh berkas Tesseract.js di libraries/. Proses lambat untuk PDF panjang.',watermark:'Watermark teks Latin saja (huruf di luar Latin-1 menjadi "?").'})[op]||''))};
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
   else if(op==='protect'){if(v('pw')!==v('pw2'))throw new Error('Kata sandi tidak sama.');addResult(out,base+'-terkunci.pdf',await S.protect(b,{user:v('pw'),owner:v('own'),allow:{print:F.aprint.checked,copy:F.acopy.checked,edit:F.aedit.checked}}))}
   else if(op==='unlock'){try{addResult(out,base+'-terbuka.pdf',await S.unlock(b,v('pw')))}catch(e){if(!(e instanceof S.UnsupportedError))throw e;
     if(!await ask('Render ulang?',e.message+' Hasil bisa dibuat sebagai gambar (teks tidak bisa dipilih; bisa dipulihkan dengan OCR).','Render ulang'))throw new Error('Dibatalkan');addResult(out,base+'-terbuka.pdf',await S.rasterize(b,2,.9,v('pw')))}}
   else if(op==='ocr'){const doc=await S.openDoc(b),cs=[];for(let i=1;i<=doc.numPages;i++){const c=document.createElement('canvas');await S.renderTo(await doc.getPage(i),c,2.5);cs.push(c)}
    const r=await OCR.runAll(cs,v('lang'));if(!r)throw new Error('OCR dibatalkan atau gagal.');const it=[];for(let i=0;i<cs.length;i++)it.push({jpeg:await OCR.jpegOf(cs[i],.8),iw:cs[i].width,ih:cs[i].height,words:r[i].words});
    addResult(out,base+'-ocr.pdf',await OCR.buildSearchable(it));const txt=r.map((x,i)=>'--- Halaman '+(i+1)+' ---\n'+x.text).join('\n\n');addResult(out,base+'-ocr.txt',new Blob([txt],{type:'text/plain'}));out.append(el('button',{class:'sec',onclick:()=>OCR.textDialog('Hasil OCR',txt,base+'-ocr.txt')},'Lihat teks'))}
   else if(op==='compare'){const r=await S.compare(bs[0],bs[1]);out.append(el('div',{class:'card'},el('p',{},'Halaman A: '+r.pagesA+' · Halaman B: '+r.pagesB),el('p',{},r.diff.length?'Teks berbeda pada halaman: '+r.diff.join(', '):'Teks semua halaman sama.'),el('p',{class:'meta'},'Perbandingan hanya pada teks, bukan tampilan visual.')))}
  }catch(e){alert('Gagal: '+(e.message||e))}btn.disabled=false;btn.textContent='Jalankan'};
 const btn=el('button',{class:'cta wide',onclick:run},'Jalankan');
 sh.body.append(head,inp,par,btn,out,el('p',{class:'meta'},'Semua diproses di perangkat Anda. Untuk mengunci PDF dengan kata sandi, pilih alat "Kunci PDF" di menu ⋮.'));form()}
