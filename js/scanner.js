import {el,download} from './helpers.js';
import {render as proc,blobOf} from './imaging.js';
import {makePdf} from './pdf-writer.js';
import {saveBlob} from './file-manager.js';
import {dropzone,toast,ask} from './ui.js';
import {shell,mh,mi} from './shell.js';
import {icon} from './icons.js';
import {analyze,findQuad} from './detect.js';
import * as OCR from './ocr.js';
const MODES=[['original','Warna asli'],['document','Dokumen'],['enhanced','Enhanced'],['gray','Abu-abu'],['bw','Hitam putih'],['contrast','Kontras']];
const scaled=async(b,m)=>{const r=Math.min(1,m/Math.max(b.width,b.height));return r===1?b:createImageBitmap(b,{resizeWidth:Math.round(b.width*r),resizeHeight:Math.round(b.height*r),resizeQuality:'medium'})};
const tb=(ic,t,fn,dis)=>{const b=el('button',{class:'tbtn',title:t,'aria-label':t,onclick:fn},icon(ic));if(dis)b.disabled=true;return b};
export function render(root){
 const live=document.documentElement.dataset.mode==='mobile';
 const pages=[];let sel=-1,facing='environment',stream=null,cam=null,tick=null,words=[],auto=false,torch=false,still=0,last=null,cool=0,cropMode=false,perspMode=false,pq=null,ocrLang='ind+eng';
 const video=el('video',{playsinline:'',autoplay:'',class:'camv'}),det=el('canvas',{class:'det'}),chip=el('div',{class:'cchip'},live?'Arahkan kamera ke dokumen':'Arahkan kamera ke dokumen'),cnt=el('span',{class:'cnt'},'0'),th=el('canvas',{class:'cth',width:96,height:96});video.muted=true;
 const stage=el('div',{class:'stage'}),strip=el('div',{class:'strip'}),chips=el('div',{class:'chips'}),ctl=el('div'),acts=el('div',{class:'tbar'}),review=el('div');review.hidden=true;
 async function add(bmp){const p={bmp,mid:await scaled(bmp,1400),small:await scaled(bmp,240),mode:'original',b:0,c:1,rot:0,crop:null,quad:null};pages.push(p);sel=pages.length-1;cropMode=false;draw();paintCount()}
 function paintCount(){cnt.textContent=pages.length;const p=pages[pages.length-1];if(!p)return;const c=proc(p.small,p),g=th.getContext('2d'),s=Math.min(c.width,c.height);g.drawImage(c,(c.width-s)/2,(c.height-s)/2,s,s,0,0,96,96)}
 async function startStream(){stream?.getTracks().forEach(t=>t.stop());stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:3840},height:{ideal:2160}},audio:false});video.srcObject=stream;await video.play().catch(()=>{});
  flashB.hidden=!stream.getVideoTracks()[0].getCapabilities?.().torch;torch=false;flashB.classList.remove('on')}
 const cb=(ic,t,fn)=>{const b=el('button',{class:'cbtn',title:t,'aria-label':t,onclick:fn},icon(ic));return b};
 const flashB=cb('bolt','Lampu',async()=>{torch=!torch;flashB.classList.toggle('on',torch);try{await stream.getVideoTracks()[0].applyConstraints({advanced:[{torch}]})}catch{toast('Lampu tidak didukung')}});
 const autoB=el('button',{class:'cpill',onclick:()=>{auto=!auto;autoB.classList.toggle('on',auto);toast(auto?'Ambil otomatis aktif: tahan stabil di atas teks':'Ambil otomatis mati')}},icon('sparkle'),' Auto');
 async function shot(){const w=video.videoWidth,h=video.videoHeight;if(!w)return;const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(video,0,0);cam.classList.add('flash');setTimeout(()=>cam?.classList.remove('flash'),130);navigator.vibrate?.(25);await add(await createImageBitmap(c))}
 const an=document.createElement('canvas');
 function paintDet(r,vw,vh){const dpr=Math.min(devicePixelRatio||1,2),cw=cam.clientWidth,ch=cam.clientHeight;if(det.width!==Math.round(cw*dpr)){det.width=Math.round(cw*dpr);det.height=Math.round(ch*dpr)}
  const g=det.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,cw,ch);const s=Math.max(cw/vw,ch/vh),ox=(cw-vw*s)/2,oy=(ch-vh*s)/2,has=r.text||words.length>0;
  const gx=cw*.08,gy=ch*.2,gw=cw*.84,gh=ch*.52,L=28;g.lineWidth=4;g.lineCap='round';g.strokeStyle=has?'#34d399':'#22b8cf';
  for(const[px,py,dx,dy]of[[gx,gy,1,1],[gx+gw,gy,-1,1],[gx,gy+gh,1,-1],[gx+gw,gy+gh,-1,-1]]){g.beginPath();g.moveTo(px,py+dy*L);g.lineTo(px,py);g.lineTo(px+dx*L,py);g.stroke()}
  if(r.found){g.lineWidth=2.5;g.strokeStyle=r.text?'#34d399':'rgba(255,255,255,.55)';g.setLineDash(r.text?[]:[8,6]);g.strokeRect(r.box.x*vw*s+ox,r.box.y*vh*s+oy,r.box.w*vw*s,r.box.h*vh*s);g.setLineDash([])}
  g.lineWidth=2;g.strokeStyle='#22b8cf';for(const b of words)g.strokeRect(b.x*s+ox,b.y*s+oy,b.width*s,b.height*s);
  chip.className='cchip'+(has?' ok':r.found?' mid':'');chip.textContent=words.length?'Teks terdeteksi · '+words.length+' blok':r.text?'Teks terdeteksi — tahan stabil':r.found?'Dokumen terdeteksi':'Arahkan kamera ke dokumen'}
 function autoStep(r){if(cool>0){cool--;return}if(!auto||!(r.text||words.length)){still=0;return}const b=r.box;if(last&&Math.abs(b.x-last.x)+Math.abs(b.y-last.y)+Math.abs(b.w-last.w)+Math.abs(b.h-last.h)<.04)still++;else still=0;last=b;if(still>=7){still=0;cool=12;shot()}}
 function startDetect(){const TD=typeof TextDetector!=='undefined'?new TextDetector():null;let busy=false,t0=0;
  const loop=()=>{if(!cam)return;const vw=video.videoWidth,vh=video.videoHeight;
   if(vw){an.width=160;an.height=Math.max(1,Math.round(160*vh/vw));const x=an.getContext('2d',{willReadFrequently:true});x.drawImage(video,0,0,an.width,an.height);const r=analyze(x.getImageData(0,0,an.width,an.height).data,an.width,an.height);
    if(TD&&!busy&&Date.now()-t0>700){busy=true;t0=Date.now();TD.detect(video).then(a=>{words=a.map(t=>t.boundingBox)}).catch(()=>{words=[]}).finally(()=>{busy=false})}
    paintDet(r,vw,vh);autoStep(r)}
   tick=setTimeout(loop,200)};loop()}
 function closeCam(){clearTimeout(tick);stream?.getTracks().forEach(t=>t.stop());stream=null;cam?.remove();cam=null;words=[]}
 async function openCam(){if(!await ask('Izin kamera','Aplikasi akan meminta izin kamera. Gambar hanya diproses di perangkat ini dan tidak dikirim ke mana pun.','Buka kamera'))return;
  cam=el('div',{class:'cam'},video,det,el('div',{class:'ctop'},cb('x','Tutup',closeCam),live?chip:el('span',{}),flashB),
   el('div',{class:'cbot'},el('button',{class:'cgal',title:'Lihat hasil','aria-label':'Lihat hasil',onclick:closeCam},th,cnt),el('button',{class:'shutter',title:'Ambil','aria-label':'Ambil',onclick:shot}),el('div',{class:'cright'},live?autoB:'',cb('flip','Balik kamera',async()=>{facing=facing==='environment'?'user':'environment';try{await startStream()}catch{toast('Gagal mengganti kamera')}}))));
  document.body.append(cam);try{await startStream()}catch{closeCam();toast('Kamera tidak bisa diakses (izin ditolak, tidak didukung, atau bukan HTTPS)');return}
  paintCount();if(live)startDetect()}
 addEventListener('hashchange',closeCam,{once:true});
 function attachCrop(box,cv,p){const ov=el('canvas',{class:'ovl'});ov.width=cv.width;ov.height=cv.height;ov.style.touchAction='none';box.append(ov);let s=null;const pos=e=>{const r=ov.getBoundingClientRect();return[Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))]};
  const paint=r=>{const g=ov.getContext('2d'),W=ov.width,H=ov.height;g.clearRect(0,0,W,H);if(!r)return;g.fillStyle='rgba(0,0,0,.55)';g.fillRect(0,0,W,H);g.clearRect(r.x*W,r.y*H,r.w*W,r.h*H);g.strokeStyle='#22b8cf';g.lineWidth=Math.max(3,W/200);g.strokeRect(r.x*W,r.y*H,r.w*W,r.h*H)};
  const rect=(a,b)=>({x:Math.min(a[0],b[0]),y:Math.min(a[1],b[1]),w:Math.abs(a[0]-b[0]),h:Math.abs(a[1]-b[1])});
  ov.addEventListener('pointerdown',e=>{s=pos(e);ov.setPointerCapture(e.pointerId)});ov.addEventListener('pointermove',e=>{if(s)paint(rect(s,pos(e)))});
  ov.addEventListener('pointerup',e=>{if(!s)return;const r=rect(s,pos(e));s=null;if(r.w>.05&&r.h>.05){p.crop=r;cropMode=false;draw()}else paint(null)})}
 function autoCrop(){const p=pages[sel],c=proc(p.small,{...p,crop:null,mode:'original',b:0,c:1}),r=analyze(c.getContext('2d').getImageData(0,0,c.width,c.height).data,c.width,c.height);
  if(!r.found||r.box.w*r.box.h>.96)return toast('Tepi dokumen tidak terdeteksi jelas');const pd=.012,bx=Math.max(0,r.box.x-pd),by=Math.max(0,r.box.y-pd);p.crop={x:bx,y:by,w:Math.min(1-bx,r.box.w+2*pd),h:Math.min(1-by,r.box.h+2*pd)};draw();toast('Dipotong otomatis ke tepi dokumen')}
 function autoQuad(p){const c=proc(p.small,{mode:'original',b:0,c:1,rot:0,crop:null,quad:null}),q=findQuad(c.getContext('2d').getImageData(0,0,c.width,c.height).data,c.width,c.height);return q}
 function attachPersp(box,cv){const ov=el('canvas',{class:'ovl'});ov.width=cv.width;ov.height=cv.height;ov.style.touchAction='none';box.append(ov);let k=-1;
  const pos=e=>{const r=ov.getBoundingClientRect();return[Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))]};
  const paint=()=>{const g=ov.getContext('2d'),W=ov.width,H=ov.height,R=Math.max(14,W/28);g.clearRect(0,0,W,H);g.fillStyle='rgba(0,0,0,.45)';g.beginPath();g.rect(0,0,W,H);g.moveTo(pq[0][0]*W,pq[0][1]*H);for(const i of[3,2,1])g.lineTo(pq[i][0]*W,pq[i][1]*H);g.closePath();g.fill('evenodd');
   g.strokeStyle='#22b8cf';g.lineWidth=Math.max(3,W/220);g.beginPath();pq.forEach(([x,y],i)=>i?g.lineTo(x*W,y*H):g.moveTo(x*W,y*H));g.closePath();g.stroke();g.fillStyle='#22b8cf';for(const[x,y]of pq){g.beginPath();g.arc(x*W,y*H,R,0,7);g.fill()}};
  ov.addEventListener('pointerdown',e=>{const m=pos(e);let bd=1e9;pq.forEach((q,i)=>{const d=Math.hypot(q[0]-m[0],q[1]-m[1]);if(d<bd){bd=d;k=i}});if(bd>.18)k=-1;if(k>=0)ov.setPointerCapture(e.pointerId)});
  ov.addEventListener('pointermove',e=>{if(k<0)return;pq[k]=pos(e);paint()});ov.addEventListener('pointerup',()=>{k=-1});paint();return paint}
 function startPersp(){const p=pages[sel];pq=(p.quad||autoQuad(p)||[[.08,.08],[.92,.08],[.92,.92],[.08,.92]]).map(a=>[...a]);perspMode=true;cropMode=false;draw()}
 function applyPersp(){const p=pages[sel];const a=pq,cross=(o,b,c)=>(b[0]-o[0])*(c[1]-o[1])-(b[1]-o[1])*(c[0]-o[0]);
  if(![0,1,2,3].every(i=>cross(a[i],a[(i+1)%4],a[(i+2)%4])>0))return toast('Titik sudut harus membentuk segi empat cembung, urut kiri-atas, kanan-atas, kanan-bawah, kiri-bawah');
  p.quad=pq;p.crop=null;perspMode=false;draw();paintCount();toast('Perspektif diluruskan')}
 function draw(){review.hidden=!pages.length;emptyWrap.hidden=!!pages.length;
  strip.replaceChildren(...pages.map((p,i)=>{const c=proc(p.small,p);return el('div',{class:'st'+(i===sel?' on':''),onclick:()=>{sel=i;cropMode=false;draw()}},c,el('span',{class:'n'},String(i+1)))}));
  const p=pages[sel];if(!p){stage.replaceChildren();return}
  if(perspMode){const cv=proc(p.mid,{mode:'original',b:0,c:1,rot:0,crop:null,quad:null}),box=el('div',{class:'sbox'},cv);stage.replaceChildren(box);attachPersp(box,cv);
   chips.replaceChildren(el('span',{class:'meta'},'Geser 4 titik biru ke sudut dokumen, lalu tekan centang.'));ctl.replaceChildren();
   acts.replaceChildren(tb('check','Terapkan',applyPersp),tb('sparkle','Deteksi sudut otomatis',()=>{const q=autoQuad(p);if(!q)return toast('Sudut tidak terdeteksi jelas, atur manual');pq=q;draw()}),tb('x','Batal',()=>{perspMode=false;draw()}),tb('undo','Hapus koreksi',()=>{p.quad=null;perspMode=false;draw();paintCount()},!p.quad));return}
  const cv=proc(p.mid,cropMode?{...p,crop:null}:p),box=el('div',{class:'sbox'},cv);stage.replaceChildren(box);if(cropMode)attachCrop(box,cv,p);
  chips.replaceChildren(...MODES.map(([k,l])=>el('span',{class:'chip'+(p.mode===k?' on':''),onclick:()=>{p.mode=k;draw()}},l)));
  ctl.replaceChildren(el('span',{class:'lbl'},'Kecerahan'),el('input',{type:'range',min:-60,max:60,value:p.b,onchange:e=>{p.b=+e.target.value;draw()}}),el('span',{class:'lbl'},'Kontras'),el('input',{type:'range',min:.5,max:2,step:.1,value:p.c,onchange:e=>{p.c=+e.target.value;draw()}}));
  const mv=d=>{const j=sel+d;if(j<0||j>=pages.length)return;[pages[sel],pages[j]]=[pages[j],pages[sel]];sel=j;draw()};
  const cr=tb('crop',cropMode?'Batal potong':'Potong manual (seret di gambar)',()=>{cropMode=!cropMode;draw()});if(cropMode)cr.classList.add('on');
  acts.replaceChildren(tb('persp','Luruskan perspektif',startPersp),tb('rotate','Putar 90°',()=>{p.rot=(p.rot+90)%360;p.crop=null;draw()}),tb('sparkle','Potong otomatis',autoCrop),cr,tb('x','Hapus potongan',()=>{p.crop=null;draw()},!p.crop),el('span',{class:'sep'}),
   tb('left','Geser ke kiri',()=>mv(-1),sel===0),tb('right','Geser ke kanan',()=>mv(1),sel===pages.length-1),el('span',{class:'sep'}),
   tb('download','Unduh gambar halaman',async()=>download('halaman-'+(sel+1)+'.png',await blobOf(proc(p.bmp,p),'image/png'))),tb('trash','Hapus halaman',()=>{pages.splice(sel,1);sel=Math.min(sel,pages.length-1);cropMode=false;draw();paintCount()}))}
 const pdf=async()=>{const it=[];for(const p of pages){const cv=proc(p.bmp,p);it.push({jpeg:new Uint8Array(await(await blobOf(cv,'image/jpeg',.92)).arrayBuffer()),iw:cv.width,ih:cv.height})}return makePdf(it)};
 const nm=()=>'scan-'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.pdf';
 const fromFiles=async(fl,z)=>{try{for(const f of fl)await add(await createImageBitmap(f))}catch{toast('Gambar tidak valid')}z.reset();sh.close()};
 const galE=dropzone({accept:'image/*',multiple:true,compact:true,label:'Pilih foto dari galeri',onfiles:fl=>fromFiles(fl,galE)}),galM=dropzone({accept:'image/*',multiple:true,compact:true,label:'Pilih foto dari galeri',onfiles:fl=>fromFiles(fl,galM)});
 const empty=el('div',{class:'hero'},el('div',{class:'hrow'},el('span',{class:'avatar'},icon('scan')),el('div',{},el('h2',{},'Pindai dokumen'),el('div',{class:'meta'},'Warna asli, multi-halaman, hasil PDF atau gambar.'))),
  el('div',{},...['Warna asli','Multi-halaman','Potong & putar','PDF / gambar'].concat(live?['Deteksi teks langsung']:[]).map(t=>el('span',{class:'badge2'},icon('check'),t))),el('div',{class:'tb'},el('button',{class:'sec cta',onclick:openCam},icon('camera'),' Buka kamera')));
 review.append(stage,el('div',{class:'dock'},strip,chips,acts));
 const canv=()=>pages.map(p=>proc(p.bmp,p));
 const ocrPage=async()=>{if(!pages[sel])return toast('Belum ada halaman');const r=await OCR.runAll([proc(pages[sel].bmp,pages[sel])],ocrLang);if(r)OCR.textDialog('Teks halaman '+(sel+1),r[0].text,'halaman-'+(sel+1)+'.txt')};
 const ocrPdf=async(save)=>{if(!pages.length)return toast('Belum ada halaman');const cs=canv(),r=await OCR.runAll(cs,ocrLang,'OCR → PDF bisa dicari');if(!r)return;const it=[];for(let i=0;i<cs.length;i++)it.push({jpeg:await OCR.jpegOf(cs[i]),iw:cs[i].width,ih:cs[i].height,words:r[i].words});
  const b=await OCR.buildSearchable(it),n=nm().replace('scan-','scan-ocr-');if(save){await saveBlob(n,b);toast('PDF OCR disimpan ke Berkas')}else download(n,b)};
 const savePdf=async()=>{if(!pages.length)return toast('Belum ada halaman');await saveBlob(nm(),await pdf());toast('PDF disimpan ke Berkas')};
 const menu=close=>el('div',{},mh('Pindai'),mi('camera','Buka kamera',()=>{close();openCam()}),mh('Foto dari galeri'),galM,
  ...(pages[sel]?[mh('Penyesuaian halaman '+(sel+1)),el('span',{class:'lbl'},'Kecerahan'),el('input',{type:'range',min:-60,max:60,value:pages[sel].b,onchange:e=>{pages[sel].b=+e.target.value;draw()}}),el('span',{class:'lbl'},'Kontras'),el('input',{type:'range',min:.5,max:2,step:.1,value:pages[sel].c,onchange:e=>{pages[sel].c=+e.target.value;draw()}})]:[]),
  mh('OCR (kenali teks)'),el('select',{onchange:e=>{ocrLang=e.target.value}},...OCR.LANGS.map(([v,t])=>el('option',{value:v,...(v===ocrLang?{selected:''}:{})},t))),mi('ocr','Kenali teks halaman ini',()=>{close();ocrPage()}),mi('pdf','Simpan PDF bisa dicari (semua halaman)',()=>{close();ocrPdf(true)}),mi('download','Unduh PDF bisa dicari',()=>{close();ocrPdf(false)}),
  ...(pages[sel]?[mh('Perspektif'),mi('persp','Luruskan perspektif halaman '+(sel+1),()=>{close();startPersp()})]:[]),
  mh('Hasil'),mi('save','Simpan PDF ke Berkas',()=>{close();savePdf()}),mi('download','Unduh PDF',async()=>{close();if(pages.length)download(nm(),await pdf());else toast('Belum ada halaman')}),mi('trash','Hapus semua halaman',()=>{pages.length=0;sel=-1;draw();paintCount();close()},{tc:'#f2575d'}),
  el('p',{class:'meta'},'Deteksi teks langsung di HP memakai TextDetector bila tersedia di browser, atau perkiraan dari kontras gambar. Teks sebenarnya dikenali lewat menu OCR (butuh berkas Tesseract.js di libraries/). Perspektif bisa diluruskan per halaman.'));
 const sh=shell(root,{title:'Pindai',cls:'col',actions:[tb('camera','Buka kamera',openCam),tb('save','Simpan PDF ke Berkas',savePdf)],menu});
 const emptyWrap=el('div',{class:'fs-pad scrolly'},empty,el('div',{class:'card'},galE,el('div',{class:'meta'},live?'Tips: tahan HP stabil; aktifkan "Auto" di kamera untuk ambil otomatis saat teks terdeteksi.':'Di komputer: gunakan kamera atau pilih foto dari berkas.')));
 review.className='col2';
 sh.body.append(emptyWrap,review);
}
