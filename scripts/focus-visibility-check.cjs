/* Check focused controls through actual sequential Tab navigation, including sticky UI. */
const {chromium}=require(process.env.SC_PLAYWRIGHT_MODULE||'playwright');const fs=require('fs');const os=require('os');const path=require('path');
const base=process.env.SC_QA_BASE||'http://127.0.0.1:4173';const output=fs.mkdtempSync(path.join(os.tmpdir(),'sc-focus-check-'));
(async()=>{const browser=await chromium.launch();const context=await browser.newContext({reducedMotion:'reduce'});await context.route('https://www.googletagmanager.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));const rows=[];const failures=[];
for(const width of [390,1440])for(const route of ['/','/pages/guides/guide-library.html','/pages/guides/mission-budget.html']){
 const p=await context.newPage();await p.setViewportSize({width,height:844});await p.goto(base+route);const seen=new Set();let count=0;
 for(let i=0;i<160;i++){
  await p.keyboard.press('Tab');await p.evaluate(()=>new Promise(requestAnimationFrame));
  const data=await p.evaluate(()=>{const e=document.activeElement;if(!e||e===document.body)return null;const r=e.getBoundingClientRect();const nodes=[...document.querySelectorAll('a,button,input,select,summary,[tabindex]')];let visible=false;for(const fragment of e.getClientRects()){const xs=[fragment.left+fragment.width*.25,fragment.left+fragment.width*.5,fragment.left+fragment.width*.75];const ys=[fragment.top+fragment.height*.25,fragment.top+fragment.height*.5,fragment.top+fragment.height*.75];for(const x of xs)for(const y of ys){if(x<0||x>=innerWidth||y<0||y>=innerHeight)continue;const hit=document.elementFromPoint(x,y);if(hit&&(e===hit||e.contains(hit)))visible=true;}}return {index:nodes.indexOf(e),tag:e.tagName,id:e.id,label:e.getAttribute('aria-label')||e.innerText||e.name,visible,rect:{top:r.top,bottom:r.bottom,left:r.left,right:r.right}};});
  if(!data)continue;if(seen.has(data.index))break;seen.add(data.index);count++;
  if(!data.visible){failures.push({route,width,...data});await p.screenshot({path:`${output}/hidden-focus-${width}-${failures.length}.png`});}
 }
 rows.push({route,width,tabStops:count});await p.close();
}
await browser.close();fs.writeFileSync(output+'/report.json',JSON.stringify({rows,failures},null,2));console.log(JSON.stringify({output,tabStops:rows.reduce((n,r)=>n+r.tabStops,0),failures},null,2));if(failures.length)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
