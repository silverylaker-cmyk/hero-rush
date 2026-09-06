import type { DamageType, Unit } from '../types';
export function damageFormula(power:number, defense:number):number { return Math.max(1, power * power / (power + Math.max(0, defense))); }
export function effectiveDefense(unit:Unit, kind:DamageType):number { return kind === 'magic' ? unit.stats.mres : unit.stats.def * (1 - (unit.statuses.find(s => s.kind === 'def_down')?.magnitude ?? 0)); }
export function attackPower(unit:Unit):number { return unit.stats.atk * (1 + (unit.statuses.find(s => s.kind === 'atk_up')?.magnitude ?? 0)); }
export function addEnergy(unit:Unit, value:number):void { if (unit.hp > 0 && unit.team === 'ally') unit.energy = Math.min(100, Math.max(0, unit.energy + value)); }
