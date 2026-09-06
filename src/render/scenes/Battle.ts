import Phaser from 'phaser';
import {BattleSim,DT} from '../../core/sim';
import {DEFAULT_PARTY} from '../../core/data';
import {UnitView} from '../UnitView';
import {AimOverlay} from '../AimOverlay';
import {Hud} from '../Hud';
import {Effects} from '../vfx/Effects';
import {Background} from '../Background';
import {button,label,panel} from '../ui';
export class Battle extends Phaser.Scene {
  sim!:BattleSim;speed=1;paused=false;aim!:AimOverlay;
  private accumulator=0;private lastEvent=0;private views=new Map<string,UnitView>();private background!:Background;private hud!:Hud;private effects!:Effects;private projectiles!:Phaser.GameObjects.Graphics;private pauseItems:Phaser.GameObjects.GameObject[]=[];private ending=false;private tutorial!:Phaser.GameObjects.Text;private tutorialShown=false;
  constructor(){super('Battle');}
  create(data:{stageId?:number;party?:string[];seed?:number}={}):void {
    this.sim=new BattleSim(data.stageId??1,data.seed??1,data.party??DEFAULT_PARTY);this.speed=1;this.paused=false;this.accumulator=0;this.lastEvent=0;this.views=new Map();this.ending=false;this.tutorialShown=false;
    this.cameras.main.setBounds(0,0,5760,1080).setScroll(0,0);this.background=new Background(this);
    this.effects=new Effects(this);this.aim=new AimOverlay(this,this.sim,()=>this.tutorial.setText(''));
    this.hud=new Hud(this,this.sim,this.aim,()=>this.speed=this.speed===1?2:1,()=>this.togglePause(),()=>this.game.events.emit('toggle-sound'));
    this.projectiles=this.add.graphics().setDepth(140);this.tutorial=label(this,960,820,'',28,'#fff0c8').setOrigin(.5).setDepth(220);
    this.input.keyboard?.on('keydown-SPACE',()=>this.togglePause());
    this.game.events.on('blur',this.blur,this);
    const cancel=()=>{this.aim.abort();this.paused=true;this.togglePause(false);};
    this.game.canvas.addEventListener('touchcancel',cancel);
    this.events.once('shutdown',()=>{this.game.events.off('blur',this.blur,this);this.game.canvas.removeEventListener('touchcancel',cancel);this.aim.abort();});
  }
  private blur():void {if(!this.paused&&!this.ending)this.togglePause();}
  togglePause(toggle=true):void {
    if(this.ending)return;if(toggle)this.paused=!this.paused;this.aim.abort();
    for(const item of this.pauseItems)item.destroy();this.pauseItems=[];
    if(!this.paused)return;
    const before=new Set(this.children.list);
    this.add.rectangle(960,540,1920,1080,0x061310,.7).setScrollFactor(0).setDepth(300).setInteractive();
    panel(this,610,300,700,440).setDepth(301);label(this,960,365,'잠시 숨을 고르세요',42).setOrigin(.5).setDepth(302);
    const resume=button(this,730,475,460,80,'전투 계속',()=>this.togglePause(),true);resume.bg.setDepth(303);resume.text.setDepth(304);
    const quit=button(this,730,595,460,70,'포기하고 목록으로',()=>this.scene.start(this.scene.manager.keys.StageSelect?'StageSelect':'Battle'));quit.bg.setDepth(303);quit.text.setDepth(304);
    this.pauseItems=this.children.list.filter(v=>!before.has(v));
  }
  update(_time:number,delta:number):void {
    if(!this.sim)return;
    if(!this.paused&&!this.ending){this.accumulator+=Math.min(delta/1000,.1)*(this.aim.active?.25:this.speed);while(this.accumulator>=DT&&!this.sim.result){this.sim.step();this.accumulator-=DT;}}
    for(const u of this.sim.units){if(!this.views.has(u.id))this.views.set(u.id,new UnitView(this,u));this.views.get(u.id)!.update(this.sim.tick);}
    for(const [id,v] of this.views)if(!this.sim.unit(id)){v.destroy();this.views.delete(id);}
    const alive=this.sim.living('ally'),center=alive.reduce((s,u)=>s+u.x,0)/Math.max(1,alive.length);
    const camera=this.cameras.main;camera.scrollX=Math.min(3840,Math.max(camera.scrollX,center-710));this.background.update(camera.scrollX);
    for(const e of this.sim.events){if(e.seq<=this.lastEvent)continue;this.lastEvent=e.seq;this.effects.event(e);this.game.events.emit('battle-sfx',e.type);if(e.type==='wave'&&e.amount!>1)this.tutorial.setText('웨이브 돌파 · 다음 전투로 진격합니다');}
    const g=this.projectiles;g.clear();for(const p of this.sim.projectiles)g.fillStyle(p.damageType==='magic'?0xf5bc75:0xe1eab4).fillCircle(p.x,p.y,7).lineStyle(3,0xfaf0b8,.4).lineBetween(p.x-30,p.y,p.x,p.y);
    this.hud.update(this.speed,this.paused);this.tutorial.setVisible(!this.aim.active);if(this.aim.active)this.aim.draw();
    if(!this.tutorialShown&&this.sim.allies.some(u=>this.sim.canCast(u))&&!this.sim.auto){this.tutorial.setText('궁극기가 준비됐습니다!  아래 초상화를 누른 채 적에게 드래그하세요.');this.tutorialShown=true;}
    if(this.sim.intermission>0)this.tutorial.setText(`웨이브 돌파!  다음 전투까지 ${Math.ceil(this.sim.intermission/60)}`);
    if(this.sim.result&&!this.ending){this.ending=true;this.aim.abort();this.time.delayedCall(1000,()=>{if(this.scene.manager.keys.Result)this.scene.start('Result',{result:this.sim.result,stageId:this.sim.stage.id,party:this.sim.party,seed:this.sim.seed});else {label(this,960,400,this.sim.result!.victory?'승리!':'다시 도전하세요',80).setOrigin(.5);button(this,760,580,400,90,'재도전',()=>this.scene.restart(),true);}});}
  }
}
