import {el,fmtSize} from './helpers.js';
import {allFiles} from './database.js';
export async function render(root){const fs=await allFiles();const est=navigator.storage?.estimate?await navigator.storage.estimate():{};
 const stat=(t,v)=>el('div',{class:'card'},el('div',{class:'meta'},t),el('h2',{},String(v)));
 root.append(el('h2',{},'Beranda'),el('div',{class:'grid'},stat('Total berkas',fs.length),stat('Berbintang',fs.filter(f=>f.star).length),stat('Terkunci',fs.filter(f=>f.locked).length),stat('Penyimpanan lokal',fmtSize(est.usage||0))),
 el('div',{class:'card'},el('b',{},'Aksi cepat'),el('p',{},el('button',{onclick:()=>location.hash='#files'},'Impor / Kelola Berkas')),
 el('p',{},el('button',{class:'sec',onclick:()=>{location.hash='#scan'}},'Scan'),el('button',{class:'sec',onclick:()=>{location.hash='#convert'}},'Konversi'),el('button',{class:'sec',onclick:()=>{location.hash='#sign'}},'Tanda Tangan')),el('p',{class:'meta'},'PDF tools (gabung/pisah), editor PDF, dan OCR butuh library di folder libraries/.')),
 el('div',{class:'card'},el('b',{},'Terbaru'),...fs.sort((a,b)=>b.added-a.added).slice(0,5).map(f=>el('div',{class:'row'},f.name))))}
