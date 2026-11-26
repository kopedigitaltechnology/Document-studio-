export function render(bmp,{mode='original',b=0,c=1,rot=0}){
 const sw=bmp.width,sh=bmp.height,sw90=rot%180!==0,cv=document.createElement('canvas');cv.width=sw90?sh:sw;cv.height=sw90?sw:sh;
 const x=cv.getContext('2d',{willReadFrequently:true});x.translate(cv.width/2,cv.height/2);x.rotate(rot*Math.PI/180);x.drawImage(bmp,-sw/2,-sh/2);x.setTransform(1,0,0,1,0,0);
 if(mode==='original'&&!b&&c===1)return cv;
 const d=x.getImageData(0,0,cv.width,cv.height),p=d.data;
 const cc=mode==='enhanced'?c*1.25:mode==='contrast'?c*1.8:mode==='document'?c*1.4:c,bb=mode==='enhanced'?b+8:b,gray=['gray','bw','document'].includes(mode);
 for(let i=0;i<p.length;i+=4){let R=p[i],G=p[i+1],B=p[i+2];if(gray)R=G=B=.299*R+.587*G+.114*B;
  R=(R-128)*cc+128+bb;G=(G-128)*cc+128+bb;B=(B-128)*cc+128+bb;
  if(mode==='bw'){R=G=B=R>128?255:0}p[i]=R;p[i+1]=G;p[i+2]=B}
 x.putImageData(d,0,0);return cv}
export const blobOf=(cv,type,q)=>new Promise(r=>cv.toBlob(r,type,q));
