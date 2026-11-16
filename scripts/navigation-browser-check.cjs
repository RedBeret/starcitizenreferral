const {chromium}=require(process.env.SC_PLAYWRIGHT_MODULE||'playwright');
const assert=require('assert/strict');const fs=require('fs');const path=require('path');const os=require('os');
const base=process.env.SC_GUIDES_BASE||process.env.SC_QA_BASE||'http://127.0.0.1:4173';
const before=process.env.SC_AUDIT_PHASE==='before';
const output=fs.mkdtempSync(path.join(os.tmpdir(),'sc-navigation-check-'));
const cases=[
 ['how do I open all the doors','essential-ship-controls'],
 ['how can I set up my joystick','keybindings'],
 ['how do I rent a ship','renting-ships'],
 ['can I add a referral after creating an account','referral-codes'],
 ['why is my referral code not working','referral-troubleshooting'],
 ['how do I refuel my ship','ship-maintenance'],
 ['how much profit will I make','mission-budget'],
 ['where is my ship','personal-hangars'],
 ['what does aUEC mean','currencies'],
 ['no credits','referral-troubleshooting'],
 ['50k credits','50000-uec-bonus']
];
const all=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../_content/guides/catalog.json'),'utf8')).concat(JSON.parse(fs.readFileSync(path.resolve(__dirname,'../_content/guides/library-extras.json'),'utf8')));
(async()=>{const b=await chromium.launch();const c=await b.newContext({reducedMotion:'reduce'});await c.route('https://www.googletagmanager.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewportSize({width:390,height:844});await p.goto(base+'/pages/guides/guide-library.html');const query=p.getByRole('searchbox',{name:'Search guides'});const results=[];
for(const [question,slug] of cases){await query.fill(question);const expected=all.find(e=>e.slug===slug);const href=expected.path||'/pages/guides/'+slug+'.html';const found=!!await p.locator(`.library-card:visible[href="${href}"]`).count();results.push({question,expected:href,found});}
console.log('Question searches:',JSON.stringify(results));
if(!before){
 assert.ok(results.every(r=>r.found),'Every recorded question must find its relevant guide');
 await query.fill('how do I');assert.equal(await p.locator('.library-card:visible').count(),all.length);
 await query.fill('not a real zqxvtopic');assert.equal(await p.locator('.library-card:visible').count(),0);
 await p.getByRole('button',{name:'Clear filters'}).click();await p.waitForFunction(()=>document.querySelector('[name="guide-query"]').value==='');
 const paths=p.locator('[data-starting-paths]');assert.ok(await paths.count());await paths.locator('summary').click();
 assert.ok(await paths.getByRole('link',{name:'Check your PC'}).isVisible());
 await paths.getByRole('link',{name:'Practise your first landing'}).click();await p.waitForURL('**/pages/guides/landing-guide.html');
 const next=p.getByRole('navigation',{name:'Choose your next step'});assert.equal(await next.locator('li').count(),3);
 assert.ok(await p.evaluate(()=>{const next=document.querySelector('.guide-next-steps');const panel=document.querySelector('.article-side .claim-panel');return next.getBoundingClientRect().top<panel.getBoundingClientRect().top}),'Mobile article next steps must precede the sidebar referral panel');
 await next.locator('li a').first().click();await p.waitForURL('**/pages/guides/first-flight-new-babbage.html');
 const plain=await b.newContext({javaScriptEnabled:false});const nojs=await plain.newPage();await nojs.goto(base+'/pages/guides/guide-library.html');await nojs.locator('[data-starting-paths] summary').click();assert.ok(await nojs.locator('[data-starting-paths]').getByRole('link',{name:'Check your PC'}).isVisible());await nojs.goto(base+'/pages/guides/landing-guide.html');assert.ok(await nojs.getByRole('navigation',{name:'Choose your next step'}).count());await plain.close();
 for(const width of [320,390,768,1440]){await p.setViewportSize({width,height:950});await p.goto(base+'/pages/guides/guide-library.html');await p.locator('[data-starting-paths] summary').click();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if([390,1440].includes(width))await p.screenshot({path:`${output}/paths-${width}.png`,fullPage:true});await p.goto(base+'/pages/guides/landing-guide.html');assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if([390,1440].includes(width))await p.locator('.guide-next-steps').screenshot({path:`${output}/next-steps-${width}.png`});}
 assert.deepEqual(errors,[]);
}
fs.writeFileSync(output+'/report.json',JSON.stringify({before,results,errors},null,2));console.log(JSON.stringify({output,questions:results.length,matched:results.filter(x=>x.found).length,before,errors},null,2));await b.close();})().catch(e=>{console.error(e);process.exit(1)});
