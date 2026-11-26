export const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
export const ub=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function derive(pw,salt,it){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);return crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:it},k,256)}
export async function hashPassword(pw){const salt=crypto.getRandomValues(new Uint8Array(16));const it=600000;return{salt:b64(salt),it,hash:b64(await derive(pw,salt,it))}}
export async function verifyPassword(pw,r){return b64(await derive(pw,ub(r.salt),r.it))===r.hash}
