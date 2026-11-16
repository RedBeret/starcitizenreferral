/* Full-route lab audit; screenshots and raw evidence are written outside the repository. */
const {chromium}=require(process.env.SC_PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs');const path=require('path');const os=require('os');
const root=path.resolve(__dirname,'..');
const base=process.env.SC_QA_BASE||'http://127.0.0.1:4173';
const phase=process.env.SC_AUDIT_PHASE||'after';
const axePath=process.env.SC_AXE_PATH||'/tmp/sc-audit-axe.min.js';
const output=fs.mkdtempSync(path.join(os.tmpdir(),`sc-site-audit-${phase}-`));
function htmlFiles(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(e=>e.isDirectory()?htmlFiles(path.join(directory,e.name)):e.name.endsWith('.html')?[path.join(directory,e.name)]:[]);}
const files=['index.html','privacy.html','iae2025.html','ad.html','og-image.html',...(fs.existsSync(root+'/404.html')?['404.html']:[]),...htmlFiles(root+'/pages').map(p=>path.relative(root,p))];
const routes=files.map(file=>{const html=fs.readFileSync(root+'/'+file,'utf8');return {route:file==='index.html'?'/':'/'+file,redirect:html.match(/http-equiv="refresh"[^>]*content="[^"]*url=([^"\s]+)/i)?.[1],artboard:file==='og-image.html'};});
const report={phase,scope:'Browser lab inspection, not a complete accessibility certification or real-user Core Web Vitals report.',pages:[],accessibility:[],failures:[]};
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({reducedMotion:'reduce'});
 await context.route('https://www.googletagmanager.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
 const page=await context.newPage();page.setDefaultTimeout(10000);
 let errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:950});
  for(const item of routes){
   errors=[];const response=await page.goto(base+item.route,{waitUntil:'domcontentloaded'});
   if(item.redirect)await page.waitForURL(base+item.redirect);
   await page.evaluate(async()=>{for(const img of document.images)img.loading='eager';await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,3000))]);});
   const data=await page.evaluate(()=>({title:document.title,h1:document.querySelectorAll('h1').length,width:innerWidth,scroll:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,brokenImages:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src')),headings:[...document.querySelectorAll('main h1,main h2,main h3')].map(e=>({tag:e.tagName,text:e.innerText})),sections:[...document.querySelectorAll('main>section,main>.shell>.article-layout,footer')].map(e=>({name:e.id||e.className,height:Math.round(e.getBoundingClientRect().height)}))}));
   const row={route:item.route,finalPath:new URL(page.url()).pathname,width,status:response.status(),...data,errors:[...errors],artboard:item.artboard};report.pages.push(row);
   if(response.status()!==200)report.failures.push({route:item.route,width,type:'http',status:response.status()});
   if(!item.artboard&&data.scroll>width)report.failures.push({route:item.route,width,type:'horizontal-overflow',scroll:data.scroll});
   if(data.brokenImages.length)report.failures.push({route:item.route,width,type:'broken-images',images:data.brokenImages});
   if(errors.length)report.failures.push({route:item.route,width,type:'browser-errors',errors});
   if([390,1440].includes(width)&&!item.redirect){
    const slug=item.route==='/'?'home':item.route.replace(/^\//,'').replaceAll('/','--').replace('.html','');
    await page.screenshot({path:`${output}/${slug}-${width}.png`,fullPage:true});
   }
   if(width===390&&!item.redirect&&!item.artboard&&fs.existsSync(axePath)){
    await page.addScriptTag({path:axePath});
    const audit=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return {version:axe.version,violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,help:v.help,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))};});
    report.accessibility.push({route:item.route,...audit});
   }
  }
  console.log('Completed all routes at',width,'CSS pixels');
 }
 // Every homepage section gets its own inspectable image, independent of long-page scaling.
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/');await page.evaluate(()=>document.fonts.ready);
 for(const selector of ['.site-head','.hero','.quick-facts','#how-it-works','#guides','#alpha-5-status','#questions','.final-cta','.site-foot']){
  const section=page.locator(selector);await section.scrollIntoViewIfNeeded();await section.screenshot({path:`${output}/home-section-${selector.replace(/[.#]/g,'')}.png`});
 }
 // Inspect both themes for the distinct interactive surfaces.
 for(const route of ['/','/pages/guides/guide-library.html','/pages/guides/mission-budget.html']){
  await page.setViewportSize({width:390,height:844});await page.goto(base+route);await page.evaluate(()=>document.documentElement.dataset.theme='light');
  if(fs.existsSync(axePath)){await page.addScriptTag({path:axePath});const r=await page.evaluate(async()=>{const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});report.accessibility.push({route,theme:'light',violations:r});}
 }
 await browser.close();
 report.pageChecks=report.pages.length;report.automatedAccessibilityViolations=report.accessibility.reduce((sum,r)=>sum+r.violations.length,0);
 fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({output,routes:routes.length,pageChecks:report.pageChecks,layoutOrRuntimeFailures:report.failures,automatedAccessibilityRuns:report.accessibility.length,automatedAccessibilityViolations:report.automatedAccessibilityViolations},null,2));
 if(report.failures.length&&phase!=='before')process.exitCode=1;
})().catch(e=>{console.error(e);fs.writeFileSync(output+'/partial-report.json',JSON.stringify(report,null,2));process.exitCode=1});
