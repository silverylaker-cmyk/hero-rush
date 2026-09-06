import Phaser from 'phaser';
export const FONT="'Trebuchet MS', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
export const C={ink:0x101d20,panel:0x172b2e,line:0x49615a,gold:0xe9c17c,cream:'#f6eddc',muted:'#a4b5aa'};
export function label(s:Phaser.Scene,x:number,y:number,text:string,size=26,color=C.cream):Phaser.GameObjects.Text {return s.add.text(x,y,text,{fontFamily:FONT,fontSize:size,color}).setScrollFactor(0).setDepth(200);}
export function panel(s:Phaser.Scene,x:number,y:number,w:number,h:number,color=C.panel,alpha=.95):Phaser.GameObjects.Graphics {return s.add.graphics().fillStyle(color,alpha).fillRoundedRect(x,y,w,h,18).lineStyle(2,C.line,.65).strokeRoundedRect(x,y,w,h,18).setScrollFactor(0).setDepth(190);}
export function button(s:Phaser.Scene,x:number,y:number,w:number,h:number,text:string,callback:()=>void,primary=false):{bg:Phaser.GameObjects.Rectangle;text:Phaser.GameObjects.Text} {
  const bg=s.add.rectangle(x,y,w,h,primary?C.gold:C.panel,1).setStrokeStyle(2,primary?0xf8dca4:C.line).setOrigin(0).setScrollFactor(0).setDepth(210).setInteractive({useHandCursor:true});
  const t=label(s,x+w/2,y+h/2,text,27,primary?'#1d302e':C.cream).setOrigin(.5).setDepth(211);
  bg.on('pointerover',()=>bg.setFillStyle(primary?0xf5d499:0x29423f));bg.on('pointerout',()=>bg.setFillStyle(primary?C.gold:C.panel));bg.on('pointerup',callback);
  return {bg,text:t};
}
export function portrait(s:Phaser.Scene,x:number,y:number,id:string,size:number):Phaser.GameObjects.Image|Phaser.GameObjects.Text {
  if(s.textures.exists('units')&&s.textures.get('units').has(`portrait-${id}`)) return s.add.image(x,y,'units',`portrait-${id}`).setDisplaySize(size,size).setScrollFactor(0).setDepth(201);
  return label(s,x,y,id.slice(0,1).toUpperCase(),size*.5).setOrigin(.5);
}
