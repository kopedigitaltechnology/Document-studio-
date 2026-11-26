let db;
export function open(){return db?Promise.resolve(db):new Promise((res,rej)=>{const r=indexedDB.open('docstudio',1);r.onupgradeneeded=()=>{r.result.createObjectStore('files',{keyPath:'id'});r.result.createObjectStore('kv')};r.onsuccess=()=>{db=r.result;res(db)};r.onerror=()=>rej(r.error)})}
function tx(s,m,f){return open().then(d=>new Promise((res,rej)=>{const t=d.transaction(s,m);const q=f(t.objectStore(s));t.oncomplete=()=>res(q.result);t.onerror=()=>rej(t.error)}))}
export const putFile=f=>tx('files','readwrite',s=>s.put(f));
export const getFile=id=>tx('files','readonly',s=>s.get(id));
export const allFiles=()=>tx('files','readonly',s=>s.getAll());
export const delFile=id=>tx('files','readwrite',s=>s.delete(id));
export const kvGet=k=>tx('kv','readonly',s=>s.get(k));
export const kvSet=(k,v)=>tx('kv','readwrite',s=>s.put(v,k));
export async function clearAll(){await tx('files','readwrite',s=>s.clear());await tx('kv','readwrite',s=>s.clear())}
