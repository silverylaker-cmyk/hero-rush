import Phaser from 'phaser';
// Native canvas scenery: three individually tiled layers, no battle-state writes.
export class Background {
  layers:Phaser.GameObjects.TileSprite[]=[];
  constructor(scene:Phaser.Scene) {
    for(let layer=0;layer<3;layer++) {
      const key=`marsh-${layer}`;
      if(!scene.textures.exists(key)) {
        const tex=scene.textures.createCanvas(key,3840,1080)!;const c=tex.context;
        if(layer===0) {
          const grad=c.createLinearGradient(0,0,0,1080);grad.addColorStop(0,'#142e34');grad.addColorStop(.55,'#668a78');grad.addColorStop(1,'#34544c');c.fillStyle=grad;c.fillRect(0,0,3840,1080);
          const glow=c.createRadialGradient(1100,280,15,1100,280,510);glow.addColorStop(0,'#e4ce9577');glow.addColorStop(1,'#e4ce9500');c.fillStyle=glow;c.fillRect(0,0,1900,900);
          c.fillStyle='#ecd9a866';c.beginPath();c.arc(1100,280,76,0,Math.PI*2);c.fill();
          for(let i=0;i<38;i++){const x=i*107,y=440+Math.sin(i*7)*95;c.fillStyle='#264b4866';c.beginPath();c.moveTo(x-180,730);c.lineTo(x,y-130);c.lineTo(x+170,730);c.fill();}
        }
        if(layer===1) {
          for(let i=0;i<18;i++) {
            const x=i*235+Math.sin(i*9)*35, h=260+Math.sin(i*4)*90;
            c.fillStyle=i%2?'#28493f':'#355648';c.fillRect(x,670-h,25,h+60);
            for(let j=0;j<4;j++){c.beginPath();c.ellipse(x+12+Math.sin(j*9)*65,650-h-j*38,90-j*6,64,0,0,Math.PI*2);c.fill();}
          }
          // Crumbling arch and standing stones establish a readable landmark.
          for(const x of [1420,3040]) {c.fillStyle='#536858';c.fillRect(x,410,90,270);c.fillRect(x+245,440,75,240);c.beginPath();c.arc(x+163,445,162,Math.PI,Math.PI*2);c.arc(x+163,445,86,Math.PI*2,Math.PI,true);c.fill();c.fillStyle='#69806a';c.fillRect(x+10,425,68,15);c.fillStyle='#2d4f40';c.fillRect(x+38,470,7,96);}
          const fog=c.createLinearGradient(0,550,0,780);fog.addColorStop(0,'#a4c8ae00');fog.addColorStop(.8,'#aac7aa44');fog.addColorStop(1,'#a4c8ae00');c.fillStyle=fog;c.fillRect(0,550,3840,240);
        }
        if(layer===2) {
          c.fillStyle='#365447';c.beginPath();c.moveTo(0,745);for(let x=0;x<=3840;x+=60)c.lineTo(x,725+Math.sin(x*.007)*18);c.lineTo(3840,1080);c.lineTo(0,1080);c.fill();
          const road=c.createLinearGradient(0,730,0,1040);road.addColorStop(0,'#79836a');road.addColorStop(.25,'#a09472');road.addColorStop(.8,'#6c7055');road.addColorStop(1,'#253e33');c.fillStyle=road;c.beginPath();c.moveTo(0,760);for(let x=0;x<=3840;x+=60)c.lineTo(x,752+Math.sin(x*.004)*15);c.lineTo(3840,1020);c.lineTo(0,1020);c.fill();
          for(let i=0;i<110;i++){const x=(i*137)%3840,y=772+(i*53)%210;c.fillStyle=i%2?'#c3b99133':'#34463833';c.beginPath();c.ellipse(x,y,5+(i%5)*4,2+i%3,0,0,7);c.fill();}
          for(let i=0;i<65;i++){const x=i*62;c.strokeStyle=i%2?'#294b3b':'#496b47';c.lineWidth=5;for(let j=0;j<3;j++){c.beginPath();c.moveTo(x,1015);c.quadraticCurveTo(x+(j-1)*15,967,x+(j-1)*28,952-(i%4)*12);c.stroke();}}
          for(let i=0;i<22;i++){const x=i*179+15;c.fillStyle='#314e41';c.beginPath();c.ellipse(x,736,44,13,0,0,7);c.fill();c.fillStyle='#6d8560';c.beginPath();c.ellipse(x-10,731,15,4,-.2,0,7);c.fill();}
        }
        tex.refresh();
      }
      this.layers.push(scene.add.tileSprite(0,0,1920,1080,key).setOrigin(0).setScrollFactor(0).setDepth(layer-10));
    }
  }
  update(scroll:number):void {this.layers.forEach((v,i)=>v.tilePositionX=scroll*[.1,.4,1][i]);}
}
