import Phaser from 'phaser';
import { getEnemy,getHero } from '../core/data';
import type { Unit } from '../core/types';
import { FONT } from './ui';
export class UnitView {
  root:Phaser.GameObjects.Container;
  body:Phaser.GameObjects.Image|Phaser.GameObjects.Container;
  bars:Phaser.GameObjects.Graphics;
  shadow:Phaser.GameObjects.Ellipse;
  status:Phaser.GameObjects.Text;
  size:number; private baseX=1;private baseY=1;
  constructor(private scene:Phaser.Scene,public unit:Unit) {
    const u=unit,def=u.team==='ally'?getHero(u.defId):getEnemy(u.defId);
    this.size=u.boss?290:u.role==='tank'?245:220;
    this.shadow=scene.add.ellipse(0,0,this.size*.55,22,0x0b241d,.32);
    if(scene.textures.exists('units')&&scene.textures.get('units').has(def.art.key)) {
      const im=scene.add.image(0,0,'units',def.art.key).setOrigin(.5,def.art.anchorY);
      im.setDisplaySize(this.size*def.art.scale,this.size*def.art.scale);this.body=im;this.baseX=im.scaleX;this.baseY=im.scaleY;
    } else {
      const box=scene.add.rectangle(0,-this.size/2,this.size*.55,this.size,u.team==='ally'?0x6cabb9:0xab6363).setStrokeStyle(4,0x26372f);
      const letter=scene.add.text(0,-this.size*.6,u.role[0].toUpperCase(),{fontFamily:FONT,fontSize:70}).setOrigin(.5);this.body=scene.add.container(0,0,[box,letter]);
    }
    this.bars=scene.add.graphics();this.status=scene.add.text(0,-this.size-62,'',{fontFamily:FONT,fontSize:21,color:'#ffdd9c',stroke:'#152920',strokeThickness:5}).setOrigin(.5);
    this.root=scene.add.container(u.x,u.y,[this.shadow,this.body,this.bars,this.status]);
  }
  update(t:number):void {
    const u=this.unit,age=(t-u.actionTick)/60,deadAge=(t-u.deathTick)/60,dir=u.team==='ally'?1:-1;
    this.root.setPosition(u.x,u.y).setDepth(u.y/10);
    let bob=Math.sin(t/60*Math.PI*2/1.2)*4,offset=0,rotation=0,sx=1,sy=1;
    if(u.state==='walk'){bob=Math.sin(t/60*Math.PI*2/.35)*6;rotation=Math.sin(t/60*Math.PI*2/.35)*.14;}
    if(u.state==='attack'&&age<.32){const p=age<.12?age/.12:1-(age-.12)/.2;offset=dir*p*(u.stats.range>200?-15:60);sx=1+p*.15;sy=1-p*.07;}
    if(u.state==='cast'&&age<.5)bob=-Math.sin(age/.5*Math.PI)*20;
    if(u.statuses.some(v=>v.kind==='airborne'))bob-=55;
    if(t-u.lastHitTick<4)offset+=Math.sin(t*2)*6;
    if(u.hp<=0){this.root.setAlpha(Math.max(0,1-deadAge/.5));rotation=-.44*Math.min(1,deadAge/.5);bob=40*Math.min(1,deadAge/.5);}
    else this.root.setAlpha(1);
    this.body.setPosition(offset,bob).setRotation(rotation).setScale(this.baseX*sx,this.baseY*sy);
    if(this.body instanceof Phaser.GameObjects.Image){if(t-u.lastHitTick<4)this.body.setTintFill(0xffffff);else this.body.clearTint();}
    const g=this.bars;g.clear();if(u.hp<=0){this.status.setText('');return;}
    const w=110,y=-this.size-24;
    g.fillStyle(0x0d211d,.95).fillRoundedRect(-w/2-3,y-3,w+6,21,4);
    g.fillStyle(u.team==='ally'?0x86d6ac:0xe39880).fillRect(-w/2,y,w*u.hp/u.stats.hp,8);
    g.fillStyle(0xf0cb73).fillRect(-w/2,y+11,w*u.energy/100,4);
    const shield=u.statuses.find(v=>v.kind==='shield');if(shield)g.lineStyle(3,0xf6dfaa,.6+.2*Math.sin(t*.08)).strokeEllipse(0,-this.size*.45,this.size*.8,this.size);
    if(u.casting){g.fillStyle(0x2d1834).fillRect(-80,y-34,160,12);g.fillStyle(0xe4aed8).fillRect(-80,y-34,160*(1-u.casting.remaining/u.casting.total),12);}
    const status=u.casting?'시전 중 · 끊으세요!':u.statuses.map(v=>({stun:'기절',silence:'침묵',airborne:'공중',dot:'화상',shield:'보호막',atk_up:'공격↑',def_down:'방어↓',knockback:''}[v.kind])).join(' · ');
    this.status.setText(status);
  }
  destroy():void {this.root.destroy();}
}
