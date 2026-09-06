import { DEFAULT_PARTY,heroes } from './core/data';
import type { BattleResult } from './core/types';
export const PROGRESS_KEY='hr.progress.v1';
export interface Progress { stars:Record<string,number>; party:string[] }
export function parseProgress(raw:string|null):Progress {
  const fallback={stars:{},party:[...DEFAULT_PARTY]};
  try {
    const data=JSON.parse(raw??'null');if(!data||typeof data!=='object')return fallback;
    const stars:Record<string,number>={};
    if(data.stars&&typeof data.stars==='object')for(const [key,value] of Object.entries(data.stars))if(Number(key)>=1&&Number(key)<=10&&Number.isInteger(Number(key))&&typeof value==='number'&&Number.isInteger(value)&&value>=1&&value<=3)stars[key]=value;
    const party=Array.isArray(data.party)&&data.party.length===5&&new Set(data.party).size===5&&data.party.every((v:unknown)=>heroes.some(h=>h.id===v))?data.party:[...DEFAULT_PARTY];
    return {stars,party};
  }catch{return fallback;}
}
export function loadProgress():Progress {try{return parseProgress(localStorage.getItem(PROGRESS_KEY));}catch{return parseProgress(null);}}
export function saveProgress(p:Progress):boolean {try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(p));return true;}catch{return false;}}
export function unlocked(p:Progress,stageId:number):boolean {return stageId===1||(p.stars[String(stageId-1)]??0)>0;}
export function recordResult(p:Progress,stageId:number,result:BattleResult):Progress {return {...p,stars:result.victory?{...p.stars,[stageId]:Math.max(p.stars[stageId]??0,result.stars)}:{...p.stars}};}
