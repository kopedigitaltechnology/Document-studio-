import {el,fmtSize} from './helpers.js';
import {state,save} from './state.js';
import {hashPassword} from './password.js';
import {clearAll} from './database.js';
import * as bio from './biometric.js';
import {icon} from './icons.js';
import {seg,switchEl,swatches,item,toast} from './ui.js';
const ACC=['#22b8cf','#6366f1','#8b5cf6','#ec4899','#f43f5e','#f59e0b','#10b981','#3b82f6'],SITE='https://www.kopedigitaltechnology.my.id';
const LIBS=[['pdf-lib','1.17.1','MIT'],['pdf.js','6.2.108','Apache-2.0'],['JSZip','3.10.1','MIT / GPL-3.0'],['marked','18.0.10','MIT']];
const LOG=[['v0.5','Semua alat layar penuh dengan menu titik tiga'],['v0.4','Profil dengan foto, Pengaturan terpadu, pemindai live dengan deteksi teks, tampilan baru'],['v0.3','Viewer/Editor PDF, Alat PDF, konversi, Teks ke PDF'],['v0.2','Scanner, tanda tangan, biometrik'],['v0.1','Fondasi: berkas, PIN, enkripsi AES-256-GCM']];
const sec=(ic,t)=>el('div',{class:'stitle'},icon(ic),t);
export function render(root){
 const build=async()=>{const est=navigator.storage?.estimate?await navigator.storage.estimate():{};root.replaceChildren();
  const setPin=async()=>{const p=prompt('PIN/kata sandi baru (min. 6 karakter):');if(p===null)return;if(p.length<6)return toast('Minimal 6 karakter');state.pin=await hashPassword(p);await save();toast('Kunci aplikasi aktif');build()};
  const offPin=async()=>{state.pin=null;state.bio=null;await save();toast('Kunci aplikasi dimatikan');build()};
  const toggleBio=async on=>{if(on){if(!state.pin){toast('Aktifkan PIN dulu sebagai cadangan');return build()}if(!await bio.supported()){toast('Biometrik tidak tersedia di perangkat/browser ini');return build()}try{await bio.register();toast('Biometrik aktif')}catch{toast('Pendaftaran dibatalkan')}}else await bio.disable();build()};
  const fill=el('div',{class:'fill'});fill.style.width=(est.quota?Math.max(1,Math.min(100,est.usage/est.quota*100)):0)+'%';
  root.append(el('h2',{},'Pengaturan'),
   sec('palette','Tampilan'),el('div',{class:'card'},
    el('span',{class:'lbl'},'Tema'),seg([['system','Sistem','sliders'],['light','Terang','sun'],['dark','Gelap','moon']],state.theme,async v=>{state.theme=v;await save()}),
    el('span',{class:'lbl'},'Warna aksen'),swatches(ACC,state.accent,async c=>{state.accent=c;await save()}),
    el('span',{class:'lbl'},'Tata letak (Otomatis mengikuti ukuran layar)'),seg([['auto','Otomatis'],['desktop','Desktop'],['mobile','HP']],state.layout,async v=>{state.layout=v;await save()}),
    el('span',{class:'lbl'},'Ukuran huruf'),el('input',{type:'range',min:14,max:22,value:state.font,onchange:async e=>{state.font=+e.target.value;await save()}})),
   sec('sliders','Umum'),el('div',{class:'card'},item({ic:'trash',title:'Konfirmasi sebelum hapus',sub:'Tanya dulu sebelum menghapus berkas',tc:'#f5b73b',right:switchEl(state.confirmDelete,async on=>{state.confirmDelete=on;await save()},'Konfirmasi hapus')})),
   sec('shield','Privasi & Keamanan'),el('div',{class:'card'},
    item({ic:'key',title:'Kunci aplikasi (PIN)',sub:state.pin?'Aktif · PBKDF2-SHA256, salt acak':'Belum aktif',tc:'#8b7cf6',right:el('span',{class:'tb'},el('button',{class:'sec',onclick:setPin},state.pin?'Ganti':'Aktifkan'),state.pin?el('button',{class:'sec',onclick:offPin},'Matikan'):'')}),
    item({ic:'finger',title:'Biometrik (sidik jari / wajah)',sub:state.bio?'Aktif · membuka aplikasi lewat WebAuthn':'Butuh PIN aktif dan HTTPS',tc:'#22b8cf',right:switchEl(!!state.bio,toggleBio,'Biometrik')}),
    item({ic:'lock',title:'Enkripsi berkas',sub:'AES-256-GCM · kunci per berkas ada di menu Dokumen',tc:'#34d399'}),
    item({ic:'info',title:'Kebijakan Privasi',sub:'Bagaimana data Anda disimpan',tc:'#5b8def',onclick:()=>{location.hash='#privacy'}}),
    item({ic:'trash',title:'Hapus semua data lokal',sub:'Berkas, tanda tangan, foto profil, pengaturan',danger:true,onclick:async()=>{if(confirm('Hapus SEMUA data lokal? Tidak bisa dibatalkan.')){await clearAll();location.reload()}}})),
   sec('db','Penyimpanan'),el('div',{class:'card'},el('div',{class:'row'},'Terpakai',el('b',{},fmtSize(est.usage||0)+' / '+(est.quota?fmtSize(est.quota):'?'))),el('div',{class:'bar'},fill),
    el('p',{},el('button',{class:'sec',onclick:async()=>{for(const k of await caches.keys())await caches.delete(k);toast('Cache aplikasi dibersihkan')}},icon('trash'),' Bersihkan cache aplikasi'))),
   sec('info','Tentang'),el('div',{class:'card'},el('div',{class:'hrow'},el('img',{class:'logo',src:'assets/logo.svg',alt:''}),el('div',{},el('b',{},'Document Studio'),el('div',{class:'meta'},'v0.5 · Advanced Professional Document Management & PDF Editing'))),
    el('p',{class:'meta'},'Privacy-first, offline-ready, local-first: dokumen diproses di perangkat Anda.'),
    item({ic:'globe',title:'Developer Website',sub:'www.kopedigitaltechnology.my.id',tc:'#22b8cf',onclick:()=>{window.location.href=SITE}}),
    el('details',{class:'det'},el('summary',{},'Library open source'),...LIBS.map(([n,v,l])=>el('div',{class:'row'},n+' '+v,el('span',{class:'meta'},l)))),
    el('details',{class:'det'},el('summary',{},'Riwayat perubahan'),...LOG.map(([v,t])=>el('div',{class:'row'},el('b',{},v),el('span',{class:'meta'},t))))))};
 build()}
