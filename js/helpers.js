export function el(tag,props={},...kids){const e=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k==='class')e.className=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v)}for(const c of kids.flat())e.append(c);return e}
export const fmtSize=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB';
export const fmtDate=t=>new Date(t).toLocaleString('id-ID');
export const uid=()=>crypto.randomUUID();
export function download(name,blob){const a=el('a',{href:URL.createObjectURL(blob),download:name});a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
