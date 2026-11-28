import {el,download} from './helpers.js';
import * as S from './pdf-service.js';
import {saveBlob} from './file-manager.js';
import {kvGet} from './database.js';
import {icon} from './icons.js';
import {dropzone,toast,swatches,seg,switchEl} from './ui.js';
import {shell,mh,mi} from './shell.js';
const TOOLS=[['none','Pilih / geser','eye','Geser dan zoom halaman','Pilih'],['pen','Pensil','scribble','Seret untuk menggambar','Pensil'],['hl','Sorot','marker','Seret untuk menyorot teks','Sorot'],['ln','Garis bawah / coret','underline','Seret mendatar di bawah atau di tengah teks','Garis'],['rect','Kotak','square','Seret untuk membuat kotak','Kotak'],['wo','Edit teks (timpa)','eraser','Seret di atas teks lama, lalu ketik pengganti','Edit teks'],['red','Sensor','redact','Seret untuk menutup area dengan warna hitam','Sensor'],['text','Teks','text','Ketuk lokasi, lalu ketik teks','Teks'],['note','Catatan','note','Ketuk lokasi, lalu ketik catatan','Catatan'],['sign','Tanda tangan','pen','Pilih tanda tangan di menu ⋮, lalu ketuk lokasi','TTD'],['img','Gambar','image','Pilih gambar di menu ⋮, lalu ketuk lokasi','Gambar']];
const COL=['#e11d48','#f59e0b','#16a34a','#0ea5e9','#6366f1','#111827','#ffffff'];
const tb=(ic,t,fn)=>el('button',{class:'tbtn',title:t,'aria-label':t,onclick:fn},icon(ic));
export async function render(root){
 let bytes=null,doc=null,name='dokumen.pdf',page=1,scale=1,tool='none',color=COL[0],lw=.004,sz=.03,anns=[],cur=null,img=null,txt=null,task=null,flat=false,pt=0,pt2=0;
 const cv=el('canvas'),ov=el('canvas',{class:'ovl'}),wrap=el('div',{class:'pwrap'},cv,ov),scroller=el('div',{class:'pscroll full'},wrap),th=el('div',{class:'thumbs'}),res=el('div'),zl=el('span',{class:'zl'},'100%'),tot=el('span',{class:'zl'},'/ 0'),pill=el('div',{class:'hintpill idle'});scroller.hidden=true;
 const pn=el('input',{type:'text',value:'1',class:'pn','aria-label':'Nomor halaman',onchange:e=>{const v=parseInt(e.target.value);if(doc&&v>=1&&v<=doc.numPages){page=v;show()}}});
 const need=()=>doc||(toast('Buka PDF dulu'),false);
 const say=t=>{pill.textContent=t;pill.classList.remove('idle');clearTimeout(pt2);pt2=setTimeout(()=>pill.classList.add('idle'),2600)};
 const wake=()=>{if(!doc)return;pager.classList.remove('idle');clearTimeout(pt);pt=setTimeout(()=>pager.classList.add('idle'),2800)};
 const wrapC=(c,t,maxW)=>{const o=[];for(const para of t.split('\n')){let l='';for(const w of para.split(' ')){const tr=l?l+' '+w:w;if(l&&c.measureText(tr).width>maxW){o.push(l);l=w}else l=tr}o.push(l)}return o};
 function drawAnn(c,a,W,H){c.save();c.strokeStyle=c.fillStyle=a.c||'#000';c.lineCap=c.lineJoin='round';
  if(a.t==='pen'){c.lineWidth=a.lw*W;c.beginPath();a.pts.forEach((p,i)=>i?c.lineTo(p[0]*W,p[1]*H):c.moveTo(p[0]*W,p[1]*H));c.stroke()}
  else if(a.t==='hl'){c.fillStyle='rgba(255,235,0,.35)';c.fillRect(a.x*W,a.y*H,a.w*W,a.h*H)}
  else if(a.t==='ln'){c.lineWidth=a.lw*W;c.beginPath();c.moveTo(a.x*W,a.y*H);c.lineTo((a.x+a.w)*W,a.y*H);c.stroke()}
  else if(a.t==='rect'){c.lineWidth=a.lw*W;c.strokeRect(a.x*W,a.y*H,a.w*W,a.h*H)}
  else if(a.t==='red'){c.fillStyle='#000';c.fillRect(a.x*W,a.y*H,a.w*W,a.h*H)}
  else if(a.t==='wo'){c.fillStyle='#fff';c.fillRect(a.x*W,a.y*H,a.w*W,a.h*H);if(a.s){let fs=a.h*H*.78;c.font=fs+'px Helvetica,Arial,sans-serif';const tw=c.measureText(a.s).width;if(tw>a.w*W-4)fs*=(a.w*W-4)/tw;c.font=fs+'px Helvetica,Arial,sans-serif';c.fillStyle='#000';c.textBaseline='middle';c.fillText(a.s,a.x*W+2,(a.y+a.h/2)*H)}}
  else if(a.t==='text'){const fs=a.sz*W;c.font=fs+'px Helvetica,Arial,sans-serif';c.textBaseline='top';a.s.split('\n').forEach((l,k)=>c.fillText(l,a.x*W,a.y*H+k*1.2*fs))}
  else if(a.t==='note'){const fs=a.sz*W*.8,pad=.008*W;c.font=fs+'px Helvetica,Arial,sans-serif';c.textBaseline='top';const L=wrapC(c,a.s,.32*W-2*pad);c.fillStyle='#fde68a';c.fillRect(a.x*W,a.y*H,.32*W,L.length*fs*1.2+2*pad);c.fillStyle='#111';L.forEach((l,k)=>c.fillText(l,a.x*W+pad,a.y*H+pad+k*1.2*fs))}
  else if(a.t==='img'&&a.bmp)c.drawImage(a.bmp,a.x*W,a.y*H,a.w*W,a.w*W*a.ar);
  c.restore()}
 function paint(extra){const c=ov.getContext('2d'),W=ov.width,H=ov.height;c.clearRect(0,0,W,H);for(const a of[...anns.filter(a=>a.p===page-1),...(extra?[extra]:[])])drawAnn(c,a,W,H)}
 const info=()=>{if(!doc)return;pn.value=page;tot.textContent='/ '+doc.numPages;zl.textContent=Math.round(scale*100)+'%';sh.setTitle(name+' · '+page+'/'+doc.numPages+(anns.length?' · '+anns.length+' anotasi':''));wake()};
 async function show(){if(!doc)return;const pg=await doc.getPage(page),css=pg.getViewport({scale}),dpr=Math.min(devicePixelRatio||1,2);task?.cancel?.();
  const t=S.renderTo(pg,cv,scale*dpr);task=t;cv.style.width=ov.style.width=css.width+'px';cv.style.height=ov.style.height=css.height+'px';
  try{await t}catch{return}ov.width=cv.width;ov.height=cv.height;info();paint()}
 async function fit(){const pg=await doc.getPage(page);scale=Math.max(.3,(scroller.clientWidth-24)/pg.getViewport({scale:1}).width);await show()}
 async function thumbs(){th.replaceChildren();for(let i=1;i<=Math.min(doc.numPages,40);i++){const pg=await doc.getPage(i),c=el('canvas',{class:'thumb',onclick:()=>{page=i;show();sh.close()}});th.append(c);await S.renderTo(pg,c,.25)}}
 async function open(f){try{bytes=await S.bytesOf(f);doc=await S.openDoc(bytes);name=f.name;page=1;anns=[];txt=null;res.replaceChildren();empty.hidden=true;scroller.hidden=false;await fit();thumbs().catch(()=>{});say('Buka menu ⋮ di kanan atas untuk alat dan pengaturan')}catch(e){toast('PDF tidak bisa dibuka (rusak atau berkata sandi)')}}
 const texts=async()=>txt||(txt=await S.pdfText(bytes));
 const pos=e=>{const r=ov.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
 const add=a=>{a.p=page-1;anns.push(a);paint();info()};
 ov.addEventListener('pointerdown',e=>{if(tool==='none'||!doc)return;const p=pos(e);
  if(tool==='text'||tool==='note'){const s=prompt('Isi teks:');if(s)add({t:tool,x:p[0],y:p[1],s,sz,c:color});return}
  if(tool==='sign'||tool==='img'){if(!img)return toast('Pilih tanda tangan atau gambar dulu di menu ⋮');add({t:'img',x:p[0]-.125,y:p[1]-.05,w:.25,ar:img.ar,bmp:img.bmp,bytes:img.bytes,type:img.type});return}
  ov.setPointerCapture(e.pointerId);cur=tool==='pen'?{t:'pen',pts:[p],c:color,lw}:{t:tool,x:p[0],y:p[1],w:0,h:0,c:color,lw,x0:p[0],y0:p[1]}});
 ov.addEventListener('pointermove',e=>{if(!cur)return;const p=pos(e);if(cur.t==='pen')cur.pts.push(p);else{cur.x=Math.min(cur.x0,p[0]);cur.y=Math.min(cur.y0,p[1]);cur.w=Math.abs(p[0]-cur.x0);cur.h=Math.abs(p[1]-cur.y0);if(cur.t==='ln'){cur.y=cur.y0}}paint(cur)});
 ov.addEventListener('pointerup',()=>{if(!cur)return;const a=cur;cur=null;if(a.t==='pen'?a.pts.length>1:a.w>.004){delete a.x0;delete a.y0;if(a.t==='wo')a.s=prompt('Teks pengganti (kosongkan = hanya menutupi teks lama):','')||'';add(a)}else paint()});
 scroller.addEventListener('scroll',wake);scroller.addEventListener('pointerup',wake);
 const setTool=t=>{tool=t;ov.style.touchAction=t==='none'?'auto':'none';toolBtns.forEach(b=>b.classList.toggle('on',b.dataset.t===t));const T=TOOLS.find(x=>x[0]===t);say(T[1]+' — '+T[3])};
 const toolBtns=TOOLS.map(([id,l,ic,,s])=>{const b=el('button',{class:'tbtn tl'+(id==='none'?' on':''),title:l,'aria-label':l,onclick:()=>{setTool(id);sh.close()}},icon(ic),el('span',{},s));b.dataset.t=id;return b});
 async function toImg(b){const bmp=await createImageBitmap(b);return{bmp,bytes:new Uint8Array(await b.arrayBuffer()),type:b.type,ar:bmp.height/bmp.width}}
 const sigs=(await kvGet('signatures'))||[],sigBox=el('div',{class:'sigs'});
 sigs.forEach((s,i)=>{const b=el('button',{class:'sigb',title:'Tanda tangan '+(i+1),'aria-label':'Tanda tangan '+(i+1),onclick:async()=>{img=await toImg(s.blob);sigBox.querySelectorAll('.sigb').forEach(x=>x.classList.remove('on'));b.classList.add('on');setTool('sign');sh.close()}},el('img',{src:URL.createObjectURL(s.blob),alt:''}));sigBox.append(b)});
 if(!sigs.length)sigBox.append(el('span',{class:'meta'},'Belum ada. Buat di menu Tanda Tangan.'));
 const imgIn=dropzone({accept:'image/png,image/jpeg',compact:true,label:'Pilih gambar untuk disisipkan',onfiles:async fl=>{if(fl[0]){img=await toImg(fl[0]);setTool('img');sh.close()}}});
 const out=async()=>{if(!need())return null;if(!anns.length){toast('Belum ada anotasi');return null}try{let r=await S.applyAnnotations(bytes,anns);if(flat)r=await S.rasterize(new Uint8Array(await r.arrayBuffer()),2,.9);return r}catch(e){alert('Gagal menyimpan: '+(e.message||e));return null}};
 const sv=()=>name.replace(/\.pdf$/i,'')+'-edit.pdf';
 const saveFiles=async()=>{const b=await out();if(b){await saveBlob(sv(),b);toast('Disimpan ke Berkas')}},saveDl=async()=>{const b=await out();if(b)download(sv(),b)};
 const find=el('input',{type:'search',placeholder:'Cari teks di PDF…','aria-label':'Cari teks'});
 const go=async()=>{if(!need())return;const q=find.value.toLowerCase();if(!q)return;res.replaceChildren(el('p',{class:'meta'},'Mencari…'));const T=await texts(),hits=T.map((t,i)=>[i+1,t.toLowerCase().split(q).length-1]).filter(h=>h[1]);res.replaceChildren(el('p',{class:'meta'},hits.length?'Ditemukan di halaman:':'Tidak ditemukan (PDF hasil scan tidak punya teks).'),el('div',{class:'tb'},...hits.map(([p,n])=>el('button',{class:'sec',onclick:()=>{page=p;show();sh.close()}},'Hal. '+p+' ('+n+')'))))};
 const zoom=f=>{if(need()){scale=Math.min(4,Math.max(.3,scale*f));show()}};
 const openIn=el('input',{type:'file',accept:'application/pdf',class:'dz-input',onchange:e=>{const f=e.target.files[0];e.target.value='';if(f)open(f)}});
 const pager=el('div',{class:'pager idle'},tb('left','Halaman sebelumnya',()=>{if(doc&&page>1){page--;show()}}),pn,tot,tb('right','Halaman berikutnya',()=>{if(doc&&page<doc.numPages){page++;show()}}),el('span',{class:'sep'}),tb('zoomout','Perkecil',()=>zoom(.8)),zl,tb('zoomin','Perbesar',()=>zoom(1.25)),tb('maximize','Sesuaikan lebar',()=>doc&&fit()));
 const menuEl=el('div',{},mh('Alat'),el('div',{class:'tgr'},...toolBtns),
  mh('Properti'),el('span',{class:'lbl'},'Warna'),swatches(COL,color,c=>{color=c}),el('span',{class:'lbl'},'Ketebalan garis'),seg([['0.004','Tipis'],['0.008','Sedang'],['0.014','Tebal']],'0.004',v=>{lw=+v}),el('span',{class:'lbl'},'Ukuran teks'),seg([['0.02','S'],['0.03','M'],['0.045','L']],'0.03',v=>{sz=+v}),
  mh('Tanda tangan & gambar'),sigBox,imgIn,
  mh('Tampilan'),mi('maximize','Sesuaikan lebar',()=>{if(need()){fit();sh.close()}}),mi('eye','Layar penuh (sembunyikan bilah browser)',()=>{sh.fs.requestFullscreen?.();sh.close()}),mi('printer','Cetak',async()=>{if(!need())return;const b=anns.length?await out():new Blob([bytes],{type:'application/pdf'});if(!b)return;const f=el('iframe',{src:URL.createObjectURL(b),class:'hid'});f.onload=()=>{try{f.contentWindow.print()}catch{toast('Cetak tidak didukung; gunakan Unduh lalu cetak')}};document.body.append(f);sh.close()}),
  mi('copy','Salin teks halaman',async()=>{if(!need())return;try{await navigator.clipboard.writeText((await texts())[page-1]||'');toast('Teks halaman disalin')}catch{toast('Gagal menyalin')}sh.close()}),
  mh('Cari teks'),el('div',{class:'tb'},find,el('button',{onclick:go},icon('search'))),res,mh('Thumbnail'),th,
  mh('Berkas'),mi('upload','Buka PDF lain',()=>{sh.close();openIn.click()}),mi('save','Simpan ke Berkas',()=>{sh.close();saveFiles()}),mi('download','Unduh',()=>{sh.close();saveDl()}),mi('trash','Hapus anotasi halaman ini',()=>{anns=anns.filter(a=>a.p!==page-1);paint();info();sh.close()},{tc:'#f2575d'}),
  el('div',{class:'row'},el('div',{},el('b',{},'Ratakan hasil'),el('div',{class:'meta'},'Jadikan gambar: teks lama pada Edit teks/Sensor hilang permanen')),switchEl(false,on=>{flat=on},'Ratakan hasil')),
  el('p',{class:'meta'},'Ini anotasi (lapisan di atas halaman), bukan mengedit struktur teks asli PDF. Edit teks menutup teks lama dengan kotak putih lalu menulis teks baru; tanpa Ratakan, teks lama masih ada di dalam berkas.'));
 const empty=el('div',{class:'fs-pad'},el('div',{class:'hero'},el('div',{class:'hrow'},el('span',{class:'avatar'},icon('pdf')),el('div',{},el('h2',{},'Viewer & Editor PDF'),el('div',{class:'meta'},'Layar penuh tanpa penghalang. Semua alat ada di menu ⋮ kanan atas.'))),
   el('div',{},...['Zoom & thumbnail','Cari teks','Pensil & sorot','Edit teks (timpa)','Sensor','Tanda tangan','Cetak & unduh'].map(t=>el('span',{class:'badge2'},icon('check'),t)))),
  dropzone({accept:'application/pdf',label:'Buka PDF',types:['PDF'],onfiles:fl=>fl[0]&&open(fl[0])}));
 const sh=shell(root,{title:'Viewer & Editor PDF',actions:[tb('undo','Urungkan',()=>{anns.pop();paint();info()}),tb('save','Simpan ke Berkas',saveFiles)],menu:menuEl});
 sh.body.append(openIn,empty,scroller,pager,pill)}
