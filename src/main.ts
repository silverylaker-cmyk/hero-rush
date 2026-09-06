import Phaser from 'phaser';
import './style.css';
import {Boot} from './render/scenes/Boot';
import {Preload} from './render/scenes/Preload';
import {Battle} from './render/scenes/Battle';
import {StageSelect} from './render/scenes/StageSelect';
import {Result} from './render/scenes/Result';
import {Sound} from './render/Sound';
export const game=new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 1920, height: 1080, backgroundColor: '#101c20', render:{antialias:true,powerPreference:'high-performance'}, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, input:{activePointers:3}, scene: [Boot,Preload,StageSelect,Battle,Result] });
new Sound(game);
// A read-only diagnostics snapshot for automated smoke tests and device reports.
Object.defineProperty(window,'heroRush',{value:Object.freeze({getState:()=>{
  const scene=game.scene.getScenes(true)[0];const b=scene instanceof Battle?scene:undefined;
  return {scene:scene?.scene.key,fps:game.loop.actualFps,selectedStage:scene instanceof StageSelect?scene.selectedStage:undefined,result:scene instanceof Result?scene.result:undefined,battle:b?{tick:b.sim.tick,wave:b.sim.wave,auto:b.sim.auto,paused:b.paused,speed:b.speed,aiming:b.aim.active,scrollX:b.cameras.main.scrollX,units:b.sim.units.map(u=>({id:u.id,defId:u.defId,team:u.team,x:u.x,y:u.y,hp:u.hp,energy:u.energy,casting:!!u.casting}))}:undefined};
}})});
document.addEventListener('pointerdown',()=>{const orientation=screen.orientation as ScreenOrientation&{lock?:(value:string)=>Promise<void>};void orientation.lock?.('landscape').catch(()=>{});},{once:true});
if (import.meta.env.PROD && 'serviceWorker' in navigator) window.addEventListener('load', () => { void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`); });
