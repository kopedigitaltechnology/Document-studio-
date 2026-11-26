import {load,state} from './state.js';
import {verifyPassword} from './password.js';
import {verify as bioVerify} from './biometric.js';
import {el} from './helpers.js';
import {icon} from './icons.js';
const R={'':['Beranda','dashboard'],files:['Berkas','file-manager'],scan:['Scan','scanner'],convert:['Konversi','converter'],sign:['TTD','signature'],profile:['Profil','profile'],settings:['Pengaturan','settings'],privacy:['Privasi','privacy-policy']};
const NAV=[['','home','Dashboard'],['files','file','Dokumen'],['scan','scan','Pindai','ctr'],['convert','convert','Konversi'],['sign','pen','Tanda Tangan','d'],['profile','user','Profil'],['settings','gear','Pengaturan','d'],['privacy','lock','Privasi','d']];
const view=document.getElementById('view'),nav=document.getElementById('nav');
async function go(){const k=location.hash.slice(1);const r=R[k]||R[''];nav.replaceChildren(el('div',{class:'brand'},el('img',{class:'logo',src:'assets/logo.svg',alt:''}),el('span',{},'DOCUMENT STUDIO')),el('div',{class:'sub'},'ADVANCED PROFESSIONAL DOCUMENT MANAGEMENT'),...NAV.map(([key,ic,lb,fl])=>el('button',{class:(key===k?'on ':'')+(fl==='ctr'?'ctr ':'')+(fl==='d'?'d-only':''),onclick:()=>{location.hash='#'+key}},el('span',{class:'i'},icon(ic)),el('span',{},lb))));
 view.replaceChildren();try{await(await import(`./${r[1]}.js`)).render(view)}catch(e){view.append(el('p',{},'Terjadi kesalahan memuat halaman.'))}}
function lockScreen(){let tries=0;return new Promise(res=>{const i=el('input',{type:'password',placeholder:'PIN / kata sandi'});
 const bio=state.bio?el('button',{class:'sec',onclick:async()=>{try{await bioVerify();res()}catch{alert('Biometrik dibatalkan/gagal. Gunakan PIN.')}}},'Buka dengan sidik jari / biometrik'):'';
 view.replaceChildren(el('div',{class:'card'},el('h2',{},'Terkunci'),i,el('button',{onclick:async()=>{if(await verifyPassword(i.value,state.pin))res();else{i.value='';if(++tries>=5){i.disabled=true;setTimeout(()=>{i.disabled=false;tries=0},30000)}alert('Salah.')}}},'Buka'),bio))})}
document.getElementById('av').replaceChildren(icon('user'));document.getElementById('gear').replaceChildren(icon('gear'));
document.getElementById('av').onclick=()=>{location.hash='#profile'};
document.getElementById('gear').onclick=()=>{location.hash='#settings'};
addEventListener('hashchange',go);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
await load();if(state.pin){nav.hidden=true;await lockScreen();nav.hidden=false}go();
