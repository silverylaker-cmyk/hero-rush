import {it,expect} from 'vitest';
import {parseProgress,recordResult,unlocked} from '../../src/progress';
import {BattleSim} from '../../src/core/sim';
it('recovers malformed storage and rejects invalid party IDs and star values',()=>{expect(parseProgress('{').party).toHaveLength(5);const p=parseProgress(JSON.stringify({stars:{'1':3,'2':99,'-1':2,'3':'3'},party:Array(5).fill('fake')}));expect(p.stars).toEqual({'1':3});expect(p.party[0]).toBe('ironwall');});
it('unlocks only the next cleared stage and preserves best stars',()=>{let p=parseProgress(null);expect(unlocked(p,1)).toBe(true);expect(unlocked(p,2)).toBe(false);const r=BattleSim.runHeadless(1,1);p=recordResult(p,1,r);expect(unlocked(p,2)).toBe(true);expect(unlocked(p,3)).toBe(false);expect(recordResult(p,1,{...r,stars:1}).stars[1]).toBe(3);expect(recordResult(p,2,{...r,victory:false,stars:0}).stars[2]).toBeUndefined();});
