import {el,fmtSize,fmtDate,uid} from './helpers.js';
import {allFiles,putFile,delFile} from './database.js';
import {state} from './state.js';
import {icon} from './icons.js';
import {encrypt,decrypt} from './encryption.js';
const OK=['application/pdf','image/jpeg','image/png','image/webp','text/plain'],MAX=50*1048576;
export async function importFiles(list){const bad=[];for(const f of list){if(!OK.includes(f.type)||f.size>MAX){bad.push(f.name);continue}await putFile({id:uid(),name:f.name.replace(/[\\/]/g,'_'),type:f.type,size:f.size,added:Date.now(),star:false,locked:false,data:await f.arrayBuffer()})}return{bad}}
async function plain(f){if(!f.locked)return f.data;const pw=prompt('Kata sandi berkas:');if(!pw)return null;try{return await decrypt(f.enc,pw)}catch{alert('Kata sandi salah.');return null}}
async function view(f){const d=await plain(f);if(!d)return;const dlg=el('dialog',{});const url=URL.createObjectURL(new Blob([d],{type:f.type}));
 dlg.append(el('h3',{},f.name),f.type.startsWith('image/')?el('img',{src:url}):f.type==='application/pdf'?el('iframe',{src:url}):el('pre',{},new TextDecoder().decode(d).slice(0,20000)),el('button',{onclick:()=>{dlg.close();dlg.remove();URL.revokeObjectURL(url)}},'Tutup'));document.body.append(dlg);dlg.showModal()}
async function download(f){const d=await plain(f);if(!d)return;const a=el('a',{href:URL.createObjectURL(new Blob([d],{type:f.type})),download:f.name});a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function lock(f){const pw=prompt('Buat kata sandi untuk mengenkripsi berkas (jika lupa, tidak bisa dipulihkan):');if(!pw)return;f.enc=await encrypt(f.data,pw);f.data=null;f.locked=true;await putFile(f)}
async function unlock(f){const d=await plain(f);if(!d)return;f.data=d;f.enc=null;f.locked=false;await putFile(f)}
export async function render(root){let q='',sort='added';const list=el('div');
 const draw=async()=>{const fs=(await allFiles()).filter(f=>f.name.toLowerCase().includes(q.toLowerCase()));
  fs.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):b[sort]-a[sort]);list.replaceChildren();
  if(!fs.length)list.append(el('p',{class:'meta'},'Belum ada berkas. Impor PDF, gambar, atau teks.'));
  for(const f of fs){const act=async fn=>{await fn();draw()};
   list.append(el('div',{class:'row'},el('div',{},el('b',{},f.star?icon('star'):'',f.locked?icon('lock'):'',' '+f.name),el('div',{class:'meta'},fmtSize(f.size)+' · '+fmtDate(f.added))),
    el('div',{},el('button',{class:'sec',onclick:()=>act(async()=>{f.star=!f.star;await putFile(f)})},icon('star')),el('button',{class:'sec',onclick:()=>view(f)},'Lihat'),el('button',{class:'sec',onclick:()=>download(f)},'Unduh'),
    el('button',{class:'sec',onclick:()=>act(()=>f.locked?unlock(f):lock(f))},f.locked?'Buka kunci':'Kunci'),
    el('button',{class:'danger',onclick:()=>act(async()=>{if(!state.confirmDelete||confirm('Hapus '+f.name+'?'))await delFile(f.id)})},'Hapus'))))}};
 const inp=el('input',{type:'file',multiple:'',accept:'application/pdf,image/jpeg,image/png,image/webp,text/plain',onchange:async e=>{const r=await importFiles([...e.target.files]);if(r.bad.length)alert('Ditolak (tipe tidak didukung / >50 MB): '+r.bad.join(', '));draw()}});
 root.append(el('h2',{},'Berkas'),el('div',{class:'card'},inp,el('input',{type:'search',placeholder:'Cari berkas…',oninput:e=>{q=e.target.value;draw()}}),
  el('select',{onchange:e=>{sort=e.target.value;draw()}},el('option',{value:'added'},'Urut: Tanggal'),el('option',{value:'name'},'Urut: Nama'),el('option',{value:'size'},'Urut: Ukuran'))),el('div',{class:'card'},list));draw()}
export async function saveBlob(name,blob){await putFile({id:uid(),name,type:blob.type,size:blob.size,added:Date.now(),star:false,locked:false,data:await blob.arrayBuffer()})}
