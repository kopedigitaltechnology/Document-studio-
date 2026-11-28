import {el} from './helpers.js';
import {textToPdf} from './pdf-service.js';
import {addResult} from './results.js';
import {dropzone,switchEl,toast} from './ui.js';
import {shell,mh,mi,topbtn} from './shell.js';
export function render(root){
 let numbers=true;const title=el('input',{type:'text',class:'tinp',placeholder:'Judul (opsional)','aria-label':'Judul'}),body=el('textarea',{class:'ta',placeholder:'Ketik atau tempel teks di sini…','aria-label':'Isi teks'}),stat=el('div',{class:'meta statline'},'0 karakter'),out=el('div',{class:'resbar'});out.hidden=true;
 const sel=(o,d)=>el('select',{},...o.map(([v,t])=>{const e=el('option',{value:v},t);if(String(v)===String(d))e.selected=true;return e}));
 const paper=sel([['A4','A4'],['A3','A3'],['Letter','Letter'],['Legal','Legal']],'A4'),ori=sel([['p','Potret'],['l','Lanskap']],'p'),font=sel([['Helvetica','Sans (Helvetica)'],['Times','Serif (Times)'],['Courier','Mono (Courier)']],'Helvetica'),
  size=sel([[10,'10 pt'],[11,'11 pt'],[12,'12 pt'],[14,'14 pt'],[16,'16 pt']],11),margin=sel([[36,'Sempit'],[54,'Normal'],[72,'Lebar']],54),lead=sel([[1.2,'Rapat'],[1.35,'Normal'],[1.6,'Longgar']],1.35);
 body.addEventListener('input',()=>{stat.textContent=body.value.length+' karakter'});
 const dz=dropzone({accept:'.txt,.md,text/plain',compact:true,label:'Buka berkas teks (.txt / .md)',onfiles:async([f])=>{if(f){body.value=await f.text();title.value=f.name.replace(/\.[^.]+$/,'');dz.reset();body.dispatchEvent(new Event('input'));sh.close()}}});
 const go=async()=>{if(!body.value.trim()&&!title.value.trim())return toast('Isi teks dulu');sh.close();out.replaceChildren();
  try{const b=[];if(title.value.trim())b.push({text:title.value.trim(),size:20,bold:true,after:.8});b.push({text:body.value});
   const nm=(title.value.trim().replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'teks')+'.pdf';
   addResult(out,nm,await textToPdf(b,{paper:paper.value,landscape:ori.value==='l',font:font.value,size:+size.value,margin:+margin.value,lead:+lead.value,numbers}));out.hidden=false}catch(e){alert('Gagal: '+e.message)}};
 const lb=(t,s)=>[el('span',{class:'lbl'},t),s];
 const menu=el('div',{},mh('Kertas & tata letak'),...lb('Kertas',paper),...lb('Arah',ori),...lb('Huruf',font),...lb('Ukuran huruf',size),...lb('Margin',margin),...lb('Spasi baris',lead),
  el('div',{class:'row'},'Nomor halaman',switchEl(true,on=>{numbers=on},'Nomor halaman')),mh('Berkas'),dz,mi('pdf','Buat PDF',go),
  el('p',{class:'meta'},'Huruf Latin saja (Indonesia/Inggris OK); karakter di luar Latin-1 menjadi "?". Kutip pintar dan tanda pisah otomatis disederhanakan.'));
 const sh=shell(root,{title:'Teks ke PDF',cls:'col',actions:[topbtn('pdf','Buat PDF',go)],menu});
 sh.body.append(title,body,stat,out)}
