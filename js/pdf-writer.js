const enc=new TextEncoder();
const esc=s=>{let o='';for(const ch of s){const c=ch.charCodeAt(0);o+=c===40||c===41||c===92?'\\'+ch:c<32?' ':c<127?ch:c<256?'\\'+c.toString(8).padStart(3,'0'):'?'}return o};
function wrap(t){const o=[];for(const l of t.split(/\r?\n/)){let s=l.replace(/\t/g,'    ');if(!s){o.push('');continue}while(s.length>92){o.push(s.slice(0,92));s=s.slice(92)}o.push(s)}return o}
export function makePdf(items){
 const pg=[];for(const it of items){if(it.jpeg)pg.push(it);else{const L=wrap(it.text);for(let i=0;i<Math.max(L.length,1);i+=54)pg.push({lines:L.slice(i,i+54)})}}
 const N=3+pg.length*3,parts=[],offs=[];let len=0;
 const push=x=>{const b=typeof x==='string'?enc.encode(x):x;parts.push(b);len+=b.length};
 const obj=(n,fn)=>{offs[n]=len;push(n+' 0 obj\n');fn();push('\nendobj\n')};
 push('%PDF-1.4\n');
 obj(1,()=>push('<</Type/Catalog/Pages 2 0 R>>'));
 obj(2,()=>push('<</Type/Pages/Count '+pg.length+'/Kids['+pg.map((_,i)=>(4+3*i)+' 0 R').join(' ')+']>>'));
 obj(3,()=>push('<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>'));
 pg.forEach((p,i)=>{const id=4+3*i;let W=595,H=842,c;
  if(p.jpeg){const s=Math.min(W/p.iw,H/p.ih);const w=(p.iw*s).toFixed(2),h=(p.ih*s).toFixed(2);W=+w;H=+h;c=`q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`}
  else c='BT /F1 11 Tf 14 TL 40 800 Td '+p.lines.map(l=>'('+esc(l)+') Tj T*').join(' ')+' ET';
  obj(id,()=>push(`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${W} ${H}]/Resources<</Font<</F1 3 0 R>>${p.jpeg?'/XObject<</Im0 '+(id+2)+' 0 R>>':''}>>/Contents ${id+1} 0 R>>`));
  obj(id+1,()=>push(`<</Length ${c.length}>>\nstream\n${c}\nendstream`));
  obj(id+2,()=>{if(p.jpeg){push(`<</Type/XObject/Subtype/Image/Width ${p.iw}/Height ${p.ih}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${p.jpeg.length}>>\nstream\n`);push(p.jpeg);push('\nendstream')}else push('null')})});
 const x=len;push(`xref\n0 ${N+1}\n0000000000 65535 f \n`);for(let i=1;i<=N;i++)push(String(offs[i]).padStart(10,'0')+' 00000 n \n');
 push(`trailer\n<</Size ${N+1}/Root 1 0 R>>\nstartxref\n${x}\n%%EOF`);
 return new Blob(parts,{type:'application/pdf'})}
