import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {chapters,makeJourney,animateJourney} from '/portal-scenes.js';
import {makeAcademy,academyWalkable,doorNearby,advanceDoor,nearestAcademySeat,nearbyLightSwitch,setLightCircuit,academyGround,plazaDoorNearby,ENTRANCE_OFFSET,STAIR_X,STAIR_TOP,STAIR_BOTTOM,onAcademyStairs,academyStairLevel,nearbyInteriorDoor,inAdaHall,inKitchen} from '/academy-interior.js';
import {createHumanoidMotion,royalFinish} from '/character-motion.js';
let zoomTarget=4.2,zoomCurrent=4.2;let academy=null,motion=null,moveSpeed=0,moveX=0,moveZ=0,doorGesture=null,seatAction=null,jumpVelocity=0,airborne=false,firstPerson=false,sprintHeld=false,sprintToggle=false,lightGesture=null,contactShadow=null,ambientLight=null,jumpOffset=0,groundY=0;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],clamp=THREE.MathUtils.clamp;
const decoder=new DRACOLoader().setDecoderPath('/vendor/three/examples/jsm/libs/draco/gltf/').setWorkerLimit(1),loader=new GLTFLoader().setDRACOLoader(decoder);
let profile={},avatar={},catalog=[],filter='all',selected=null,hero=null,mixer=null,clips=[],renderer,scene,camera,orbit,environment,active='loading',sequence=0,journeyState=null,progress=0,smoothed=0,chapterIndex=-1,quality='auto',last=0,frameCount=0,lastFps=0,thumbRunning=false,thumbTarget,thumbs=new Map(),keys=new Set(),walkAction,idleAction,movingBefore=false,yaw=0,pitch=.46,drag=null,busy=false,journeyReadyAt=0;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
async function api(path,data){let r=await fetch('/api/'+path,{method:data===undefined?'GET':'POST',credentials:'same-origin',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});let result=await r.json();if(!r.ok)throw Error(result.error||'Request failed');return result}
function show(id){if(active==='journey'&&id!=='journey'){if(id==='world')portalComplete();else portalStop()}if(id!=='world'&&document.pointerLockElement)document.exitPointerLock?.();active=id;for(const name of ['loading','identity','characters','journey','world'])$('#'+name).hidden=name!==id;let n=['identity','characters','journey','world'].indexOf(id);$('#stepLabel').textContent=n<0?'Loading':['Identity','Character','Journey','Campus'][n];$$('.steps i').forEach((el,i)=>el.classList.toggle('on',i<=n));document.body.style.overflow=id==='world'?'hidden':'';window.scrollTo({top:0,behavior:'instant'});keys.clear();if(renderer)resize()}
function dispose(root){if(!root)return;let gs=new Set(),ms=new Set(),ts=new Set();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)gs.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){ms.add(m);for(const t of Object.values(m))if(t?.isTexture)ts.add(t)}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose())}
function init(){if(renderer)return;renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(37,1,.05,180);const pm=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();environment=pm.fromScene(room,.04);room.dispose();pm.dispose();renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();show('loading');$('#loadingText').textContent='Graphics context lost. Reload to retry.';$('#retry').hidden=false});addEventListener('resize',resize);const canvas=renderer.domElement;
 const canLook=()=>active==='world'&&$('#computerPanel').hidden&&!$('#dailyDialog').open&&!$('#storeDialog').open&&!$('#settingsDialog').open;
 const rotateLook=(dx,dy,scale=1)=>{yaw-=dx*.0034*scale*preferences.sensitivity;pitch=clamp(pitch+dy*.0029*scale*preferences.sensitivity,-.65,1.05);yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw))};
 const touches=new Map();let pinchDistance=0,gestureScale=1;const zoomBy=f=>{zoomTarget=clamp(zoomTarget*f,1.5,7)};
 canvas.style.touchAction='none';
 canvas.addEventListener('wheel',e=>{if(!canLook()||firstPerson)return;e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?240:1);zoomBy(Math.exp(clamp(delta,-180,180)*.0035))},{passive:false});
 canvas.addEventListener('gesturestart',e=>{if(!canLook()||firstPerson)return;e.preventDefault();gestureScale=1},{passive:false});
 canvas.addEventListener('gesturechange',e=>{if(!canLook()||firstPerson)return;e.preventDefault();const scale=Number(e.scale)||1;zoomBy(gestureScale/scale);gestureScale=scale},{passive:false});
 canvas.addEventListener('pointerdown',e=>{if(!canLook())return;if(e.pointerType==='mouse'){if(e.button!==0)return;if(document.pointerLockElement===canvas)return;try{const pending=canvas.requestPointerLock?.();pending?.catch?.(()=>{});}catch{}drag={x:e.clientX,y:e.clientY};}else{touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2){const [a,b]=[...touches.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);drag=null}else if(touches.size===1)drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)}});
 canvas.addEventListener('pointermove',e=>{if(!canLook()||document.pointerLockElement===canvas)return;if(e.pointerType!=='mouse'){if(!touches.has(e.pointerId))return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size>=2){const [a,b]=[...touches.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance>0&&d>0&&!firstPerson)zoomBy(pinchDistance/d);pinchDistance=d;drag=null;return}}if(e.pointerType==='mouse'&&!(e.buttons&1)){drag=null;return}if(drag)rotateLook(e.clientX-drag.x,e.clientY-drag.y,e.pointerType==='mouse'?1:1.3);drag={x:e.clientX,y:e.clientY}});
 document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&canLook())rotateLook(e.movementX,e.movementY)});
 document.addEventListener('pointerlockchange',()=>{drag=null;keys.clear();sprintHeld=false;const b=$('#mouseLook');if(b)b.textContent=document.pointerLockElement===canvas?'Mouse locked · Esc':'Lock mouse';});
 document.addEventListener('pointerlockerror',()=>{const b=$('#mouseLook');if(b)b.textContent='Lock mouse · retry'});
 for(const event of ['pointerleave','pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{touches.delete(e.pointerId);pinchDistance=0;drag=touches.size===1?[...touches.values()][0]:null})}
function mount(id){init();$('#'+id).prepend(renderer.domElement);resize()}
let autoPixelRatio=1,lowSamples=0,highSamples=0,lightBudgetAt=0;
function resize(){if(!renderer)return;let el=renderer.domElement.parentElement,w=el?.clientWidth,h=el?.clientHeight;if(!w||!h)return;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?.75:quality==='high'?1.5:active==='world'?autoPixelRatio:1.25));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function lighting(target,world=false){target.environment=environment.texture;target.add(new THREE.HemisphereLight(0xe2fff5,0x3b5660,world?2:1.7));for(let [x,y,z,i] of [[-3,5,4,2],[4,2,3,1.1],[0,4,-4,1.3]]){let l=new THREE.DirectionalLight(0xffffff,i);l.position.set(x,y,z);target.add(l)}}
function resetScene(){campusNpc=null;academy=null;journeyState?.signalWind?.dispose();orbit?.dispose();orbit=null;if(hero)hero.removeFromParent();dispose(scene);scene=new THREE.Scene();journeyState=null;camera.fov=37;camera.near=.05;camera.far=180;camera.updateProjectionMatrix()}
function smoothTopology(points,triangles,strength=.65){
 const vertices=[],ids=[],lookup=new Map(),edges=new Map(),neighbors=[],boundary=[];
 const extent=Math.max(...[0,1,2].map(k=>{let lo=Infinity,hi=-Infinity;for(const p of points){lo=Math.min(lo,p[k]);hi=Math.max(hi,p[k])}return hi-lo}));const eps=Math.max(extent*1e-6,1e-9);
 for(const p of points){const key=p.map(v=>Math.round(v/eps)).join(',');let id=lookup.get(key);if(id===undefined){id=vertices.length;lookup.set(key,id);vertices.push(p);neighbors.push(new Set());boundary.push(new Set())}ids.push(id)}
 const edgeKey=(a,b)=>a<b?a+':'+b:b+':'+a;
 for(const t of triangles){let v=t.map(i=>ids[i]);if(new Set(v).size!==3)continue;for(let k=0;k<3;k++){let a=v[k],b=v[(k+1)%3],c=v[(k+2)%3],key=edgeKey(a,b);neighbors[a].add(b);neighbors[b].add(a);if(!edges.has(key))edges.set(key,{a,b,op:[]});edges.get(key).op.push(c)}}
 for(const e of edges.values())if(e.op.length!==2){boundary[e.a].add(e.b);boundary[e.b].add(e.a)}
 const mix=(a,b,t)=>a.map((x,k)=>x+(b[k]-x)*t);
 const updated=vertices.map((v,i)=>{let n=[...neighbors[i]];if(boundary[i].size||n.length<3)return v.slice();const beta=n.length===3?3/16:3/(8*n.length);return mix(v,v.map((x,k)=>(1-n.length*beta)*x+beta*n.reduce((sum,id)=>sum+vertices[id][k],0)),strength)});
 for(const e of edges.values()){const a=vertices[e.a],b=vertices[e.b],mid=a.map((x,k)=>(x+b[k])*.5);e.id=updated.length;updated.push(e.op.length===2?mix(mid,mid.map((_,k)=>.375*(a[k]+b[k])+.125*(vertices[e.op[0]][k]+vertices[e.op[1]][k])),strength):mid)}
 const result=[];for(const t of triangles){let v=t.map(i=>ids[i]);if(new Set(v).size!==3)continue;let m=[0,1,2].map(k=>edges.get(edgeKey(v[k],v[(k+1)%3])).id);
 const a={id:v[0],src:[t[0]]},b={id:v[1],src:[t[1]]},c={id:v[2],src:[t[2]]},ab={id:m[0],src:[t[0],t[1]]},bc={id:m[1],src:[t[1],t[2]]},ca={id:m[2],src:[t[2],t[0]]};result.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca])}
 return {positions:updated,triangles:result};
}
function refineMesh(mesh){
 const g=mesh.geometry,pos=g?.attributes.position;if(!pos||pos.count<120||pos.count>30000||g.morphAttributes.position?.length||g.groups.length>1)return false;
 const count=g.index?.count||pos.count;if(count%3||count/3>16000)return false;
 const points=Array.from({length:pos.count},(_,i)=>[pos.getX(i),pos.getY(i),pos.getZ(i)]),tris=[];for(let i=0;i<count;i+=3)tris.push([0,1,2].map(k=>g.index?g.index.getX(i+k):i+k));
 const t=smoothTopology(points,tris),normals=t.positions.map(()=>new THREE.Vector3());if(!t.triangles.length)return false;
 const v=t.positions.map(p=>new THREE.Vector3(...p));for(const tri of t.triangles){const [a,b,c]=tri.map(x=>v[x.id]);const n=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a));for(const corner of tri)normals[corner.id].add(n)}
 normals.forEach(n=>n.normalize());const out=new THREE.BufferGeometry(),positions=[],normal=[],attributes={};for(const [key,a] of Object.entries(g.attributes))if(['uv','uv1','color'].includes(key))attributes[key]={a,values:[]};
 const skinIndex=g.attributes.skinIndex,skinWeight=g.attributes.skinWeight,si=[],sw=[];
 for(const tri of t.triangles)for(const c of tri){positions.push(...t.positions[c.id]);normal.push(...normals[c.id].toArray());for(const {a,values} of Object.values(attributes))for(let k=0;k<a.itemSize;k++){let get=(i)=>[a.getX(i),a.getY(i),a.itemSize>2?a.getZ(i):0,a.itemSize>3?a.getW(i):0][k];values.push(c.src.reduce((sum,i)=>sum+get(i),0)/c.src.length)}
 if(skinIndex&&skinWeight){const weights=new Map();for(const i of c.src){const ids=[skinIndex.getX(i),skinIndex.getY(i),skinIndex.getZ(i),skinIndex.getW(i)],w=[skinWeight.getX(i),skinWeight.getY(i),skinWeight.getZ(i),skinWeight.getW(i)];for(let k=0;k<4;k++)weights.set(ids[k],(weights.get(ids[k])||0)+w[k]/c.src.length)}let best=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4);while(best.length<4)best.push([0,0]);let sum=best.reduce((a,b)=>a+b[1],0);if(sum<1e-8)best=[[skinIndex.getX(c.src[0]),1],[0,0],[0,0],[0,0]],sum=1;si.push(...best.map(x=>x[0]));sw.push(...best.map(x=>x[1]/sum))}
 }
 out.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));out.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));for(const [key,{a,values}] of Object.entries(attributes))out.setAttribute(key,new THREE.Float32BufferAttribute(values,a.itemSize));if(skinIndex&&skinWeight){out.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));out.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4))}
 out.computeBoundingBox();out.computeBoundingSphere();mesh.geometry=out;mesh.frustumCulled=false;g.dispose();return true;
}
function polishModel(root){
 const maxAniso=renderer?.capabilities?.getMaxAnisotropy?.()||4;
 root.traverse(o=>{if(!o.isMesh)return;const mm=(Array.isArray(o.material)?o.material:[o.material]).filter(Boolean);
 const smallDetail=mm.some(m=>/eye|brow|lash|teeth/i.test(m.name||''));
 if(!smallDetail&&!o.isSkinnedMesh)refineMesh(o);
 if(!o.geometry?.attributes.normal&&o.geometry?.attributes.position)o.geometry.computeVertexNormals();
 if(o.isSkinnedMesh)o.frustumCulled=false;
 for(const m of mm){
  const name=m.name||'';
  if(/eye|brow|lash|teeth/i.test(name)){m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-2}
  if(!smallDetail){m.flatShading=false;if(m.isMeshStandardMaterial){const metal=/metal|gold|silver|armor|armour/i.test(name),skin=/skin|face/i.test(name);m.roughness=THREE.MathUtils.clamp(m.roughness??.8,metal?.28:skin?.48:.58,.96);m.metalness=metal?Math.max(.25,m.metalness??0):Math.min(.20,m.metalness??0);m.envMapIntensity=metal?.85:.65}}
  for(const k of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap']){const tex=m[k];if(!tex)continue;tex.anisotropy=Math.min(maxAniso,8);tex.magFilter=THREE.LinearFilter;if(tex.generateMipmaps)tex.minFilter=THREE.LinearMipmapLinearFilter;tex.needsUpdate=true}
  m.needsUpdate=true;
 }});
}
function fit(root){root.traverse(o=>{if(o.isMesh&&/pistol|weapon|rifle|gun/i.test(o.name))o.visible=false});polishModel(root);root.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());if(!Number.isFinite(size.y)||size.y<.001)throw Error('Invalid model');let wrapper=new THREE.Group(),pivot=new THREE.Group();pivot.add(root);let scale=1.7/size.y;pivot.scale.setScalar(scale);pivot.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);wrapper.add(pivot);return wrapper}
function previewScene(){mount('preview');resetScene();scene.background=new THREE.Color(0x102b30);lighting(scene);const disc=new THREE.Mesh(new THREE.CylinderGeometry(.85,.94,.08,64),new THREE.MeshStandardMaterial({color:0x285357,roughness:.8}));disc.position.y=-.05;scene.add(disc);camera.position.set(.6,1.22,3.65);orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,.85,0);orbit.enablePan=false;orbit.enableDamping=true;orbit.minDistance=2;orbit.maxDistance=5;orbit.update();if(hero){hero.position.set(0,0,0);hero.rotation.set(0,0,0);scene.add(hero);walkAction?.stop();idleAction?.play()}}
function renderCards(){let el=$('#cards');el.replaceChildren();for(let r of catalog.filter(r=>filter==='all'||r.gender===filter)){let b=document.createElement('button');b.className='character'+(r.exclusive?' royal-card':'');b.setAttribute('aria-pressed',String(selected?.id===r.id));b.disabled=!r.ready;let tile=document.createElement('span');tile.className='tile';if(thumbs.has(r.id)){let img=document.createElement('img');img.src=thumbs.get(r.id);img.alt=r.name;tile.append(img)}else tile.textContent=r.exclusive?'👑':'3D';let name=document.createElement('strong');name.textContent=r.name;let sub=document.createElement('small');sub.textContent=r.exclusive?(r.locked?'🔒 Admin Only':'👑 Admin Only · Unlocked'):r.theme;b.append(tile,name,sub);b.onclick=()=>loadCharacter(r);el.append(b)}}
async function loadCharacter(r){if(busy)return;selected=r;let seq=++sequence;$('#begin').disabled=true;$('#begin').textContent=r.locked?'🔒 Admin Only':'Begin my journey →';$('#modelMessage').hidden=false;$('#modelMessage').textContent='Loading '+r.name+'…';$('#characterName').textContent=r.name;$('#characterTheme').textContent=r.theme+' · Drag to rotate';$('#charError').textContent='';renderCards();try{let response=await fetch(r.model);if(!response.ok)throw Error('Character unavailable');let gltf=await loader.parseAsync(await response.arrayBuffer(),'/');if(seq!==sequence||active!=='characters'){dispose(gltf.scene);return}let next=fit(gltf.scene);if(r.id==='male-king')royalFinish(next);if(hero){mixer?.stopAllAction();hero.removeFromParent();dispose(hero)}hero=next;cosmeticRig(hero);motion=createHumanoidMotion(hero);clips=motion?[]:gltf.animations;mixer=new THREE.AnimationMixer(hero);idleAction=null;walkAction=null;const idle=clips.find(c=>/^idle$/i.test(c.name));const walk=clips.find(c=>/^walk$/i.test(c.name));if(idle){idleAction=mixer.clipAction(idle);idleAction.play()}if(walk)walkAction=mixer.clipAction(walk);scene.add(hero);$('#modelMessage').hidden=true;$('#begin').disabled=!r.selectable;$('#begin').textContent=r.locked?'🔒 Admin Only':'Begin my journey →';if(r.locked)$('#charError').textContent='This character is reserved for admins. You can preview it, but cannot select it.';try{thumbs.set(r.id,thumbnail(hero));renderCards()}catch{}fillThumbs()}catch(e){if(seq===sequence){$('#modelMessage').textContent='Model unavailable. Choose another or retry.';$('#charError').textContent=e.message;$('#begin').disabled=true}}}
function thumbnail(target){const w=280,h=320;thumbTarget??=new THREE.WebGLRenderTarget(w,h);thumbTarget.texture.colorSpace=THREE.SRGBColorSpace;const temp=new THREE.Scene();temp.background=new THREE.Color(0x19393d);lighting(temp);const c=new THREE.PerspectiveCamera(35,w/h,.05,100);c.position.set(.4,1.05,3.4);c.lookAt(0,.85,0);let parent=target.parent,previous=renderer.getRenderTarget();temp.add(target);try{renderer.setRenderTarget(thumbTarget);renderer.clear();renderer.render(temp,c);let pix=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(thumbTarget,0,0,w,h,pix);let canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;let ctx=canvas.getContext('2d'),im=ctx.createImageData(w,h);for(let y=0;y<h;y++)im.data.set(pix.subarray((h-y-1)*w*4,(h-y)*w*4),y*w*4);ctx.putImageData(im,0,0);return canvas.toDataURL('image/webp',.92)}finally{target.removeFromParent();if(parent)parent.add(target);renderer.setRenderTarget(previous)}}
async function fillThumbs(){if(thumbRunning||active!=='characters'||document.hidden)return;thumbRunning=true;try{for(const r of catalog){if(active!=='characters'||document.hidden)break;if(!r.ready||thumbs.has(r.id))continue;let tmp;try{let res=await fetch(r.model);if(!res.ok)continue;let g=await loader.parseAsync(await res.arrayBuffer(),'/');if(active!=='characters'){dispose(g.scene);break}tmp=fit(g.scene);if(r.id==='male-king')royalFinish(tmp);thumbs.set(r.id,thumbnail(tmp));renderCards()}catch{}finally{if(tmp)dispose(tmp)}await new Promise(r=>setTimeout(r,120))}}finally{thumbRunning=false}}
function openCharacters(){show('characters');try{previewScene();renderCards();const r=catalog.find(r=>r.id===avatar.characterId&&r.selectable)||catalog.find(r=>r.selectable);if(r)loadCharacter(r);else $('#charError').textContent='No character models are available.'}catch(e){$('#charError').textContent='3D graphics unavailable: '+e.message}}
function beginJourney(){if(!hero||!selected?.selectable)return;show('journey');mount('journeyStage');resetScene();journeyState=makeJourney(scene);smoothed=progress=0;portalStart();chapterIndex=-1;journeyReadyAt=performance.now();$('#routeDirection').textContent='FORWARD / SIGNAL ACQUIRED';updateChapter(0);$('#scrollHint').textContent=checkpoint?'↓ SCROLL TO RETURN TO YOUR LAST LOCATION':reduce?'SCROLL OR SKIP':'↓ SCROLL TO EXPLORE';}
function updateChapter(p){let n=Math.min(chapters.length-1,Math.floor(clamp(p,0,1)*chapters.length));if(n===chapterIndex)return;chapterIndex=n;const [id,title,desc]=chapters[n];$('#chapter').textContent=id;$('#filmTitle').innerHTML=title;$('#filmText').textContent=desc;$('#chapterCount').textContent=String(n+1).padStart(2,'0')+' / '+chapters.length;$$('.route-dot').forEach((b,i)=>{b.classList.toggle('done',i<n);b.classList.toggle('current',i===n)});if(!reduce&&$('#filmCopy').animate)$('#filmCopy').animate([{opacity:.2,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:620,easing:'cubic-bezier(.2,.65,.2,1)'})}
function onScroll(){if(active!=='journey')return;let el=$('#journey'),max=Math.max(1,el.offsetHeight-innerHeight);progress=clamp(-el.getBoundingClientRect().top/max,0,1);$('#progress').style.width=(progress*100)+'%';$('#routeDirection').textContent=progress<.40?'FORWARD / SIGNAL ACQUIRED':progress<.66?'TURN RIGHT / NEW SECTOR':progress<.80?'FORWARD / DATA CORE':'DESCENT / DEEP GATEWAY';$('.progress').setAttribute('aria-valuenow',String(Math.round(progress*100)))}

 // Independent, non-selectable campus NPC. Stylized reference likeness;
 // no player catalog entry and no original photograph distributed publicly.
 let campusNpc=null;
 function createCampusNpc(world,academyState){
  const root=new THREE.Group();root.name='Campus roaming NPC';world.add(root);

  // Continuous anatomical surfaces and weighted joints, no photo assets.
  const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.88});
  const skin=mat(0xc18c73),hair=mat(0x191613),shirt=mat(0x711f31),dark=mat(0x511521),tee=mat(0xe9e2d7),pants=mat(0x26292d),shoe=mat(0x59282c),sole=mat(0xa18360),white=mat(0xe2dbd2),iris=mat(0x4b3024),lip=mat(0x956254),metal=mat(0x969696);
  const sphere=new THREE.SphereGeometry(1,20,14);
  function group(p,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g}
  function ell(p,m,x,y,z,w,h,d){const o=new THREE.Mesh(sphere,m);o.position.set(x,y,z);o.scale.set(w,h,d);p.add(o);return o}
  function geo(rings,n=32,modify=null,colour=null){
   const v=[],ix=[],rgb=[];for(let i=0;i<rings.length;i++){const [y,w,d,z=0,x=0]=rings[i];for(let k=0;k<n;k++){let a=k/n*2*Math.PI,p=[x+Math.sin(a)*w,y,z+Math.cos(a)*d];if(modify)p=modify(p,a,i);v.push(...p);if(colour){let c=colour(p,a);rgb.push(c.r,c.g,c.b)}}}
   for(let i=0;i<rings.length-1;i++)for(let k=0;k<n;k++){let a=i*n+k,b=i*n+(k+1)%n,c=a+n,d=b+n;ix.push(a,b,c,b,d,c)}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));if(colour)g.setAttribute('color',new THREE.Float32BufferAttribute(rgb,3));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingSphere();return g
  }
  function loft(p,m,r,n=32,mod=null,col=null){let o=new THREE.Mesh(geo(r,n,mod,col),m);p.add(o);return o}
  function line(p,m,pts,r=.003){const o=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(a=>new THREE.Vector3(...a))),12,r,5,false),m);p.add(o);return o}
  function limb(p,m,r,joint){
   const g=geo(r,24),ix=[],wt=[],v=g.attributes.position;for(let k=0;k<v.count;k++){let t=THREE.MathUtils.smoothstep(-v.getY(k),-joint-.09,-joint+.09);ix.push(0,1,0,0);wt.push(1-t,t,0,0)}
   g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ix,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(wt,4));
   const o=new THREE.SkinnedMesh(g,m),a=new THREE.Bone(),b=new THREE.Bone();b.position.y=joint;a.add(b);o.add(a);p.add(o);root.updateMatrixWorld(true);o.bind(new THREE.Skeleton([a,b]));o.frustumCulled=false;return {a,b}
  }
  const body=group(root,0,0,0),hips=group(body,0,.83,0);
  loft(body,pants,[[.72,.006,.006],[.77,.198,.114],[.86,.207,.137],[.96,.192,.128],[.97,.005,.005]]);
  loft(body,shirt,[[.89,.005,.005],[.895,.207,.129],[.93,.219,.144],[1.02,.226,.158],[1.16,.239,.159],[1.29,.247,.144],[1.40,.248,.121],[1.445,.185,.106],[1.475,.103,.088],[1.48,.004,.004]],40);
  loft(body,dark,[[.887,.207,.130],[.91,.219,.142],[.929,.218,.141]]);
  const patch=(p,m,v,idx)=>{let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v.flat(),3));g.setIndex(idx);g.computeVertexNormals();let o=new THREE.Mesh(g,m);p.add(o)};
  tee.side=THREE.DoubleSide;dark.side=THREE.DoubleSide;
  patch(body,tee,[[-.078,1.457,.101],[.078,1.457,.101],[-.044,1.37,.147],[.044,1.37,.147],[0,1.335,.16]],[0,2,1,1,2,3,2,4,3]);
  for(let side of [-1,1])patch(body,dark,[[side*.075,1.479,.095],[side*.115,1.45,.11],[side*.055,1.36,.153],[side*.032,1.412,.136]],[0,2,1,0,3,2]);
  line(body,metal,[[0,.94,.151],[0,1.08,.165],[0,1.23,.159],[0,1.33,.161]],.0023);
  for(let side of [-1,1])line(body,dark,[[side*.135,1.025,.131],[side*.177,1.08,.108],[side*.194,1.13,.088]],.002);
  loft(body,skin,[[1.43,.072,.064],[1.49,.068,.069],[1.54,.075,.073],[1.57,.085,.073]]);
  const head=group(body,0,1.49,0),rings=[[-.005,.003,.003,.015],[.005,.055,.059,.024],[.024,.083,.077,.017],[.047,.101,.092,.009],[.071,.113,.104,.004],[.099,.121,.111,.001],[.125,.123,.114,-.004],[.147,.122,.117,-.006],[.169,.119,.119,-.008],[.195,.115,.117,-.010],[.219,.105,.109,-.010],[.243,.079,.081,-.012],[.259,.04,.041,-.012],[.264,.002,.002,-.012]];
  const g=(x,s)=>Math.exp(-x*x/(s*s));
  const mod=(p,a)=>{let [x,y,z]=p,f=Math.pow(Math.max(0,Math.cos(a)),2);z+=f*(.027*g(x,.022)*g(y-.115,.058)+.025*g(x,.030)*g(y-.083,.020)+.012*g(x,.044)*g(y-.040,.023)-.012*g(Math.abs(x)-.05,.027)*g(y-.137,.023));return [x,y,z]};
  const base=new THREE.Color(0xc18c73),stubble=new THREE.Color(0x49362e),cheek=new THREE.Color(0xb97061),facemat=mat(0xffffff);facemat.vertexColors=true;
  const colour=([x,y,z],a)=>{let c=base.clone().lerp(cheek,.15*g(Math.abs(x)-.075,.033)*g(y-.09,.026)*Math.max(0,Math.cos(a))),jaw=.047+Math.abs(x)*.35,amount=y<jaw&&Math.cos(a)>-.65?THREE.MathUtils.smoothstep(jaw-y,0,.025)*.83:0;if(Math.abs(x)<.05&&Math.abs(y-.060)<.009&&Math.cos(a)>.8)amount=Math.max(amount,.35);return c.lerp(stubble,amount)};
  const dense=[];for(let i=0;i<rings.length-1;i++)for(let k=0;k<4;k++)dense.push(rings[i].map((v,j)=>v+(rings[i+1][j]-v)*k/4));dense.push(rings.at(-1));loft(head,facemat,dense,64,mod,colour);
  function front(x,y){let i=0;while(i<rings.length-2&&rings[i+1][0]<y)i++;let a=rings[i],b=rings[i+1],t=THREE.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1),rx=a[1]+(b[1]-a[1])*t,rz=a[2]+(b[2]-a[2])*t,cz=a[3]+(b[3]-a[3])*t,ang=Math.asin(THREE.MathUtils.clamp(x/rx,-.99,.99));return mod([x,y,cz+Math.cos(ang)*rz],ang)[2]}
  for(let side of [-1,1]){
   ell(head,skin,side*.121,.116,-.003,.017,.037,.024);ell(head,lip,side*.132,.115,.006,.006,.020,.010);
   const x=side*.048,y=.137,z=front(x,y);ell(head,white,x,y,z+.001,.025,.0095,.006);ell(head,iris,x,y,z+.007,.0085,.0087,.0028);ell(head,hair,x,y,z+.009,.0038,.0045,.0018);
   line(head,skin,[[x-.025,y,front(x-.025,y)+.002],[x-.012,y+.010,front(x-.012,y+.010)+.006],[x+.012,y+.010,front(x+.012,y+.010)+.006],[x+.025,y,front(x+.025,y)+.002]],.0026);
   line(head,hair,[[x-.029,y+.022,front(x-.029,y+.022)+.002],[x-.010,y+.029,front(x-.010,y+.029)+.003],[x+.012,y+.027,front(x+.012,y+.027)+.003],[x+.027,y+.020,front(x+.027,y+.020)+.002]],.004);
   ell(head,hair,side*.019,.075,front(side*.019,.075)+.001,.006,.0025,.002);
  }
  line(head,lip,[[-.032,.047,front(-.032,.047)+.001],[0,.045,front(0,.045)+.002],[.032,.047,front(.032,.047)+.001]],.0021);
  loft(head,hair,Array.from({length:21},(_,i)=>[i/20,1,1,0]),48,(p,a,i)=>{let t=i/20,fr=Math.max(0,Math.cos(a)),bk=Math.max(0,-Math.cos(a)),y=.105+.087*fr-.022*bk+.010*Math.sin(a)*fr,phi=t*Math.PI/2;return [Math.sin(a)*.129*Math.cos(phi)-.010*Math.sin(phi),y+(.282-y)*Math.sin(phi),-.009+Math.cos(a)*.126*Math.cos(phi)]});
  const arms=[],legs=[];
  for(let side of [-1,1]){
   const shoulder=group(body,side*.221,1.405,0);
   const arm=limb(shoulder,shirt,[[-.535,.050,.048,0,side*.055],[-.50,.054,.052,0,side*.056],[-.44,.061,.060,0,side*.060],[-.34,.065,.066,0,side*.061],[-.27,.071,.070,0,side*.053],[-.21,.077,.076,0,side*.04],[-.13,.086,.080,0,side*.028],[-.055,.084,.082,0,side*.010],[.016,.070,.065,0,-side*.008],[.047,.006,.006]],-.275);
   const hand=group(arm.b,side*.055,-.26,0);
   loft(hand,skin,[[-.145,.005,.005,.006],[-.13,.033,.020,.005],[-.09,.040,.027,0],[-.04,.039,.030,0],[0,.045,.039],[.02,.038,.035]],20);ell(hand,skin,-side*.031,-.067,.016,.014,.043,.015);
   loft(hand,dark,[[-.011,.049,.048],[.014,.053,.052],[.024,.052,.051]],24);
   if(side===-1){loft(hand,metal,[[-.024,.046,.038],[-.010,.046,.038]],24);ell(hand,hair,0,-.017,.040,.020,.014,.006)}
   arms.push(arm.a);
   const hip=group(hips,side*.103,0,0),leg=limb(hip,pants,[[-.735,.073,.066],[-.70,.077,.071],[-.62,.078,.078,-.003],[-.52,.087,.089,-.008],[-.43,.086,.083],[-.36,.087,.088,.008],[-.28,.102,.104,.006],[-.17,.112,.118],[-.06,.109,.120],[.035,.092,.107],[.075,.007,.008]],-.385);
   const foot=group(leg.b,0,-.343,0);loft(foot,shoe,[[-.067,.076,.125,.052],[-.053,.084,.136,.052],[-.025,.083,.133,.050],[.006,.076,.113,.036],[.044,.068,.072,.005],[.057,.061,.066]],24);
   loft(foot,sole,[[-.102,.003,.003,.052],[-.100,.074,.126,.052],[-.085,.085,.137,.052],[-.064,.084,.136,.052]],24);line(foot,hair,[[-.033,.019,.079],[.033,.019,.085],[-.033,.008,.103],[.033,.006,.109]],.0023);legs.push({leg:leg.a,knee:leg.b,foot});
  }
  const state={...academyState,level:0};
  const safe=(x,z)=>z<-.65&&z>-30&&x>-28&&x<12&&!onAcademyStairs(x,z,-.35)&&!inAdaHall(x,z)&&academyWalkable(state,x,z,.35);
  const step=.40,cell=(x,z)=>[Math.round(x/step),Math.round(z/step)],key=(x,z)=>x+','+z;
  function nearest(x,z){const [cx,cz]=cell(x,z);for(let n=0;n<=7;n++)for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){if(Math.max(Math.abs(i),Math.abs(j))!==n)continue;let a=cx+i,b=cz+j;if(safe(a*step,b*step))return [a,b]}return null}
  const start=nearest(-1.2,-2.5)||nearest(1.35,-3);if(!start){world.remove(root);return null}
  root.position.set(start[0]*step,0,start[1]*step);
  let route=[],pause=0,phase=0,targetIndex=0;
  const stops=[[-1.2,-2.5],[-.8,-9.3],[-2.8,-13.2],[-9.8,-13.7],[-.6,-22], [6.4,-24], [4.6,-13.1]];
  function plan(){
   const a=nearest(root.position.x,root.position.z);if(!a)return;
   const q=[a],parents=new Map([[key(...a),null]]);
   for(let i=0;i<q.length&&q.length<9500;i++){let [x,z]=q[i];for(let [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){let nx=x+dx,nz=z+dz,k=key(nx,nz);if(parents.has(k)||!safe(nx*step,nz*step)||!safe((x+nx)*step/2,(z+nz)*step/2))continue;parents.set(k,[x,z]);q.push([nx,nz])}}
   let dest=null;for(let j=0;j<stops.length;j++){let p=stops[targetIndex++%stops.length],b=nearest(...p);if(b&&parents.has(key(...b))&&Math.hypot((b[0]-a[0])*step,(b[1]-a[1])*step)>2){dest=b;break}}
   if(!dest){dest=q.reduce((best,p)=>Math.hypot(p[0]-a[0],p[1]-a[1])>Math.hypot(best[0]-a[0],best[1]-a[1])?p:best,a)}
   let path=[];for(let p=dest;p;p=parents.get(key(...p)))path.push({x:p[0]*step,z:p[1]*step});
   route=path.reverse();if(route.length<2)pause=2;
  }
  plan();
  return {root,update(dt,player){
   let walking=false;pause=Math.max(0,pause-dt);
   if(!pause&&route.length){
    let p=route[0],dx=p.x-root.position.x,dz=p.z-root.position.z,d=Math.hypot(dx,dz);
    if(d<.025){route.shift();if(!route.length)pause=1.8}
    else {const amount=Math.min(d,1.0*dt),nx=root.position.x+dx/d*amount,nz=root.position.z+dz/d*amount;
     if(player&&academyState.level===0&&Math.hypot(player.x-nx,player.z-nz)<.68){/* yield to player */}
     else if(safe(nx,nz)){root.position.x=nx;root.position.z=nz;walking=true;const angle=Math.atan2(dx,dz),diff=Math.atan2(Math.sin(angle-root.rotation.y),Math.cos(angle-root.rotation.y));root.rotation.y+=diff*(1-Math.exp(-dt*12))}
     else {route=[];pause=.8}
    }
   }else if(!pause&&!route.length)plan();
   root.position.y=academyGround(root.position.x,root.position.z,0);
   if(walking)phase+=dt*7.5;
   body.position.y=THREE.MathUtils.damp(body.position.y,walking?.012*Math.abs(Math.sin(phase)):0,12,dt);
   for(let i=0;i<2;i++){let swing=walking?Math.sin(phase+i*Math.PI)*.34:0;legs[i].leg.rotation.x=THREE.MathUtils.damp(legs[i].leg.rotation.x,swing,12,dt);legs[i].knee.rotation.x=THREE.MathUtils.damp(legs[i].knee.rotation.x,walking?Math.max(0,-swing)*.85:0,12,dt);arms[i].rotation.x=THREE.MathUtils.damp(arms[i].rotation.x,-swing*.65,12,dt)}
  }};
 }

function enterWorld(){if(!['journey','characters'].includes(active)||!hero)return;void loadProgress();void loadStore();show('world');mount('worldStage');resetScene();academy=makeAcademy(scene);campusNpc=createCampusNpc(scene,academy);autoPixelRatio=1;lowSamples=highSamples=0;lightBudgetAt=0;resize();camera.near=.12;camera.far=70;camera.updateProjectionMatrix();drag=null;scene.environment=environment.texture;ambientLight=new THREE.HemisphereLight(0xfff0dd,0x403a35,1.15);scene.add(ambientLight);const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sh=shadowCanvas.getContext('2d'),grad=sh.createRadialGradient(64,64,4,64,64,62);grad.addColorStop(0,'rgba(0,0,0,.55)');grad.addColorStop(.5,'rgba(0,0,0,.24)');grad.addColorStop(1,'rgba(0,0,0,0)');sh.fillStyle=grad;sh.fillRect(0,0,128,128);contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));contactShadow.rotation.x=-Math.PI/2;scene.add(contactShadow);hero.position.set(.5+ENTRANCE_OFFSET,-1.8,30);groundY=-1.8;jumpOffset=0;hero.rotation.set(0,Math.PI,0);scene.add(hero);yaw=0;pitch=.16;movingBefore=false;moveSpeed=0;moveX=0;moveZ=0;doorGesture=null;seatAction=null;jumpVelocity=0;airborne=false;firstPerson=false;sprintHeld=sprintToggle=false;lightGesture=null;$('#sprintAction').setAttribute('aria-pressed','false');closeComputer();hero.visible=true;motion?.setReach(null,0);motion?.setSeat(0);motion?.setAir(0);motion?.setTerrain?.((x,z)=>academyGround(x,z,academy.level));idleAction?.reset().play();walkAction?.stop();$('#welcome').textContent='Welcome, '+profile.first+'!';$('#zone').textContent='E PLAZA · Exterior';$('#doorAction').hidden=true;lastFps=performance.now();frameCount=0;camera.position.set(.5+ENTRANCE_OFFSET,.25,33.0);camera.lookAt(.5+ENTRANCE_OFFSET,-.55,25);if(checkpoint){const c=checkpoint;academy.level=c.level;if((c.level===1?c.layout===3:c.z>=0||c.layout===2||c.layout===3)&&academyWalkable(academy,c.x,c.z)){groundY=academyGround(c.x,c.z,c.level);hero.position.set(c.x,groundY,c.z);yaw=c.yaw;hero.rotation.y=yaw+Math.PI;camera.position.set(c.x+Math.sin(yaw)*3,groundY+1.6,c.z+Math.cos(yaw)*3);camera.lookAt(c.x,groundY+1.2,c.z)}else academy.level=0}}
function toggleAcademyDoor(){if(seatAction||airborne||lightGesture||doorGesture||active!=='world'||!academy||!hero)return;
 const pos=hero.position,outer=plazaDoorNearby(academy,pos.x,pos.z),near=outer||doorNearby(academy,pos.x,pos.z);if(!near){const d=nearbyInteriorDoor(academy,pos.x,pos.z);if(d)d.open=!d.open;return;}
 const z0=outer?23:0,door=outer?academy.plazaDoor:academy.door,key=outer?'plazaOpen':'open',side=pos.z>=z0?1:-1;
 if(academy[key]&&Math.abs(pos.z-z0)<.55)return;
 if(!motion){academy[key]=!academy[key];return}
 const localHandle=new THREE.Vector3(outer?-.83:-1.03,outer?1.15:1.04,.11*side),handle=door.localToWorld(localHandle.clone());
 const candidates=academy[key]?Array.from({length:16},(_,i)=>{let a=i*Math.PI/8;return new THREE.Vector3(handle.x+.55*Math.cos(a),0,handle.z+.55*Math.sin(a))}):[new THREE.Vector3((outer?.30:3.98)+ENTRANCE_OFFSET,0,z0+side*.66),new THREE.Vector3((outer?.55:4.21)+ENTRANCE_OFFSET,0,z0+side*.66)];let goal=null,best=Infinity;
 for(let pt of candidates){if(Math.sign(pt.z-z0)!==side||!academyWalkable(academy,pt.x,pt.z))continue;const d=Math.hypot(pt.x-pos.x,pt.z-pos.z);if(d<best){goal=pt;best=d}}
 if(!goal)return;doorGesture={time:0,approach:0,goal,side,fired:false,door,key,localHandle};moveX=moveZ=moveSpeed=0;
}
$('#doorAction').onclick=toggleAcademyDoor;
$('#waveAction').onclick=()=>motion?.wave();
function interact(){
 if(!$('#computerPanel').hidden)return;
 if(active!=='world'||!academy||!hero||airborne||doorGesture||lightGesture)return;
 if(seatAction){if(seatAction.stage==='seated'){seatAction.stage='stand';seatAction.time=0}return}
 const pos=hero.position;if(doorNearby(academy,pos.x,pos.z)||plazaDoorNearby(academy,pos.x,pos.z)||nearbyInteriorDoor(academy,pos.x,pos.z)){toggleAcademyDoor();return}
 const next=motion&&nearestAcademySeat(academy,pos.x,pos.z);if(!next)return;
 seatAction={...next,stage:'approach',time:0};moveX=moveZ=moveSpeed=0;motion.setReach(null,0);
}
function jump(){if(active!=='world'||!hero||airborne||seatAction||doorGesture||lightGesture||$('#dailyDialog').open||$('#storeDialog').open||$('#settingsDialog').open||!$('#computerPanel').hidden)return;const p=hero.position;if((Math.abs(p.x+5.45)<.85&&p.z>=-8.85&&p.z<=-1.65)||(p.z>18.45&&p.z<22.55))return;jumpVelocity=3.1;airborne=true;}
function setComputerPower(pc,on){pc.on=on;pc.display.color.setHex(on?0x204956:0x10171c);pc.display.emissive.setHex(on?0x62cced:0x000000);pc.display.emissiveIntensity=on?.65:0}
function closeComputer(){$('#computerPanel').hidden=true;drag=null;keys.clear();$('#computerInput').value=''}
function useComputer(){if(active!=='world'||seatAction?.stage!=='seated'||!seatAction.seat.computer)return;if(document.pointerLockElement)document.exitPointerLock?.();setComputerPower(seatAction.seat.computer,true);$('#computerPanel').hidden=false;keys.clear();$('#computerOutput').textContent='AcademyOne OS / Local workstation\nType help to see the available commands.';$('#computerInput').focus()}
function writeConsole(line){const out=$('#computerOutput');out.textContent+=(out.textContent?'\n':'')+line;if(out.textContent.length>9000)out.textContent=out.textContent.slice(-7000);out.scrollTop=out.scrollHeight}
$('#computerClose').onclick=closeComputer;$('#computerPower').onclick=()=>{if(seatAction?.seat.computer)setComputerPower(seatAction.seat.computer,false);closeComputer()};
$('#computerForm').addEventListener('submit',e=>{e.preventDefault();const el=$('#computerInput'),raw=el.value.trim();el.value='';if(!raw)return;const cmd=raw.toLowerCase();if(cmd==='clear'){$('#computerOutput').textContent='';return}writeConsole('> '+raw);if(cmd==='help')writeConsole('help  |  whoami  |  status  |  echo <text>  |  clear  |  exit');else if(cmd==='whoami')writeConsole([profile.first,profile.last].filter(Boolean).join(' ')||'Student');else if(cmd==='status')writeConsole('Workstation online. Local simulation; no shell access.');else if(cmd.startsWith('echo '))writeConsole(raw.slice(5));else if(cmd==='exit')closeComputer();else writeConsole('Unknown command. Type help.');});
function switchLight(){if(active!=='world'||!academy||!hero||seatAction||airborne||doorGesture||lightGesture||!$('#computerPanel').hidden)return;const c=nearbyLightSwitch(academy,hero.position.x,hero.position.z);if(!c)return;if(!motion){setLightCircuit(c,!c.on);return}lightGesture={c,time:0,fired:false};moveX=moveZ=moveSpeed=0}
$('#lightAction').onclick=switchLight;$('#sprintAction').onclick=()=>{sprintToggle=!sprintToggle;$('#sprintAction').setAttribute('aria-pressed',String(sprintToggle))};
function toggleView(){if(active!=='world'||!hero)return;firstPerson=!firstPerson;hero.visible=!firstPerson;}
$('#mouseLook').onclick=()=>{if(active!=='world'||!renderer)return;if(document.pointerLockElement){document.exitPointerLock?.();return}try{const p=renderer.domElement.requestPointerLock?.();p?.catch?.(()=>{});}catch{}};$('#seatAction').onclick=interact;$('#jumpAction').onclick=jump;$('#computerAction').onclick=useComputer;$('#viewAction').onclick=toggleView;
function worldFrame(dt){
 if(!academy)return;if($('#computerPanel').hidden){yaw+=(Number(keys.has('arrowleft'))-Number(keys.has('arrowright')))*1.9*dt;pitch=clamp(pitch+(Number(keys.has('arrowdown'))-Number(keys.has('arrowup')))*1.35*dt,-.18,1.05)}advanceDoor(academy,dt);const pos=hero.position,dx=Number(keys.has('d'))-Number(keys.has('a')),dz=Number(keys.has('s'))-Number(keys.has('w'));let moving=false,actualSpeed=0;const onStairs=onAcademyStairs(pos.x,pos.z,-.10)||(pos.z>18.45&&pos.z<22.55);const inputLength=doorGesture||seatAction||lightGesture||$('#dailyDialog').open||$('#storeDialog').open||$('#settingsDialog').open||!$('#computerPanel').hidden?0:Math.hypot(dx,dz),desiredSpeed=inputLength?(onStairs?1.05:(keys.has('shift')||sprintHeld||sprintToggle)?3.25:1.40):0;
 const targetX=inputLength?(dx*Math.cos(yaw)+dz*Math.sin(yaw))/inputLength*desiredSpeed:0,targetZ=inputLength?(dz*Math.cos(yaw)-dx*Math.sin(yaw))/inputLength*desiredSpeed:0;
 const damping=inputLength?8:15;moveX=THREE.MathUtils.damp(moveX,targetX,damping,dt);moveZ=THREE.MathUtils.damp(moveZ,targetZ,damping,dt);moveSpeed=Math.hypot(moveX,moveZ);
 if(moveSpeed<.015){moveX=0;moveZ=0;moveSpeed=0}
 if(moveSpeed){let ox=pos.x,oz=pos.z,nx=ox+moveX*dt,nz=oz+moveZ*dt;if(academyWalkable(academy,nx,oz))pos.x=nx;else moveX=0;if(academyWalkable(academy,pos.x,nz))pos.z=nz;else moveZ=0;let ax=pos.x-ox,az=pos.z-oz;actualSpeed=Math.hypot(ax,az)/Math.max(dt,.001);moving=actualSpeed>.005;if(moving){let target=Math.atan2(ax,az),delta=Math.atan2(Math.sin(target-hero.rotation.y),Math.cos(target-hero.rotation.y));hero.rotation.y+=delta*(1-Math.exp(-dt*12))}}
 if(doorGesture){let g=doorGesture,handle=g.door.localToWorld(g.localHandle.clone());const delta=Math.atan2(handle.x-pos.x,handle.z-pos.z)-hero.rotation.y;hero.rotation.y+=Math.atan2(Math.sin(delta),Math.cos(delta))*(1-Math.exp(-dt*12));
  const dx=g.goal.x-pos.x,dz=g.goal.z-pos.z,dist=Math.hypot(dx,dz);
  if(!g.fired&&g.time===0&&dist>.035){g.approach+=dt;const step=Math.min(dist,.85*dt),nx=pos.x+dx/dist*step,nz=pos.z+dz/dist*step,ox=pos.x,oz=pos.z;if(academyWalkable(academy,nx,pos.z))pos.x=nx;if(academyWalkable(academy,pos.x,nz))pos.z=nz;actualSpeed=Math.hypot(pos.x-ox,pos.z-oz)/Math.max(dt,.001);moving=actualSpeed>.005;if(g.approach>3){doorGesture=null;motion.setReach(null,0)}}else{
   g.time+=dt;const smooth=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};motion.setReach(handle,smooth(g.time/.38)*smooth((1.22-g.time)/.40));if(!g.fired&&g.time>=.40){academy[g.key]=!academy[g.key];g.fired=true}if(g.time>=1.22){doorGesture=null;motion.setReach(null,0)}
  }
 }
 if(lightGesture){const g=lightGesture,c=g.c,handle=new THREE.Vector3(c.x,c.y,c.z),target=new THREE.Vector3(c.approachX,0,c.z),dx=target.x-pos.x,dz=target.z-pos.z,dist=Math.hypot(dx,dz);if(dist>.06&&g.time===0){const step=Math.min(dist,.90*dt),nx=pos.x+dx/dist*step,nz=pos.z+dz/dist*step;if(academyWalkable(academy,nx,nz)){pos.x=nx;pos.z=nz;actualSpeed=step/Math.max(dt,.001);moving=true}else{lightGesture=null;motion.setReach(null,0)}}else{g.time+=dt;const ang=Math.atan2(c.x-pos.x,c.z-pos.z)-hero.rotation.y;hero.rotation.y+=Math.atan2(Math.sin(ang),Math.cos(ang))*(1-Math.exp(-dt*14));const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};motion.setReach(handle,ease(g.time/.32)*ease((.92-g.time)/.32));if(!g.fired&&g.time>.38){setLightCircuit(c,!c.on);g.fired=true}if(g.time>=.92){lightGesture=null;motion.setReach(null,0)}}}
 // Seat state machine: walk to an unobstructed anchor, turn, lower into the seat, stand in reverse.
 if(seatAction){let g=seatAction,seat=g.seat,ap=g.approach;const turn=angle=>{let delta=angle-hero.rotation.y;hero.rotation.y+=Math.atan2(Math.sin(delta),Math.cos(delta))*(1-Math.exp(-dt*12))};const ease=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};
  if(g.stage==='approach'){g.time+=dt;let dx=ap.x-pos.x,dz=ap.z-pos.z,dist=Math.hypot(dx,dz);if(dist<.035){pos.x=ap.x;pos.z=ap.z;g.stage='turn';g.time=0}else{let step=Math.min(dist,.95*dt),nx=pos.x+dx/dist*step,nz=pos.z+dz/dist*step;if(academyWalkable(academy,nx,nz)){pos.x=nx;pos.z=nz;actualSpeed=step/Math.max(dt,.001);moving=true;turn(Math.atan2(dx,dz))}if(g.time>3)seatAction=null}}
  else if(g.stage==='turn'){turn(seat.yaw);g.time+=dt;if(g.time>=.58){g.stage='sit';g.time=0;hero.rotation.y=seat.yaw;yaw=seat.yaw+Math.PI;pitch=.24}}
  else if(g.stage==='sit'||g.stage==='stand'){g.time+=dt;let w=ease(g.time/1.10);if(g.stage==='stand')w=1-w;pos.x=THREE.MathUtils.lerp(ap.x,seat.x,w);pos.z=THREE.MathUtils.lerp(ap.z,seat.z,w);motion.setSeat(w,seat.height);hero.rotation.y=seat.yaw;if(g.time>=1.10){if(g.stage==='stand'){seatAction=null;motion.setSeat(0)}else{g.stage='seated';g.time=0;motion.setSeat(1,seat.height)}}}
  else if(g.stage==='seated'){motion.setSeat(1,seat.height);hero.rotation.y=seat.yaw}
 }
 academy.level=academyStairLevel(pos.x,pos.z,academy.level);const floor=academyGround(pos.x,pos.z,academy.level);groundY=THREE.MathUtils.damp(groundY,floor,onStairs?13:22,dt);if(Math.abs(groundY-floor)<.003)groundY=floor;if(airborne){jumpVelocity-=9.81*dt;jumpOffset=Math.max(0,jumpOffset+jumpVelocity*dt);if(jumpOffset<=0&&jumpVelocity<0){airborne=false;jumpVelocity=0}motion?.setAir(airborne?Math.min(1,jumpOffset/.32):0)}pos.y=groundY+jumpOffset;motion?.setTerrain?.(airborne?null:(x,z)=>academyGround(x,z,academy.level));
 const zoneCircuit=academy.circuits.find(c=>c.id===(inAdaHall(pos.x,pos.z)?'lounge':pos.z>10?'plaza':pos.z>.2?'entrance':pos.z<-10.94?'workspace':'lounge'));if(ambientLight)ambientLight.intensity=THREE.MathUtils.damp(ambientLight.intensity,zoneCircuit?.on===false?.32:pos.z>23?.62:1.15,5,dt);if(contactShadow){contactShadow.position.set(pos.x,floor+.012,pos.z);contactShadow.scale.setScalar(1+jumpOffset*.45);contactShadow.material.opacity=(zoneCircuit?.on===false?.22:.70)/(1+jumpOffset*1.6);contactShadow.visible=!firstPerson&&(!seatAction||seatAction.stage==='approach'||seatAction.stage==='turn')}if(actualSpeed>.08&&!seatAction&&!airborne){stepDistance+=actualSpeed*dt;if(stepDistance>(actualSpeed>2?.72:.53)){stepDistance=0;playSound('step')}}if(performance.now()-checkpointAt>10000){checkpointAt=performance.now();void saveCheckpoint()}if(motion){const facing=yaw+Math.PI,delta=Math.atan2(Math.sin(facing-hero.rotation.y),Math.cos(facing-hero.rotation.y));motion.setLook?.(delta*.75,(pitch-.16)*.60);motion.update(dt,actualSpeed);}if(moving!==movingBefore){if(moving&&walkAction){idleAction?.stop();walkAction.reset().play()}else if(!moving){walkAction?.stop();idleAction?.reset().play()}movingBefore=moving}
 const light=!(seatAction||airborne||doorGesture)&&nearbyLightSwitch(academy,pos.x,pos.z);$('#lightAction').hidden=!light&&!lightGesture;$('#lightAction').disabled=!!lightGesture;$('#lightAction').textContent=light?(light.on?'Lights off · L':'Lights on · L'):'Light switch · L';const sprinting=sprintHeld||sprintToggle||keys.has('shift');$('#sprintAction').textContent=sprinting?(actualSpeed>2?'Running · Shift':'Sprint ready · Shift'):'Sprint · Shift';$('#sprintAction').setAttribute('aria-pressed',String(sprinting));const exteriorNear=plazaDoorNearby(academy,pos.x,pos.z),interiorNear=nearbyInteriorDoor(academy,pos.x,pos.z),near=!seatAction&&!airborne&&(doorNearby(academy,pos.x,pos.z)||exteriorNear||interiorNear);const available=!near&&!seatAction&&!airborne&&motion?nearestAcademySeat(academy,pos.x,pos.z):null;$('#seatAction').hidden=!seatAction&&!available;$('#seatAction').disabled=!!seatAction&&seatAction.stage!=='seated';$('#seatAction').textContent=seatAction?(seatAction.stage==='seated'?'Stand up · E':'Please wait…'):'Sit on '+(available?.seat.kind||'seat')+' · E';$('#computerAction').hidden=!(seatAction?.stage==='seated'&&seatAction.seat.computer);$('#computerAction').textContent=seatAction?.seat.computer?.on?'Use PC · F':'Turn on PC · F';$('#viewAction').textContent=firstPerson?'Third person · V':'First person · V';$('#doorAction').hidden=!near;$('#doorAction').disabled=!!doorGesture;$('#doorAction').textContent=(exteriorNear?academy.plazaOpen:interiorNear?interiorNear.open:academy.open)?'Close door · E':'Open door · E';$('#zone').textContent=academy.level===1?'Academy · Second floor':inAdaHall(pos.x,pos.z)?'Ada Lovelace · Auditorium':inKitchen(pos.x,pos.z)?'Academy · Kitchen':pos.z>23?'E PLAZA · Exterior':pos.z>18?'E PLAZA · Entrance stairs':pos.z>10?'E PLAZA · Reception':pos.z>.2?'Academy entrance corridor':pos.z<-10.94?'Open workspace · ground floor':'Academy lounge · ground floor';
 // Keep the third-person camera in a clear section of the room, not behind walls.
 if(firstPerson){const seated=seatAction&&['sit','seated','stand'].includes(seatAction.stage),height=seated?seatAction.seat.height+.69:1.55,lookPitch=pitch-.24;camera.position.set(pos.x,pos.y+height,pos.z);camera.lookAt(pos.x-Math.sin(yaw)*Math.cos(lookPitch),pos.y+height-Math.sin(lookPitch),pos.z-Math.cos(yaw)*Math.cos(lookPitch));return}
 zoomCurrent=THREE.MathUtils.damp(zoomCurrent,zoomTarget,9,dt);const distance=zoomCurrent,offset=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)),target=new THREE.Vector3(pos.x,pos.y+(seatAction?.stage==='seated'?.93:1.22),pos.z),desired=target.clone();if(seatAction&&['sit','seated','stand'].includes(seatAction.stage)){let clear=false;for(let d=.3;d<=distance;d+=.15){const pt=target.clone().addScaledVector(offset,d);pt.y=Math.max(pos.y+1.45,pt.y);if(!academyWalkable(academy,pt.x,pt.z,.12)){if(clear)break;continue}clear=true;desired.copy(pt)}if(!clear)desired.set(seatAction.approach.x,pos.y+1.65,seatAction.approach.z);camera.position.lerp(desired,1-Math.exp(-dt*12));if(!academyWalkable(academy,camera.position.x,camera.position.z,.10))camera.position.copy(desired);camera.lookAt(target);return}
 for(let d=.3;d<=distance;d+=.15){let pt=target.clone().addScaledVector(offset,d);if(!academyWalkable(academy,pt.x,pt.z,.12))break;desired.copy(pt)}
 desired.y=Math.max(academyGround(desired.x,desired.z,academy.level)+1.35,desired.y);camera.position.lerp(desired,Math.min(1,dt*12));if(!academyWalkable(academy,camera.position.x,camera.position.z,.10))camera.position.copy(desired);camera.lookAt(target);
}
function frame(now){requestAnimationFrame(frame);if(document.hidden||!renderer||!['characters','journey','world'].includes(active)){last=now;return}let threshold=quality==='low'?33:16;if(now-last<threshold)return;let dt=Math.min(.065,(now-last)/1000||.016);last=now;if(active==='characters'){mixer?.update(dt);motion?.update(dt,0);orbit?.update()}else if(active==='journey'&&journeyState){smoothed=reduce?progress:THREE.MathUtils.damp(smoothed,progress,5,dt);animateJourney(journeyState,camera,smoothed,reduce?0:now/1000);updateChapter(smoothed);portalUpdate(smoothed,dt);if(progress>=.999&&smoothed>.995){enterWorld();return}}else if(active==='world'&&hero){mixer?.update(dt);worldFrame(dt);campusNpc?.update(dt,hero.position);if(now-lightBudgetAt>=160){lightBudgetAt=now;academy.lightBudget?.update(hero.position.x,hero.position.y+1.1,hero.position.z)}frameCount++;if(now-lastFps>1000){let fps=Math.round(frameCount*1000/(now-lastFps));$('#fps').textContent=fps+' FPS · '+renderer.info.render.calls+' draws';if(quality==='auto'){if(fps<35){lowSamples++;highSamples=0}else if(fps>=55){highSamples++;lowSamples=0}else{lowSamples=highSamples=0}let next=autoPixelRatio;if(lowSamples>=2){next=Math.max(.60,autoPixelRatio-.15);lowSamples=0}else if(highSamples>=5){next=Math.min(1.25,devicePixelRatio,autoPixelRatio+.10);highSamples=0}if(next!==autoPixelRatio){autoPixelRatio=next;resize()}}frameCount=0;lastFps=now}}renderer.render(scene,camera)}
$('#nameForm').onsubmit=async e=>{e.preventDefault();if(busy)return;let first=$('#first').value.trim(),lastName=$('#last').value.trim();if(!first||!lastName){$('#nameError').textContent='Enter both names.';return}busy=true;let b=e.target.querySelector('button[type=submit]');b.disabled=true;$('#nameError').textContent='';try{profile={...profile,first,last:lastName};await api('state',{profile,avatar});busy=false;openCharacters()}catch(e){$('#nameError').textContent=e.message}finally{busy=false;b.disabled=false}};
$('#begin').onclick=async()=>{if(busy||!selected?.selectable||!hero||$('#begin').disabled)return;busy=true;$('#begin').disabled=true;$('#charError').textContent='';try{const picked=selected.id;avatar={...avatar,characterId:picked};await api('state',{profile,avatar});if(active==='characters'&&selected.id===picked){beginJourney()}else $('#begin').disabled=false}catch(e){$('#charError').textContent=e.message;$('#begin').disabled=false}finally{busy=false}};
$('#backName').onclick=()=>{if(busy)return;sequence++;if(profile.first&&profile.last)location.href='/';else show('identity')};$('#backCharacters').onclick=()=>openCharacters();$('#changeCharacter').onclick=()=>{closeComputer();lightGesture=null;sprintHeld=sprintToggle=false;hero.visible=true;motion?.setSeat(0);motion?.setAir(0);motion?.setTerrain?.(null);motion?.setLook?.(0,0);motion?.setReach(null,0);seatAction=null;doorGesture=null;openCharacters()};$('#skip').onclick=enterWorld;
$$('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCards()});
$('#quality').onclick=()=>{quality=quality==='auto'?'low':quality==='low'?'high':'auto';$('#quality').textContent='Graphics: '+quality[0].toUpperCase()+quality.slice(1);preferences.quality=quality;void savePreferences().catch(()=>{});resize()};
addEventListener('scroll',onScroll,{passive:true});addEventListener('keydown',e=>{if($('#dailyDialog').open||$('#storeDialog').open||$('#settingsDialog').open)return;if(active==='world'&&$('#computerPanel').hidden){sprintHeld=e.shiftKey||e.code==='ShiftLeft'||e.code==='ShiftRight';if(e.code==='KeyL'&&!e.repeat){switchLight();e.preventDefault()}}if(active==='world'&&!$('#computerPanel').hidden){if(e.key==='Escape'){closeComputer();e.preventDefault()}return}if(active==='world'&&e.key.toLowerCase()==='h'&&!e.repeat){motion?.wave();e.preventDefault()}if(active==='world'&&e.key.toLowerCase()==='e'&&!e.repeat){interact();e.preventDefault()}if(active==='world'&&!e.repeat&&[' ','f','v'].includes(e.key.toLowerCase())){if(e.key===' ')jump();else if(e.key.toLowerCase()==='f')useComputer();else toggleView();e.preventDefault()}if(active==='world'&&['w','a','s','d','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())){keys.add(e.key.toLowerCase());e.preventDefault()}});addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());sprintHeld=e.shiftKey;if(!e.shiftKey)keys.delete('shift')});addEventListener('blur',()=>{keys.clear();sprintHeld=false;drag=null});
$$('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);keys.add(b.dataset.key)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(b.dataset.key))});
document.addEventListener('visibilitychange',()=>{keys.clear();if(!document.hidden)fillThumbs()});$('#retry').onclick=()=>location.reload();



let storeState=null,storeBusy=false;
const originalColors=new WeakMap(),originalCrownVisibility=new WeakMap(),storePreviews=new Map();


const cosmeticFits=new WeakMap();
function cosmeticRig(model){
 if(cosmeticFits.has(model))return cosmeticFits.get(model);
 model.updateWorldMatrix(true,true);
 let head=null;model.traverse(o=>{if(o.isBone&&/(^|[:_])head$/i.test(o.name))head=o});
 const fit={parts:[],head:null,materials:[],nativeCrowns:[],nativeCrownMaterials:[]};
 const points=[],headPoints=[],namedCrowns=[],v=new THREE.Vector3();
 const hp=head?model.worldToLocal(head.getWorldPosition(new THREE.Vector3())):new THREE.Vector3(0,1.37,0);
 model.traverse(o=>{
  if(!o.isMesh||!o.geometry?.attributes.position)return;
  const mats=Array.isArray(o.material)?o.material:[o.material];
  const name=(o.name||'')+' '+mats.map(m=>m?.name||'').join(' ');
  if(/crown|tiara|coronet/i.test(name)){namedCrowns.push(o);fit.nativeCrowns.push({mesh:o,visible:o.visible});return}
  // Keep eyes, face, skin, hair and metallic hardware unchanged.
  if(!/weapon|pistol|rifle|gun/i.test(name)){
   for(const m of mats){if(!m?.color||/skin|hair|eye|face|teeth|mouth|metal|gold|silver|crown|visor|glass|black|white|shoe|boot|glove/i.test(m.name||'')||!/cloth|shirt|jacket|hoodie|tunic|fabric|torso|armor|armour|body|blue|red|green|purple|orange|velvet/i.test(name))continue; if(!fit.materials.some(x=>x.m===m))fit.materials.push({m,color:m.color.clone()})}
  }
  if(!o.visible||/cape|weapon|pistol|rifle|gun/i.test(name))return;
  const pos=o.geometry.attributes.position,si=o.geometry.attributes.skinIndex,sw=o.geometry.attributes.skinWeight;const meshBounds=new THREE.Box3();
  const headIndices=o.isSkinnedMesh&&head?new Set(o.skeleton.bones.map((bone,i)=>bone===head||bone.parent===head?i:-1).filter(i=>i>=0)):null;
  for(let i=0;i<pos.count;i++){
   v.fromBufferAttribute(pos,i);if(o.isSkinnedMesh)o.applyBoneTransform(i,v);o.localToWorld(v);model.worldToLocal(v);
   if(!Number.isFinite(v.y))continue;meshBounds.expandByPoint(v);
   if(Math.abs(v.x-hp.x)<.40&&Math.abs(v.z-hp.z)<.40&&v.y>hp.y-.025)points.push(v.clone());
   if(headIndices&&si&&sw){let w=0;for(let k=0;k<4;k++)if(headIndices.has(si.getComponent(i,k)))w+=sw.getComponent(i,k);if(w>.55)headPoints.push(v.clone())}
  }
  if(!meshBounds.isEmpty()&&meshBounds.min.y>hp.y+.065&&meshBounds.max.y>1.55&&/gold/i.test(name)){fit.nativeCrowns.push({mesh:o,visible:o.visible});for(const m of mats)if(m?.color)fit.nativeCrownMaterials.push({m,color:m.color.clone()})}
 });
 const source=points.concat(headPoints).filter(p=>p.y>hp.y-.025&&Math.abs(p.x-hp.x)<.40&&Math.abs(p.z-hp.z)<.40);
 if(head&&source.length){const top=source.reduce((n,p)=>Math.max(n,p.y),1.70),bottom=source.reduce((n,p)=>Math.min(n,p.y),top),height=top-bottom;
  const bandY=top-Math.min(.037,Math.max(.012,height*.12));
  let ring=source.filter(p=>p.y>=bandY-.055&&p.y<=top+.001);if(ring.length<6)ring=source.filter(p=>p.y>=top-height*.36);
  const box=new THREE.Box3().setFromPoints(ring.length?ring:source),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  fit.head={bone:head,center,top,bandY,rx:clamp(size.x*.5+.018,.090,.145),rz:clamp(size.z*.5+.018,.090,.145),reference:head.matrixWorld.clone().invert().multiply(model.matrixWorld)};
 }
 cosmeticFits.set(model,fit);return fit;
}
function equipModel(model,outfit,crown){
 if(!model)return;const fit=cosmeticRig(model);for(const p of fit.parts){p.removeFromParent();dispose(p)}fit.parts=[];
 for(const {m,color} of fit.materials){m.color.copy(color);if(outfit){const target=new THREE.Color(outfit.color),base=color.getHSL({}),hsl=target.getHSL({});m.color.setHSL(hsl.h,Math.min(.72,hsl.s*.80),clamp(base.l*.70+hsl.l*.30,.12,.76))}}
 for(const native of fit.nativeCrowns)native.mesh.visible=native.visible;for(const {m,color} of fit.nativeCrownMaterials)m.color.copy(color);if(crown&&model.getObjectByName('RoyalCape')){for(const {m} of fit.nativeCrownMaterials)m.color.set(crown.color);return}for(const native of fit.nativeCrowns)native.mesh.visible=crown?false:native.visible;
 if(!crown||!fit.head)return;
 const h=fit.head,g=new THREE.Group();g.name='AcademyStoreCrown';g.userData.storeCosmetic=true;
 const gold=crown.id==='gold-crown',silver=crown.id==='silver-crown',metal=new THREE.MeshStandardMaterial({color:crown.color,metalness:.75,roughness:.32,side:THREE.DoubleSide});
 // Elliptic open band follows the top cross section, with a bottom rim above the hairline.
 g.position.set(h.center.x,h.top-.006,h.center.z);
 const band=new THREE.Mesh(new THREE.CylinderGeometry(1.025,1,.032,48,1,true),metal);band.scale.set(h.rx,1,h.rz);g.add(band);
 for(const y of [-.016,.016]){const rim=new THREE.Mesh(new THREE.TorusGeometry(1,.045,8,48),metal);rim.rotation.x=Math.PI/2;rim.scale.set(h.rx,h.rz,.10);rim.position.y=y;g.add(rim)}
 const count=gold?8:silver?6:5,tipHeight=gold?.082:silver?.061:.045;
 for(let i=0;i<count;i++){const a=i*2*Math.PI/count;const tip=new THREE.Mesh(new THREE.ConeGeometry(.024,tipHeight,4),metal);tip.position.set(Math.cos(a)*h.rx,.016+tipHeight*.5,Math.sin(a)*h.rz);tip.rotation.y=-a;g.add(tip)}
 g.applyMatrix4(h.reference);h.bone.add(g);fit.parts.push(g);
}
function applyEquipment(){if(!hero||!storeState)return;const item=slot=>storeState.items.find(i=>i.id===storeState[slot]);equipModel(hero,item('outfit'),item('crown'))}
let previewJob=null;
async function generateStorePreviews(){
 const character=selected?.id||avatar.characterId,entry=catalog.find(i=>i.id===character);if(!entry?.model||!storeState||previewJob)return;
 const missing=storeState.items.filter(i=>!storePreviews.has(character+':'+i.id));if(!missing.length)return;
 previewJob=(async()=>{let model;try{const response=await fetch(entry.model);if(!response.ok)throw Error('Preview unavailable');const g=await loader.parseAsync(await response.arrayBuffer(),'/');model=fit(g.scene);if(character==='male-king')royalFinish(model);cosmeticRig(model);createHumanoidMotion(model);for(const item of missing){if(!$('#storeDialog').open)break;equipModel(model,item.slot==='outfit'?item:null,item.slot==='crown'?item:null);storePreviews.set(character+':'+item.id,thumbnail(model));if($('#storeDialog').open)renderStore();await new Promise(resolve=>requestAnimationFrame(resolve));}}catch(e){$('#storeFeedback').textContent='Some 3D previews unavailable.'}finally{if(model)dispose(model)}})();try{await previewJob}finally{previewJob=null}
}
function renderStore(){const root=$('#storeItems');root.replaceChildren();$('#storeBalance').textContent=(storeState.admin?'Admin · all items unlocked · ':'')+'🪙 '+storeState.coins;for(const item of storeState.items){const card=document.createElement('div');card.className='store-item';const sw=document.createElement('div');sw.className='store-swatch';const preview=storePreviews.get((selected?.id||avatar.characterId)+':'+item.id);if(preview){const img=document.createElement('img');img.src=preview;img.alt=item.name+' on your character';sw.append(img)}else{sw.style.background=item.color;sw.textContent='Loading preview…'}const name=document.createElement('strong');name.textContent=item.name;const owned=storeState.owned.includes(item.id),equipped=storeState[item.slot]===item.id;const meta=document.createElement('small');meta.textContent=equipped?'Equipped':owned?'In inventory':item.price+' Coins';const button=document.createElement('button');button.className='btn';button.textContent=equipped?'Unequip':owned?'Equip':'Buy · '+item.price;button.disabled=storeBusy||(!owned&&storeState.coins<item.price);button.onclick=()=>storeAction(owned?'equip':'buy',equipped?null:item.id,item.slot);card.append(sw,name,meta,button);root.append(card)}}
async function storeAction(action,id,slot){if(storeBusy)return;storeBusy=true;renderStore();try{storeState=await api('store/'+action,{id,slot});applyEquipment();await loadProgress();$('#storeFeedback').textContent=action==='buy'?'Purchased. Equip your new item from inventory.':'Equipment updated.'}catch(e){$('#storeFeedback').textContent=e.message}finally{storeBusy=false;renderStore()}}
async function loadStore(){try{storeState=await api('store');applyEquipment();return true}catch(e){$('#progressStatus').textContent=e.message;return false}}
$('#storeOpen').onclick=async()=>{if(storeBusy)return;if(document.pointerLockElement)document.exitPointerLock?.();keys.clear();drag=null;sprintHeld=false;storeBusy=true;try{if(!await loadStore())return;$('#storeFeedback').textContent='';$('#storeDialog').showModal()}finally{storeBusy=false;if(storeState){renderStore();void generateStorePreviews()}}};
$('#storeClose').onclick=()=>$('#storeDialog').close();
$('#storeDialog').addEventListener('close',()=>{keys.clear();drag=null});


let preferences={lang:'en',sensitivity:1,sound:true,quality:'auto',portalSound:true,portalVolume:.55},checkpoint=null,checkpointBusy=false,checkpointAt=0,checkpointKey='',audioCtx=null,stepDistance=0;

let portalAudio=null,portalPrevious=0,portalVelocity=0,portalStage=-1,portalFinished=false;
function portalSoundButton(){const b=$('#portalSound');if(b){b.textContent=preferences.portalSound===false?'Sound off':'Sound on';b.setAttribute('aria-pressed',String(preferences.portalSound!==false))}}
function portalStart(){portalStop();portalPrevious=0;portalVelocity=0;portalStage=-1;portalFinished=false;portalSoundButton()}
function portalStop(){if(!portalAudio)return;const a=portalAudio;portalAudio=null;const t=a.ctx.currentTime;a.master.gain.cancelScheduledValues(t);a.master.gain.setTargetAtTime(0,t,.08);for(const n of a.sources){try{n.stop(t+.5)}catch{}}setTimeout(()=>{try{a.master.disconnect()}catch{}},600)}
function portalInit(){if(portalAudio||!preferences.sound||preferences.portalSound===false||!audioCtx||audioCtx.state!=='running')return;const ctx=audioCtx,master=ctx.createGain(),filter=ctx.createBiquadFilter(),rumble=ctx.createGain(),air=ctx.createGain(),sources=[];master.gain.value=0;master.connect(ctx.destination);filter.type='lowpass';filter.frequency.value=180;filter.Q.value=.7;filter.connect(air).connect(master);rumble.connect(master);const duration=3,buffer=ctx.createBuffer(1,ctx.sampleRate*duration,ctx.sampleRate),data=buffer.getChannelData(0);let noise=0;for(let i=0;i<data.length;i++){noise=.96*noise+.04*(Math.random()*2-1);data[i]=noise*3}const wind=ctx.createBufferSource();wind.buffer=buffer;wind.loop=true;wind.connect(filter);wind.start();sources.push(wind);const tones=[43,65,87].map((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=i===1?'triangle':'sine';o.frequency.value=f;g.gain.value=.11/(i+1);o.connect(g).connect(rumble);o.start();sources.push(o);return o});portalAudio={ctx,master,filter,air,rumble,tones,sources}}
function portalPulse(stage,final=false){if(!portalAudio)return;const {ctx,master}=portalAudio,t=ctx.currentTime,volume=clamp(Number(preferences.portalVolume??.55),0,1);if(volume===0)return;for(const [i,f] of (final?[65,130,196]:[180+stage*65,270+stage*90]).entries()){const o=ctx.createOscillator(),g=ctx.createGain(),d=final?.52:.20;o.type=final?'sine':'triangle';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(final?f*.48:f*1.45,t+d);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(final?.15*volume:.055,t+.025);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(final?ctx.destination:master);o.start(t+i*.035);o.stop(t+d+.06)}}
function portalUpdate(p,dt){if(!preferences.sound||preferences.portalSound===false){portalStop();return}portalInit();const a=portalAudio;if(!a)return;const velocity=Math.min(3,Math.abs(p-portalPrevious)/Math.max(.016,dt));portalPrevious=p;portalVelocity=THREE.MathUtils.damp(portalVelocity,velocity,5,dt);const t=a.ctx.currentTime,intensity=Math.min(1,portalVelocity*.8),energy=Math.pow(p,2.4),volume=clamp(Number(preferences.portalVolume??.55),0,1);a.master.gain.setTargetAtTime(volume*.32,t,.12);a.air.gain.setTargetAtTime(.06+intensity*.34+energy*.16,t,.15);a.rumble.gain.setTargetAtTime(.30+energy*.55,t,.18);a.filter.frequency.setTargetAtTime(160+intensity*1450+energy*700,t,.15);a.tones.forEach((o,i)=>o.frequency.setTargetAtTime([43,65,87][i]*(1+energy*.62+intensity*.18),t,.2));const stage=Math.min(5,Math.floor(p*6));if(stage!==portalStage){if(portalStage>=0)portalPulse(stage);portalStage=stage}}
function portalComplete(){if(!portalFinished&&portalAudio&&preferences.sound&&preferences.portalSound!==false){portalFinished=true;portalPulse(5,true)}portalStop()}
$('#portalSound').onclick=()=>{preferences.portalSound=preferences.portalSound===false;portalSoundButton();unlockAudio();if(!preferences.portalSound)portalStop();void savePreferences().catch(()=>{})};
document.addEventListener('visibilitychange',()=>{if(document.hidden)portalStop()});addEventListener('pagehide',portalStop);

function applyPreferences(){quality=preferences.quality;$('#quality').textContent='Graphics: '+quality;$('#dailyLang').value=preferences.lang;resize()}
async function savePreferences(){await api('preferences',preferences)}
function playSound(kind){if(!preferences.sound)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state!=='running')return;const duration=kind==='step'?.085:.18,rate=audioCtx.sampleRate,buf=audioCtx.createBuffer(1,Math.ceil(rate*duration),rate),data=buf.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=.65*last+.35*(Math.random()*2-1);data[i]=last*Math.pow(1-i/data.length,3)}const source=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),gain=audioCtx.createGain();source.buffer=buf;filter.type='lowpass';filter.frequency.value=kind==='step'?450:1200;gain.gain.value=kind==='step'?.22:.13;source.connect(filter).connect(gain).connect(audioCtx.destination);source.start()}catch{}}
function unlockAudio(){if(!preferences.sound)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume().catch(()=>{})}catch{}}
document.addEventListener('pointerdown',unlockAudio);document.addEventListener('keydown',unlockAudio);
function checkpointData(){if(active!=='world'||!hero||!academy||seatAction||airborne||doorGesture||lightGesture)return null;const p=hero.position;if(!academyWalkable(academy,p.x,p.z)||onAcademyStairs(p.x,p.z,-.10)||p.z>18.45&&p.z<22.55)return null;return {x:Math.round(p.x*100)/100,z:Math.round(p.z*100)/100,yaw,level:academy.level,layout:3}}
async function saveCheckpoint(force=false){const data=checkpointData();if(!data||checkpointBusy)return;const key=JSON.stringify(data);if(key===checkpointKey)return;checkpointBusy=true;try{await api('checkpoint',data);checkpoint=data;checkpointKey=key}catch{}finally{checkpointBusy=false}}
addEventListener('pagehide',()=>{const data=checkpointData();if(data)fetch('/api/checkpoint',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),keepalive:true}).catch(()=>{})});
$('#settingsOpen').onclick=()=>{if(document.pointerLockElement)document.exitPointerLock?.();keys.clear();sprintHeld=sprintToggle=false;$('#settingsLang').value=preferences.lang;$('#settingsSensitivity').value=preferences.sensitivity;$('#sensitivityValue').value=preferences.sensitivity.toFixed(1);$('#settingsSound').checked=preferences.sound;$('#settingsPortalSound').checked=preferences.portalSound!==false;$('#settingsPortalVolume').value=preferences.portalVolume??.55;$('#settingsQuality').value=quality;$('#settingsFeedback').textContent='';$('#settingsDialog').showModal()};
$('#settingsClose').onclick=()=>$('#settingsDialog').close();
$('#settingsSensitivity').oninput=()=>$('#sensitivityValue').value=Number($('#settingsSensitivity').value).toFixed(1);
$('#settingsForm').onsubmit=async e=>{e.preventDefault();preferences={lang:$('#settingsLang').value,sensitivity:Number($('#settingsSensitivity').value),sound:$('#settingsSound').checked,portalSound:$('#settingsPortalSound').checked,portalVolume:Number($('#settingsPortalVolume').value),quality:$('#settingsQuality').value};applyPreferences();try{await savePreferences();$('#settingsDialog').close()}catch(err){$('#settingsFeedback').textContent=err.message}};
const dailyLabels={en:{done:'Completed today. Return tomorrow.',check:'Check answer',wrong:'Not quite. Try again.',reward:'Earn 40 XP and 20 Coins by answering correctly.'},hy:{done:'Այսօրվա հարցն ավարտված է։ Վերադարձիր վաղը։',check:'Ստուգել պատասխանը',wrong:'Սխալ պատասխան։ Փորձիր նորից։',reward:'Ճիշտ պատասխանի համար՝ 40 XP և 20 Coins։'},ru:{done:'Сегодня выполнено. Возвращайтесь завтра.',check:'Проверить ответ',wrong:'Неверно. Попробуйте ещё раз.',reward:'За правильный ответ: 40 XP и 20 Coins.'}};
function renderDaily(){const q=dailyData.question,t=q.translations?.[preferences.lang]||q,l=dailyLabels[preferences.lang];$('#dailyQuestion').textContent=t.text;$('#dailyQuestion').nextElementSibling.textContent=l.reward;const options=$('#dailyOptions');options.replaceChildren();for(const [i,option] of t.options.entries()){const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='answer';input.value=i;input.required=true;input.disabled=playerProgress.dailyDone;label.append(input,document.createTextNode(option));options.append(label)}$('#dailyFeedback').textContent=playerProgress.dailyDone?l.done:'';$('#dailySubmit').textContent=l.check;$('#dailySubmit').disabled=playerProgress.dailyDone}
$('#dailyLang').onchange=()=>{if(dailyBusy)return;preferences.lang=$('#dailyLang').value;renderDaily();savePreferences().catch(e=>$('#dailyFeedback').textContent=e.message)};

let playerProgress=null, dailyData=null, dailyBusy=false, levelTimer=null;
function displayProgress(p,animate=false){
 const previous=playerProgress?.level;playerProgress=p;
 $('#playerRank').textContent='Level '+p.level+' — '+p.title+(p.admin?' · Admin':'');$('#playerHp').textContent='HP '+p.hp+' / '+p.maxHp;
 $('#playerXp').textContent=p.levelXp+' / '+p.nextXp+' XP · '+p.xp+' total';
 $('#xpFill').style.width=(100*p.levelXp/p.nextXp)+'%';
 $('#playerCoins').textContent='🪙 '+p.coins;
 $('#playerStreak').textContent=p.streak+' days';
 $('#playerQuests').textContent=p.completed;
 $('#dailyOpen').textContent=p.dailyDone?'Daily learning ✓':'Daily learning';
 if(animate&&previous!=null&&p.level>previous){const toast=$('#levelToast');toast.textContent='LEVEL UP! · '+p.level+' — '+p.title;toast.hidden=false;clearTimeout(levelTimer);levelTimer=setTimeout(()=>toast.hidden=true,3500);}
}
async function loadProgress(){try{dailyData=await api('progression');displayProgress(dailyData.progress);$('#progressStatus').textContent='';return true}catch(e){$('#progressStatus').textContent=e.message;return false}}
$('#dailyOpen').onclick=async()=>{if(dailyBusy)return;if(document.pointerLockElement)document.exitPointerLock?.();dailyBusy=true;$('#dailyOpen').disabled=true;try{if(!await loadProgress())return;keys.clear();drag=null;sprintHeld=false;$('#dailyLang').value=preferences.lang;renderDaily();$('#dailyDialog').showModal()}finally{dailyBusy=false;$('#dailyOpen').disabled=false}};
$('#dailyClose').onclick=()=>$('#dailyDialog').close();
$('#dailyDialog').addEventListener('close',()=>{keys.clear();drag=null});
$('#dailyForm').onsubmit=async e=>{e.preventDefault();if(dailyBusy||playerProgress?.dailyDone)return;const chosen=new FormData(e.target).get('answer');if(chosen===null)return;dailyBusy=true;$('#dailySubmit').disabled=true;try{const result=await api('progression/answer',{day:dailyData.question.day,answer:Number(chosen),lang:preferences.lang});displayProgress(result.progress,true);$('#dailyFeedback').textContent=result.correct?(result.awarded?'+40 XP · +20 Coins. ':'Already completed. ')+result.explanation:dailyLabels[preferences.lang].wrong;if(result.correct)$('#dailyOptions').querySelectorAll('input').forEach(i=>i.disabled=true)}catch(err){$('#dailyFeedback').textContent=err.message}finally{dailyBusy=false;$('#dailySubmit').disabled=!!playerProgress?.dailyDone}};

async function boot(){try{const me=await api('me');if(!me.user){$('#loadingText').textContent='Log in before starting your journey.';$('#loginLink').hidden=false;return}profile=me.user.profile||{};avatar=me.user.avatar||{};try{const saved=await api('preferences');preferences={...preferences,...saved.preferences};checkpoint=saved.checkpoint;applyPreferences()}catch{}const r=await api('character-collection');catalog=r.characters||[];if(avatar.characterId==='male-king'&&!catalog.some(x=>x.id==='male-king'&&x.selectable)){avatar={...avatar};delete avatar.characterId}$('#first').value=profile.first||'';$('#last').value=profile.last||'';if(profile.first&&profile.last){openCharacters();const chosen=catalog.find(c=>c.id===avatar.characterId&&c.selectable);if(chosen){const seq=sequence;const resume=()=>{if(active!=='characters'||sequence!==seq)return;if(hero&&selected?.id===chosen.id&&!$('#begin').disabled){beginJourney()}else if(!$('#modelMessage').hidden&&$('#modelMessage').textContent.startsWith('Loading '))requestAnimationFrame(resume)};requestAnimationFrame(resume)}}else show('identity')}catch(e){$('#loadingText').textContent=e.message;$('#retry').hidden=false}}
requestAnimationFrame(frame);boot();
