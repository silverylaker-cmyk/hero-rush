import heroesData from '../../data/heroes.json';
import enemiesData from '../../data/enemies.json';
import skillsData from '../../data/skills.json';
import stagesData from '../../data/stages.json';
import type { HeroDef, EnemyDef, Skill, StageDef } from '../types';
export const heroes = heroesData as HeroDef[];
export const enemies = enemiesData as EnemyDef[];
export const skills = skillsData as Skill[];
export const stages = stagesData as StageDef[];
export const DEFAULT_PARTY = ['ironwall','lancer','ember','hawkeye','lumen'];
export function getHero(id:string):HeroDef { const d=heroes.find(v=>v.id===id); if(!d) throw Error(`Unknown hero: ${id}`); return d; }
export function getEnemy(id:string):EnemyDef { const d=enemies.find(v=>v.id===id); if(!d) throw Error(`Unknown enemy: ${id}`); return d; }
export function getSkill(id:string):Skill { const d=skills.find(v=>v.id===id); if(!d) throw Error(`Unknown skill: ${id}`); return d; }
export function getStage(id:number):StageDef { const d=stages.find(v=>v.id===id); if(!d) throw Error(`Unknown stage: ${id}`); return d; }
