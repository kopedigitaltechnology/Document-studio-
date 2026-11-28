// Deteksi dokumen & perkiraan teks dari satu frame (RGBA). Heuristik ringan, bukan OCR.
export function analyze(d,w,h){
 const g=new Uint8Array(w*h),hist=new Uint32Array(256);
 for(let i=0,j=0;i<d.length;i+=4,j++){const v=(.299*d[i]+.587*d[i+1]+.114*d[i+2])|0;g[j]=v;hist[v]++}
 const total=w*h;let sum=0;for(let t=0;t<256;t++)sum+=t*hist[t];
 let wB=0,sB=0,mx=0,thr=128;for(let t=0;t<256;t++){wB+=hist[t];if(!wB)continue;const wF=total-wB;if(!wF)break;sB+=t*hist[t];const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>mx){mx=v;thr=t}}
 const rows=new Float32Array(h),cols=new Float32Array(w);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(g[y*w+x]>thr){rows[y]++;cols[x]++}
 for(let y=0;y<h;y++)rows[y]/=w;for(let x=0;x<w;x++)cols[x]/=h;
 const run=(a,n)=>{const gap=Math.max(2,Math.round(n*.08)),R=[];let s=-1;for(let i=0;i<=n;i++){const on=i<n&&a[i]>.3;if(on&&s<0)s=i;if(!on&&s>=0){R.push([s,i-1]);s=-1}}
  const M=[];for(const r of R){const l=M[M.length-1];if(l&&r[0]-l[1]<=gap)l[1]=r[1];else M.push([...r])}
  let best=[0,n-1],bl=0;for(const m of M)if(m[1]-m[0]+1>bl){bl=m[1]-m[0]+1;best=m}return{a:best[0],b:best[1],len:bl}};
 const r=run(rows,h),c=run(cols,w),box={x:c.a/w,y:r.a/h,w:(c.b-c.a+1)/w,h:(r.b-r.a+1)/h},found=r.len>0&&c.len>0&&box.w>.3&&box.h>.3;
 let ed=0,n=0;if(found)for(let y=r.a;y<=r.b;y++)for(let x=c.a;x<c.b;x++){n++;{const i=y*w+x,v=g[i];if(Math.abs(g[i+1]-v)>24||Math.abs(g[i+w]-v)>24)ed++}}
 const density=n?ed/n:0;return{found,box,density,text:found&&density>.03&&density<.45}}

// Cari 4 sudut kertas (kiri-atas, kanan-atas, kanan-bawah, kiri-bawah) dari area terang terbesar. Mengembalikan null bila tak yakin.
export function findQuad(d,w,h){
 const g=new Uint8Array(w*h),hist=new Uint32Array(256);for(let i=0,j=0;i<d.length;i+=4,j++){const v=(.299*d[i]+.587*d[i+1]+.114*d[i+2])|0;g[j]=v;hist[v]++}
 const total=w*h;let sum=0;for(let t=0;t<256;t++)sum+=t*hist[t];let wB=0,sB=0,mx=0,thr=128;
 for(let t=0;t<256;t++){wB+=hist[t];if(!wB)continue;const wF=total-wB;if(!wF)break;sB+=t*hist[t];const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>mx){mx=v;thr=t}}
 const lab=new Int32Array(w*h),st=new Int32Array(w*h);let best=0,bestId=0,id=0;
 for(let s=0;s<w*h;s++){if(g[s]<=thr||lab[s])continue;id++;let n=0,sp=0;st[sp++]=s;lab[s]=id;
  while(sp){const p=st[--sp];n++;const x=p%w,y=(p-x)/w;for(const q of[x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(q>=0&&g[q]>thr&&!lab[q]){lab[q]=id;st[sp++]=q}}
  if(n>best){best=n;bestId=id}}
 if(best<total*.15||best>total*.97)return null;
 const c=[[-1e9,0,0],[-1e9,0,0],[-1e9,0,0],[-1e9,0,0]],f=[(x,y)=>-(x+y),(x,y)=>x-y,(x,y)=>x+y,(x,y)=>y-x];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(lab[y*w+x]===bestId)for(let k=0;k<4;k++){const v=f[k](x,y);if(v>c[k][0])c[k]=[v,x,y]}
 return c.map(([,x,y])=>[x/w,y/h])}
