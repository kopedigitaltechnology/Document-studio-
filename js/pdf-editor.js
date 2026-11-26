import {el,download} from './helpers.js';
import * as S from './pdf-service.js';
import {saveBlob} from './file-manager.js';
import {kvGet} from './database.js';
import {icon} from './icons.js';
export async function render(root){
 let bytes=null,doc=null,name='dokumen.pdf',page=1,scale=1,tool='none',color='#e11d48',lw=.004,sz=.03,anns=[],cur=null,img=null,txt=null,task=null;
 const cv=el('canvas'),ov=el('canvas',{class:'ovl'}),wrap=el('div',{class:'pwrap'},cv,ov),scroller=el('div',{class:'pscroll'},wrap),info=el('span',{class:'meta'},'Belum ada PDF'),th=el('div',{class:'thumbs'}),res=el('div');
 const pn=el('input',{type:'text',value:'1',class:'pn',onchange:e=>{const v=parseInt(e.target.value);if(doc&&v>=1&&v<=doc.numPages){page=v;show()}}});
 const wrapC=(c,t,maxW)=>{const o=[];for(const para of t.split('\n')){let l='';for(const w of para.split(' ')){const tr=l?l+' '+w:w;if(l&&c.measureText(tr).width>maxW){o.push(l);l=w}else l=tr}o.push(l)}return o};
 function drawAnn(c,a,W,H){c.save();c.strokeStyle=c.fillStyle=a.c||'#000';c.lineCap=c.lineJoin='round';
  if(a.t==='pen'){c.lineWidth=a.lw*W;c.beginPath();a.pts.forEach((p,i)=>i?c.lineTo(p[0]*W,p[1]*H):c.moveTo(p[0]*W,p[1]*H));c.stroke()}
  else if(a.t==='hl'){c.fillStyle='rgba(255,235,0,.35)';c.fillRect(a.x*W,a.y*H,a.w*W,a.h*H)}
  else if(a.t==='ln'){c.lineWidth=a.lw*W;c.beginPath();c.moveTo(a.x*W,a.y*H);c.lineTo((a.x+a.w)*W,a.y*H);c.stroke()}
  else if(a.t==='rect'){c.lineWidth=a.lw*W;c.strokeRect(a.x*W,a.y*H,a.w*W,a.h*H)}
  else if(a.t==='text'){const fs=a.sz*W;c.font=fs+'px Helvetica,Arial,sans-serif';c.textBaseline='top';a.s.split('\n').forEach((l,k)=>c.fillText(l,a.x*W,a.y*H+k*1.2*fs))}
  else if(a.t==='note'){const fs=a.sz*W*.8,pad=.008*W;c.font=fs+'px Helvetica,Arial,sans-serif';c.textBaseline='top';const L=wrapC(c,a.s,.32*W-2*pad);c.fillStyle='#fde68a';c.fillRect(a.x*W,a.y*H,.32*W,L.length*fs*1.2+2*pad);c.fillStyle='#111';L.forEach((l,k)=>c.fillText(l,a.x*W+pad,a.y*H+pad+k*1.2*fs))}
  else if(a.t==='img'&&a.bmp)c.drawImage(a.bmp,a.x*W,a.y*H,a.w*W,a.w*W*a.ar);
  c.restore()}
 function paint(extra){const c=ov.getContext('2d'),W=ov.width,H=ov.height;c.clearRect(0,0,W,H);for(const a of[...anns.filter(a=>a.p===page-1),...(extra?[extra]:[])])drawAnn(c,a,W,H)}
 async function show(){if(!doc)return;const pg=await doc.getPage(page),css=pg.getViewport({scale}),dpr=Math.min(devicePixelRatio||1,2);task?.cancel?.();
  const t=S.renderTo(pg,cv,scale*dpr);task=t;cv.style.width=ov.style.width=css.width+'px';cv.style.height=ov.style.height=css.height+'px';
  try{await t}catch{return}ov.width=cv.width;ov.height=cv.height;pn.value=page;info.textContent='Halaman '+page+'/'+doc.numPages+' · '+Math.round(scale*100)+'%';paint()}
 async function fit(){const pg=await doc.getPage(page);scale=Math.max(.3,(scroller.clientWidth-12)/pg.getViewport({scale:1}).width);await show()}
 async function thumbs(){th.replaceChildren();for(let i=1;i<=Math.min(doc.numPages,40);i++){const pg=await doc.getPage(i),c=el('canvas',{class:'thumb',onclick:()=>{page=i;show()}});th.append(c);await S.renderTo(pg,c,.25)}}
 async function open(f){try{bytes=await S.bytesOf(f);doc=await S.openDoc(bytes);name=f.name;page=1;anns=[];txt=null;res.replaceChildren();await fit();thumbs().catch(()=>{})}catch(e){alert('PDF tidak bisa dibuka (rusak atau berkata sandi): '+(e.message||e))}}
 const texts=async()=>txt||(txt=await S.pdfText(bytes));
 const pos=e=>{const r=ov.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
 const add=a=>{a.p=page-1;anns.push(a);paint()};
 ov.addEventListener('pointerdown',e=>{if(tool==='none'||!doc)return;const p=pos(e);
  if(tool==='text'||tool==='note'){const s=prompt('Isi teks:');if(s)add({t:tool,x:p[0],y:p[1],s,sz,c:color});return}
  if(tool==='sign'||tool==='img'){if(!img)return alert('Pilih tanda tangan atau gambar dulu.');add({t:'img',x:p[0]-.125,y:p[1]-.05,w:.25,ar:img.ar,bmp:img.bmp,bytes:img.bytes,type:img.type});return}
  ov.setPointerCapture(e.pointerId);cur=tool==='pen'?{t:'pen',pts:[p],c:color,lw}:{t:tool,x:p[0],y:p[1],w:0,h:0,c:color,lw,x0:p[0],y0:p[1]}});
 ov.addEventListener('pointermove',e=>{if(!cur)return;const p=pos(e);if(cur.t==='pen')cur.pts.push(p);else{cur.x=Math.min(cur.x0,p[0]);cur.y=Math.min(cur.y0,p[1]);cur.w=Math.abs(p[0]-cur.x0);cur.h=Math.abs(p[1]-cur.y0);if(cur.t==='ln'){cur.y=cur.y0}}paint(cur)});
 ov.addEventListener('pointerup',()=>{if(!cur)return;const a=cur;cur=null;if(a.t==='pen'?a.pts.length>1:a.w>.004){delete a.x0;delete a.y0;add(a)}else paint()});
 const setTool=t=>{tool=t;ov.style.touchAction=t==='none'?'auto':'none';tb.querySelectorAll('button').forEach(b=>b.classList.toggle('sec',b.dataset.t!==t))};
 const TOOLS=[['none','Pilih/Geser'],['pen','Pensil'],['hl','Sorot'],['ln','Garis bawah/coret'],['rect','Kotak'],['text','Teks'],['note','Catatan'],['sign','Tanda tangan'],['img','Gambar']];
 const tb=el('div');TOOLS.forEach(([id,l])=>tb.append(el('button',{class:'sec','data-t':id,onclick:()=>setTool(id)},l)));
 const sigSel=el('select',{onchange:async e=>{const s=sigs[e.target.value];if(!s)return;img=await toImg(s.blob)}},el('option',{value:''},'— pilih tanda tangan tersimpan —'));
 const sigs=(await kvGet('signatures'))||[];sigs.forEach((s,i)=>sigSel.append(el('option',{value:i},'Tanda tangan '+(i+1))));
 async function toImg(b){const bmp=await createImageBitmap(b);return{bmp,bytes:new Uint8Array(await b.arrayBuffer()),type:b.type,ar:bmp.height/bmp.width}}
 const imgIn=el('input',{type:'file',accept:'image/png,image/jpeg',onchange:async e=>{const f=e.target.files[0];if(f)img=await toImg(f)}});
 const out=async()=>{if(!doc)return null;if(!anns.length){alert('Belum ada anotasi.');return null}try{return await S.applyAnnotations(bytes,anns)}catch(e){alert('Gagal menyimpan: '+(e.message||e));return null}};
 const sv=n=>name.replace(/\.pdf$/i,'')+'-edit.pdf';
 const find=el('input',{type:'search',placeholder:'Cari teks di PDF…'});
 const go=async()=>{if(!doc)return;const q=find.value.toLowerCase();if(!q)return;res.replaceChildren(el('p',{class:'meta'},'Mencari…'));const T=await texts(),hits=T.map((t,i)=>[i+1,t.toLowerCase().split(q).length-1]).filter(h=>h[1]);res.replaceChildren(el('p',{class:'meta'},hits.length?'Ditemukan di halaman:':'Tidak ditemukan (PDF hasil scan tidak punya teks).'),...hits.map(([p,n])=>el('button',{class:'sec',onclick:()=>{page=p;show()}},'Hal. '+p+' ('+n+')')))};
 const zoom=f=>{scale=Math.min(4,Math.max(.3,scale*f));show()};
 const nav=[['‹',()=>{if(page>1){page--;show()}}],['›',()=>{if(doc&&page<doc.numPages){page++;show()}}],['−',()=>zoom(.8)],['+',()=>zoom(1.25)],['Lebar',()=>doc&&fit()]];
 root.append(el('h2',{},'Viewer & Editor PDF'),el('div',{class:'card'},el('input',{type:'file',accept:'application/pdf',onchange:e=>e.target.files[0]&&open(e.target.files[0])}),
  el('div',{class:'tb'},...nav.map(([l,f])=>el('button',{class:'sec',onclick:f},l)),pn,info),
  el('div',{class:'tb'},el('button',{class:'sec',onclick:()=>scroller.requestFullscreen?.()},'Layar penuh'),el('button',{class:'sec',onclick:async()=>{if(doc)try{await navigator.clipboard.writeText((await texts())[page-1]||'');alert('Teks halaman disalin.')}catch{alert('Gagal menyalin.')}}},'Salin teks halaman'),
   el('button',{class:'sec',onclick:async()=>{if(!doc)return;const b=anns.length?await out():new Blob([bytes],{type:'application/pdf'});if(!b)return;const f=el('iframe',{src:URL.createObjectURL(b),class:'hid'});f.onload=()=>{try{f.contentWindow.print()}catch{alert('Cetak tidak didukung di sini; gunakan Unduh lalu cetak.')}};document.body.append(f)}},'Cetak')),
  ),scroller,
  el('div',{class:'card'},el('div',{class:'tb'},find,el('button',{onclick:go},'Cari')),res),
  el('div',{class:'card'},el('b',{},'Anotasi'),tb,
   el('div',{class:'tb'},'Warna ',el('input',{type:'color',value:color,onchange:e=>{color=e.target.value}}),el('select',{onchange:e=>{lw=+e.target.value}},el('option',{value:.004},'Tipis'),el('option',{value:.008},'Sedang'),el('option',{value:.014},'Tebal')),el('select',{onchange:e=>{sz=+e.target.value}},el('option',{value:.03},'Teks sedang'),el('option',{value:.02},'Teks kecil'),el('option',{value:.045},'Teks besar'))),
   sigSel,el('p',{class:'meta'},'Atau gambar:'),imgIn,
   el('div',{class:'tb'},el('button',{class:'sec',onclick:()=>{anns.pop();paint()}},'Urungkan'),el('button',{class:'sec',onclick:()=>{anns=anns.filter(a=>a.p!==page-1);paint()}},'Hapus anotasi halaman ini'),
    el('button',{onclick:async()=>{const b=await out();if(b){await saveBlob(sv(),b);alert('Disimpan ke Berkas.')}}},'Simpan ke Berkas'),el('button',{class:'sec',onclick:async()=>{const b=await out();if(b)download(sv(),b)}},'Unduh')),
   el('p',{class:'meta'},'Ini anotasi (lapisan tambahan di atas halaman), bukan mengedit teks asli PDF. Pencarian menampilkan halaman yang cocok, belum menandai posisi teks.')),
  el('div',{class:'card'},el('b',{},'Thumbnail'),th));setTool('none')}
