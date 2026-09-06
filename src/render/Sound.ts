import type Phaser from 'phaser';
// Six original synthesized cues: no downloaded audio, no BGM or external license.
export class Sound {
  private context?:AudioContext;private lastHit=0;muted=false;
  constructor(game:Phaser.Game) {
    document.addEventListener('pointerdown',()=>{try{this.context??=new AudioContext();void this.context.resume();}catch{/* Audio is optional on restricted browsers. */}},{once:true});
    game.events.on('toggle-sound',()=>{this.muted=!this.muted;game.registry.set('muted',this.muted);});
    game.events.on('battle-sfx',(kind:string)=>this.play(kind));
  }
  private tone(frequency:number,delay:number,duration:number,type:OscillatorType='sine',gain=.075,end?:number):void {
    const c=this.context;if(!c)return;const t=c.currentTime+delay,osc=c.createOscillator(),vol=c.createGain();
    osc.type=type;osc.frequency.setValueAtTime(frequency,t);if(end)osc.frequency.exponentialRampToValueAtTime(end,t+duration);
    vol.gain.setValueAtTime(.0001,t);vol.gain.exponentialRampToValueAtTime(gain,t+.008);vol.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(vol);vol.connect(c.destination);osc.start(t);osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();vol.disconnect();};
  }
  play(kind:string):void {
    if(this.muted||!this.context||this.context.state!=='running')return;
    if(kind==='damage'){if(this.context.currentTime-this.lastHit<.085)return;this.lastHit=this.context.currentTime;this.tone(140,0,.065,'triangle',.045,45);}
    if(kind==='attack')this.tone(700,0,.06,'sine',.018,220);
    if(kind==='skill'){this.tone(220,0,.3,'triangle',.1,880);this.tone(660,.06,.4,'sine',.07);}
    if(kind==='interrupt'){this.tone(990,0,.14,'square',.045);this.tone(1480,.11,.22,'triangle',.08);}
    if(kind==='victory')[440,554,659,880].forEach((v,i)=>this.tone(v,i*.13,.5,'triangle',.07));
    if(kind==='defeat')[330,294,220].forEach((v,i)=>this.tone(v,i*.2,.55,'triangle',.06));
  }
}
