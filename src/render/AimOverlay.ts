import Phaser from 'phaser';
import type { Aim, Unit } from '../core/types';
import { getSkill } from '../core/data';
import type { BattleSim } from '../core/sim';
import { label } from './ui';
export class AimOverlay {
  active=false; unit?:Unit; aim?:Aim; valid=false; cancel=false;
  private graphics:Phaser.GameObjects.Graphics;private hint:Phaser.GameObjects.Text;private pointerId=-1;
  constructor(private scene:Phaser.Scene,private sim:BattleSim,private onRelease:()=>void) {
    this.graphics=scene.add.graphics().setDepth(180);
    this.hint=label(scene,960,180,'',32,'#ffe3a0').setOrigin(.5).setDepth(230);
    scene.input.on('pointermove',this.move,this);scene.input.on('pointerup',this.release,this);scene.input.on('pointerupoutside',this.abort,this);
    scene.input.on('gameout',this.abort,this);
    scene.events.once('shutdown',()=>{scene.input.off('pointermove',this.move,this);scene.input.off('pointerup',this.release,this);scene.input.off('pointerupoutside',this.abort,this);scene.input.off('gameout',this.abort,this);});
  }
  begin(unit:Unit,p:Phaser.Input.Pointer):void {
    if(this.active||!this.sim.canCast(unit))return;
    if(this.sim.auto)this.sim.enqueue({tick:this.sim.tick+1,type:'auto',enabled:false});
    this.unit=unit;this.active=true;this.pointerId=p.id;this.aim=this.sim.defaultAim(unit);this.valid=!!this.aim;this.cancel=false;this.draw();
  }
  private move(p:Phaser.Input.Pointer):void {
    if(!this.active||p.id!==this.pointerId||!this.unit)return;
    const s=getSkill(this.unit.skillId!),point=this.scene.cameras.main.getWorldPoint(p.x,p.y);
    this.cancel=p.y>1065;
    if(s.aimType==='target_ally'||s.aimType==='target_enemy') {
      const team=s.aimType==='target_ally'?'ally':'enemy';
      const target=this.sim.living(team).filter(v=>Math.abs(point.x-v.x)<150*1.4&&point.y>=v.y-300*1.4&&point.y<=v.y+50).sort((a,b)=>Math.hypot(a.x-point.x,a.y-110-point.y)-Math.hypot(b.x-point.x,b.y-110-point.y))[0];
      this.aim=target?{x:target.x,y:target.y,targetId:target.id}:undefined;
    } else if(s.aimType==='ground_point') this.aim={x:point.x,y:Math.max(500,Math.min(940,point.y))};
    else if(s.aimType==='direction') {const angle=Phaser.Math.Clamp(Math.atan2(point.y-(this.unit.y-100),point.x-this.unit.x),-Math.PI/6,Math.PI/6);this.aim={x:this.unit.x+Math.cos(angle)*s.range,y:this.unit.y+Math.sin(angle)*s.range,angle};}
    else this.aim={x:this.unit.x,y:this.unit.y};
    this.valid=!!this.aim&&this.sim.validAim(this.unit,this.aim)&&!this.cancel;this.draw();
  }
  draw():void {
    const g=this.graphics;g.clear();if(!this.active||!this.unit)return;
    const s=getSkill(this.unit.skillId!),color=this.valid?0xe8d599:0xe08479;
    this.hint.setText(`${s.name}  ·  ${this.cancel?'놓으면 취소':'드래그하여 조준 · 놓아서 시전'}  /  ¼ SPEED`);
    const screenX=this.scene.cameras.main.scrollX;
    g.fillStyle(0x091514,.3).fillRect(screenX,80,1920,930);
    g.fillStyle(0x8e3a34,.65).fillRect(screenX,1065,1920,15);
    if(s.aimType==='target_ally'||s.aimType==='target_enemy') for(const v of this.sim.living(s.aimType==='target_ally'?'ally':'enemy')) g.lineStyle(this.aim?.targetId===v.id?6:2,color,this.aim?.targetId===v.id?1:.3).strokeEllipse(v.x,v.y,160,45);
    if(!this.aim)return;
    if(s.aimType==='ground_point') {
      g.fillStyle(color,.18).fillEllipse(this.aim.x,820,(s.radius??200)*2,170).lineStyle(4,color,.9).strokeEllipse(this.aim.x,820,(s.radius??200)*2,170);
      g.lineStyle(2,color,.8).lineBetween(this.aim.x-26,820,this.aim.x+26,820).lineBetween(this.aim.x,802,this.aim.x,838);
      for(const v of this.sim.living('enemy')) if(Math.abs(v.x-this.aim.x)<=(s.radius??0))g.lineStyle(4,color,.9).strokeRoundedRect(v.x-80,v.y-225,160,235,20);
    } else if(s.aimType==='direction') {
      const a=this.aim.angle??0,x=this.unit.x,y=this.unit.y-100,range=s.range,w=s.width??80,dx=Math.cos(a),dy=Math.sin(a);
      const points=[new Phaser.Geom.Point(x-dy*w/2,y+dx*w/2),new Phaser.Geom.Point(x+dx*range-dy*w/2,y+dy*range+dx*w/2),new Phaser.Geom.Point(x+dx*range+dy*w/2,y+dy*range-dx*w/2),new Phaser.Geom.Point(x+dy*w/2,y-dx*w/2)];
      g.fillStyle(color,.17).fillPoints(points,true).lineStyle(3,color,.9).strokePoints(points,true);g.lineBetween(x,y,x+dx*range,y+dy*range);
    }
  }
  private release(p:Phaser.Input.Pointer):void {if(!this.active||p.id!==this.pointerId)return;if(this.valid&&this.aim&&this.unit&&!this.cancel)this.sim.enqueue({tick:this.sim.tick+1,type:'cast',unitId:this.unit.id,aim:this.aim});this.abort();this.onRelease();}
  abort():void {this.active=false;this.unit=undefined;this.aim=undefined;this.graphics.clear();this.hint.setText('');}
}
