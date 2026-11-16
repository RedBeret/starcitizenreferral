/* Sequential simulated visitor journeys. No registrations, payments or support messages. */
const playwright=require(process.env.SC_PLAYWRIGHT_MODULE||'playwright');
const assert=require('assert/strict');
const fs=require('fs');const path=require('path');const os=require('os');
const base=process.env.SC_QA_BASE||'http://127.0.0.1:4173';
const phase=process.env.SC_AUDIT_PHASE||'after';
const output=fs.mkdtempSync(path.join(os.tmpdir(),`sc-visitors-${phase}-`));
const signup='https://www.robertsspaceindustries.com/enlist?referral=STAR-9L66-ZTDY';
const library='/pages/guides/guide-library.html';
const report={phase,scope:'Simulated visitors, sequential isolated browser sessions; no real customer recruitment or RSI registration/purchase.',visitors:[]};
const browsers={};
(async()=>{
async function visitor(name,options,task){
 const engine=options.engine||'chromium';
 if(!browsers[engine])browsers[engine]=await playwright[engine].launch({headless:true});
 const {engine:unused,...settings}=options;
 const context=await browsers[engine].newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',...settings});
 await context.route('https://www.googletagmanager.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
 const page=await context.newPage();page.setDefaultTimeout(8000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const row={number:report.visitors.length+1,name,engine,steps:[],passed:false};
 async function step(label,fn){try{await fn();row.steps.push({label,passed:true});}catch(e){row.steps.push({label,passed:false,error:e.message});throw e;}}
 async function go(route){await page.goto(base+route,{waitUntil:'domcontentloaded'});}
 try{await task({page,context,step,go});assert.deepEqual(errors,[]);row.passed=true;}catch(e){row.error=e.message;try{await page.screenshot({path:`${output}/visitor-${row.number}-failure.png`,fullPage:true});}catch{}}
 report.visitors.push(row);console.log(`${row.passed?'PASS':'FAIL'} ${row.number}. ${name}${row.error?' — '+row.error.split('\n')[0]:''}`);
 await context.close();
}
await visitor('New desktop player checks code and official signup',{},async({page,context,step,go})=>{
 await go('/');
 await step('Hero displays the exact code and standard bonus',async()=>{assert.equal(await page.locator('#referral-code').innerText(),'STAR-9L66-ZTDY');assert.match(await page.locator('.hero-lede').innerText(),/50,000 UEC/);});
 await step('Copy produces the actual code',async()=>{await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>window.__copied=t}}));await page.locator('[data-copy-code]').first().click();assert.equal(await page.evaluate(()=>window.__copied),'STAR-9L66-ZTDY');});
 await step('CTA opens the exact official destination; test intercepts before account creation',async()=>{await context.route(signup,r=>r.fulfill({status:200,contentType:'text/html',body:'Read-only test interception'}));const [popup]=await Promise.all([page.waitForEvent('popup'),page.locator('#enlist-link').click()]);await popup.waitForLoadState();assert.equal(popup.url(),signup);await popup.close();});
});
await visitor('New phone visitor follows onboarding to PC requirements',{viewport:{width:390,height:844},isMobile:true,hasTouch:true},async({page,step,go})=>{
 await go('/');await step('Open menu and choose Start here',async()=>{await page.getByRole('button',{name:'Toggle navigation'}).click();await page.locator('#main-nav').getByRole('link',{name:'Start here'}).click();assert.ok(page.url().endsWith('/new-player-guide.html'));});
 await step('Find the detailed hardware guide from onboarding',async()=>{await page.getByRole('link',{name:'Check your PC requirements',exact:true}).click();assert.ok(page.url().endsWith('/system-requirements.html'));});
});
await visitor('Existing account holder checks the grace period',{},async({page,step,go})=>{
 await go('/');await step('FAQ answers the already-created-account question',async()=>{const d=page.locator('details').filter({has:page.getByText('I already made an account. Can I add the code?',{exact:true})});await d.locator('summary').click();assert.match(await d.innerText(),/24-hour/);assert.match(await d.innerText(),/cannot be replaced/);});
 await go('/pages/info/star-citizen-referral-code-not-working.html');await step('Troubleshooting does not promise changing an attached code',async()=>assert.match(await page.locator('.article-body').innerText(),/cannot be changed/));
});
await visitor('Signed-in RSI visitor understands homepage redirects',{},async({page,step,go})=>{
 await go('/pages/tools/verify.html');await step('Read signed-in explanation without creating another account',async()=>{const text=await page.locator('.article-body').innerText();assert.match(text,/already be signed in/);assert.match(text,/account-summary referral field/);assert.match(text,/does not demonstrate a completed registration/);});
});
await visitor('Prospective buyer searches for game-package help',{viewport:{width:390,height:844}},async({page,step,go})=>{
 await go(library);await step('Search finds the existing package guide',async()=>{await page.getByRole('searchbox',{name:'Search guides'}).fill('game package');assert.ok(await page.locator('.library-card:visible[href="/pages/guides/starter-pack-guide.html"]').count(),'The game-package guide is absent from searchable cards');});
});
await visitor('New recruit searches for the 50,000-credit explanation',{},async({page,step,go})=>{
 await go(library);await step('Bonus search finds the actual bonus guide',async()=>{await page.getByRole('searchbox',{name:'Search guides'}).fill('50,000');assert.ok(await page.locator('.library-card:visible[href="/pages/guides/50000-uec-bonus.html"]').count(),'The bonus guide is absent from searchable cards');});
});
await visitor('Frustrated visitor searches for a referral that is not working',{},async({page,step,go})=>{
 await go(library);await step('Problem search finds direct troubleshooting help',async()=>{await page.getByRole('searchbox',{name:'Search guides'}).fill('referral not working');assert.ok(await page.locator('.library-card:visible[href="/pages/info/star-citizen-referral-code-not-working.html"]').count(),'Referral troubleshooting is absent from searchable cards');});
});
await visitor('Returning player finds HOTAS setup',{},async({page,step,go})=>{
 await go(library);await step('Search HOTAS and reach the profile guide',async()=>{await page.getByRole('searchbox',{name:'Search guides'}).fill('HOTAS');await page.locator('.library-card:visible').first().click();assert.ok(page.url().endsWith('/keybindings.html'));await page.getByRole('heading',{name:'Export a profile you can restore'}).waitFor({state:'visible'});});
});
await visitor('Phone keyboard user presses Escape while searching',{viewport:{width:390,height:844}},async({page,step,go})=>{
 await go(library);await step('Escape in a search field does not jump focus to a closed menu',async()=>{const search=page.getByRole('searchbox',{name:'Search guides'});await search.fill('cargo');await search.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'guide-query');});
 await step('Escape closes an actually open menu and restores its button',async()=>{await page.getByRole('button',{name:'Toggle navigation'}).click();await page.keyboard.press('Escape');assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');assert.equal(await page.evaluate(()=>document.activeElement.id),'menu-toggle');});
});
await visitor('Keyboard-only reader uses skip link and native FAQ',{},async({page,step,go})=>{
 await go('/');await step('First Tab reveals skip link; Enter targets main content',async()=>{await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent.trim()),'Skip to content');await page.keyboard.press('Enter');assert.ok(page.url().endsWith('#main'));});
 await step('FAQ opens with keyboard',async()=>{const summary=page.locator('summary').first();await summary.focus();await page.keyboard.press('Enter');assert.ok(await page.locator('details').first().evaluate(e=>e.open));});
});
await visitor('Small-screen reader at a 320 CSS-pixel viewport',{viewport:{width:320,height:800}},async({page,step,go})=>{
 for(const route of ['/','/pages/guides/essential-ship-controls.html','/pages/guides/mission-budget.html']){await go(route);await step(`Content reflows at ${route}`,async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)));}
});
await visitor('Visitor denies clipboard permission',{viewport:{width:390,height:844}},async({page,step,go})=>{
 await go('/');await step('Failed automatic copy provides a selected manual fallback',async()=>{await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}});document.execCommand=()=>false;});await page.locator('[data-copy-code]').first().click();assert.match(await page.locator('#site-status').innerText(),/Copy unavailable/);assert.equal(await page.evaluate(()=>window.getSelection().toString()),'STAR-9L66-ZTDY');});
});
await visitor('Privacy-conscious visitor blocks storage and analytics',{},async({page,context,step,go})=>{
 await context.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}});Object.defineProperty(navigator,'doNotTrack',{get(){return '1'}});});await go('/');
 await step('Theme remains usable and analytics is not loaded',async()=>{await page.getByRole('button',{name:'Switch to light theme'}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');assert.equal(await page.locator('script[src*="googletagmanager"]').count(),0);});
 await go('/privacy.html');await step('Privacy page explains preferences and signup ownership',async()=>assert.match(await page.locator('.article-body').innerText(),/does not.*collect your RSI login/));
});
await visitor('German-language phone visitor',{viewport:{width:390,height:844},locale:'de-DE'},async({page,step,go})=>{
 await go('/');await step('Signup panel uses German with the unchanged referral destination',async()=>{assert.equal(await page.locator('#language-select').inputValue(),'de');assert.equal(await page.locator('#enlist-link').getAttribute('href'),signup);assert.match(await page.locator('#enlist-link').innerText(),/RSI-Konto/);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));});
});
await visitor('No-JavaScript mobile visitor',{viewport:{width:390,height:844},javaScriptEnabled:false},async({page,step,go})=>{
 await go('/');await step('Code and signup remain present',async()=>{assert.equal(await page.locator('#referral-code').innerText(),'STAR-9L66-ZTDY');assert.equal(await page.locator('#enlist-link').getAttribute('href'),signup);});
 await go(library);await step('All guide cards stay readable',async()=>assert.ok(await page.locator('.library-card:visible').count()>=27));
 await go('/pages/guides/mission-budget.html');await step('Worked arithmetic remains available without the calculator',async()=>{assert.ok(await page.getByRole('heading',{name:'A fictional worked example'}).isVisible());assert.ok(await page.locator('noscript p').isVisible());});
});
await visitor('Crew planner calculates a shared contract',{},async({page,step,go})=>{
 await go('/pages/guides/mission-budget.html');await step('Example uses personal expenses after equal sharing',async()=>{await page.getByRole('button',{name:'Load example'}).click();assert.equal(await page.locator('[data-budget-net]').innerText(),'12,000 aUEC');});
 await step('Editing hides stale results and zero crew is rejected',async()=>{await page.getByLabel('Participants sharing the reward').fill('0');assert.equal(await page.locator('[data-budget-results]').isVisible(),false);await page.getByRole('button',{name:'Calculate estimate'}).click();assert.match(await page.locator('[data-budget-error]').innerText(),/Complete every field/);});
});
await visitor('Galaxy pilot checks door and staggered-fire guidance',{},async({page,step,go})=>{
 await go(library);await step('Find controls by Galaxy and doors',async()=>{await page.getByRole('searchbox',{name:'Search guides'}).fill('Galaxy doors');await page.locator('.library-card:visible').first().click();assert.ok(page.url().endsWith('/essential-ship-controls.html'));});
 await step('Unverified ship-specific shortcut is not presented as tested',async()=>{assert.match(await page.locator('#galaxy').locator('..').innerText(),/have not verified a dedicated Galaxy/);assert.ok(await page.locator('#staggered-fire').count());});
});
await visitor('Printer user keeps an offline departure list',{},async({page,step,go})=>{
 await go('/pages/guides/flight-checklist.html');await step('Native checklist ticks and resets',async()=>{await page.getByRole('checkbox').first().check();assert.match(await page.locator('[data-checklist-progress]').innerText(),/^1 of 12/);await page.getByRole('button',{name:'Reset checklist'}).click();await page.waitForFunction(()=>document.querySelector('[data-checklist-progress]').textContent.startsWith('0 of 12'));});
 await step('Printable layout includes all twelve checks',async()=>{await page.emulateMedia({media:'print'});assert.equal(await page.locator('.site-head').isVisible(),false);assert.equal(await page.getByRole('checkbox').count(),12);await page.pdf({path:output+'/departure-checklist.pdf',format:'A4',margin:{top:'12mm',bottom:'12mm',left:'12mm',right:'12mm'}});});
});
await visitor('Old bookmark visitor arrives at a 2025 event',{},async({page,step,go})=>{
 await go('/iae2025.html');await step('Archive is explicit and leads to the dated current snapshot',async()=>{assert.match(await page.locator('h1').innerText(),/archived/i);await page.getByRole('link',{name:'See current events & updates →'}).click();assert.ok(page.url().endsWith('/current-month.html'));});
});
await visitor('Visitor opens a mistyped or removed page',{},async({page,step})=>{
 await step('404 keeps the visitor oriented with useful recovery links',async()=>{const response=await page.goto(base+'/this-guide-does-not-exist');assert.equal(response.status(),404);assert.ok(await page.getByRole('link',{name:'Browse the guide library'}).count(),'Missing custom 404 recovery navigation');});
});
await visitor('Fonts fail on a slow phone connection',{viewport:{width:390,height:844},reducedMotion:'reduce'},async({page,context,step,go})=>{
 await context.route('**/*',route=>/fonts\.(googleapis|gstatic)\.com/.test(route.request().url())?route.abort():route.continue());await go('/');
 await step('Fallback fonts keep code and primary action readable',async()=>{assert.equal(await page.locator('#referral-code').innerText(),'STAR-9L66-ZTDY');assert.ok(await page.locator('#enlist-link').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));});
});
for(const engine of ['firefox','webkit'])await visitor(`${engine==='webkit'?'WebKit mobile':'Firefox desktop'} reader finds and uses a tool`,{engine,viewport:engine==='webkit'?{width:390,height:844}:{width:1440,height:1000}},async({page,step,go})=>{
 await go(library);await step('Search and navigate to the budget planner',async()=>{await page.getByRole('searchbox',{name:'Search guides'}).fill('calculator');await page.locator('.library-card:visible[href="/pages/guides/mission-budget.html"]').click();});
 await step('Calculator produces the same result in this engine',async()=>{await page.getByRole('button',{name:'Load example'}).click();assert.equal(await page.locator('[data-budget-net]').innerText(),'12,000 aUEC');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));});
});
report.passed=report.visitors.filter(v=>v.passed).length;report.failed=report.visitors.length-report.passed;
fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({output,visitors:report.visitors.length,passed:report.passed,failed:report.failed},null,2));
for(const browser of Object.values(browsers))await browser.close();
if(report.failed&&phase!=='before')process.exitCode=1;
})().catch(async e=>{console.error(e);fs.writeFileSync(output+'/partial-report.json',JSON.stringify(report,null,2));for(const b of Object.values(browsers))await b.close();process.exitCode=1});
