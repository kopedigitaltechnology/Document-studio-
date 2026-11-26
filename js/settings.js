import {el} from './helpers.js';
import {state,save} from './state.js';
import {hashPassword} from './password.js';
import {clearAll} from './database.js';
import * as bio from './biometric.js';
export function render(root){
 const sel=(k,opts)=>el('select',{onchange:async e=>{state[k]=e.target.value;await save()}},...opts.map(([v,t])=>{const o=el('option',{value:v},t);if(state[k]==v)o.selected=true;return o}));
 root.append(el('h2',{},'Pengaturan'),el('div',{class:'card'},el('b',{},'Tampilan'),el('p',{},'Tema'),sel('theme',[['system','Sistem'],['light','Terang'],['dark','Gelap']]),
  el('p',{},'Tata letak (otomatis mengikuti ukuran layar)'),sel('layout',[['auto','Otomatis'],['desktop','Desktop'],['mobile','HP']]),el('p',{},'Warna aksen'),el('input',{type:'color',value:state.accent,onchange:async e=>{state.accent=e.target.value;await save()}}),
  el('p',{},'Ukuran huruf'),el('input',{type:'range',min:14,max:22,value:state.font,onchange:async e=>{state.font=+e.target.value;await save()}})),
 el('div',{class:'card'},el('b',{},'Umum'),el('p',{},el('label',{},el('input',{type:'checkbox',...(state.confirmDelete?{checked:''}:{}),onchange:async e=>{state.confirmDelete=e.target.checked;await save()}}),' Konfirmasi sebelum hapus'))),
 el('div',{class:'card'},el('b',{},'Keamanan'),el('p',{class:'meta'},state.pin?'Kunci PIN aktif (PBKDF2-SHA256, salt acak).':'Kunci aplikasi belum aktif.'),
  el('button',{onclick:async()=>{const p=prompt('PIN/kata sandi baru (min. 6 karakter):');if(!p||p.length<6)return alert('Minimal 6 karakter.');state.pin=await hashPassword(p);await save();location.reload()}},state.pin?'Ganti PIN':'Aktifkan PIN'),
  state.pin?el('button',{class:'sec',onclick:async()=>{state.pin=null;state.bio=null;await save();location.reload()}},'Matikan PIN'):''),
 el('div',{class:'card'},el('b',{},'Biometrik (sidik jari / wajah)'),el('p',{class:'meta'},state.bio?'Aktif: membuka aplikasi lewat WebAuthn Android. PIN tetap jadi cadangan.':'Memakai WebAuthn bawaan Android. Hanya jalan lewat HTTPS dan jika HP punya sidik jari/kunci layar terdaftar.'),
  state.bio?el('button',{class:'sec',onclick:async()=>{await bio.disable();location.reload()}},'Matikan biometrik'):el('button',{onclick:async()=>{if(!state.pin)return alert('Aktifkan PIN dulu sebagai cadangan.');if(!await bio.supported())return alert('Biometrik tidak tersedia di perangkat/browser ini.');try{await bio.register();location.reload()}catch{alert('Pendaftaran dibatalkan atau gagal.')}}},'Aktifkan biometrik')),
 el('div',{class:'card'},el('b',{},'Data'),el('p',{class:'meta'},'Semua data hanya ada di perangkat ini.'),
  el('button',{class:'danger',onclick:async()=>{if(confirm('Hapus SEMUA data lokal? Tidak bisa dibatalkan.')){await clearAll();location.reload()}}},'Hapus semua data lokal')))}
