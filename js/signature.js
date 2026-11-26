import {el,download} from './helpers.js';
import {kvGet,kvSet} from './database.js';
import {uid} from './helpers.js';
export async function render(root){
 let sigs=(await kvGet('signatures'))||[];
 const cv=el('canvas',{width:600,height:220,class:'pad'}),x=cv.getContext('2d');x.lineWidth=3;x.lineCap='round';x.strokeStyle='#111';let d=false;
 const pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
 cv.addEventListener('pointerdown',e=>{d=true;cv.setPointerCapture(e.pointerId);x.beginPath();x.moveTo(...pos(e))});
 cv.addEventListener('pointermove',e=>{if(d){x.lineTo(...pos(e));x.stroke()}});
 cv.addEventListener('pointerup',()=>{d=false});
 const list=el('div');
 const store=async b=>{sigs.push({id:uid(),blob:b});await kvSet('signatures',sigs);draw()};
 const draw=()=>{list.replaceChildren(...sigs.map(s=>el('div',{class:'row'},el('img',{src:URL.createObjectURL(s.blob),class:'sig'}),el('span',{},
  el('button',{class:'sec',onclick:()=>download('tanda-tangan.png',s.blob)},'Unduh'),
  el('button',{class:'danger',onclick:async()=>{sigs=sigs.filter(q=>q.id!==s.id);await kvSet('signatures',sigs);draw()}},'Hapus')))));
  if(!sigs.length)list.append(el('p',{class:'meta'},'Belum ada tanda tangan tersimpan.'))};
 root.append(el('h2',{},'Tanda Tangan'),el('div',{class:'card'},cv,
  el('button',{onclick:()=>cv.toBlob(b=>store(b),'image/png')},'Simpan tanda tangan'),el('button',{class:'sec',onclick:()=>x.clearRect(0,0,cv.width,cv.height)},'Bersihkan'),
  el('p',{class:'meta'},'Atau unggah gambar tanda tangan:'),el('input',{type:'file',accept:'image/png,image/jpeg',onchange:e=>{const f=e.target.files[0];if(f&&f.size<5e6)store(f)}}),
  el('p',{class:'meta'},'Ini tanda tangan visual, bukan tanda tangan digital bersertifikat. Menempel ke PDF butuh pdf-lib (tahap berikutnya).')),el('div',{class:'card'},list));draw()}
