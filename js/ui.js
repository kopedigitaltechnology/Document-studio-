import {el} from './helpers.js';
import {icon} from './icons.js';
export function dropzone({accept='',multiple=false,label='Pilih berkas',hint='',types=[],compact=false,onfiles}={}){
 const input=el('input',{type:'file',class:'dz-input'});input.accept=accept;input.multiple=multiple;
 const names=el('div',{class:'dz-names'});
 const box=el('label',{class:'dz'+(compact?' compact':'')},input,el('span',{class:'dz-ic'},icon('upload')),
  el('span',{class:'dz-t'},el('b',{},label),el('small',{},hint||(compact?'Ketuk untuk memilih':'Tarik & lepas di sini, atau ketuk untuk memilih'))),
  types.length?el('div',{class:'dz-chips'},...types.map(t=>el('span',{class:'chip'},t))):'');
 const wrap=el('div',{class:'dzw'},box,names);
 const take=fl=>{fl=[...fl];names.replaceChildren(...fl.slice(0,6).map(f=>el('span',{class:'chip on'},f.name)),...(fl.length>6?[el('span',{class:'chip'},'+'+(fl.length-6))]:[]));onfiles?.(fl)};
 input.addEventListener('change',()=>take(input.files));
 ['dragenter','dragover'].forEach(t=>box.addEventListener(t,e=>{e.preventDefault();box.classList.add('over')}));
 ['dragleave','drop'].forEach(t=>box.addEventListener(t,e=>{e.preventDefault();box.classList.remove('over')}));
 box.addEventListener('drop',e=>{const f=e.dataTransfer?.files;if(f?.length){try{input.files=f}catch{}take(f)}});
 Object.defineProperties(wrap,{files:{get:()=>input.files},accept:{get:()=>input.accept,set:v=>{input.accept=v}},multiple:{get:()=>input.multiple,set:v=>{input.multiple=v}}});
 wrap.reset=()=>{input.value='';names.replaceChildren()};
 return wrap}
export function toast(msg){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=el('div',{class:'toast'},msg);document.body.append(t);setTimeout(()=>t.remove(),3200)}
export function seg(opts,val,fn){const w=el('div',{class:'seg'});const draw=v=>w.replaceChildren(...opts.map(([k,l,ic])=>el('button',{class:k===v?'on':'',onclick:()=>{draw(k);fn(k)}},ic?icon(ic):'',l)));draw(val);return w}
export function switchEl(on,fn,label='Sakelar'){const b=el('button',{class:'switch'+(on?' on':''),role:'switch','aria-label':label,'aria-checked':String(!!on),onclick:()=>{on=!on;b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on));fn(on)}},el('span'));return b}
export function swatches(colors,val,fn){const w=el('div',{class:'sws'});const draw=v=>w.replaceChildren(...colors.map(c=>{const b=el('button',{class:'sw'+(c===v?' on':''),'aria-label':c,onclick:()=>{draw(c);fn(c)}});b.style.setProperty('--c',c);return b}));draw(val);return w}
export function item({ic,title,sub,right,onclick,tc,danger}){const d=el('div',{class:'item'+(onclick?' click':'')+(danger?' dng':''),...(onclick?{role:'button',tabindex:'0'}:{})},el('span',{class:'li'},icon(ic)),el('div',{class:'lt'},el('b',{},title),sub?el('small',{},sub):''),right||'');
 if(tc)d.style.setProperty('--tc',tc);if(onclick){d.addEventListener('click',onclick);d.addEventListener('keydown',e=>{if(e.key==='Enter')onclick(e)})}return d}
export function ask(title,msg,ok='Lanjut'){return new Promise(res=>{const d=el('dialog',{class:'dlg'},el('h3',{},title),el('p',{class:'meta'},msg),el('div',{class:'tb'},el('button',{onclick:()=>{d.close();d.remove();res(true)}},ok),el('button',{class:'sec',onclick:()=>{d.close();d.remove();res(false)}},'Batal')));d.addEventListener('cancel',()=>{d.remove();res(false)});document.body.append(d);d.showModal()})}

export function askText(title,msg,{password=false,ok='OK'}={}){return new Promise(res=>{const i=el('input',{type:password?'password':'text',autocomplete:'off'});
 const d=el('dialog',{class:'dlg'},el('h3',{},title),el('p',{class:'meta'},msg),i,el('div',{class:'tb'},el('button',{onclick:()=>{const v=i.value;d.close();d.remove();res(v)}},ok),el('button',{class:'sec',onclick:()=>{d.close();d.remove();res(null)}},'Batal')));
 d.addEventListener('cancel',()=>{d.remove();res(null)});i.addEventListener('keydown',e=>{if(e.key==='Enter')d.querySelector('button').click()});document.body.append(d);d.showModal();i.focus()})}
export function progressDlg(title){const f=el('div',{class:'fill'}),m=el('p',{class:'meta'},'Memulai…'),d=el('dialog',{class:'dlg'},el('h3',{},title),el('div',{class:'bar'},f),m);
 d.addEventListener('cancel',e=>e.preventDefault());document.body.append(d);d.showModal();return{set:(t,p)=>{m.textContent=t;if(p!=null)f.style.width=Math.round(Math.min(1,p)*100)+'%'},close:()=>{d.close();d.remove()}}}
