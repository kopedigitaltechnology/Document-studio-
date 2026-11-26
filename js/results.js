import {el,download} from './helpers.js';
import {saveBlob} from './file-manager.js';
export function addResult(box,name,blob){box.append(el('div',{class:'row'},name,el('span',{},el('button',{class:'sec',onclick:()=>download(name,blob)},'Unduh'),el('button',{class:'sec',onclick:async e=>{await saveBlob(name,blob);e.target.disabled=true;e.target.textContent='Tersimpan'}},'Simpan ke Berkas'))))}
