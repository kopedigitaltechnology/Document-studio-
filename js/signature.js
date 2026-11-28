import {el,download,uid} from './helpers.js';
import {kvGet,kvSet} from './database.js';
import {dropzone,toast,swatches,seg} from './ui.js';
import {icon} from './icons.js';
import {shell,mh} from './shell.js';
const tb=(ic,t,fn)=>el('button',{class:'tbtn',title:t,'aria-label':t,onclick:fn},icon(ic));
export async function render(root){
 let sigs=(await kvGet('signatures'))||[],col='#111111',w=3,d=false,dirty=false;
 const cv=el('canvas'),pad=el('div',{class:'sigpad'},cv,el('div',{class:'base'})),x=cv.getContext('2d',{willReadFrequently:true});
 const dpr=()=>Math.min(devicePixelRatio||1,2),pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
 const style=()=>{x.lineCap=x.lineJoin='round';x.strokeStyle=col;x.lineWidth=w*dpr()*1.4};
 cv.addEventListener('pointerdown',e=>{d=true;dirty=true;cv.setPointerCapture(e.pointerId);style();x.beginPath();const p=pos(e);x.moveTo(...p);x.lineTo(p[0]+.1,p[1]);x.stroke()});
 cv.addEventListener('pointermove',e=>{if(d){x.lineTo(...pos(e));x.stroke()}});cv.addEventListener('pointerup',()=>{d=false});
 const clear=()=>{x.clearRect(0,0,cv.width,cv.height);dirty=false};
 const trim=()=>{const W=cv.width,H=cv.height,a=x.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=-1,y1=-1;for(let y=0;y<H;y++)for(let i=0;i<W;i++)if(a[(y*W+i)*4+3]>8){if(i<x0)x0=i;if(i>x1)x1=i;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0)return null;const p=12,sx=Math.max(0,x0-p),sy=Math.max(0,y0-p),sw=Math.min(W,x1+p)-sx,sh2=Math.min(H,y1+p)-sy,c=document.createElement('canvas');c.width=sw;c.height=sh2;c.getContext('2d').drawImage(cv,sx,sy,sw,sh2,0,0,sw,sh2);return c};
 const store=async b=>{sigs.push({id:uid(),blob:b});await kvSet('signatures',sigs);toast('Tanda tangan disimpan')};
 const save=()=>{const c=dirty&&trim();if(!c)return toast('Gambar dulu tanda tangannya');c.toBlob(async b=>{await store(b);clear()},'image/png')};
 const menu=close=>el('div',{},mh('Warna'),swatches(['#111111','#1d4ed8','#b91c1c','#047857'],col,c=>{col=c}),el('span',{class:'lbl'},'Ketebalan'),seg([['2','Tipis'],['3','Sedang'],['5','Tebal']],String(w),v=>{w=+v}),
  mh('Unggah gambar'),dropzone({accept:'image/png,image/jpeg',compact:true,label:'Unggah gambar tanda tangan',onfiles:async fl=>{if(fl[0]&&fl[0].size<5e6){await store(fl[0]);close()}}}),
  mh('Tersimpan ('+sigs.length+')'),...(sigs.length?sigs.map(s=>el('div',{class:'row'},el('img',{src:URL.createObjectURL(s.blob),class:'sig',alt:'Tanda tangan'}),el('span',{},tb('download','Unduh',()=>download('tanda-tangan.png',s.blob)),tb('trash','Hapus',async()=>{sigs=sigs.filter(q=>q.id!==s.id);await kvSet('signatures',sigs);sh.open()})))):[el('p',{class:'meta'},'Belum ada tanda tangan tersimpan.')]),
  el('p',{class:'meta'},'Ini tanda tangan visual, bukan tanda tangan digital bersertifikat. Pakai lewat alat Tanda tangan di Viewer & Editor PDF.'));
 const sh=shell(root,{title:'Tanda Tangan',cls:'col',actions:[tb('eraser','Bersihkan',clear),tb('check','Simpan tanda tangan',save)],menu});
 sh.body.append(el('div',{class:'meta statline'},'Gambar tanda tangan di area putih dengan jari atau mouse'),pad);
 requestAnimationFrame(()=>{const r=pad.getBoundingClientRect();cv.width=Math.round(r.width*dpr());cv.height=Math.round(r.height*dpr())})}
