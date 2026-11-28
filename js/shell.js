import {el} from './helpers.js';
import {icon} from './icons.js';
// Kerangka layar penuh: tombol kembali, judul, aksi cepat, dan menu titik tiga di kanan atas.
export function shell(root,{title,actions=[],menu,cls=''}){
 const ttl=el('div',{class:'fs-title'},title),body=el('div',{class:'fs-body '+cls}),sheet=el('div',{class:'sheet'}),scrim=el('div',{class:'scrim'});sheet.hidden=scrim.hidden=true;
 const close=()=>{sheet.hidden=scrim.hidden=true;more.classList.remove('on')};
 const open=()=>{if(menu)sheet.replaceChildren(typeof menu==='function'?menu(close):menu);sheet.hidden=scrim.hidden=false;more.classList.add('on')};
 const more=el('button',{class:'tbtn',title:'Menu','aria-label':'Menu',onclick:()=>sheet.hidden?open():close()},icon('more'));
 scrim.addEventListener('click',close);
 const back=el('button',{class:'tbtn',title:'Kembali','aria-label':'Kembali',onclick:()=>{history.length>1?history.back():(location.hash='')}},icon('left'));
 const fs=el('div',{class:'fs'},el('div',{class:'fs-top'},back,ttl,...actions,more),body,scrim,sheet);root.append(fs);
 return{fs,body,open,close,setTitle:t=>{ttl.textContent=t}}}
export const mi=(ic,label,fn,{sub,on,tc}={})=>{const d=el('div',{class:'mi'+(on?' on':''),role:'button',tabindex:'0'},el('span',{class:'li'},icon(ic)),el('div',{class:'lt'},el('b',{},label),sub?el('small',{},sub):''),on?icon('check'):'');if(tc)d.style.setProperty('--tc',tc);d.addEventListener('click',fn);d.addEventListener('keydown',e=>{if(e.key==='Enter')fn(e)});return d};
export const mh=t=>el('div',{class:'mh'},t);
export const topbtn=(ic,label,fn)=>el('button',{class:'topbtn',onclick:fn},icon(ic),el('span',{},label));
