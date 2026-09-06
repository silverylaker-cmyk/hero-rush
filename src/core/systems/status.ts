import type { SkillEffect, Unit } from '../types';
export const hardCC = (u:Unit):boolean => u.statuses.some(s => s.kind === 'stun' || s.kind === 'airborne');
export const silenced = (u:Unit):boolean => u.statuses.some(s => s.kind === 'silence');
export function mergeStatus(unit:Unit, effect:SkillEffect, sourceId:string):void {
  let duration = effect.kind === 'airborne' ? 0.8 : effect.duration;
  if (unit.boss && (effect.kind === 'stun' || effect.kind === 'airborne')) duration *= 0.5;
  const old = unit.statuses.find(s => s.kind === effect.kind);
  if (old) { old.duration = Math.max(old.duration, duration); old.magnitude = Math.max(old.magnitude, effect.magnitude); old.sourceId = sourceId; }
  else unit.statuses.push({ ...effect, duration, sourceId, nextTick: 1 });
}
