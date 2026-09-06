import type { Unit } from '../types';
export function selectTarget(unit:Unit, opponents:Unit[], range=Infinity):Unit|undefined {
  return opponents.filter(v => v.hp > 0 && Math.abs(v.x-unit.x) <= range).sort((a,b) => {
    if (unit.targetPolicy === 'backline') return Math.abs(b.x-unit.x)-Math.abs(a.x-unit.x) || a.slot-b.slot;
    if (unit.targetPolicy === 'lowestHp') return a.hp/a.stats.hp-b.hp/b.stats.hp || a.slot-b.slot;
    return Math.abs(a.x-unit.x)-Math.abs(b.x-unit.x) || a.slot-b.slot;
  })[0];
}
