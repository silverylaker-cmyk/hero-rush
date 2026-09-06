import Phaser from 'phaser';
import {heroes,stages,getStage} from '../../core/data';
import {loadProgress,saveProgress,unlocked,type Progress} from '../../progress';
import {Background} from '../Background';
import {label,panel,button,portrait,C} from '../ui';
export class StageSelect extends Phaser.Scene {
  selectedStage=1;party:string[]=[];
  private progress!:Progress;private stageCards:{bg:Phaser.GameObjects.Rectangle;number:Phaser.GameObjects.Text}[]=[];private partyCards:{bg:Phaser.GameObjects.Rectangle;check:Phaser.GameObjects.Text}[]=[];private stageTitle!:Phaser.GameObjects.Text;private launch!:ReturnType<typeof button>;private notice!:Phaser.GameObjects.Text;
  constructor(){super('StageSelect');}
  create(data:{stageId?:number}={}):void {
    this.progress=loadProgress();this.party=[...this.progress.party];this.selectedStage=data.stageId&&unlocked(this.progress,data.stageId)?data.stageId:Math.min(10,stages.filter(s=>unlocked(this.progress,s.id)).at(-1)?.id??1);this.stageCards=[];this.partyCards=[];
    this.cameras.main.setScroll(0,0);new Background(this).update(180);
    this.add.rectangle(960,540,1920,1080,0x0a1b19,.83);
    label(this,65,46,'HERO RUSH',42,'#e9c17c').setFontStyle('bold');label(this,350,63,'당신의 한 수가 전투를 바꾼다',22,C.muted);
    label(this,1790,59,`${Object.values(this.progress.stars).reduce((a,b)=>a+b,0)} / 30  ★`,26,'#e9c17c').setOrigin(1,0);
    label(this,76,173,'CHAPTER 01  /  CAMPAIGN',22,'#d0b882').setLetterSpacing(4);
    label(this,73,235,'고블린 늪지',76).setFontStyle('bold');
    label(this,78,345,'다섯 영웅, 하나의 모험.\n안개 속 적의 주문을 끊고 길을 열어라.',28,'#bac7ba').setLineSpacing(10);
    this.add.ellipse(340,772,400,44,0x000000,.28);
    if(this.textures.exists('units')) {
      this.add.image(325,785,'units','ironwall').setOrigin(.5,1).setDisplaySize(385,385);
      this.add.image(500,790,'units','ember').setOrigin(.5,1).setDisplaySize(310,310).setAlpha(.95);
    }
    label(this,736,180,'원정 경로',32).setFontStyle('bold');label(this,1804,192,'이전 전투를 클리어하면 다음 길이 열립니다',21,C.muted).setOrigin(1,0);
    for(const [i,stage] of stages.entries()) {
      const x=736+i%5*218,y=250+Math.floor(i/5)*237,isOpen=unlocked(this.progress,stage.id),stars=this.progress.stars[stage.id]??0;
      const bg=this.add.rectangle(x,y,198,214,isOpen?0x263f38:0x152a27,.97).setOrigin(0).setStrokeStyle(2,isOpen?0x6b7760:0x30453d).setDepth(190).setInteractive({useHandCursor:isOpen});
      const num=label(this,x+22,y+18,String(stage.id).padStart(2,'0'),45,isOpen?'#ecd3a1':'#6b7d70').setFontStyle('bold');
      label(this,x+22,y+88,stage.name.replace(' ','\n'),23,isOpen?C.cream:'#829186').setLineSpacing(6);
      label(this,x+22,y+175,isOpen?(stars?'★'.repeat(stars)+'☆'.repeat(3-stars):`${stage.waves.length} WAVES`):'잠김',20,isOpen?'#d9ba78':'#718376');
      this.stageCards.push({bg,number:num});bg.on('pointerup',()=>{if(isOpen){this.selectedStage=stage.id;this.refresh();}});
    }
    panel(this,64,823,1185,231,0x122820,.96);label(this,84,787,'출전 영웅',27);this.notice=label(this,285,792,'6명 중 5명을 선택하세요',21,C.muted);
    heroes.forEach((hero,i)=>{
      const x=84+i*193,bg=this.add.rectangle(x,846,170,187,0x244237).setOrigin(0).setStrokeStyle(2,0x55745b).setScrollFactor(0).setDepth(200).setInteractive({useHandCursor:true});
      portrait(this,x+85,910,hero.id,112);label(this,x+85,976,hero.name,25).setOrigin(.5);label(this,x+85,1010,hero.title,18,C.muted).setOrigin(.5);
      const check=label(this,x+143,861,'✓',22,'#e9c17c').setOrigin(.5);
      this.partyCards.push({bg,check});bg.on('pointerup',()=>{if(this.party.includes(hero.id))this.party=this.party.filter(id=>id!==hero.id);else if(this.party.length<5)this.party.push(hero.id);else {this.notice.setText('한 명을 먼저 해제한 뒤 교체하세요');return;}this.refresh();});
    });
    this.stageTitle=label(this,1330,820,'',31);label(this,1330,867,'궁극기는 기본 수동 · 드래그해서 조준',21,C.muted);
    this.launch=button(this,1325,925,480,102,'전투 시작  →',()=>{if(this.party.length!==5)return;this.progress.party=[...this.party];saveProgress(this.progress);this.scene.start('Battle',{stageId:this.selectedStage,party:this.party,seed:1});},true);
    this.refresh();
  }
  private refresh():void {
    this.stageCards.forEach((c,i)=>{const selected=i+1===this.selectedStage;c.bg.setStrokeStyle(selected?4:2,selected?C.gold:0x405b4b);c.bg.setFillStyle(selected?0x445444:unlocked(this.progress,i+1)?0x263f38:0x152a27);});
    this.partyCards.forEach((c,i)=>{const selected=this.party.includes(heroes[i].id);c.bg.setAlpha(selected?1:.35);c.check.setText(selected?'✓':'＋');c.bg.setStrokeStyle(selected?3:1,selected?0xc2b575:0x55745b);});
    this.notice.setText(`${this.party.length} / 5 선택됨  ·  탭해서 영웅 교체`);this.stageTitle.setText(`1-${this.selectedStage}  ${getStage(this.selectedStage).name}`);this.launch.bg.setAlpha(this.party.length===5?1:.4);this.launch.text.setText(this.party.length===5?'전투 시작  →':'영웅 5명을 선택하세요');
  }
}
