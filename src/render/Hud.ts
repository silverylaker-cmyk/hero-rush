import Phaser from 'phaser';
import type { BattleSim } from '../core/sim';
import { getHero,getSkill } from '../core/data';
import { button,label,panel,portrait,C } from './ui';
import type { AimOverlay } from './AimOverlay';
export class Hud {
  wave:Phaser.GameObjects.Text;auto:ReturnType<typeof button>;speed:ReturnType<typeof button>;
  private cards:{bar:Phaser.GameObjects.Graphics;text:Phaser.GameObjects.Text;bg:Phaser.GameObjects.Rectangle}[]=[];
  constructor(private scene:Phaser.Scene,private sim:BattleSim,aim:AimOverlay,onSpeed:()=>void,onPause:()=>void,onSound:()=>void) {
    panel(scene,32,26,1856,74,C.ink,.93);
    label(scene,64,45,'HERO RUSH',29,'#e9c17c');this.wave=label(scene,320,48,'',26);
    this.auto=button(scene,1320,37,150,54,'AUTO OFF',()=>sim.enqueue({tick:sim.tick+1,type:'auto',enabled:!sim.auto}));
    this.speed=button(scene,1484,37,100,54,'×1',onSpeed);
    const sound=button(scene,1598,37,110,54,scene.registry.get('muted')?'소리 OFF':'소리 ON',()=>{onSound();sound.text.setText(scene.registry.get('muted')?'소리 OFF':'소리 ON');});sound.text.setFontSize(21);button(scene,1722,37,135,54,'일시정지',onPause);
    panel(scene,466,887,988,189,C.ink,.96);
    sim.allies.forEach((u,i)=>{
      const x=512+i*184,def=getHero(u.defId);
      const bg=scene.add.rectangle(x+80,980,160,160,0x213a36).setStrokeStyle(2,0x49615a).setScrollFactor(0).setDepth(200).setInteractive({useHandCursor:true});
      portrait(scene,x+80,952,u.defId,112);
      label(scene,x+12,906,String(i+1),17,C.muted);label(scene,x+80,1010,def.name,24).setOrigin(.5);
      const text=label(scene,x+80,1041,'',20,'#e9c17c').setOrigin(.5);
      const bar=scene.add.graphics().setScrollFactor(0).setDepth(203);this.cards.push({bar,text,bg});
      bg.on('pointerdown',(p:Phaser.Input.Pointer)=>aim.begin(u,p));
    });
    label(scene,65,1000,'궁극기 준비 후\n누르기 → 조준 → 놓기',24,C.muted).setLineSpacing(6);
    label(scene,1610,1000,'아래로 드래그하면 취소',22,C.muted);
  }
  update(speed:number,paused:boolean):void {
    this.wave.setText(`1-${this.sim.stage.id}  /  ${this.sim.stage.name}       WAVE  ${this.sim.wave+1} / ${this.sim.stage.waves.length}`);
    this.auto.text.setText(this.sim.auto?'AUTO ON':'AUTO OFF').setColor(this.sim.auto?'#e9c17c':C.cream);this.speed.text.setText(`×${speed}`);
    this.cards.forEach((c,i)=>{const u=this.sim.allies[i],x=512+i*184;c.bar.clear();c.bar.fillStyle(0x0a211a).fillRect(x+10,1064,140,5);c.bar.fillStyle(0xe9c17c).fillRect(x+10,1064,140*u.energy/100,5);const ready=this.sim.canCast(u);c.text.setText(u.hp<=0?'전투 불능':ready?'조준하기':`${Math.floor(u.energy)}%`);c.bg.setStrokeStyle(ready?4:2,ready?0xf4d796:0x49615a,ready?.75+.25*Math.sin(this.sim.tick*.08):1).setAlpha(u.hp>0?1:.35);if(paused)c.text.setAlpha(.45);else c.text.setAlpha(1);});
  }
}
