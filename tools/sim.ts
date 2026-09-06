import { BattleSim } from '../src/core/sim';
import type { Policy } from '../src/core/types';
const args=process.argv.slice(2);
const arg=(key:string,fallback:string) => args[args.indexOf(key)+1]??fallback;
const stage=args.includes('--stage')?Number(arg('--stage','1')):1;
const seed=args.includes('--seed')?Number(arg('--seed','1')):1;
const policy=(args.includes('--policy')?arg('--policy','auto'):'auto') as Policy;
if(!['auto','noUlt','tactical'].includes(policy)) throw Error('policy: auto | noUlt | tactical');
console.log(JSON.stringify(BattleSim.runHeadless(stage,seed,policy),null,2));
