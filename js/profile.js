import {el,fmtDate} from './helpers.js';
import {state,save} from './state.js';
import {icon} from './icons.js';
export function render(root){
 const name=el('input',{type:'text',value:state.name,maxlength:'40'});
 root.append(el('h2',{},'Profil'),el('div',{class:'card'},el('p',{class:'meta'},'Profil Lokal — tanpa login. Anggota sejak '+fmtDate(state.since)),name,
  el('button',{onclick:async()=>{state.name=name.value.trim()||'Pengguna Lokal';await save();alert('Tersimpan.')}},'Simpan nama'),el('button',{class:'sec',onclick:()=>{location.hash='#settings'}},icon('gear'),' Pengaturan'),el('button',{class:'sec',onclick:()=>{location.hash='#privacy'}},'Kebijakan Privasi')),
 el('div',{class:'card'},el('b',{},'Developer Website'),el('p',{class:'meta'},'https://www.kopedigitaltehnology.my.id'),
  el('button',{onclick:()=>{window.location.href='https://www.kopedigitaltehnology.my.id'}},'Kunjungi Website Resmi')),
 el('div',{class:'card'},el('b',{},'Tentang'),el('p',{class:'meta'},'Document Studio v0.2. Tanpa library eksternal.')))}
