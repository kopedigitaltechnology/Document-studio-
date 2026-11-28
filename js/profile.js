import {el,fmtDate,fmtSize} from './helpers.js';
import {state,save} from './state.js';
import {icon} from './icons.js';
import {allFiles,kvGet} from './database.js';
import {avatarUrl,setAvatar,clearAvatar} from './avatar.js';
import {toast} from './ui.js';
export async function render(root){
 const fs=await allFiles(),sigs=(await kvGet('signatures'))||[];let url=await avatarUrl(),editing=false;
 const hero=el('div',{class:'hero'}),pick=el('input',{type:'file',accept:'image/*',class:'dz-input',onchange:async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{await setAvatar(f);url=await avatarUrl();toast('Foto profil diperbarui');paint()}catch{toast('Gambar tidak valid')}}});
 const paint=()=>{const inp=el('input',{type:'text',value:state.name,maxlength:'40',class:'hin','aria-label':'Nama'});
  const done=async()=>{state.name=inp.value.trim()||'Pengguna Lokal';await save();editing=false;toast('Nama disimpan');paint()};inp.addEventListener('keydown',e=>{if(e.key==='Enter')done()});
  hero.replaceChildren(el('div',{class:'hrow'},
   el('div',{class:'avatar'},url?el('img',{src:url,alt:'Foto profil'}):icon('user'),el('button',{class:'cam',title:'Ganti foto','aria-label':'Ganti foto',onclick:()=>pick.click()},icon('camera'))),
   el('div',{},editing?el('div',{class:'tb'},inp,el('button',{class:'tbtn',title:'Simpan','aria-label':'Simpan',onclick:done},icon('check')),el('button',{class:'tbtn',title:'Batal','aria-label':'Batal',onclick:()=>{editing=false;paint()}},icon('x')))
     :el('div',{class:'tb'},el('h2',{},state.name),el('button',{class:'tbtn',title:'Ubah nama','aria-label':'Ubah nama',onclick:()=>{editing=true;paint();hero.querySelector('input').focus()}},icon('edit'))),
    el('div',{},el('span',{class:'badge2'},icon('user'),'Profil Lokal'),el('span',{class:'badge2'},icon('shield'),state.pin?'Dikunci PIN':'Tanpa PIN'),state.bio?el('span',{class:'badge2'},icon('finger'),'Biometrik'):''))),
   url?el('div',{class:'tb'},el('button',{class:'sec',onclick:async()=>{await clearAvatar();url=await avatarUrl();toast('Foto dihapus');paint()}},icon('trash'),' Hapus foto')):'')};
 const stat=(ic,t,v,tc)=>{const d=el('div',{class:'card statc'},el('span',{class:'li'},icon(ic)),el('div',{},el('b',{},v),el('small',{},t)));d.style.setProperty('--tc',tc);return d};
 root.append(pick,hero,el('div',{class:'grid'},stat('file','Berkas',String(fs.length),'#22b8cf'),stat('db','Ukuran total',fmtSize(fs.reduce((a,f)=>a+f.size,0)),'#8b7cf6'),stat('pen','Tanda tangan',String(sigs.length),'#f5b73b'),stat('user','Anggota sejak',fmtDate(state.since).split(',')[0],'#34d399')),
  el('div',{class:'card'},el('b',{},'Tentang profil ini'),el('p',{class:'meta'},'Profil tersimpan lokal di perangkat ini; tanpa akun dan tanpa login. Nama dan foto tidak dikirim ke server mana pun. Pengaturan, privasi, dan informasi aplikasi ada di menu Pengaturan.')));paint()}
