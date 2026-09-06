import Phaser from 'phaser';
import type { BattleEvent } from '../../core/types';
import { getSkill } from '../../core/data';
import { FONT } from '../ui';
export class Effects {
  constructor(private scene:Phaser.Scene){}
  event(e:BattleEvent):void {
    const s=this.scene;
    if(e.type==='damage'||e.type==='heal'||e.type==='interrupt') {
      const str=e.type==='interrupt'?'INTERRUPT!':e.type==='heal'?`+${e.amount}`:`${e.amount}`;
      const text=s.add.text(e.x??0,(e.y??820)-240,str,{fontFamily:FONT,fontSize:e.type==='interrupt'?36:30,color:e.type==='heal'?'#b9f1c5':e.type==='interrupt'?'#ffe1a6':'#fff4d9',stroke:'#21342d',strokeThickness:5,fontStyle:'bold'}).setOrigin(.5).setDepth(150);
      s.tweens.add({targets:text,y:text.y-70,alpha:0,duration:800,onComplete:()=>text.destroy()});
    }
    if(e.type==='skill') {
      const skill=getSkill(e.skillId!),color=Phaser.Display.Color.HexStringToColor(skill.color).color;
      const x=e.toX??e.x??0,y=e.toY??e.y??820;const g=s.add.graphics().setDepth(145);
      if(skill.aimType==='ground_point'){g.fillStyle(color,.22).fillEllipse(x,820,(skill.radius??200)*2,160).lineStyle(8,color,.9).strokeEllipse(x,820,(skill.radius??200)*2,160);for(let i=0;i<12;i++)g.fillStyle(color,.65).fillTriangle(x-220+i*40,820,x-195+i*40,820,x-205+i*40,680-(i%3)*35);}
      else if(skill.aimType==='direction'){const toX=e.toX??(e.x??0)-650,toY=e.toY??e.y??820;g.lineStyle(skill.width??80,color,.22).lineBetween(e.x??0,(e.y??820)-100,toX,toY-100).lineStyle(10,0xfff3d7,.95).lineBetween(e.x??0,(e.y??820)-100,toX,toY-100);}
      else {g.lineStyle(8,color,.95).strokeEllipse(x,y-100,200,280);g.fillStyle(color,.15).fillEllipse(x,y-100,200,280);}
      s.tweens.add({targets:g,alpha:0,duration:650,onComplete:()=>g.destroy()});s.cameras.main.shake(120,.002);s.cameras.main.flash(100,255,242,213,false,undefined,undefined);s.cameras.main.flashEffect.alpha=.05;
      for(let i=0;i<14;i++){const a=i*Math.PI*2/14,p=s.add.circle(x,y-100,4+i%3,color).setDepth(147);s.tweens.add({targets:p,x:x+Math.cos(a)*200,y:y-100+Math.sin(a)*120,alpha:0,duration:500+i*15,onComplete:()=>p.destroy()});}
    }
  }
}
