import {it,expect} from 'vitest';
import {BattleSim} from '../../src/core/sim';
it('meets early and late AUTO win-rate gates across twenty fixed seeds',()=>{
  for(const stage of [1,2,3,8,9,10]){const wins=Array.from({length:20},(_,i)=>BattleSim.runHeadless(stage,i+1,'auto')).filter(r=>r.victory).length;if(stage<=3)expect(wins,`stage ${stage}`).toBe(20);else expect(wins,`stage ${stage}`).toBeLessThanOrEqual(10);}
},15000);
it('allows the last stage to be won by reserving control and healing for the right moment',()=>{const manual=BattleSim.runHeadless(10,2,'tactical'),automatic=BattleSim.runHeadless(10,2,'auto');expect(manual.victory).toBe(true);expect(automatic.victory).toBe(false);expect(manual.wave).toBe(3);});
