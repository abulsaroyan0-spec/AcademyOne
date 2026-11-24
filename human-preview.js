import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));

const PEOPLE={male:'ethan',female:'priya'};
let gender='male',category='hair',current=null,mixer=null,renderer,scene,camera,controls,group,loader,env,request=0,controller,eco=false,visible=true,last=0,busy=false,thumbToken=0,thumbTarget,headPoint=new THREE.Vector3(0,1.65,0),headSize=.30,selected={},catalog={},morphs=[],materialGroups={},thumbCache=new Map(),facePose=null;
const svgs={
hair:'<path d="M4 14V9a8 8 0 0 1 16 0v5M4 9c4 1 7-1 9-4 1 3 4 5 7 5M6 14v3m12-3v3"/>',
hairColor:'<path d="M5 5c2-2 5-2 7 0l8 8-7 7-8-8c-2-2-2-5 0-7Z"/><path d="m9 9 6 6"/>',
brows:'<path d="M3 10c3-4 6-4 9-1m0 0c3-3 6-3 9 1M4 14h4m8 0h4"/>',
eyes:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/>',
eyeColor:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 4v3m0 10v3M4 12h3m10 0h3"/>',
nose:'<path d="M11 4c0 5-1 8-3 11-1 2 1 3 3 3h3c3 0 4-2 2-3"/>',
smile:'<path d="M3 10c4 0 6-3 9-1 3-2 5 1 9 1-2 6-5 8-9 8s-7-2-9-8Z"/><path d="M3 10c6 3 12 3 18 0"/>',
skin:'<path d="M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/>',
shape:'<path d="M5 8a7 7 0 0 1 14 0v5c0 4-4 8-7 8s-7-4-7-8Z"/><path d="M8 10h2m4 0h2M10 16h4"/>',
ears:'<path d="M8 17c-4 0-5-3-5-7 0-5 6-7 8-3m5 10c4 0 5-3 5-7 0-5-6-7-8-3"/>',
lips:'<path d="M3 12c4-1 6-5 9-2 3-3 5 1 9 2-3 4-6 6-9 6s-6-2-9-6Zm0 0h18"/>',
extras:'<path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>'
};
const sections=[['hair','Hair'],['hairColor','Hair color'],['brows','Brows'],['eyes','Eyes'],['eyeColor','Eye color'],['nose','Nose'],['lips','Lips'],['smile','Smile'],['skin','Skin'],['shape','Face shape'],['ears','Ears'],['extras','Details']];
const cap=(s)=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const semantic=(root)=>{const names=[];let n=root;while(n&&names.length<4){names.push(n.name||'');n=n.parent}return names.join(' ')};
function show(msg,retry=false){$('#status').hidden=false;$('#message').textContent=msg;$('#retry').hidden=!retry}
function selectButtons(sel,val,key){$$(sel).forEach(b=>{const on=b.dataset[key]===val;b.classList.toggle('sel',on);b.setAttribute('aria-pressed',String(on))})}
function buildCategories(){let el=$('#categories');el.replaceChildren();for(const [id,name] of sections){let b=document.createElement('button');b.className='category';b.dataset.category=id;b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+svgs[id]+'</svg><span>'+name+'</span>';b.onclick=()=>{category=id;renderGallery()};el.append(b)}selectButtons('[data-category]',category,'category')}
const pair=(name,v)=>({[name+'Left']:v,[name+'Right']:v});
const poses={
brows:[['Natural',{}],['Raised',pair('browOuterUp',.7)],['Inner lift',{browInnerUp:.8}],['Soft arch',{browInnerUp:.35,...pair('browOuterUp',.3)}],['Lowered',pair('browDown',.65)],['Focused',pair('browDown',.3)],['Left raised',{browOuterUpLeft:.8}],['Right raised',{browOuterUpRight:.8}],['Surprised',{browInnerUp:.8,...pair('browOuterUp',.8)}],['Relaxed',{...pair('browDown',.12),browInnerUp:.15}]],
eyes:[['Natural',{}],['Bright',pair('eyeWide',.35)],['Wide open',pair('eyeWide',.8)],['Soft gaze',pair('eyeSquint',.2)],['Focused',pair('eyeSquint',.45)],['Narrowed',pair('eyeSquint',.75)],['Sleepy',pair('eyeBlink',.38)],['Half closed',pair('eyeBlink',.63)],['Left wink',{eyeBlinkLeft:.9}],['Right wink',{eyeBlinkRight:.9}]],
nose:[['Natural',{}],['Subtle scrunch',pair('noseSneer',.15)],['Soft scrunch',pair('noseSneer',.3)],['Medium scrunch',pair('noseSneer',.5)],['Strong scrunch',pair('noseSneer',.8)],['Left scrunch',{noseSneerLeft:.7}],['Right scrunch',{noseSneerRight:.7}]],
lips:[['Natural',{}],['Soft press',pair('mouthPress',.25)],['Pressed',pair('mouthPress',.7)],['Pucker',{mouthPucker:.6}],['Rounded',{mouthFunnel:.65}],['Slight opening',{jawOpen:.14}],['Open',{jawOpen:.35}],['Upper lift',pair('mouthUpperUp',.55)],['Lower lip',pair('mouthLowerDown',.6)],['Tight',{mouthClose:.6,...pair('mouthPress',.3)}]],
smile:[['Neutral',{}],['Subtle',pair('mouthSmile',.2)],['Soft',pair('mouthSmile',.4)],['Warm',{...pair('mouthSmile',.6),...pair('cheekSquint',.15)}],['Bright',{...pair('mouthSmile',.85),...pair('cheekSquint',.3)}],['Big smile',{...pair('mouthSmile',1),jawOpen:.15}],['Laugh',{...pair('mouthSmile',.9),jawOpen:.45,...pair('eyeSquint',.2)}],['Smirk',{mouthSmileLeft:.65}],['Right smirk',{mouthSmileRight:.65}],['Serious',pair('mouthFrown',.35)]]
};
const managedMorphs=new Set(Object.values(poses).flatMap(v=>v.flatMap(([,w])=>Object.keys(w).map(cap))));
const colors={
hairColor:[['Original',null],['Soft black','#46434a'],['Dark brown','#79604b'],['Chestnut','#a17b59'],['Warm brown','#c1996d'],['Copper','#d09a72'],['Honey','#e0c293'],['Ash','#b6ada2'],['Silver','#c6c6cd'],['Violet','#b8a2df']],
eyeColor:[['Original',null],['Brown','#9a775b'],['Amber','#d3a268'],['Hazel','#b6af79'],['Olive','#a8b48a'],['Green','#85b2a0'],['Blue','#91b9e1'],['Gray','#b8c2cc'],['Ice','#c1d9e9'],['Deep brown','#705950']],
skin:[['Original',null],['Light rose','#fff0ed'],['Warm light','#ffe9d6'],['Golden','#f7d4ab'],['Peach','#f4c4ad'],['Olive','#dac9a2'],['Tan','#cda684'],['Bronze','#b08c71'],['Deep','#92735e'],['Rich deep','#735b50']]
};
const notes={hair:'Original hairstyle. Additional hairstyles need fitted 3D hair assets.',hairColor:'Texture tint · the original hair texture is preserved.',brows:'Brow expressions, not permanent eyebrow shapes.',eyes:'Eye expressions, not permanent eye shapes.',eyeColor:'Iris texture tint, when the model has a separate iris material.',nose:'Nose expressions only. Nose shape editing needs dedicated morphs.',lips:'Lip movements and expressions.',smile:'Facial expressions · choose a preview to apply it.',skin:'Skin texture tint, when a dedicated skin material is available.',shape:'Structural face morphs are not supplied by these models.',ears:'Independent ear shape meshes are not supplied.',extras:'Additional facial hair and makeup assets are not supplied.'};
const unsupported={hair:'More hairstyles require new compatible hair meshes.',hairColor:'This character has no separately editable hair material.',eyeColor:'This character has no separately editable iris material.',skin:'This character has no safely identifiable skin-only material.',brows:'This model does not contain compatible brow morphs.',eyes:'This model does not contain compatible eye morphs.',nose:'This model does not contain compatible nose morphs.',lips:'This model does not contain compatible lip morphs.',smile:'This model does not contain compatible smile morphs.',shape:'Face shape assets are not available yet.',ears:'Ear shape assets are not available yet.',extras:'Facial hair and makeup assets are not available yet.'};
function discover(){
 morphs=[];materialGroups={hairColor:new Set(),eyeColor:new Set(),skin:new Set()};
 const dictionary=new Map();
 current.traverse(o=>{
 if(!o.isMesh)return;
 if(o.morphTargetDictionary&&o.morphTargetInfluences){for(const [name,index] of Object.entries(o.morphTargetDictionary)){const k=cap(name);dictionary.set(k,name);morphs.push({o,index,k})}}
 const materials=Array.isArray(o.material)?o.material:[o.material];
 for(let m of materials){if(!m?.color)continue;m.userData.faceOriginal=m.color.clone();const mat=(m.name||'').toLowerCase(),mesh=(o.name||'').toLowerCase(),sem=mat+' '+mesh;
 // Avoid tinting a shared head/eye texture or eyebrows accidentally.
 if(/(^|[\s_.-])hair($|[\s_.-]|\d)/i.test(sem)&&!/brow|lash|beard|skin|head|body/i.test(mat))materialGroups.hairColor.add(m);
 if(/(^|[\s_.-])iris($|[\s_.-]|\d)/i.test(sem)&&!/skin|head|body|sclera/i.test(mat))materialGroups.eyeColor.add(m);
 if(/(^|[\s_.-])skin($|[\s_.-]|\d)|face.?skin|head.?skin|body.?skin/i.test(sem)&&!/eye|hair|brow|lash|teeth|cloth|outfit/i.test(mat))materialGroups.skin.add(m);
 }}
 );
 catalog={hair:[{id:'original',name:'Original style'}],shape:[],ears:[],extras:[]};
 for(const [key,defs] of Object.entries(poses)){const seen=new Set();catalog[key]=[];for(let i=0;i<defs.length;i++){let [name,weights]=defs[i],actual=Object.fromEntries(Object.entries(weights).map(([k,v])=>[cap(k),v]).filter(([k])=>dictionary.has(k)));if(i&&Object.keys(actual).length!==Object.keys(weights).length)continue;let sig=JSON.stringify(Object.entries(actual).sort());if(seen.has(sig))continue;seen.add(sig);catalog[key].push({id:String(i),name,weights:actual})}if(catalog[key].length<=1)catalog[key]=[]}
 for(const [key,defs] of Object.entries(colors))catalog[key]=materialGroups[key].size?defs.map(([name,tint],i)=>({id:String(i),name,tint})):[];
 selected=Object.fromEntries(Object.entries(catalog).filter(([k,v])=>v.length).map(([k,v])=>[k,v[0].id]));
 $('#modelDetails').textContent='Detected '+dictionary.size+' morph channels. Editable color materials: hair '+materialGroups.hairColor.size+', iris '+materialGroups.eyeColor.size+', skin '+materialGroups.skin.size+'. Unsupported categories are shown explicitly. Face choices are preview-only, not stored in your account.';
}
function choice(key,id=selected[key]){return catalog[key]?.find(x=>x.id===id)}
function applyFace(overrideKey=null,override=null){
 if(!current)return;
 const weights={};
 for(const key of Object.keys(poses)){let opt=key===overrideKey?override:choice(key);for(const [k,v] of Object.entries(opt?.weights||{}))weights[k]=Math.max(weights[k]||0,v)}
 // All managed face units are restored to neutral before applying the selected combination.
 const managed=managedMorphs;
 for(let {o,index,k} of morphs)if(managed.has(k))o.morphTargetInfluences[index]=weights[k]||0;
 for(const [key,materials] of Object.entries(materialGroups)){let opt=key===overrideKey?override:choice(key);for(let m of materials){m.color.copy(m.userData.faceOriginal);if(opt?.tint)m.color.multiply(new THREE.Color(opt.tint))}}
}
function resetCamera(){if(!camera)return;const dist=Math.max(.50,headSize*2.8);camera.position.set(headPoint.x+.035,headPoint.y+.01,headPoint.z+dist);controls.target.copy(headPoint);controls.update()}
function locateHead(){current.updateMatrixWorld(true);const bone=current.getObjectByName('mixamorigHead')||current.getObjectByName('Head')||(()=>{let head;current.traverse(o=>{if(!head&&o.isBone&&/head$/i.test(o.name))head=o});return head})();let box=new THREE.Box3().setFromObject(current),size=box.getSize(new THREE.Vector3());headSize=THREE.MathUtils.clamp(size.y*.17,.23,.39);if(bone){bone.getWorldPosition(headPoint);headPoint.y+=headSize*.19;headPoint.z+=.015}else{box.getCenter(headPoint);headPoint.y=box.max.y-headSize*.48}}
function dispose(root){if(!root)return;const textures=new Set(),materials=new Set(),geometries=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(let m of Array.isArray(o.material)?o.material:[o.material]){if(!m)continue;materials.add(m);for(let v of Object.values(m))if(v?.isTexture)textures.add(v)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}
function thumbnail(key,opt){
 // One offscreen render target, no additional WebGL contexts. The exact active model is rendered.
 const w=144,h=128;if(!thumbTarget){thumbTarget=new THREE.WebGLRenderTarget(w,h,{depthBuffer:true});thumbTarget.texture.colorSpace=THREE.SRGBColorSpace}
 const cam=new THREE.PerspectiveCamera(32,w/h,.05,50),dist=Math.max(.50,headSize*2.42);cam.position.set(headPoint.x+(key==='hair'?.13:.035),headPoint.y+.01,headPoint.z+dist);cam.lookAt(headPoint);
 const targetBefore=renderer.getRenderTarget(),clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha();
 try{applyFace(key,opt);renderer.setRenderTarget(thumbTarget);renderer.setClearColor(0xece7f3,1);renderer.clear();renderer.render(scene,cam);let pixels=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(thumbTarget,0,0,w,h,pixels);let c=document.createElement('canvas');c.width=w;c.height=h;let ctx=c.getContext('2d'),im=ctx.createImageData(w,h);for(let y=0;y<h;y++)im.data.set(pixels.subarray((h-y-1)*w*4,(h-y)*w*4),y*w*4);ctx.putImageData(im,0,0);return c.toDataURL('image/webp',.86)}finally{renderer.setRenderTarget(targetBefore);renderer.setClearColor(clear,alpha);applyFace()}
}
function renderGallery(){
 const seq=++thumbToken,grid=$('#optionGrid');selectButtons('[data-category]',category,'category');$('#categoryTitle').textContent=sections.find(([k])=>k===category)[1];
 grid.replaceChildren();const key=category,opts=catalog[key]||[];$('#optionCount').textContent=current&&!busy?(opts.length?opts.length+' option'+(opts.length===1?'':'s'):'Not available'):'';
 $('#sectionNote').textContent=current&&!busy?notes[key]:'';
 if(busy||!current){let el=document.createElement('div');el.className='empty';el.textContent=busy?'Loading character…':'Select a model or retry the preview.';grid.append(el);return}
 if(!opts.length){let el=document.createElement('div');el.className='empty';el.textContent=unsupported[key];grid.append(el);return}
 const jobs=[];
 for(let opt of opts){let btn=document.createElement('button');btn.className='option';btn.dataset.option=opt.id;let img=document.createElement('img');img.alt=opt.name+' — preview of selected 3D character';img.hidden=true;let placeholder=document.createElement('span');placeholder.className='placeholder';placeholder.textContent='…';let name=document.createElement('span');name.className='name';name.textContent=opt.name;btn.append(img,placeholder,name);btn.onclick=()=>{selected[key]=opt.id;applyFace();selectButtons('[data-option]',opt.id,'option');thumbCache.clear();$('#detail').textContent=opt.name+' selected';};grid.append(btn);jobs.push({img,placeholder,opt})}
 selectButtons('[data-option]',selected[key],'option');
 // Incremental thumbnail generation: one actual 3D render per frame; cancelled on tab or model switch.
 let i=0;const cacheState=JSON.stringify(selected);function next(){if(seq!==thumbToken||busy||key!==category)return;if(i>=jobs.length)return;let {img,placeholder,opt}=jobs[i++];const cacheKey=gender+'|'+key+'|'+opt.id+'|'+cacheState;try{let src=thumbCache.get(cacheKey);if(!src){src=thumbnail(key,opt);thumbCache.set(cacheKey,src);if(thumbCache.size>80)thumbCache.delete(thumbCache.keys().next().value)}img.src=src;img.hidden=false;placeholder.hidden=true}catch(e){placeholder.textContent='Preview unavailable'}requestAnimationFrame(next)}requestAnimationFrame(next)
}
async function load(){
 let seq=++request;thumbToken++;busy=true;controller?.abort();controller=new AbortController();catalog={};renderGallery();show('Loading character…');$('#detail').textContent='Loading real 3D textures…';
 try{let res=await fetch('/avatar-models/'+PEOPLE[gender]+'.glb',{signal:controller.signal});if(!res.ok)throw Error('Model download failed ('+res.status+')');let bytes=await res.arrayBuffer();if(seq!==request)return;show('Preparing face editor…');let gltf=await loader.parseAsync(bytes,'/avatar-models/');if(seq!==request){dispose(gltf.scene);return}
 mixer?.stopAllAction();if(current){group.remove(current);dispose(current)}current=gltf.scene;current.traverse(o=>{if(!o.isMesh)return;o.frustumCulled=false;for(let m of Array.isArray(o.material)?o.material:[o.material]){if(!m)continue;if(/^Hair|^Eyebrows|^Eyelashes/i.test(o.name)&&m.map){m.alphaTest=.35;m.transparent=false;m.depthWrite=true;m.side=THREE.DoubleSide}m.needsUpdate=true}});
 // Restore the original outfit and hide alternative modular garment sets.
 const alternate=new Set(['Outfit_formal','Skin_formal','Top_shirt','Skin_shirt','Top_tee','Skin_tee','Trousers','Shoes']);
 if(current.getObjectByName('Outfit_original'))current.traverse(o=>{if(alternate.has(o.name))o.visible=false;if(o.name==='Outfit_original'||o.name==='Skin_original')o.visible=true});
 group.add(current);mixer=new THREE.AnimationMixer(current);const idle=gltf.animations.find(x=>x.name.toLowerCase()==='idle')||gltf.animations.find(x=>x.name.toLowerCase().includes('idle'));if(idle){mixer.clipAction(idle).play();mixer.update(.05)}
 locateHead();discover();applyFace();thumbCache.clear();resetCamera();busy=false;$('#status').hidden=true;$('#detail').textContent='3D face ready';renderGallery();
 }catch(e){if(seq!==request||e.name==='AbortError')return;busy=false;if(current){group.remove(current);dispose(current);current=null}mixer=null;show(e.message||'Unable to load character',true);$('#detail').textContent='Model unavailable';renderGallery()}
}
function resize(){const canvas=$('#view'),w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h||!renderer)return;renderer.setPixelRatio(eco?1:Math.min(devicePixelRatio,1.5));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function start(){try{renderer=new THREE.WebGLRenderer({canvas:$('#view'),alpha:true,antialias:true,powerPreference:'low-power'});renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(32,1,.05,50);controls=new OrbitControls(camera,$('#view'));controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.32;controls.maxDistance=2;controls.maxPolarAngle=Math.PI*.72;controls.autoRotateSpeed=1.1;const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();env=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();scene.environment=env.texture;scene.environmentIntensity=.95;scene.add(new THREE.HemisphereLight(0xffffff,0xc6b3da,1.6));for(let [x,y,z,i,c] of [[-3,4,5,2.2,0xfff4e9],[3,2,3,1.2,0xf5f2ff],[1,3,-4,2,0xc9b6ff]]){let l=new THREE.DirectionalLight(c,i);l.position.set(x,y,z);scene.add(l)}group=new THREE.Group();scene.add(group);loader=new GLTFLoader();new ResizeObserver(resize).observe($('#stage'));new IntersectionObserver(entries=>visible=entries[0].isIntersecting).observe($('#stage'));resize();resetCamera();
 function tick(now){requestAnimationFrame(tick);if(document.hidden||!visible){last=now;return}if(now-last<(eco?66:33))return;last=now;controls.update();renderer.render(scene,camera)}requestAnimationFrame(tick);load()}catch(e){show('WebGL viewer could not start. Check graphics acceleration.');$('#detail').textContent='GPU rendering unavailable'}}
buildCategories();
$$('[data-gender]').forEach(b=>b.onclick=()=>{if(gender===b.dataset.gender)return;gender=b.dataset.gender;selectButtons('[data-gender]',gender,'gender');if(loader)load()});
$('#retry').onclick=()=>{if(loader)load()};$('#close').onclick=resetCamera;$('#reset').onclick=()=>{if(controls){controls.autoRotate=false;$('#rotate').classList.remove('sel');resetCamera()}};$('#rotate').onclick=()=>{if(controls){controls.autoRotate=!controls.autoRotate;$('#rotate').classList.toggle('sel',controls.autoRotate)}};$('#resetFace').onclick=()=>{if(!current||busy)return;selected=Object.fromEntries(Object.entries(catalog).filter(([k,v])=>v.length).map(([k,v])=>[k,v[0].id]));applyFace();thumbCache.clear();renderGallery();$('#detail').textContent='Face reset'};$('#eco').onclick=()=>{eco=!eco;$('#eco').classList.toggle('sel',eco);$('#eco').setAttribute('aria-pressed',String(eco));resize()};start();
