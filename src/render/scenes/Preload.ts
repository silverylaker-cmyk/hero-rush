import Phaser from 'phaser';
import {label,C} from '../ui';
export class Preload extends Phaser.Scene {
  constructor(){super('Preload');}
  preload():void {
    label(this,960,435,'HERO RUSH',100,'#e9c17c').setOrigin(.5);label(this,960,555,'당신의 한 수가 전투를 바꾼다',28,C.muted).setOrigin(.5);
    const bar=this.add.graphics();this.load.on('progress',(p:number)=>{bar.clear().fillStyle(0x29483e).fillRoundedRect(660,640,600,7,4).fillStyle(C.gold).fillRoundedRect(660,640,Math.max(7,600*p),7,4);});
    // Key art is optional: deployment remains playable while artists replace it.
    this.load.atlas('units',`${import.meta.env.BASE_URL}assets/units/atlas.png`,`${import.meta.env.BASE_URL}assets/units/atlas.json`);
  }
  create():void {this.scene.start(this.scene.manager.keys.StageSelect?'StageSelect':'Battle');}
}
