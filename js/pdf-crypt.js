// Proteksi kata sandi PDF (standar PDF 2.0, AES-256 / R6) dan pembuka kunci (R2-R6).
// Tanpa library tambahan: memakai WebCrypto + pdf-lib yang sudah ada. Semua diproses di perangkat.
const te=new TextEncoder(),S=()=>crypto.subtle;
const cat=(...a)=>{const o=new Uint8Array(a.reduce((s,x)=>s+x.length,0));let p=0;for(const x of a){o.set(x,p);p+=x.length}return o};
const rnd=n=>crypto.getRandomValues(new Uint8Array(n)),hex=b=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
const Z16=new Uint8Array(16);
const sha=async(alg,d)=>new Uint8Array(await S().digest(alg,d));
async function cbcEnc(key,iv,data,pad){const k=await S().importKey('raw',key,'AES-CBC',false,['encrypt']);const o=new Uint8Array(await S().encrypt({name:'AES-CBC',iv},k,data));return pad?o:o.slice(0,data.length)}
async function cbcDecNoPad(key,iv,data){const k=await S().importKey('raw',key,'AES-CBC',false,['encrypt','decrypt']);
 const extra=new Uint8Array(await S().encrypt({name:'AES-CBC',iv:data.slice(-16)},k,new Uint8Array(0)));return new Uint8Array(await S().decrypt({name:'AES-CBC',iv},k,cat(data,extra)))}
async function cbcDec(key,data){if(data.length<32)return new Uint8Array(0);const k=await S().importKey('raw',key,'AES-CBC',false,['decrypt']);return new Uint8Array(await S().decrypt({name:'AES-CBC',iv:data.slice(0,16)},k,data.slice(16)))}
// Algoritma 2.B (ISO 32000-2) untuk R6
async function hash2B(pw,salt,u=new Uint8Array(0)){
 let k=await sha('SHA-256',cat(pw,salt,u)),e=new Uint8Array(1),i=0;
 while(i<64||e[e.length-1]>i-32){const one=cat(pw,k,u),k1=new Uint8Array(one.length*64);for(let j=0;j<64;j++)k1.set(one,j*one.length);
  e=await cbcEnc(k.slice(0,16),k.slice(16,32),k1,false);let r=0;for(let j=0;j<16;j++)r+=e[j];
  k=await sha(['SHA-256','SHA-384','SHA-512'][r%3],e);i++}
 return k.slice(0,32)}
const pwBytes=s=>te.encode(s||'').slice(0,127);
const eq=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
// ---------- MD5 & RC4 (hanya untuk membuka berkas lama R2-R4) ----------
export function md5(data){const K=new Uint32Array(64),s=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];for(let i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296)>>>0;
 const n=data.length,len=(((n+8)>>6)+1)<<6,b=new Uint8Array(len);b.set(data);b[n]=0x80;const dv=new DataView(b.buffer);dv.setUint32(len-8,(n<<3)>>>0,true);dv.setUint32(len-4,Math.floor(n/536870912),true);
 let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
 for(let o=0;o<len;o+=64){const M=new Uint32Array(16);for(let i=0;i<16;i++)M[i]=dv.getUint32(o+i*4,true);let A=a0,B=b0,C=c0,D=d0;
  for(let i=0;i<64;i++){let F,g;if(i<16){F=(B&C)|(~B&D);g=i}else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16}else if(i<48){F=B^C^D;g=(3*i+5)%16}else{F=C^(B|~D);g=(7*i)%16}
   F=(F+A+K[i]+M[g])>>>0;A=D;D=C;C=B;const sh=s[(i>>4)*4+(i&3)];B=(B+((F<<sh)|(F>>>(32-sh))))>>>0}
  a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+C)>>>0;d0=(d0+D)>>>0}
 const out=new Uint8Array(16),ov=new DataView(out.buffer);[a0,b0,c0,d0].forEach((v,i)=>ov.setUint32(i*4,v,true));return out}
function rc4(key,data){const s=new Uint8Array(256);for(let i=0;i<256;i++)s[i]=i;let j=0;for(let i=0;i<256;i++){j=(j+s[i]+key[i%key.length])&255;[s[i],s[j]]=[s[j],s[i]]}
 const o=new Uint8Array(data.length);let a=0,b=0;for(let k=0;k<data.length;k++){a=(a+1)&255;b=(b+s[a])&255;[s[a],s[b]]=[s[b],s[a]];o[k]=data[k]^s[(s[a]+s[b])&255]}return o}
const PAD=Uint8Array.from([0x28,0xBF,0x4E,0x5E,0x4E,0x75,0x8A,0x41,0x64,0x00,0x4E,0x56,0xFF,0xFA,0x01,0x08,0x2E,0x2E,0x00,0xB6,0xD0,0x68,0x3E,0x80,0x2F,0x0C,0xA9,0xFE,0x64,0x53,0x69,0x7A]);
const padPw=b=>cat(b,PAD).slice(0,32);
// ---------- Penelusuran objek pdf-lib ----------
const isStream=o=>o&&typeof o.getContents==='function'&&o.dict;
async function walk(o,L,fn){const{PDFArray,PDFDict,PDFString,PDFHexString}=L;
 if(o instanceof PDFString||o instanceof PDFHexString)return fn(o.asBytes());
 if(o instanceof PDFArray){for(let i=0;i<o.size();i++){const v=o.get(i),r=await walk(v,L,fn);if(r!==v)o.set(i,r)}}
 else if(o instanceof PDFDict){for(const[k,v]of o.entries()){const r=await walk(v,L,fn);if(r!==v)o.set(k,r)}}
 return o}
async function mapAll(doc,L,{skipRef,bytesFn}){const ctx=doc.context,{PDFHexString,PDFRawStream,PDFName}=L;
 for(const[ref,obj]of[...ctx.enumerateIndirectObjects()]){if(skipRef&&skipRef===ref)continue;
  const sf=async b=>PDFHexString.of(hex(await bytesFn(b,ref,'s')));
  if(isStream(obj)){const t=obj.dict.get(PDFName.of('Type'));if(t&&t.toString()==='/XRef')continue;
   await walk(obj.dict,L,sf);const nb=await bytesFn(obj.getContents(),ref,'m',obj.dict);if(nb)ctx.assign(ref,PDFRawStream.of(obj.dict,nb))}
  else{const r=await walk(obj,L,sf);if(r!==obj)ctx.assign(ref,r)}}}
const permBits=({print=true,copy=true,edit=true}={})=>(0xFFFFF0C0|512|(print?4|2048:0)|(copy?16:0)|(edit?8|32|256|1024:0))|0;
// ---------- Proteksi ----------
export async function protect(bytes,{user='',owner='',allow={}},L){
 if(!user)throw new Error('Kata sandi tidak boleh kosong.');
 let doc;try{doc=await L.PDFDocument.load(bytes,{updateMetadata:false})}catch(e){throw new Error(/encrypt/i.test(e.message)?'PDF ini sudah memakai kata sandi. Buka kuncinya dulu.':e.message)}
 const{PDFHexString,PDFName}=L,ctx=doc.context,P=permBits(allow),fk=rnd(32),pu=pwBytes(user),po=pwBytes(owner||hex(rnd(16)));
 const uvs=rnd(8),uks=rnd(8),U=cat(await hash2B(pu,uvs),uvs,uks),UE=await cbcEnc(await hash2B(pu,uks),Z16,fk,false);
 const ovs=rnd(8),oks=rnd(8),O=cat(await hash2B(po,ovs,U),ovs,oks),OE=await cbcEnc(await hash2B(po,oks,U),Z16,fk,false);
 const pb=new Uint8Array(16),dv=new DataView(pb.buffer);dv.setInt32(0,P,true);dv.setUint32(4,0xFFFFFFFF,true);pb[8]=84;pb.set(te.encode('adb'),9);pb.set(rnd(4),12);
 const Perms=await cbcEnc(fk,Z16,pb,false);
 const key=await S().importKey('raw',fk,'AES-CBC',false,['encrypt']);
 await mapAll(doc,L,{bytesFn:async b=>{const iv=rnd(16);return cat(iv,new Uint8Array(await S().encrypt({name:'AES-CBC',iv},key,b)))}});
 const H=b=>PDFHexString.of(hex(b));
 const enc=ctx.obj({Filter:'Standard',V:5,R:6,Length:256,P,CF:{StdCF:{AuthEvent:'DocOpen',CFM:'AESV3',Length:32}},StmF:'StdCF',StrF:'StdCF',O:H(O),U:H(U),OE:H(OE),UE:H(UE),Perms:H(Perms)});
 ctx.trailerInfo.Encrypt=ctx.register(enc);ctx.trailerInfo.ID=ctx.obj([H(rnd(16)),H(rnd(16))]);
 doc.catalog.set(PDFName.of('Extensions'),ctx.obj({ADBE:{BaseVersion:'1.7',ExtensionLevel:8}}));
 return new Blob([await doc.save({useObjectStreams:false,updateFieldAppearances:false})],{type:'application/pdf'})}
// ---------- Buka kunci ----------
export class PasswordError extends Error{constructor(m){super(m);this.name='PasswordError'}}
export class UnsupportedError extends Error{constructor(m){super(m);this.name='UnsupportedError'}}
const bytesOf=o=>o&&o.asBytes?o.asBytes():new Uint8Array(0);
export async function unlock(bytes,password,L){try{return await unlock0(bytes,password,L)}catch(e){if(e instanceof PasswordError||e instanceof UnsupportedError)throw e;throw new UnsupportedError(e.message)}}
async function unlock0(bytes,password,L){
 const{PDFDocument,PDFDict,PDFArray,PDFName,PDFRef}=L;let doc;
 try{doc=await PDFDocument.load(bytes,{ignoreEncryption:true,updateMetadata:false})}catch(e){throw new UnsupportedError('Struktur PDF tidak bisa dibaca langsung: '+e.message)}
 const ctx=doc.context,er=ctx.trailerInfo.Encrypt;if(!er)throw new UnsupportedError('PDF ini tidak memakai kata sandi.');
 const E=ctx.lookup(er);if(!(E instanceof PDFDict))throw new UnsupportedError('PDF terenkripsi memakai object stream; tidak bisa dibuka langsung.');
 const N=k=>{const v=E.lookup(PDFName.of(k));return v&&v.asNumber?v.asNumber():undefined};
 if(E.lookup(PDFName.of('Filter'))?.toString()!=='/Standard')throw new UnsupportedError('Jenis enkripsi tidak didukung.');
 const V=N('V')||0,R=N('R')||2,len=N('Length')||40,Pn=N('P')|0,O=bytesOf(E.lookup(PDFName.of('O'))),U=bytesOf(E.lookup(PDFName.of('U')));
 const em=E.lookup(PDFName.of('EncryptMetadata')),encMeta=!(em&&em.toString()==='false');
 let method='RC4';if(V>=4){const cf=E.lookup(PDFName.of('CF')),nm=E.lookup(PDFName.of('StmF'))?.toString().slice(1);
  if(nm==='Identity'||!nm)method='NONE';else{const c=cf&&cf.lookup(PDFName.of(nm)),m=c&&c.lookup(PDFName.of('CFM'))?.toString().slice(1);method=m==='AESV2'?'AES128':m==='AESV3'?'AES256':m==='V2'?'RC4':'?';if(method==='?')throw new UnsupportedError('Metode enkripsi tidak didukung.')}}
 const pw=pwBytes(password);let fk;
 if(R>=5){const h=R===5?(s,u=new Uint8Array(0))=>sha('SHA-256',cat(pw,s,u)):(s,u)=>hash2B(pw,s,u),UEb=bytesOf(E.lookup(PDFName.of('UE'))),OEb=bytesOf(E.lookup(PDFName.of('OE')));
  if(eq(await h(U.slice(32,40)),U.slice(0,32)))fk=await cbcDecNoPad(await h(U.slice(40,48)),Z16,UEb);
  else{const u48=U.slice(0,48);if(eq(await h(O.slice(32,40),u48),O.slice(0,32)))fk=await cbcDecNoPad(await h(O.slice(40,48),u48),Z16,OEb);else throw new PasswordError('Kata sandi salah.')}}
 else{const n=R===2?5:Math.min(16,len/8),idArr=ctx.lookup(ctx.trailerInfo.ID,PDFArray),id0=idArr?bytesOf(idArr.lookup(0)):new Uint8Array(0),pb=new Uint8Array(4);new DataView(pb.buffer).setInt32(0,Pn,true);
  let h=md5(cat(padPw(pw),O.slice(0,32),pb,id0,R>=4&&!encMeta?Uint8Array.from([255,255,255,255]):new Uint8Array(0)));if(R>=3)for(let i=0;i<50;i++)h=md5(h.slice(0,n));fk=h.slice(0,n);
  let ok;if(R===2)ok=eq(rc4(fk,PAD),U.slice(0,32));else{let x=rc4(fk,md5(cat(PAD,id0)));for(let i=1;i<=19;i++)x=rc4(fk.map(b=>b^i),x);ok=eq(x,U.slice(0,16))}
  if(!ok)throw new PasswordError('Kata sandi salah.')}
 const objKey=async(ref,aes)=>{const r=ref.objectNumber,g=ref.generationNumber,x=cat(fk,Uint8Array.from([r&255,(r>>8)&255,(r>>16)&255,g&255,(g>>8)&255]),aes?te.encode('sAlT'):new Uint8Array(0));return md5(x).slice(0,Math.min(fk.length+5,16))};
 const fn=async(b,ref,kind,dict)=>{if(method==='NONE')return b;
  if(kind==='m'&&dict){const t=dict.get(PDFName.of('Type'))?.toString();if(t==='/Metadata'&&!encMeta)return b}
  if(method==='AES256')return cbcDec(fk,b);
  const k=await objKey(ref,method==='AES128');return method==='AES128'?cbcDec(k,b):rc4(k,b)};
 await mapAll(doc,L,{skipRef:er instanceof PDFRef?er:undefined,bytesFn:fn});
 ctx.trailerInfo.Encrypt=undefined;if(er instanceof PDFRef)ctx.assign(er,ctx.obj(null));
 return new Blob([await doc.save({useObjectStreams:false,updateFieldAppearances:false})],{type:'application/pdf'})}
