// Koreksi perspektif: q = 4 titik [x,y] relatif (0-1) urut kiri-atas, kanan-atas, kanan-bawah, kiri-bawah.
export function homography(q){const[[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=q,dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;
 if(Math.abs(dx3)<1e-12&&Math.abs(dy3)<1e-12)return{a:x1-x0,b:x2-x1,c:x0,d:y1-y0,e:y2-y1,f:y0,g:0,h:0};
 const den=dx1*dy2-dx2*dy1,g=(dx3*dy2-dx2*dy3)/den,h=(dx1*dy3-dx3*dy1)/den;
 return{a:x1-x0+g*x1,b:x3-x0+h*x3,c:x0,d:y1-y0+g*y1,e:y3-y0+h*y3,f:y0,g,h}}
export function warp(src,q){const sw=src.width,sh=src.height,P=q.map(([x,y])=>[x*sw,y*sh]),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 let W=Math.round(Math.max(dist(P[0],P[1]),dist(P[3],P[2]))),H=Math.round(Math.max(dist(P[0],P[3]),dist(P[1],P[2])));const k=Math.min(1,4200/Math.max(W,H,1));W=Math.max(2,Math.round(W*k));H=Math.max(2,Math.round(H*k));
 const sc=document.createElement('canvas');sc.width=sw;sc.height=sh;const sx=sc.getContext('2d',{willReadFrequently:true});sx.drawImage(src,0,0);const S=sx.getImageData(0,0,sw,sh).data;
 const out=document.createElement('canvas');out.width=W;out.height=H;const ox=out.getContext('2d'),od=ox.createImageData(W,H),D=od.data,m=homography(P.map(([x,y])=>[x/sw,y/sh]));
 for(let y=0;y<H;y++){const v=(y+.5)/H;for(let x=0;x<W;x++){const u=(x+.5)/W,w=m.g*u+m.h*v+1,fx=(m.a*u+m.b*v+m.c)/w*sw-.5,fy=(m.d*u+m.e*v+m.f)/w*sh-.5;
  const x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0,i=(y*W+x)*4;
  for(let ch=0;ch<4;ch++){const g=(xx,yy)=>S[(Math.min(sh-1,Math.max(0,yy))*sw+Math.min(sw-1,Math.max(0,xx)))*4+ch];
   D[i+ch]=(g(x0,y0)*(1-tx)+g(x0+1,y0)*tx)*(1-ty)+(g(x0,y0+1)*(1-tx)+g(x0+1,y0+1)*tx)*ty}}}
 ox.putImageData(od,0,0);return out}
export function render(bmp,{mode='original',b=0,c=1,rot=0,crop=null,quad=null}){
 if(quad)bmp=warp(bmp,quad);
 const sw=bmp.width,sh=bmp.height,odd=rot%180!==0;let cv=document.createElement('canvas');cv.width=odd?sh:sw;cv.height=odd?sw:sh;
 let x=cv.getContext('2d',{willReadFrequently:true});x.translate(cv.width/2,cv.height/2);x.rotate(rot*Math.PI/180);x.drawImage(bmp,-sw/2,-sh/2);x.setTransform(1,0,0,1,0,0);
 if(crop){const w=Math.max(1,Math.round(crop.w*cv.width)),h=Math.max(1,Math.round(crop.h*cv.height)),c2=document.createElement('canvas');c2.width=w;c2.height=h;const x2=c2.getContext('2d',{willReadFrequently:true});x2.drawImage(cv,Math.round(crop.x*cv.width),Math.round(crop.y*cv.height),w,h,0,0,w,h);cv=c2;x=x2}
 if(mode==='original'&&!b&&c===1)return cv;
 const d=x.getImageData(0,0,cv.width,cv.height),p=d.data,cc=mode==='enhanced'?c*1.25:mode==='contrast'?c*1.8:mode==='document'?c*1.4:c,bb=mode==='enhanced'?b+8:b,gray=['gray','bw','document'].includes(mode);
 for(let i=0;i<p.length;i+=4){let R=p[i],G=p[i+1],B=p[i+2];if(gray)R=G=B=.299*R+.587*G+.114*B;
  R=(R-128)*cc+128+bb;G=(G-128)*cc+128+bb;B=(B-128)*cc+128+bb;
  if(mode==='bw'){R=G=B=R>128?255:0}p[i]=R;p[i+1]=G;p[i+2]=B}
 x.putImageData(d,0,0);return cv}
export const blobOf=(cv,type,q)=>new Promise(r=>cv.toBlob(r,type,q));
