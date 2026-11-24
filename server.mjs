import http from 'node:http';
import {readFileSync} from 'node:fs';
import pg from 'pg';
import sharp from 'sharp';
import {randomBytes,scrypt,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt),port=Number(process.env.PORT||3000),prod=process.env.NODE_ENV==='production';
const {Pool}=pg;
const pool=process.env.DATABASE_URL?new Pool({connectionString:process.env.DATABASE_URL,max:4,connectionTimeoutMillis:5000,idleTimeoutMillis:30000}):null;
let initialized=false,initPromise;
pool?.on('error',err=>console.error('Database connection error',err.code||'unknown'));
async function initialize(){if(!pool)throw Object.assign(Error('Account storage is not connected yet.'),{status:503});if(initialized)return;if(!initPromise)initPromise=pool.query("CREATE TABLE IF NOT EXISTS accounts(id BIGSERIAL PRIMARY KEY,email TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,hash TEXT NOT NULL,profile TEXT NOT NULL,avatar TEXT NOT NULL DEFAULT '{}'); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,expires BIGINT NOT NULL); CREATE INDEX IF NOT EXISTS sessions_expiration_idx ON sessions(expires);").then(()=>{initialized=true}).catch(e=>{initPromise=null;console.error('Database initialization failed',e.code||'unknown');throw Object.assign(Error('Account storage is temporarily unavailable. Try again.'),{status:503})});await initPromise}
async function query(sql,args=[]){await initialize();return pool.query(sql,args)}
async function one(sql,args=[]){return (await query(sql,args)).rows[0]||null}
const html=readFileSync(new URL('./index.html',import.meta.url));
const art=JSON.parse(readFileSync(new URL('./campus-source.json',import.meta.url),'utf8'));
const campus=await sharp(Buffer.from(art.original,'base64')).composite([{input:Buffer.from(art.patch,'base64'),left:art.left,top:art.top}]).webp({quality:91}).toBuffer();

const onboardingHtml=readFileSync(new URL('./onboarding.html',import.meta.url));
const onboardingJs=readFileSync(new URL('./onboarding.js',import.meta.url));
const academyJs=readFileSync(new URL('./academy-interior.js',import.meta.url));
const motionJs=readFileSync(new URL('./character-motion.js',import.meta.url));
const portalJs=readFileSync(new URL('./portal-scenes.js',import.meta.url));
const collectionHtml=readFileSync(new URL('./character-collection.html',import.meta.url));
const collectionJs=readFileSync(new URL('./character-collection.js',import.meta.url));
const collectionRoster=JSON.parse(readFileSync(new URL('./character-collection.json',import.meta.url),'utf8'));
const collectionAssets=new Map(),collectionPending=new Map(),remoteCollectionCache=new Map();
function collectionFile(id,ext){return new URL('./character-assets/'+id+'.'+ext,import.meta.url)}
// Register only local, licensed, self-contained, rigged assets; the concept roster is not proof of availability.
for(const c of collectionRoster){if(!/^[a-z0-9-]+$/.test(c.id))continue;try{
 const meta=JSON.parse(readFileSync(collectionFile(c.id,'json'),'utf8'));
 if(!meta.license||!meta.source||meta.approved!==true)continue;
 let b;try{b=readFileSync(collectionFile(c.id,'glb'))}catch{b=Buffer.from(readFileSync(collectionFile(c.id,'glb.b64'),'utf8'),'base64')}
 if(b.length<20||b.length>24*1024*1024||b.toString('ascii',0,4)!=='glTF'||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length||b.readUInt32LE(16)!==0x4e4f534a)continue;
 const len=b.readUInt32LE(12);if(len<2||len>b.length-20)continue;
 const j=JSON.parse(b.toString('utf8',20,20+len));if(!j.meshes?.length||!j.skins?.length||[...(j.buffers||[]),...(j.images||[])].some(x=>x.uri&&!x.uri.startsWith('data:')))continue;
 let poster=false;try{const bytes=readFileSync(collectionFile(c.id,'webp'));poster=bytes.length>12&&bytes.length<2*1024*1024&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'}catch{}
 collectionAssets.set(c.id,{license:String(meta.license),source:String(meta.source),poster,bytes:b});
}catch{}}
const collectionRevision='0128ca510d653bb04d6d1e4885bd8890b5050b4f';
for(const c of collectionRoster){let a=c.asset;if(a?.license==='CC0-1.0'&&/^public\/glb\/modular_(men|women)\/[A-Za-z0-9]+\.glb$/.test(a.path)&&/^[a-f0-9]{40}$/.test(a.sha)){collectionAssets.set(c.id,{...a,remote:true,poster:false})}}
async function getCollectionModel(id){const a=collectionAssets.get(id);if(!a)throw fail(404,'Unknown model');if(a.bytes)return a.bytes;if(remoteCollectionCache.has(id))return remoteCollectionCache.get(id);if(collectionPending.has(id))return collectionPending.get(id);
 const job=(async()=>{const response=await fetch('https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/'+collectionRevision+'/'+a.path,{redirect:'error',signal:AbortSignal.timeout(30000)});if(!response.ok||!response.body)throw fail(502,'Model source unavailable');const reader=response.body.getReader(),chunks=[];let n=0;try{while(true){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>8*1024*1024){await reader.cancel();throw fail(502,'Model too large')}chunks.push(Buffer.from(value))}}finally{reader.releaseLock()}const b=Buffer.concat(chunks,n);
 if(createHash('sha1').update('blob '+n+'\0').update(b).digest('hex')!==a.sha)throw fail(502,'Model checksum mismatch');
 if(n<20||b.toString('ascii',0,4)!=='glTF'||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==n||b.readUInt32LE(16)!==0x4e4f534a)throw fail(502,'Invalid model');
 const len=b.readUInt32LE(12);if(len<2||len>n-20)throw fail(502,'Invalid model metadata');const m=JSON.parse(b.toString('utf8',20,20+len));if(!m.meshes?.length||!m.skins?.length||[...(m.buffers||[]),...(m.images||[])].some(x=>x.uri&&!x.uri.startsWith('data:')))throw fail(502,'Unsupported model');
 remoteCollectionCache.set(id,b);while(remoteCollectionCache.size>8)remoteCollectionCache.delete(remoteCollectionCache.keys().next().value);console.log('Character model verified',id,n,'clips',m.animations?.length||0);return b})();collectionPending.set(id,job);try{return await job}finally{collectionPending.delete(id)}}
function canUseKing(a){const owners=(process.env.ACADEMY_OWNER_EMAILS||process.env.ACADEMY_OWNER_EMAIL||'').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean);return !!(a&&typeof a.email==='string'&&owners.includes(a.email.trim().toLowerCase()))}
function collectionCatalog(accountRow){return collectionRoster.map(({asset,...c})=>{let a=collectionAssets.get(c.id),locked=c.id==='male-king'&&!canUseKing(accountRow);return {...c,locked,selectable:!!a&&!locked,ready:!!a,model:a?'/character-assets/'+c.id+'.glb':null,poster:a?.poster?'/character-assets/'+c.id+'.webp':null,license:a?.license||null,source:a?.source||null}})}
const humanPreviewHtml=readFileSync(new URL('./human-preview.html',import.meta.url));
const humanPreviewJs=readFileSync(new URL('./human-preview.js',import.meta.url));
const avatarLicense=readFileSync(new URL('./avatar-license.txt',import.meta.url));
const assetRevision='2fd9ec82fbe1613d40ae38aadcca3f410725f740';
const permittedAvatars=new Set(['ethan','carlos','priya','emma']);
const avatarCache=new Map(),avatarPending=new Map();
async function loadAvatar(id){
 if(!permittedAvatars.has(id))throw fail(404,'Unknown avatar');
 if(avatarCache.has(id)){const b=avatarCache.get(id);avatarCache.delete(id);avatarCache.set(id,b);return b}
 if(avatarPending.has(id))return avatarPending.get(id);
 const pending=(async()=>{
 const url='https://raw.githubusercontent.com/memoriesrohit/avatar-studio/'+assetRevision+'/models/'+id+'_casual.glb';
 const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(45000)});
 if(!response.ok||!response.body)throw fail(502,'Source 3D model unavailable');
 const max=24*1024*1024;
 if(Number(response.headers.get('content-length'))>max)throw fail(502,'Model exceeds preview size limit');
 const reader=response.body.getReader(),chunks=[];let n=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>max){await reader.cancel();throw fail(502,'Model exceeds preview size limit')}chunks.push(Buffer.from(value))}}finally{reader.releaseLock()}
 const bytes=Buffer.concat(chunks,n);
 if(n<20||bytes.toString('ascii',0,4)!=='glTF'||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==n)throw fail(502,'Source did not return a valid GLB');
 const jsonLength=bytes.readUInt32LE(12);
 if(jsonLength<2||jsonLength>n-20||bytes.readUInt32LE(16)!==0x4e4f534a)throw fail(502,'Invalid GLB metadata');
 let manifest;try{manifest=JSON.parse(bytes.toString('utf8',20,20+jsonLength))}catch{throw fail(502,'Invalid GLB metadata')}
 if(!manifest.meshes?.length||!manifest.skins?.length||!manifest.animations?.length)throw fail(502,'Source is not a rigged animated model');
 if((manifest.buffers||[]).some(b=>b.uri&&!b.uri.startsWith('data:'))||(manifest.images||[]).some(b=>b.uri&&!b.uri.startsWith('data:')))throw fail(502,'Model is not self-contained');
 avatarCache.set(id,bytes);while(avatarCache.size>2)avatarCache.delete(avatarCache.keys().next().value);
 console.log('Human preview asset validated:',id,'bytes:',n,'meshes:',manifest.meshes.length,'animations:',manifest.animations.length);
 return bytes;
 })();
 avatarPending.set(id,pending);try{return await pending}catch(e){console.warn('Human preview asset failed:',id,e.status||e.name);throw fail(e.status||502,'3D model is temporarily unavailable. Retry the preview.')}finally{avatarPending.delete(id)}
}
const hairRevision='852e48f316b90a0937234886630e4fb4cdfd1f78';
const hairIds=new Set(['short02','short04','afro01','bob01','bob02','long01','ponytail01','braid01']);
const hairCache=new Map(),hairPending=new Map();
async function loadHair(id){
 if(!hairIds.has(id))throw fail(404,'Unknown hairstyle');
 if(hairCache.has(id))return hairCache.get(id);
 if(hairPending.has(id))return hairPending.get(id);
 const pending=(async()=>{const res=await fetch('https://raw.githubusercontent.com/kblood/CharacterCreator/'+hairRevision+'/output/hair_'+id+'.glb',{redirect:'error',signal:AbortSignal.timeout(25000)});
 if(!res.ok||!res.body)throw fail(502,'Hair asset unavailable');
 const max=4*1024*1024,reader=res.body.getReader(),chunks=[];let n=0;try{while(true){let {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>max){await reader.cancel();throw fail(502,'Hair asset too large')}chunks.push(Buffer.from(value))}}finally{reader.releaseLock()}
 const b=Buffer.concat(chunks,n);if(n<20||b.toString('ascii',0,4)!=='glTF'||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==n||b.readUInt32LE(16)!==0x4e4f534a)throw fail(502,'Invalid hair asset');
 const len=b.readUInt32LE(12);if(len<2||len>n-20)throw fail(502,'Invalid asset metadata');
 const j=JSON.parse(b.toString('utf8',20,20+len));if(!j.meshes?.length||[...(j.buffers||[]),...(j.images||[])].some(v=>v.uri&&!v.uri.startsWith('data:')))throw fail(502,'Hair asset is not self-contained');
 hairCache.set(id,b);while(hairCache.size>6)hairCache.delete(hairCache.keys().next().value);return b})();
 hairPending.set(id,pending);try{return await pending}catch(e){console.warn('Hair asset download:',id,e.name);throw fail(e.status||502,'Hair download failed')}finally{hairPending.delete(id)}
}
function sendBytes(res,bytes,type,cache='no-store'){res.writeHead(200,{'Content-Type':type,'Content-Length':bytes.length,'Cache-Control':cache});res.end(bytes)}

const digest=x=>createHash('sha256').update(x).digest('hex'),ttl=7*24*3600,attempts=new Map();
const fail=(status,message)=>Object.assign(Error(message),{status});
function json(res,status,body,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(body))}
function cookie(value,age){return 'academy_session='+value+'; HttpOnly; SameSite=Lax; Path=/; Max-Age='+age+(prod?'; Secure':'')}
function token(req){return (req.headers.cookie||'').match(/(?:^|;\s*)academy_session=([a-f0-9]{64})(?:;|$)/)?.[1]}
async function account(req){const t=token(req);return t?one('SELECT a.* FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token=$1 AND s.expires>$2',[digest(t),Date.now()]):null}
const view=a=>a?{email:a.email,profile:JSON.parse(a.profile),avatar:JSON.parse(a.avatar)}:null;
async function session(req,res,a){const t=token(req);if(t)await query('DELETE FROM sessions WHERE token=$1',[digest(t)]);const raw=randomBytes(32).toString('hex');await query('DELETE FROM sessions WHERE expires<=$1',[Date.now()]);await query('INSERT INTO sessions(token,account_id,expires) VALUES($1,$2,$3)',[digest(raw),a.id,Date.now()+ttl*1000]);json(res,200,{user:view(a)},{'Set-Cookie':cookie(raw,ttl)})}
async function body(req){if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw fail(415,'JSON required');let chunks=[],size=0;for await(const c of req){size+=c.length;if(size>16384)throw fail(413,'Request too large');chunks.push(c)}try{let d=JSON.parse(Buffer.concat(chunks));if(!d||typeof d!=='object'||Array.isArray(d))throw Error();return d}catch{throw fail(400,'Invalid request')}}
function limit(req,path){const now=Date.now();for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);const k=req.socket.remoteAddress+':'+path;let v=attempts.get(k)||{count:0,until:now+60000};v.count++;attempts.set(k,v);if(v.count>(path==='register'?8:15))throw fail(429,'Too many attempts. Try again in a minute.')}
function cleanProfile(p={}){if(!p||typeof p!=='object')throw fail(400,'Invalid profile');let first=typeof p.first==='string'?p.first.trim():'',last=typeof p.last==='string'?p.last.trim():'';if(!first||!last||first.length>40||last.length>40)throw fail(400,'Enter valid first and last names.');let out={first,last};for(const [k,opts] of Object.entries({language:['Armenian','English','Russian','Other'],code:['C++','C','Python','JavaScript','Not yet'],experience:['Beginner','Intermediate','Advanced']})){if(opts.includes(p[k]))out[k]=p[k]}return out}
function cleanAvatar(a={}){if(!a||typeof a!=='object')throw fail(400,'Invalid character');let out={};if(typeof a.characterId==='string'&&collectionAssets.has(a.characterId))out.characterId=a.characterId;for(const k of ['skin','hairColor','shirt','pants'])if(typeof a[k]==='string'&&/^#[0-9a-f]{6}$/i.test(a[k]))out[k]=a[k];for(const [k,opts] of Object.entries({body:['a','b'],hair:['short','long','bald'],style:['jacket','tee','hoodie'],preset:['man-in-hoodie','woman-in-denim-jacket','man-in-flannel-shirt','woman-in-oversized-sweater']}))if(opts.includes(a[k]))out[k]=a[k];if(a.custom&&typeof a.custom==='object'&&!Array.isArray(a.custom)){const custom={};for(const key of ['face','skin','hair','hairColor','brows','eyes','eyeColor','nose','ears','smile','build','top','bottom','shoes','accessory']){const n=a.custom[key];if(Number.isInteger(n)&&n>=0&&n<=9)custom[key]=n}const height=a.custom.height;if(Number.isInteger(height)&&height>=145&&height<=205)custom.height=height;out.custom=custom}return out}
const server=http.createServer(async(req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');try{const path=new URL(req.url,'http://localhost').pathname;
if(req.method==='GET'&&path==='/onboarding'){res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");return sendBytes(res,onboardingHtml,'text/html; charset=utf-8')}
if(req.method==='GET'&&path==='/onboarding.js')return sendBytes(res,onboardingJs,'text/javascript; charset=utf-8');
if(req.method==='GET'&&path==='/academy-interior.js')return sendBytes(res,academyJs,'text/javascript; charset=utf-8');
if(req.method==='GET'&&path==='/character-motion.js')return sendBytes(res,motionJs,'text/javascript; charset=utf-8');
if(req.method==='GET'&&path==='/portal-scenes.js')return sendBytes(res,portalJs,'text/javascript; charset=utf-8');
if(req.method==='GET'&&path==='/characters'){res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");return sendBytes(res,collectionHtml,'text/html; charset=utf-8')}
if(req.method==='GET'&&path==='/character-collection.js')return sendBytes(res,collectionJs,'text/javascript; charset=utf-8');
if(req.method==='GET'&&path==='/api/character-collection'){res.setHeader('Cache-Control','private, no-store');return json(res,200,{characters:collectionCatalog(await account(req))})}
if(req.method==='GET'&&path.startsWith('/character-assets/')){const m=path.match(/^\/character-assets\/([a-z0-9-]+)\.(glb|webp)$/);if(!m||!collectionAssets.has(m[1])||(m[2]==='webp'&&!collectionAssets.get(m[1]).poster))throw fail(404,'Asset unavailable');// The original CC0 model is public for preview; equip permission is checked in POST /api/state.
return sendBytes(res,m[2]==='glb'?await getCollectionModel(m[1]):readFileSync(collectionFile(m[1],m[2])),m[2]==='glb'?'model/gltf-binary':'image/webp','public, max-age=3600')}
if(req.method==='GET'&&path==='/character-preview'){res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");return sendBytes(res,humanPreviewHtml,'text/html; charset=utf-8')}
if(req.method==='GET'&&path==='/human-preview.js')return sendBytes(res,humanPreviewJs,'text/javascript; charset=utf-8');
if(req.method==='GET'&&path==='/avatar-license.txt')return sendBytes(res,avatarLicense,'text/plain; charset=utf-8');
if(req.method==='GET'&&path==='/vendor/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm'){return sendBytes(res,readFileSync(new URL('./node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm',import.meta.url)),'application/wasm','public, max-age=3600')}
if(req.method==='GET'&&path.startsWith('/vendor/three/')){const file=path.slice('/vendor/three/'.length);if(!/^(build\/three(?:\.core|\.module)?\.js|examples\/jsm\/[a-zA-Z0-9_./-]+\.js)$/.test(file)||file.split('/').some(x=>x==='..'||x==='.'||!x))throw fail(404,'Not found');let data;try{data=readFileSync(new URL('./node_modules/three/'+file,import.meta.url))}catch{throw fail(404,'Module not found')}return sendBytes(res,data,'text/javascript; charset=utf-8','public, max-age=3600')}
if(req.method==='GET'&&path.startsWith('/hair-models/')){const m=path.match(/^\/hair-models\/([a-z0-9]+)\.glb$/);if(!m||!hairIds.has(m[1]))throw fail(404,'Not found');return sendBytes(res,await loadHair(m[1]),'model/gltf-binary','public, max-age=86400')}
if(req.method==='GET'&&path.startsWith('/avatar-models/')){const m=path.match(/^\/avatar-models\/(ethan|carlos|priya|emma)\.glb$/);if(!m)throw fail(404,'Not found');const data=await loadAvatar(m[1]);return sendBytes(res,data,'model/gltf-binary','public, max-age=86400')}
if(req.method==='GET'&&path==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(html)}if(req.method==='GET'&&path==='/assets/campus-v052.webp'){res.writeHead(200,{'Content-Type':'image/webp','Cache-Control':'public, max-age=86400'});return res.end(campus)}if(req.method==='GET'&&path==='/health')return json(res,200,{status:'ok',release:'1.4.1'});if(req.method==='GET'&&path==='/api/me'){await initialize();return json(res,200,{user:view(await account(req))})}if(req.method==='GET'&&path==='/api/status'){await query('SELECT 1');return json(res,200,{status:'ok',storage:'postgres',release:'1.4.1'})}if(req.method!=='POST'||!['/api/register','/api/login','/api/logout','/api/state'].includes(path))throw fail(404,'Not found');const expected=process.env.PUBLIC_ORIGIN||process.env.RENDER_EXTERNAL_URL||(prod?'https://':'http://')+req.headers.host;if(req.headers.origin!==expected)throw fail(403,'Invalid request origin');const d=await body(req);if(path==='/api/logout'){let t=token(req);if(t)await query('DELETE FROM sessions WHERE token=$1',[digest(t)]);return json(res,200,{ok:true},{'Set-Cookie':cookie('',0)})}if(path==='/api/state'){let a=await account(req);if(!a)throw fail(401,'Please log in');if(d.avatar?.characterId==='male-king'&&!canUseKing(a))throw fail(403,'Exclusive character');await query('UPDATE accounts SET profile=$1,avatar=$2 WHERE id=$3',[JSON.stringify(cleanProfile(d.profile)),JSON.stringify(cleanAvatar(d.avatar)),a.id]);return json(res,200,{ok:true})}limit(req,path);const email=typeof d.email==='string'?d.email.trim().toLowerCase():'',pass=d.password;if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||typeof pass!=='string'||pass.length>128||!pass.length)throw fail(400,'Enter a valid email and password.');if(path==='/api/register'){if(canUseKing({email}))throw fail(403,'This address is reserved. Log in with your existing account.');if(pass.length<10||pass!==d.confirm)throw fail(400,'Use at least 10 characters and matching passwords.');const p=cleanProfile(d),salt=randomBytes(16).toString('hex'),hash=(await derive(pass,salt,64)).toString('hex');let a;try{a=await one('INSERT INTO accounts(email,salt,hash,profile) VALUES($1,$2,$3,$4) RETURNING *',[email,salt,hash,JSON.stringify(p)])}catch(e){if(e.code==='23505')throw fail(409,'An account with this email already exists.');throw e}return await session(req,res,a)}const a=await one('SELECT * FROM accounts WHERE email=$1',[email]),h=await derive(pass,a?.salt||'dummy-salt-for-timing',64);if(!a||!timingSafeEqual(h,Buffer.from(a.hash,'hex')))throw fail(401,'Incorrect email or password. If you registered on an earlier preview, create your account again.');return await session(req,res,a)}catch(e){if(!e.status)console.error('Request failed',e.code||e.name);if(!res.headersSent)json(res,e.status||500,{error:e.status?e.message:'Something went wrong.'});else res.end()}});
server.listen(port,'0.0.0.0',()=>console.log('AcademyOne listening on '+port));
