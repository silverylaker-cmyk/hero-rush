import { DEFAULT_PARTY, getHero, getEnemy, getSkill, getStage } from './data';
import { Rng } from './rng';
import { attackPower, addEnergy, damageFormula, effectiveDefense } from './systems/combat';
import { hardCC, silenced, mergeStatus } from './systems/status';
import { selectTarget } from './systems/targeting';
import type { Aim, BattleEvent, BattleInput, BattleResult, DamageType, Policy, Projectile, SkillEffect, StageDef, Unit } from './types';
export const TICK_RATE=60, DT=1/TICK_RATE, WORLD_WIDTH=5760, GROUND_Y=820;
const MAX_TICKS=180*TICK_RATE;
export class BattleSim {
  readonly rng:Rng;
  readonly stage:StageDef;
  readonly party:string[];
  readonly seed:number;
  units:Unit[]=[];
  projectiles:Projectile[]=[];
  events:BattleEvent[]=[];
  inputs:BattleInput[]=[];
  inputLog:BattleInput[]=[];
  tick=0; wave=0; intermission=0; auto=false; result?:BattleResult;
  eventHash=2166136261; private seq=0; private projectileSeq=0;
  constructor(stageId=1, seed=1, party=DEFAULT_PARTY) {
    if(party.length!==5 || new Set(party).size!==5) throw Error('Select exactly five unique heroes');
    this.stage=getStage(stageId); this.party=[...party]; this.seed=seed>>>0; this.rng=new Rng(seed);
    const rowCounts={front:0,mid:0,back:0};
    this.units=party.map((id,slot) => {
      const h=getHero(id), rowIndex=rowCounts[h.row]++;
      const x=600-({front:0,mid:140,back:280}[h.row]);
      const offsets=h.row==='front' ? [-30,60] : h.row==='mid' ? [40] : [-60,20,100];
      return this.makeUnit(id,h.name,'ally',slot,h.role,x,GROUND_Y+(offsets[rowIndex]??0),h.stats,h.skillId,h.targetPolicy);
    });
    this.spawnWave();
  }
  get allies():Unit[] { return this.units.filter(u=>u.team==='ally'); }
  get enemies():Unit[] { return this.units.filter(u=>u.team==='enemy'); }
  living(team:'ally'|'enemy'):Unit[] { return this.units.filter(u=>u.team===team && u.hp>0); }
  unit(id?:string):Unit|undefined { return this.units.find(u=>u.id===id); }
  private makeUnit(defId:string,name:string,team:Unit['team'],slot:number,role:Unit['role'],x:number,y:number,stats:Unit['stats'],skillId?:string,targetPolicy:Unit['targetPolicy']='nearest'):Unit {
    return {id:`${team}-${team==='enemy'?this.wave+'-':''}${slot}-${defId}`,defId,name,team,slot,role,x,y,hp:stats.hp,energy:0,stats:{...stats},skillId,targetPolicy,cooldown:this.rng.next()*0.45,castCooldown:3+this.rng.next()*2,statuses:[],state:'idle',actionTick:-100,lastHitTick:-100,deathTick:-1,damageDone:0,healingDone:0,boss:role==='boss'};
  }
  emit(event:Omit<BattleEvent,'seq'|'tick'>):void {
    const e={...event,seq:++this.seq,tick:this.tick}; this.events.push(e);
    if(this.events.length>160) this.events.shift();
    for(const c of JSON.stringify(e)) this.eventHash=Math.imul(this.eventHash^c.charCodeAt(0),16777619)>>>0;
  }
  enqueue(input:BattleInput):boolean {
    if(!Number.isInteger(input.tick)||input.tick<=this.tick||this.result) return false;
    if(input.type==='cast' && (!Number.isFinite(input.aim.x)||!Number.isFinite(input.aim.y)||(input.aim.angle!==undefined&&!Number.isFinite(input.aim.angle)))) return false;
    const copy=structuredClone(input); this.inputs.push(copy); this.inputs.sort((a,b)=>a.tick-b.tick); this.inputLog.push(structuredClone(copy)); return true;
  }
  canCast(unit:Unit):boolean { return unit.team==='ally'&&unit.hp>0&&unit.energy>=100&&!hardCC(unit)&&!silenced(unit)&&!!unit.skillId&&!this.intermission&&!this.result; }
  defaultAim(unit:Unit, tactical=false):Aim|undefined {
    const skill=getSkill(unit.skillId!);
    if(skill.aimType==='none') return {x:unit.x,y:unit.y};
    if(skill.aimType==='target_ally') {
      const ally=this.living('ally').filter(v=>Math.abs(v.x-unit.x)<=skill.range).sort((a,b)=>a.hp/a.stats.hp-b.hp/b.stats.hp||a.slot-b.slot)[0];
      return ally ? {x:ally.x,y:ally.y,targetId:ally.id} : undefined;
    }
    const valid=this.living('enemy').filter(v=>Math.abs(v.x-unit.x)<=skill.range);
    const caster=tactical ? valid.find(v=>v.casting) : undefined;
    const target=caster??selectTarget(unit,valid);
    if(!target) return undefined;
    let x=target.x;
    if(tactical&&skill.aimType==='ground_point') x=valid.map(v=>v.x).sort((a,b)=>valid.filter(v=>Math.abs(v.x-b)<(skill.radius??0)).length-valid.filter(v=>Math.abs(v.x-a)<(skill.radius??0)).length)[0];
    return {x,y:target.y,targetId:target.id,angle:Math.max(-Math.PI/6,Math.min(Math.PI/6,Math.atan2(target.y-unit.y,target.x-unit.x)))};
  }
  validAim(unit:Unit,aim:Aim):boolean {
    if(!unit.skillId||!Number.isFinite(aim.x)||!Number.isFinite(aim.y)) return false;
    const s=getSkill(unit.skillId);
    if(s.aimType==='none') return true;
    if(s.aimType==='direction') return Number.isFinite(aim.angle??0)&&Math.abs(aim.angle??0)<=Math.PI/6+1e-8;
    if(Math.abs(aim.x-unit.x)>s.range || aim.x<0 || aim.x>WORLD_WIDTH) return false;
    if(s.aimType==='ground_point') return aim.y>=500&&aim.y<=940;
    const target=this.unit(aim.targetId);
    return !!target&&target.hp>0&&target.team===(s.aimType==='target_ally'?'ally':'enemy')&&Math.abs(target.x-unit.x)<=s.range;
  }
  cast(unitId:string,aim:Aim):boolean {
    const u=this.unit(unitId);
    if(!u||!this.canCast(u)||!this.validAim(u,aim)) return false;
    const s=getSkill(u.skillId!); u.energy=0; u.actionTick=this.tick; u.state='cast'; u.cooldown=Math.max(u.cooldown,0.5);
    this.emit({type:'skill',unitId:u.id,skillId:s.id,x:u.x,y:u.y,toX:aim.x,toY:aim.y});
    let targets:Unit[]=[];
    if(s.aimType==='target_ally'||s.aimType==='target_enemy') targets=[this.unit(aim.targetId)!];
    else if(s.aimType==='none') targets=this.living('ally');
    else if(s.aimType==='ground_point') targets=this.living('enemy').filter(v=>Math.abs(v.x-aim.x)<=(s.radius??0));
    else {
      const angle=aim.angle??0, dx=Math.cos(angle), dy=Math.sin(angle);
      targets=this.living('enemy').filter(v=>{const x=v.x-u.x,y=v.y-u.y,along=x*dx+y*dy; return along>=0&&along<=s.range&&Math.abs(-x*dy+y*dx)<=(s.width??80)/2+50;});
    }
    for(const v of targets) {
      if(s.heal) this.heal(u,v,s.heal);
      if(s.damage) this.damage(u,v,s.damage,s.damageType);
      if(v.hp>0) for(const effect of s.effects) this.applyStatus(v,effect,u.id);
    }
    return true;
  }
  applyStatus(unit:Unit,effect:SkillEffect,sourceId:string):void {
    if(unit.hp<=0) return;
    if(['stun','silence','airborne','knockback'].includes(effect.kind)&&unit.casting) {
      this.emit({type:'interrupt',unitId:unit.id,x:unit.x,y:unit.y}); unit.casting=undefined; unit.castCooldown=6;
    }
    if(effect.kind==='knockback') { unit.x=Math.max(60,Math.min(WORLD_WIDTH-60,unit.x+(unit.team==='enemy'?1:-1)*effect.magnitude)); mergeStatus(unit,{kind:'stun',duration:0.3,magnitude:0},sourceId); }
    else mergeStatus(unit,effect,sourceId);
  }
  damage(source:Unit|undefined,target:Unit,power:number,kind:DamageType,basic=false):number {
    if(target.hp<=0) return 0;
    let amount=kind==='true'?Math.max(1,power):damageFormula(power,effectiveDefense(target,kind));
    const shield=target.statuses.find(s=>s.kind==='shield');
    if(shield) {const absorb=Math.min(shield.magnitude,amount); shield.magnitude-=absorb; amount-=absorb; if(shield.magnitude<=0) target.statuses=target.statuses.filter(s=>s!==shield);}
    amount=Math.min(target.hp,amount); target.hp-=amount; target.lastHitTick=this.tick;
    if(source) source.damageDone+=amount;
    if(basic&&source) addEnergy(source,source.stats.energyOnHit);
    addEnergy(target,target.stats.energyOnDamaged);
    this.emit({type:'damage',unitId:source?.id,targetId:target.id,amount:Math.round(amount),x:target.x,y:target.y});
    if(target.hp<=0) {target.hp=0; target.state='dead'; target.deathTick=this.tick; target.casting=undefined; target.statuses=[];
      this.emit({type:'death',unitId:target.id,x:target.x,y:target.y});
      if(target.team==='ally') for(const ally of this.living('ally')) addEnergy(ally,15);
    }
    return amount;
  }
  heal(source:Unit,target:Unit,amount:number):void {if(target.hp<=0)return; const actual=Math.min(amount,target.stats.hp-target.hp); target.hp+=actual; source.healingDone+=actual; this.emit({type:'heal',unitId:source.id,targetId:target.id,amount:Math.round(actual),x:target.x,y:target.y});}
  private statuses():void {
    for(const u of this.units) {
      if(u.hp<=0) continue;
      addEnergy(u,2*DT);
      for(const s of [...u.statuses]) {
        const elapsed=Math.min(DT,s.duration); s.duration-=DT; s.nextTick-=elapsed;
        if(s.kind==='dot'&&s.nextTick<=1e-8) {s.nextTick+=1; this.damage(this.unit(s.sourceId),u,s.magnitude,'magic');}
        if(u.hp<=0) break;
      }
      u.statuses=u.statuses.filter(s=>s.duration>1e-8);
    }
  }
  private enemyCast(unit:Unit):void {
    const skill=getSkill(unit.casting!.skillId);
    this.emit({type:'skill',unitId:unit.id,skillId:skill.id,x:unit.x,y:unit.y});
    const targets=this.living('ally').filter(v=>skill.id==='swamp_hex'||Math.abs(v.x-unit.x)<=600);
    for(const v of targets) {this.damage(unit,v,skill.damage*(unit.stats.atk/getEnemy(unit.defId).stats.atk),skill.damageType); if(v.hp>0) for(const e of skill.effects) this.applyStatus(v,e,unit.id);}
    unit.casting=undefined; unit.castCooldown=getEnemy(unit.defId).castCooldown??10;
  }
  private actions():void {
    // Movement reads a shared position snapshot, so units starting side by side
    // march together without update-order blocking. Collision uses only x.
    const positions=new Map(this.units.map(u=>[u.id,u.x]));
    const moves=new Map<string,number>();
    for(const u of this.units) {
      if(u.hp<=0) continue;
      u.cooldown=Math.max(0,u.cooldown-DT); u.castCooldown=Math.max(0,u.castCooldown-DT);
      if(hardCC(u)) {u.state='stun'; continue;}
      if(u.casting) {u.state='cast'; u.casting.remaining-=DT; if(u.casting.remaining<=0) this.enemyCast(u); continue;}
      if(u.team==='ally'&&this.auto&&this.canCast(u)) {const aim=this.defaultAim(u); if(aim&&this.cast(u.id,aim)) continue;}
      const opponents=this.living(u.team==='ally'?'enemy':'ally');
      const inRange=selectTarget(u,opponents,u.stats.range), target=inRange??selectTarget(u,opponents);
      u.targetId=target?.id;
      if(!target) {u.state='idle';continue;}
      if(u.team==='enemy'&&u.skillId&&u.castCooldown<=0&&!silenced(u)&&Math.abs(target.x-u.x)<=750) {
        const def=getEnemy(u.defId), duration=def.castDuration??2.5;
        u.casting={skillId:u.skillId,remaining:duration,total:duration};u.state='cast';u.actionTick=this.tick;
        this.emit({type:'cast',unitId:u.id,skillId:u.skillId,x:u.x,y:u.y});continue;
      }
      if(inRange) {
        if(this.tick-u.actionTick>30) u.state='idle';
        if(u.cooldown<=0) {
          u.cooldown=1/u.stats.atkSpeed;u.state='attack';u.actionTick=this.tick;
          this.emit({type:'attack',unitId:u.id,targetId:target.id,x:u.x,y:u.y});
          const power=attackPower(u), kind=(u.role==='mage'||u.role==='healer'||u.role==='caster')?'magic':'physical';
          if(u.stats.range>200) this.projectiles.push({id:++this.projectileSeq,sourceId:u.id,targetId:target.id,x:u.x,y:u.y-90,power,damageType:kind,speed:900});
          else this.damage(u,target,power,kind,true);
        }
      } else {
        const dir=u.team==='ally'?1:-1, current=positions.get(u.id)!;
        let next=current+dir*Math.min(u.stats.moveSpeed*DT,Math.max(0,Math.abs(target.x-current)-u.stats.range));
        for(const other of this.units) {
          if(other.hp<=0||other.team!==u.team||other.id===u.id) continue;
          const ahead=(positions.get(other.id)!-current)*dir;
          // Existing side-by-side formations stay together; no unit closes a
          // positive gap through the 60 px barrier.
          if(ahead>=60&&((next-current)*dir)>ahead-60) next=current+dir*Math.max(0,ahead-60);
          else if(ahead>0&&ahead<60) next=current;
        }
        moves.set(u.id,Math.max(30,Math.min(WORLD_WIDTH-30,next)));u.state=next===current?'idle':'walk';
      }
    }
    for(const [id,x] of moves) {const u=this.unit(id)!; if(u.hp>0&&!hardCC(u)) u.x=x;}
  }
  private moveProjectiles():void {
    this.projectiles=this.projectiles.filter(p=>{
      const v=this.unit(p.targetId); if(!v||v.hp<=0) return false;
      const dx=v.x-p.x, dy=v.y-100-p.y, distance=Math.hypot(dx,dy), step=p.speed*DT;
      if(distance<=step) {this.damage(this.unit(p.sourceId),v,p.power,p.damageType,true);return false;}
      p.x+=dx/distance*step;p.y+=dy/distance*step;return true;
    });
  }
  private spawnWave():void {
    this.units=this.allies; this.projectiles=[];
    const partyCenter=this.living('ally').reduce((sum,u)=>sum+u.x,0)/Math.max(1,this.living('ally').length);
    const start=this.wave===0?2100:Math.min(WORLD_WIDTH-850,partyCenter+1450);
    let slot=0;
    for(const spawn of this.stage.waves[this.wave].spawns) for(let i=0;i<spawn.count;i++) {
      const d=getEnemy(spawn.enemyId), scale=spawn.levelScale, stats={...d.stats};
      for(const k of ['hp','atk','def','mres'] as const) stats[k]*=scale;
      const u=this.makeUnit(d.id,d.name,'enemy',slot,d.role,start+slot*68+(this.rng.next()-0.5)*24,GROUND_Y+[-50,65,5][slot%3],stats,d.castSkillId); this.units.push(u);slot++;
    }
    for(const u of this.allies) {u.targetId=undefined;u.casting=undefined;u.state=u.hp>0?'walk':'dead';}
    this.emit({type:'wave',amount:this.wave+1});
  }
  private finish(reason:BattleResult['reason']):void {
    const alive=this.living('ally').length, victory=reason==='victory';
    this.emit({type:'end',amount:victory?1:0});
    this.result={victory,stars:victory?(alive===5?3:alive>=3?2:1):0,ticks:this.tick,seconds:this.tick/TICK_RATE,survivors:alive,wave:this.wave+1,reason,hash:this.eventHash,damage:Object.fromEntries(this.allies.map(u=>[u.defId,Math.round(u.damageDone)]))};
  }
  step():void {
    if(this.result) return;
    this.tick++; this.statuses();
    while(this.inputs.length&&this.inputs[0].tick<=this.tick) {const input=this.inputs.shift()!;if(input.type==='auto') this.auto=input.enabled;else this.cast(input.unitId,input.aim);}
    if(!this.living('ally').length) {this.finish('defeat');return;}
    if(this.intermission>0) {
      this.intermission--; for(const u of this.living('ally')) {if(!hardCC(u)) {u.x=Math.min(WORLD_WIDTH-1200,u.x+u.stats.moveSpeed*DT);u.state='walk';}}
      if(this.intermission===0) {this.wave++;this.spawnWave();}
    } else {
      this.actions();this.moveProjectiles();
      if(!this.living('ally').length) this.finish('defeat');
      else if(!this.living('enemy').length) {
        if(this.wave+1===this.stage.waves.length) this.finish('victory');
        else {this.intermission=180;this.projectiles=[];for(const u of this.allies) {u.casting=undefined;u.targetId=undefined;}}
      }
    }
    if(!this.result&&this.tick>=MAX_TICKS) this.finish('timeout');
  }
  snapshot():string { return JSON.stringify({tick:this.tick,wave:this.wave,rng:this.rng.state,units:this.units,projectiles:this.projectiles,intermission:this.intermission,auto:this.auto,inputs:this.inputs,hash:this.eventHash,result:this.result}); }
  static runHeadless(stageId:number,seed:number,policy:Policy='auto',party=DEFAULT_PARTY):BattleResult {
    const sim=new BattleSim(stageId,seed,party);sim.auto=policy==='auto';
    while(!sim.result) {
      if(policy==='tactical') for(const u of sim.allies) {
        if(!sim.canCast(u)) continue;
        const skill=getSkill(u.skillId!);
        if(skill.heal&&!sim.living('ally').some(v=>v.hp/v.stats.hp<0.65)) continue;
        const control=skill.effects.some(e=>['stun','silence','airborne','knockback'].includes(e.kind));
        if(control&&!sim.enemies.some(v=>v.casting)&&sim.enemies.some(v=>v.hp>0&&v.skillId)) continue;
        const aim=sim.defaultAim(u,true);if(aim) sim.enqueue({type:'cast',tick:sim.tick+1,unitId:u.id,aim});
      }
      sim.step();
    }
    return sim.result;
  }
}
