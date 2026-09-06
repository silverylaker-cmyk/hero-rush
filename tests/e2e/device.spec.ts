import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
test('touch direction aiming works in a mobile browser',async({browser})=>{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const page=await context.newPage();
  await page.goto('http://127.0.0.1:5173/hero-rush/');await page.waitForFunction(()=>(window as any).heroRush?.getState().scene==='StageSelect');
  const b=(await page.locator('canvas').boundingBox())!,point=(x:number,y:number)=>({x:b.x+x/1920*b.width,y:b.y+y/1080*b.height});
  const start=point(1565,975);await page.touchscreen.tap(start.x,start.y);
  await page.waitForFunction(()=> (window as any).heroRush.getState().battle?.units.find((u:any)=>u.defId==='lancer')?.energy>=100);
  const data=await page.evaluate(()=>(window as any).heroRush.getState().battle),u=data.units.find((v:any)=>v.defId==='lancer'),target=data.units.find((v:any)=>v.team==='enemy'&&v.hp>0);
  const cdp=await context.newCDPSession(page),button=point(776,970),end=point(target.x-data.scrollX,target.y-100);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[button]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[end]});await page.waitForTimeout(100);
  expect(await page.evaluate(()=>(window as any).heroRush.getState().battle.aiming)).toBe(true);
  await page.screenshot({path:'tests/screenshots/mobile-touch-aim.png'});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(100);expect(await page.evaluate(id=>(window as any).heroRush.getState().battle.units.find((v:any)=>v.id===id).energy,u.id)).toBeLessThan(100);
  await context.close();
});
test('performance: twenty units under six-times CPU throttling',async({page,context})=>{
  await page.goto('./');await page.waitForFunction(()=>(window as any).heroRush?.getState().scene==='StageSelect');
  // Stress setup is confined to this development browser test, not game data.
  await page.evaluate(async()=>{const path='/hero-rush/src/main.ts';const {game}=await import(path);game.scene.stop('StageSelect');game.scene.start('Battle',{stageId:10});});
  await page.waitForFunction(()=>(window as any).heroRush?.getState().scene==='Battle');
  await page.evaluate(async()=>{const path='/hero-rush/src/main.ts';const {game}=await import(path);const sim=game.scene.getScene('Battle').sim;while(sim.units.length<20){const copy=structuredClone(sim.enemies[0]);copy.id='stress-'+sim.units.length;copy.slot=sim.units.length;copy.x+=sim.units.length*20;sim.units.push(copy);}});
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:6});await page.waitForTimeout(2500);
  const perf=await page.evaluate(()=>new Promise<{fps:number;frames:number;duration:number}>(resolve=>{let frames=0;const start=performance.now();function frame(now:number){frames++;if(now-start>=4000)resolve({fps:frames/((now-start)/1000),frames,duration:now-start});else requestAnimationFrame(frame);}requestAnimationFrame(frame);}));
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  writeFileSync('tests/performance-report.json',JSON.stringify({browser:'Chrome desktop headless',viewport:'1280x720',initialUnits:20,cpuThrottle:6,...perf,physicalPhoneVerified:false},null,2)+'\n');
  expect(perf.fps).toBeGreaterThanOrEqual(30);
});
