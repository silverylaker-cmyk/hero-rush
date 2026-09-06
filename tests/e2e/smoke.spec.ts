import {test,expect,type Page} from '@playwright/test';
const state=(page:Page)=>page.evaluate(()=> (window as any).heroRush.getState());
async function waitScene(page:Page,scene:string){await page.waitForFunction(name=>(window as any).heroRush?.getState().scene===name,scene);}
async function at(page:Page,x:number,y:number){const box=(await page.locator('canvas').boundingBox())!;return {x:box.x+x/1920*box.width,y:box.y+y/1080*box.height};}
async function click(page:Page,x:number,y:number){const p=await at(page,x,y);await page.mouse.click(p.x,p.y);}
test('load, fight stage 1 with AUTO, save stars and unlock stage 2',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./');await waitScene(page,'StageSelect');
  await page.screenshot({path:'tests/screenshots/stage-select.png'});
  await click(page,1565,975);await waitScene(page,'Battle');
  await click(page,1395,64);await click(page,1534,64);
  await page.waitForFunction(()=>((window as any).heroRush.getState().battle?.tick??0)>420);
  await page.screenshot({path:'tests/screenshots/battle.png'});
  await waitScene(page,'Result');expect((await state(page)).result).toMatchObject({victory:true,stars:3});
  await page.screenshot({path:'tests/screenshots/result.png'});
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hr.progress.v1')!).stars['1'])).toBe(3);
  await page.reload();await waitScene(page,'StageSelect');expect((await state(page)).selectedStage).toBe(2);expect(errors).toEqual([]);
});
test('manual hold slows time, ground drag casts and pause freezes ticks',async({page})=>{
  await page.goto('./');await waitScene(page,'StageSelect');await click(page,1565,975);await waitScene(page,'Battle');
  await page.waitForFunction(()=> (window as any).heroRush.getState().battle?.units.find((u:any)=>u.defId==='ironwall')?.energy>=100);
  const before=await state(page),tank=before.battle.units.find((u:any)=>u.defId==='ironwall');
  const cancelStart=await at(page,592,970);await page.mouse.move(cancelStart.x,cancelStart.y);await page.mouse.down();await page.mouse.move(cancelStart.x,740);await page.mouse.up();
  expect((await state(page)).battle.aiming).toBe(false);expect((await state(page)).battle.units.find((u:any)=>u.defId==='ironwall').energy).toBe(100);
  const p=await at(page,592,970);await page.mouse.move(p.x,p.y);await page.mouse.down();
  expect((await state(page)).battle.aiming).toBe(true);const tick=(await state(page)).battle.tick;
  await page.waitForTimeout(400);const diff=(await state(page)).battle.tick-tick;expect(diff).toBeGreaterThan(0);expect(diff).toBeLessThan(12);
  const live=await state(page),enemy=live.battle.units.filter((u:any)=>u.team==='enemy'&&u.hp>0).sort((a:any,b:any)=>Math.abs(a.x-tank.x)-Math.abs(b.x-tank.x))[0];
  const aim=await at(page,enemy.x-live.battle.scrollX,810);await page.mouse.move(aim.x,aim.y,{steps:10});await page.screenshot({path:'tests/screenshots/aim.png'});await page.mouse.up();
  await page.waitForTimeout(100);expect((await state(page)).battle.units.find((u:any)=>u.defId==='ironwall').energy).toBeLessThan(100);
  await click(page,1785,64);const paused=(await state(page)).battle.tick;await page.waitForTimeout(300);expect((await state(page)).battle.tick).toBe(paused);
  await click(page,960,515);expect((await state(page)).battle.paused).toBe(false);
});
test('ground ultimate interrupts an actual enemy casting bar',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('hr.progress.v1',JSON.stringify({stars:{'1':3,'2':3,'3':3}})));
  await page.goto('./');await waitScene(page,'StageSelect');await click(page,1565,975);await waitScene(page,'Battle');
  await page.waitForFunction(()=>{const b=(window as any).heroRush.getState().battle;return b?.units.some((u:any)=>u.team==='enemy'&&u.casting)&&b?.units.find((u:any)=>u.defId==='ironwall')?.energy>=100;});
  const b=(await state(page)).battle,target=b.units.find((u:any)=>u.team==='enemy'&&u.casting);
  const start=await at(page,592,970),end=await at(page,target.x-b.scrollX,820);await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:5});await page.mouse.up();
  await page.waitForTimeout(80);expect((await state(page)).battle.units.find((u:any)=>u.id===target.id).casting).toBe(false);
  await page.screenshot({path:'tests/screenshots/interrupt.png'});
});
test('mobile landscape canvas fits and portrait shows rotation guidance',async({page})=>{
  await page.setViewportSize({width:844,height:390});await page.goto('./');await waitScene(page,'StageSelect');
  const b=(await page.locator('canvas').boundingBox())!;expect(b.width).toBeLessThanOrEqual(844);expect(b.height).toBeLessThanOrEqual(390);expect(b.width/b.height).toBeCloseTo(16/9,1);
  await page.screenshot({path:'tests/screenshots/mobile-landscape.png'});
  await page.setViewportSize({width:390,height:844});await expect(page.locator('#rotate')).toBeVisible();
});
