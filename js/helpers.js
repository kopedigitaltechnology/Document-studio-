export function el(tag,props={},...kids){const e=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='class')e.className=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v)}for(const c of kids.flat())e.append(c);return e}
export const fmtSize=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':n<1073741824?(n/1048576).toFixed(1)+' MB':(n/1073741824).toFixed(2)+' GB';
export const fmtDate=t=>new Date(t).toLocaleString('id-ID');
export const uid=()=>crypto.randomUUID();
export function download(name,blob){const a=el('a',{href:URL.createObjectURL(blob),download:name});a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
const _ls={};
export function loadScript(src,g){return _ls[src]||(_ls[src]=new Promise((ok,no)=>{if(window[g])return ok(window[g]);const s=document.createElement('script');s.src=src;s.onload=()=>ok(window[g]);s.onerror=()=>{delete _ls[src];no(new Error(src.split('/').pop()+' belum ada di folder libraries/'))};document.head.append(s)}))}
