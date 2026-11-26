import {state,save} from './state.js';
import {b64,ub} from './password.js';
export const supported=async()=>!!(window.isSecureContext&&window.PublicKeyCredential&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.());
export async function register(){const c=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:'Document Studio'},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'local',displayName:'Pengguna Lokal'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000}});state.bio=b64(c.rawId);await save()}
export async function verify(){await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id:ub(state.bio)}],userVerification:'required',timeout:60000}});return true}
export async function disable(){state.bio=null;await save()}
