import {loadScript} from './helpers.js';
const H=[22,18,15,13,12,11],clean=t=>t.replace(/\s+/g,' ').trim();
export function htmlBlocks(html){const doc=new DOMParser().parseFromString(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi,''),'text/html'),out=[],skip=new Set(['SCRIPT','STYLE','HEAD','NOSCRIPT','TEMPLATE','SVG']);
 (function walk(n){for(const c of n.childNodes){if(c.nodeType===3){const t=clean(c.textContent);if(t)out.push({text:t})}else if(c.nodeType===1){const u=c.tagName.toUpperCase();if(skip.has(u))continue;
  if(/^H[1-6]$/.test(u))out.push({text:clean(c.textContent),size:H[+u[1]-1],bold:true,gap:6,after:.5});
  else if(u==='LI')out.push({text:'- '+clean(c.textContent),indent:12});
  else if(u==='PRE')out.push({text:c.textContent});
  else if(['P','BLOCKQUOTE','FIGCAPTION','DT','DD','TR','CAPTION'].includes(u)){const t=clean(c.textContent);if(t)out.push({text:t})}
  else walk(c)}}})(doc.body);return out}
const plain=s=>s.replace(/!\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/[*_`~]/g,'');
export async function mdBlocks(md){const M=await loadScript('libraries/marked.umd.js','marked'),out=[];
 for(const t of M.lexer(md)){if(t.type==='heading')out.push({text:plain(t.text),size:H[Math.min(t.depth,6)-1],bold:true,gap:6,after:.5});
  else if(t.type==='paragraph'||t.type==='blockquote'||t.type==='code')out.push({text:t.type==='code'?t.text:plain(t.text)});
  else if(t.type==='list')t.items.forEach((it,i)=>out.push({text:(t.ordered?(i+1)+'. ':'- ')+plain(it.text),indent:12,after:.15}))}return out}
export async function docxBlocks(bytes){const Z=await loadScript('libraries/jszip.min.js','JSZip');let z;try{z=await Z.loadAsync(bytes)}catch{throw new Error('Bukan berkas DOCX yang valid')}
 const f=z.file('word/document.xml');if(!f)throw new Error('word/document.xml tidak ditemukan');
 const xml=new DOMParser().parseFromString(await f.async('string'),'application/xml'),out=[];
 for(const p of xml.getElementsByTagName('w:p')){let t='';for(const n of p.getElementsByTagName('*')){const g=n.nodeName;if(g==='w:t')t+=n.textContent;else if(g==='w:tab')t+='    ';else if(g==='w:br')t+='\n'}
  const st=p.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val')||'',hm=st.match(/^(?:Heading|Judul)\s*([1-6])$/i);
  if(hm)out.push({text:t,size:H[+hm[1]-1],bold:true,gap:6});else if(st==='Title')out.push({text:t,size:24,bold:true,gap:6});else out.push({text:(p.getElementsByTagName('w:numPr').length?'- ':'')+t})}
 return out}
