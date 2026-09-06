import Phaser from 'phaser';
import type {BattleResult} from '../../core/types';
import {getHero,getStage} from '../../core/data';
import {loadProgress,recordResult,saveProgress} from '../../progress';
import {Background} from '../Background';
import {label,panel,button,portrait,C} from '../ui';
export class Result extends Phaser.Scene {
  result?:BattleResult;
  constructor(){super('Result');}
  create(data:{result:BattleResult;stageId:number;party:string[];seed:number}):void {
    const {result:r,stageId,party,seed}=data;this.result=r;
    const saved=saveProgress(recordResult(loadProgress(),stageId,r));
    new Background(this).update(900);this.add.rectangle(960,540,1920,1080,0x091b17,.88);
    label(this,960,105,r.victory?'VICTORY':'TRY AGAIN',25,'#d4b97e').setOrigin(.5).setLetterSpacing(7);
    label(this,960,172,r.victory?'길을 열었습니다':'영웅들은 다시 일어납니다',64).setOrigin(.5).setFontStyle('bold');
    label(this,960,269,`1-${stageId}  ${getStage(stageId).name}`,28,C.muted).setOrigin(.5);
    label(this,960,365,'★'.repeat(r.stars)+'☆'.repeat(3-r.stars),95,r.victory?'#efd38f':'#758775').setOrigin(.5);
    label(this,960,451,`${r.seconds.toFixed(1)}초  ·  ${r.survivors}명 생존  ·  ${r.wave}웨이브`,27).setOrigin(.5);
    panel(this,435,517,1050,309);
    label(this,470,543,'영웅별 가한 피해',25,C.muted);
    const max=Math.max(1,...Object.values(r.damage));
    party.forEach((id,i)=>{const x=488+i*202;portrait(this,x+53,650,id,106);label(this,x+53,727,getHero(id).name,24).setOrigin(.5);this.add.rectangle(x,765,106,7,0x294735).setOrigin(0).setDepth(202);this.add.rectangle(x,765,106*(r.damage[id]??0)/max,7,C.gold).setOrigin(0).setDepth(203);label(this,x+53,793,(r.damage[id]??0).toLocaleString(),21,'#d6c18d').setOrigin(.5);});
    if(!r.victory)label(this,960,870,'적의 시전 바가 보이면 기절·침묵 궁극기로 끊어보세요.',24,C.muted).setOrigin(.5);
    if(!saved)label(this,960,490,'브라우저가 진행도 저장을 허용하지 않았습니다.',21,'#e9ac89').setOrigin(.5);
    button(this,435,933,290,84,'스테이지 목록',()=>this.scene.start('StageSelect',{stageId}));
    button(this,755,933,290,84,'재도전',()=>this.scene.start('Battle',{stageId,party,seed}));
    button(this,1075,933,410,84,r.victory&&stageId<10?'다음 전투  →':r.victory?'챕터 완료  →':'다시 도전  →',()=>r.victory?this.scene.start(stageId<10?'Battle':'StageSelect',{stageId:Math.min(10,stageId+1),party,seed}):this.scene.start('Battle',{stageId,party,seed}),true);
    this.game.events.emit('battle-sfx',r.victory?'victory':'defeat');
  }
}
