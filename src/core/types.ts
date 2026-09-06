export type Team = 'ally' | 'enemy';
export type Role = 'tank' | 'melee' | 'ranged' | 'mage' | 'healer' | 'caster' | 'boss';
export type AimType = 'none' | 'target_enemy' | 'target_ally' | 'ground_point' | 'direction';
export type DamageType = 'physical' | 'magic' | 'true';
export type StatusKind = 'stun' | 'silence' | 'airborne' | 'knockback' | 'dot' | 'shield' | 'atk_up' | 'def_down';
export type Policy = 'auto' | 'noUlt' | 'tactical';
export interface Stats { hp:number; atk:number; def:number; mres:number; atkSpeed:number; range:number; moveSpeed:number; energyOnHit:number; energyOnDamaged:number }
export interface ArtDef { key:string; portrait:string; scale:number; anchorY:number }
export interface HeroDef { id:string; name:string; title:string; role:Role; row:'front'|'mid'|'back'; stats:Stats; skillId:string; art:ArtDef; color:string; targetPolicy?:'nearest'|'backline'|'lowestHp' }
export interface EnemyDef { id:string; name:string; role:Role; stats:Stats; castSkillId?:string; castDuration?:number; castCooldown?:number; art:ArtDef; color:string }
export interface SkillEffect { kind:StatusKind; duration:number; magnitude:number }
export interface Skill { id:string; name:string; description:string; aimType:AimType; range:number; radius?:number; width?:number; damage:number; damageType:DamageType; heal?:number; effects:SkillEffect[]; color:string }
export interface StageDef { id:number; name:string; subtitle:string; waves:{ spawns:{ enemyId:string; count:number; levelScale:number }[] }[] }
export interface StatusEffect extends SkillEffect { sourceId:string; nextTick:number }
export interface Unit { id:string; defId:string; name:string; team:Team; slot:number; role:Role; x:number; y:number; hp:number; energy:number; stats:Stats; skillId?:string; targetPolicy:'nearest'|'backline'|'lowestHp'; targetId?:string; cooldown:number; castCooldown:number; casting?:{ skillId:string; remaining:number; total:number }; statuses:StatusEffect[]; state:'idle'|'walk'|'attack'|'cast'|'stun'|'dead'; actionTick:number; lastHitTick:number; deathTick:number; damageDone:number; healingDone:number; boss:boolean }
export interface Projectile { id:number; sourceId:string; targetId:string; x:number; y:number; power:number; damageType:DamageType; speed:number }
export interface Aim { x:number; y:number; targetId?:string; angle?:number }
export type BattleInput = { tick:number; type:'cast'; unitId:string; aim:Aim } | { tick:number; type:'auto'; enabled:boolean };
export interface BattleEvent { seq:number; tick:number; type:'attack'|'damage'|'heal'|'death'|'skill'|'cast'|'interrupt'|'wave'|'end'; unitId?:string; targetId?:string; skillId?:string; amount?:number; x?:number; y?:number; toX?:number; toY?:number }
export interface BattleResult { victory:boolean; stars:number; ticks:number; seconds:number; survivors:number; wave:number; reason:'victory'|'defeat'|'timeout'; hash:number; damage:Record<string,number> }
