/* Own the preview server for the duration of a test; do not rely on an idle background session. */
const {spawn}=require('child_process');const path=require('path');
const root=path.resolve(__dirname,'..');
const scripts=process.argv.slice(2);
if(!scripts.length){console.error('Usage: node scripts/run-local-audit.cjs scripts/customer-journey-check.cjs [...]');process.exit(1);}
const server=spawn('python3',['scripts/serve-preview.py','--port','0'],{cwd:root,stdio:['ignore','pipe','pipe']});
let tail='';server.stderr.on('data',data=>{tail=(tail+data).slice(-2000)});
let child;
const stop=()=>{child?.kill('SIGTERM');server.kill('SIGTERM');};
process.on('SIGINT',()=>{stop();process.exitCode=130});
process.on('SIGTERM',()=>{stop();process.exitCode=143});
(async()=>{
 const base=await new Promise((resolve,reject)=>{let text='';server.stdout.on('data',data=>{text+=data;const found=text.match(/Preview: (http:\/\/127\.0\.0\.1:\d+)/);if(found)resolve(found[1]);});server.once('error',reject);server.once('exit',code=>reject(Error(`Preview exited with ${code}: ${tail}`)));});
 console.log('Owned preview:',base);
 for(const script of scripts){
  const target=path.resolve(root,script);
  if(!target.startsWith(root+'/scripts/')||!target.endsWith('.cjs'))throw Error('Choose a .cjs test inside scripts/.');
  console.log('Running:',script);
  const code=await new Promise((resolve,reject)=>{child=spawn(process.execPath,[target],{cwd:root,env:{...process.env,SC_QA_BASE:base,SC_GUIDES_BASE:base},stdio:'inherit'});child.once('error',reject);child.once('exit',resolve);});
  child=null;
  if(code!==0)throw Error(`${script} exited with ${code}`);
 }
})().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(stop);
