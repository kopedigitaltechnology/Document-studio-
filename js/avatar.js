import {kvGet,kvSet} from './database.js';
let url=null;
export async function avatarUrl(){if(url){URL.revokeObjectURL(url);url=null}const b=await kvGet('avatar');if(b)url=URL.createObjectURL(b);return url}
export async function setAvatar(file){const bmp=await createImageBitmap(file),s=Math.min(bmp.width,bmp.height),c=document.createElement('canvas');c.width=c.height=320;c.getContext('2d').drawImage(bmp,(bmp.width-s)/2,(bmp.height-s)/2,s,s,0,0,320,320);
 await kvSet('avatar',await new Promise(r=>c.toBlob(r,'image/jpeg',.9)));dispatchEvent(new Event('avatar'))}
export async function clearAvatar(){await kvSet('avatar',null);dispatchEvent(new Event('avatar'))}
