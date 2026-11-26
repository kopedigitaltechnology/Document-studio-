import {kvGet,kvSet} from './database.js';
export const state={theme:'dark',accent:'#22b8cf',layout:'auto',font:16,confirmDelete:true,name:'Pengguna Lokal',pin:null,bio:null,since:Date.now()};
export async function load(){Object.assign(state,(await kvGet('settings'))||{});apply()}
export async function save(){await kvSet('settings',{...state});apply()}
export function apply(){const r=document.documentElement;const dark=state.theme==='dark'||(state.theme==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);r.dataset.theme=dark?'dark':'light';r.dataset.mode=state.layout==='auto'?(innerWidth>=900?'desktop':'mobile'):state.layout;r.style.setProperty('--ac',state.accent);r.style.fontSize=state.font+'px'}

addEventListener('resize',apply);
