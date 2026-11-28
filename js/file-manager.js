import {el,fmtSize,fmtDate,uid,download,loadScript} from './helpers.js';
import {allFiles,putFile,delFile} from './database.js';
import {state} from './state.js';
import {icon} from './icons.js';
import {encrypt,decrypt} from './encryption.js';
import {dropzone,toast} from './ui.js';
const OK=['application/pdf','image/jpeg','image/png','image/webp','text/plain'],MAX=50*1048576;
export async function importFiles(list){const bad=[];for(const f of list){if(!OK.includes(f.type)||f.size>MAX){bad.push(f.name);continue}await putFile({id:uid(),name:f.name.replace(/[\\/]/g,'_'),type:f.type,size:f.size,added:Date.now(),star:false,locked:false,data:await f.arrayBuffer()})}return{bad}}
export async function saveBlob(name,blob){await putFile({id:uid(),name,type:blob.type,size:blob.size,added:Date.now(),star:false,locked:false,data:await blob.arrayBuffer()})}
const kind=t=>t==='application/pdf'?['pdf','cr','pdf']:t.startsWith('image/')?['image','cg','image']:['text','cb','file'];
async function plain(f){if(!f.locked)return f.data;const pw=prompt('Kata sandi berkas:');if(!pw)return null;try{return await decrypt(f.enc,pw)}catch{alert('Kata sandi salah.');return null}}
async function view(f){const d=await plain(f);if(!d)return;const dlg=el('dialog',{});const url=URL.createObjectURL(new Blob([d],{type:f.type}));
 dlg.append(el('h3',{},f.name),f.type.startsWith('image/')?el('img',{src:url}):f.type==='application/pdf'?el('iframe',{src:url}):el('pre',{},new TextDecoder().decode(d).slice(0,20000)),el('button',{onclick:()=>{dlg.close();dlg.remove();URL.revokeObjectURL(url)}},'Tutup'));document.body.append(dlg);dlg.showModal()}
async function save(f){const d=await plain(f);if(d)download(f.name,new Blob([d],{type:f.type}))}
async function lock(f){const pw=prompt('Buat kata sandi untuk mengenkripsi berkas (jika lupa, tidak bisa dipulihkan):');if(!pw)return;f.enc=await encrypt(f.data,pw);f.data=null;f.locked=true;await putFile(f)}
async function unlock(f){const d=await plain(f);if(!d)return;f.data=d;f.enc=null;f.locked=false;await putFile(f)}
export async function render(root){
 let q='',sort='added',flt='all',mode='grid',cache=[],run=0;const sel=new Set(),holders=new Map();
 const grid=el('div',{class:'files'}),chips=el('div',{class:'chips'}),bulk=el('div',{class:'card bulk'});bulk.hidden=true;
 const FL=[['all','Semua'],['pdf','PDF'],['image','Gambar'],['text','Teks'],['star','Berbintang'],['lock','Terkunci']];
 const isF=(f,k)=>k==='all'||(k==='pdf'&&f.type==='application/pdf')||(k==='image'&&f.type.startsWith('image/'))||(k==='text'&&f.type==='text/plain')||(k==='star'&&f.star)||(k==='lock'&&f.locked);
 const reload=async()=>{cache=await allFiles();for(const id of[...sel])if(!cache.some(f=>f.id===id))sel.delete(id);draw()};
 const ib=(n,t,fn)=>el('button',{class:'sec',title:t,'aria-label':t,onclick:fn},icon(n));
 async function thumbs(fs,my){for(const f of fs.slice(0,30)){if(my!==run)return;const h=holders.get(f.id);if(!h||f.locked)continue;
  try{if(f.type.startsWith('image/')){const u=URL.createObjectURL(new Blob([f.data],{type:f.type})),im=el('img',{src:u,alt:''});im.onload=()=>URL.revokeObjectURL(u);h.replaceChildren(im)}
  else if(f.type==='application/pdf'){const S=await import('./pdf-service.js'),d=await S.openDoc(new Uint8Array(f.data)),c=document.createElement('canvas');await S.renderTo(await d.getPage(1),c,.35);d.destroy?.();h.replaceChildren(c)}}catch{}}}
 const draw=()=>{const my=++run;holders.clear();
  chips.replaceChildren(...FL.map(([k,l])=>el('span',{class:'chip'+(flt===k?' on':''),onclick:()=>{flt=k;draw()}},l+' '+cache.filter(f=>isF(f,k)).length)));
  const fs=cache.filter(f=>isF(f,flt)&&f.name.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):b[sort]-a[sort]);
  grid.className='files '+mode;grid.replaceChildren();
  bulk.hidden=!sel.size;bulk.replaceChildren(el('b',{},sel.size+' terpilih'),el('span',{},
   el('button',{class:'sec',onclick:zip},icon('zip'),' Unduh ZIP'),el('button',{class:'danger',onclick:async()=>{if(confirm('Hapus '+sel.size+' berkas?')){for(const id of sel)await delFile(id);sel.clear();reload()}}},icon('trash'),' Hapus'),el('button',{class:'sec',onclick:()=>{sel.clear();draw()}},'Batal')));
  if(!fs.length)grid.append(el('div',{class:'empty'},icon('folder'),el('p',{},cache.length?'Tidak ada berkas yang cocok.':'Belum ada berkas. Impor lewat kotak di atas.')));
  for(const f of fs){const[lab,cls,ic]=kind(f.type),act=async fn=>{await fn();reload()},h=el('div',{class:'th '+cls},icon(f.locked?'lock':ic));holders.set(f.id,h);
   grid.append(el('div',{class:'fc'+(sel.has(f.id)?' sel':'')},h,
    el('input',{type:'checkbox',class:'ck',...(sel.has(f.id)?{checked:''}:{}),'aria-label':'Pilih',onchange:e=>{e.target.checked?sel.add(f.id):sel.delete(f.id);draw()}}),
    el('div',{class:'badge'},f.star?icon('star'):''),
    el('div',{class:'fi'},el('div',{class:'fn',title:f.name},f.name),el('div',{class:'meta'},lab.toUpperCase()+' · '+fmtSize(f.size)+' · '+fmtDate(f.added))),
    el('div',{class:'fa'},ib('star','Bintang',()=>act(async()=>{f.star=!f.star;await putFile(f)})),ib('eye','Lihat',()=>view(f)),ib('download','Unduh',()=>save(f)),ib('lock',f.locked?'Buka kunci':'Kunci',()=>act(()=>f.locked?unlock(f):lock(f))),
     ib('edit','Ganti nama',()=>act(async()=>{const n=prompt('Nama baru:',f.name);if(n&&n.trim()){f.name=n.trim().replace(/[\\/]/g,'_');await putFile(f)}})),ib('copy','Gandakan',()=>act(()=>putFile({...f,id:uid(),name:'Salinan '+f.name,added:Date.now()}))),
     ib('trash','Hapus',()=>act(async()=>{if(!state.confirmDelete||confirm('Hapus '+f.name+'?'))await delFile(f.id)})))))}
  thumbs(fs,my)};
 async function zip(){try{const Z=await loadScript('libraries/jszip.min.js','JSZip'),z=new Z();let n=0,skip=0;for(const f of cache.filter(f=>sel.has(f.id))){if(f.locked){skip++;continue}z.file(f.name,f.data);n++}if(!n)return toast('Semua berkas terpilih terkunci.');download('document-studio.zip',await z.generateAsync({type:'blob'}));toast(n+' berkas dikemas'+(skip?', '+skip+' terkunci dilewati':''))}catch(e){alert('Gagal membuat ZIP: '+e.message)}}
 const dz=dropzone({multiple:true,accept:'application/pdf,image/jpeg,image/png,image/webp,text/plain',label:'Impor berkas',types:['PDF','JPG','PNG','WEBP','TXT','maks 50 MB'],onfiles:async fl=>{toast('Mengimpor '+fl.length+' berkas…');const r=await importFiles(fl);dz.reset();toast((fl.length-r.bad.length)+' berkas diimpor'+(r.bad.length?', '+r.bad.length+' ditolak (tipe/ukuran)':''));reload()}});
 root.append(el('h2',{},'Berkas'),el('div',{class:'card'},dz,el('div',{class:'tb'},el('button',{class:'sec',onclick:()=>{location.hash='#scan'}},icon('scan'),' Pindai kamera'),el('button',{class:'sec',onclick:()=>{location.hash='#text'}},icon('text'),' Buat PDF dari teks'))),
  el('div',{class:'card'},el('div',{class:'tb'},el('input',{type:'search',placeholder:'Cari berkas…',oninput:e=>{q=e.target.value;draw()}}),
   el('select',{class:'sm',onchange:e=>{sort=e.target.value;draw()}},el('option',{value:'added'},'Terbaru'),el('option',{value:'name'},'Nama'),el('option',{value:'size'},'Ukuran')),
   ib('grid','Tampilan kartu',()=>{mode='grid';draw()}),ib('list','Tampilan daftar',()=>{mode='list';draw()})),chips,bulk,grid));reload()}
