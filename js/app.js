import {load,state} from './state.js';
import {verifyPassword} from './password.js';
import {verify as bioVerify} from './biometric.js';
import {el} from './helpers.js';
const R={'':['Beranda','dashboard'],files:['Berkas','file-manager'],scan:['Scan','scanner'],convert:['Konversi','converter'],sign:['TTD','signature'],profile:['Profil','profile'],settings:['⚙','settings'],privacy:['Privasi','privacy-policy']};
const NAV=['','files','scan','convert','sign','profile'];
const view=document.getElementById('view'),nav=document.getElementById('nav');
async function go(){const k=location.hash.slice(1);const r=R[k]||R[''];nav.replaceChildren(...NAV.map(key=>el('button',{class:key===k?'on':'',onclick:()=>{location.hash='#'+key}},R[key][0])));
 view.replaceChildren();try{await(await import(`./${r[1]}.js`)).render(view)}catch(e){view.append(el('p',{},'Terjadi kesalahan memuat halaman.'))}}
function lockScreen(){let tries=0;return new Promise(res=>{const i=el('input',{type:'password',placeholder:'PIN / kata sandi'});
 const bio=state.bio?el('button',{class:'sec',onclick:async()=>{try{await bioVerify();res()}catch{alert('Biometrik dibatalkan/gagal. Gunakan PIN.')}}},'Buka dengan sidik jari / biometrik'):'';
 view.replaceChildren(el('div',{class:'card'},el('h2',{},'Terkunci'),i,el('button',{onclick:async()=>{if(await verifyPassword(i.value,state.pin))res();else{i.value='';if(++tries>=5){i.disabled=true;setTimeout(()=>{i.disabled=false;tries=0},30000)}alert('Salah.')}}},'Buka'),bio))})}
document.getElementById('gear').onclick=()=>{location.hash='#settings'};
addEventListener('hashchange',go);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
await load();if(state.pin){nav.hidden=true;await lockScreen();nav.hidden=false}go();
