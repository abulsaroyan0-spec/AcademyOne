import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));


const PEOPLE={male:'ethan',female:'priya'};
const HAIR={short02:'Classic short',short04:'Sleek short',afro01:'Curly afro',bob01:'Long bob',bob02:'Soft bob',long01:'Long straight',ponytail01:'Ponytail',braid01:'Braid'};
const sections=[['hair','Hairstyles'],['hairColor','Hair color'],['eyeColor','Eye color'],['skin','Skin tone']];
const svgs={hair:'<path d="M4 14V9a8 8 0 0 1 16 0v5M4 9c4 1 7-1 9-4 1 3 4 5 7 5M6 14v3m12-3v3"/>',hairColor:'<path d="M5 5c2-2 5-2 7 0l8 8-7 7-8-8c-2-2-2-5 0-7Z"/><path d="m9 9 6 6"/>',eyeColor:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/>',skin:'<path d="M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/>'};
const colors={
hairColor:[['Original',null],['Black','#201a19'],['Espresso','#3a241a'],['Chestnut','#68422e'],['Chocolate','#855637'],['Copper','#a75028'],['Honey','#bd9560'],['Blond','#e1c58f'],['Ash blond','#c2b9a9'],['Silver','#b8b9c2']],
eyeColor:[['Original',null],['Dark brown','#583522'],['Brown','#865433'],['Amber','#c09239'],['Hazel','#888146'],['Olive','#747d40'],['Green','#528561'],['Blue','#528bb9'],['Gray','#9ba6b1'],['Ice blue','#9ac4dc']],
skin:[['Original',null],['Fair','#fff5ef'],['Warm fair','#ffe6d2'],['Peach','#f9cbb1'],['Golden','#e8bd91'],['Olive','#d3b48b'],['Tan','#bc9172'],['Bronze','#a77c61'],['Deep','#805b49'],['Rich deep','#5b3e34']]};
let gender='male',category='hair',current=null,mixer=null,renderer,scene,camera,controls,group,loader,env,request=0,controller,eco=false,visible=true,last=0,busy=false,thumbToken=0,thumbTarget,headPoint=new THREE.Vector3(0,1.65,0),headSize=.3,selected={},catalog={},thumbCache=new Map(),hairAssets=new Map(),hairPending=new Map(),hairRoot=null,originalHair=[],targetFit=null,sourceFit=null,materialGroups={},derivedTextures=new Map(),hairGeneration=0;
const notes={hair:'Choose a different 3D hairstyle.',hairColor:'Choose a hair color.',eyeColor:'Choose an iris color.',skin:'Choose a skin tone.'};
const unsupported={hair:'This model has no safely separable hair mesh.',hairColor:'No editable hair material found.',eyeColor:'No separate iris or suitable eye texture found.',skin:'No safely identifiable skin material found.'};
const selectButtons=(sel,val,key)=>$$(sel).forEach(b=>{const on=b.dataset[key]===val;b.classList.toggle('sel',on);b.setAttribute('aria-pressed',String(on))});
function show(msg,retry=false){$('#status').hidden=false;$('#message').textContent=msg;$('#retry').hidden=!retry}
function buildCategories(){let el=$('#categories');el.replaceChildren();for(const [id,name] of sections){let b=document.createElement('button');b.className='category';b.dataset.category=id;b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+svgs[id]+'</svg><span>'+name+'</span>';b.onclick=()=>{category=id;renderGallery()};el.append(b)}selectButtons('[data-category]',category,'category')}
const mats=o=>(Array.isArray(o.material)?o.material:[o.material]).filter(Boolean);
const isHairName=s=>/(^|[\s_.-])hair($|[\s_.-]|\d)|^hair(?=[A-Z])/i.test(s)&&!/brow|lash|beard|skin/i.test(s);
const semantic=o=>[o.name||'',o.parent?.name||''].join(' ');
function hairMaterial(m,o){return isHairName(m.name||'')||isHairName(semantic(o))}
function vertices(o,fn){const pos=o.geometry?.attributes.position;if(!pos)return;o.updateWorldMatrix(true,false);if(o.isSkinnedMesh)o.skeleton.update();const p=new THREE.Vector3();for(let i=0;i<pos.count;i++){o.getVertexPosition(i,p);p.applyMatrix4(o.matrixWorld);fn(p)}}
function fitOf(meshes){
 const box=new THREE.Box3();for(const o of meshes)vertices(o,p=>box.expandByPoint(p));if(box.isEmpty())return null;
 const full=box.getSize(new THREE.Vector3());if(!Number.isFinite(full.x)||full.x<.02||full.x>1)return null;
 const upper=new THREE.Box3();let cut=box.max.y-Math.min(.135,Math.max(.07,full.x*.63));for(const o of meshes)vertices(o,p=>{if(p.y>=cut)upper.expandByPoint(p)});
 if(upper.isEmpty())return null;let size=upper.getSize(new THREE.Vector3()),center=upper.getCenter(new THREE.Vector3());if(size.x<.025||size.z<.025)return null;
 return {top:box.max.y,center,size};
}
function dispose(root){if(!root)return;const textures=new Set(),materials=new Set(),geometry=new Set();root.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(let m of mats(o)){materials.add(m);for(let v of Object.values(m))if(v?.isTexture)textures.add(v)}});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}
function rememberMaterial(m){if(!m.userData.faceOriginal){m.userData.faceOriginal=m.color?.clone();m.userData.faceMap=m.map||null}}
function detect(){
 materialGroups={hairColor:new Set(),eyeColor:new Set(),skin:new Set()};originalHair=[];
 current.updateMatrixWorld(true);
 current.traverse(o=>{
 if(!o.isMesh)return;const mm=mats(o);if(!mm.length)return;
 const hairOnly=mm.every(m=>hairMaterial(m,o));
 if(hairOnly&&o.visible){originalHair.push(o);for(let m of mm){rememberMaterial(m);m.roughness=.85;m.metalness=0;m.envMapIntensity=.3;m.alphaToCoverage=true;if(m.map){m.alphaTest=.36;m.transparent=false;m.depthWrite=true;m.side=THREE.DoubleSide}materialGroups.hairColor.add(m)}}
 for(let m of mm){if(!m.color)continue;rememberMaterial(m);let name=(m.name||'').toLowerCase(),mesh=semantic(o).toLowerCase(),sem=name+' '+mesh;
 if(!hairOnly&&/(^|[\s_.-])iris($|[\s_.-]|\d)/i.test(sem)&&!/skin|head|body|sclera/i.test(name)){m.userData.eyeMode='iris';materialGroups.eyeColor.add(m)}
 else if(!hairOnly&&/(^|[\s_.-])eyes?($|[\s_.-]|\d)/i.test(sem)&&!/brow|lash|skin|head|body|teeth/i.test(name)&&m.map?.image){m.userData.eyeMode='texture';if(canRecolorEye(m))materialGroups.eyeColor.add(m)}
 if(!hairOnly&&/(^|[\s_.-])skin($|[\s_.-]|\d)|face.?skin|head.?skin|body.?skin/i.test(sem)&&!/eye|hair|brow|lash|teeth|cloth|outfit/i.test(name))materialGroups.skin.add(m);
 }
 });
 targetFit=fitOf(originalHair);sourceFit=null;
 catalog={hair:[{id:'original',name:'Original'}]};
 if(targetFit){let order=gender==='male'?['short02','short04','afro01','bob02','bob01','long01','ponytail01','braid01']:['bob02','bob01','long01','ponytail01','braid01','afro01','short02','short04'];catalog.hair.push(...order.map(id=>({id,name:HAIR[id]})))}
 for(const [key,defs] of Object.entries(colors))catalog[key]=(materialGroups[key].size||(key==='hairColor'&&targetFit))?defs.map(([name,tint],i)=>({id:String(i),name,tint})):[];
 selected=Object.fromEntries(Object.entries(catalog).filter(([k,v])=>v.length).map(([k,v])=>[k,v[0].id]));
 $('#modelDetails').textContent='Independent CC0 hairstyle meshes are fitted to the original head silhouette. Available: '+catalog.hair.length+' hairstyles, '+catalog.hairColor.length+' hair colors, '+catalog.eyeColor.length+' eye colors, '+catalog.skin.length+' skin tones. Fit may vary. Choices are preview-only.';
}
function choice(key,id=selected[key]){return catalog[key]?.find(o=>o.id===id)}
function getImageData(tex){const img=tex?.image,w=img?.width||img?.videoWidth,h=img?.height||img?.videoHeight;if(!w||!h)return null;const ratio=Math.min(1,768/Math.max(w,h));let c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*ratio));c.height=Math.max(1,Math.round(h*ratio));let ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,c.width,c.height);return {c,ctx,im:ctx.getImageData(0,0,c.width,c.height)}}
function irisMask(r,g,b){let hi=Math.max(r,g,b),lo=Math.min(r,g,b),sat=(hi-lo)/Math.max(1,hi);return hi>35&&hi<205&&sat>.13&&!(r>g*1.36&&g>b*1.10)}
function canRecolorEye(m){try{const x=getImageData(m.map);if(!x)return false;let n=0,opaque=0;for(let i=0;i<x.im.data.length;i+=4){let [r,g,b,a]=x.im.data.subarray(i,i+4);if(a<100)continue;opaque++;if(irisMask(r,g,b))n++}return n>25&&n<opaque*.8}catch{return false}}
function recolorMap(m,tint,kind){
 const source=m.userData.faceMap;if(!source)return null;const key=source.uuid+'|'+kind+'|'+tint;if(derivedTextures.has(key))return derivedTextures.get(key);
 try{let data=getImageData(source);if(!data)return null;const {c,ctx,im}=data;let rgb=new THREE.Color(tint).getRGB(new THREE.Color(),THREE.SRGBColorSpace);let target=[rgb.r*255,rgb.g*255,rgb.b*255];
 for(let i=0;i<im.data.length;i+=4){let r=im.data[i],g=im.data[i+1],b=im.data[i+2];if(im.data[i+3]<5||kind==='eye'&&!irisMask(r,g,b))continue;let lum=.2126*r+.7152*g+.0722*b;let gain=kind==='hair'?THREE.MathUtils.clamp(.48+lum/150,.40,1.55):THREE.MathUtils.clamp(lum/105,.42,1.55);for(let k=0;k<3;k++)im.data[i+k]=Math.round(THREE.MathUtils.clamp(target[k]*gain,0,255))}
 ctx.putImageData(im,0,0);let tex=source.clone();tex.image=c;tex.needsUpdate=true;derivedTextures.set(key,tex);return tex}catch{return null}
}
function tintMat(m,opt,kind){if(!m.color)return;rememberMaterial(m);m.color.copy(m.userData.faceOriginal);m.map=m.userData.faceMap||null;if(!opt?.tint){m.needsUpdate=true;return}
 if(kind==='eyeColor'&&m.userData.eyeMode==='texture'){let map=recolorMap(m,opt.tint,'eye');if(map)m.map=map;}
 else if(kind==='hairColor'){if(m.userData.tint?.gain){m.color.set(opt.tint).multiplyScalar(m.userData.tint.gain)}else{let map=recolorMap(m,opt.tint,'hair');if(map){m.map=map;m.color.set(0xffffff)}else m.color.set(opt.tint)}}
 else m.color.multiply(new THREE.Color(opt.tint));m.needsUpdate=true;
}
async function sourceHair(id){
 const gen=hairGeneration;if(hairAssets.has(id))return hairAssets.get(id);if(hairPending.has(id))return hairPending.get(id);
 const job=(async()=>{let res=await fetch('/hair-models/'+id+'.glb');if(!res.ok)throw Error('Hair download failed');let gltf=await loader.parseAsync(await res.arrayBuffer(),'/hair-models/');if(gen!==hairGeneration){dispose(gltf.scene);throw Error('Model changed')}
 gltf.scene.updateMatrixWorld(true);const candidates=[];gltf.scene.traverse(o=>{if(o.isMesh&&o.geometry?.attributes.position&&(/hair/i.test(o.name)||mats(o).some(m=>/hair/i.test(m.name||''))))candidates.push(o)});if(!candidates.length){gltf.scene.traverse(o=>{if(o.isMesh&&o.geometry?.attributes.position)candidates.push(o)})}
 if(!candidates.length){dispose(gltf.scene);throw Error('No hair geometry')}
 const root=new THREE.Group();for(let o of candidates){let g=o.geometry.clone(),pos=g.attributes.position,p=new THREE.Vector3();o.updateWorldMatrix(true,false);if(o.isSkinnedMesh)o.skeleton.update();for(let i=0;i<pos.count;i++){o.getVertexPosition(i,p);p.applyMatrix4(o.matrixWorld);pos.setXYZ(i,p.x,p.y,p.z)}pos.needsUpdate=true;g.morphAttributes={};g.deleteAttribute('skinIndex');g.deleteAttribute('skinWeight');g.deleteAttribute('skinIndex1');g.deleteAttribute('skinWeight1');if(g.attributes.normal)g.attributes.normal.applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(o.matrixWorld));else g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();for(let m of mats(o)){rememberMaterial(m);m.side=THREE.DoubleSide;m.roughness=.82;m.metalness=0;m.envMapIntensity=.30;if(m.map){m.alphaTest=.36;m.transparent=false;m.depthWrite=true;m.alphaToCoverage=true}m.needsUpdate=true}let mesh=new THREE.Mesh(g,o.material);mesh.name='SwappableHair';root.add(mesh)}
 root.updateMatrixWorld(true);let fit=fitOf(root.children);if(!fit){dispose(root);throw Error('Hair geometry scale unsupported')}
 const item={root,fit,source:gltf.scene};hairAssets.set(id,item);return item})();
 hairPending.set(id,job);try{return await job}finally{if(hairPending.get(id)===job)hairPending.delete(id)}
}
async function prepareHair(id){
 if(id==='original')return;if(!targetFit)throw Error('Hair is not separable');let gen=hairGeneration;
 let ref=await sourceHair('short02'),asset=await sourceHair(id);if(gen!==hairGeneration)throw Error('Model changed');
 sourceFit=ref.fit;
 const sx=THREE.MathUtils.clamp(targetFit.size.x/sourceFit.size.x,.65,1.5),sz=THREE.MathUtils.clamp(targetFit.size.z/sourceFit.size.z,.65,1.5),sy=(sx+sz)/2;
 asset.root.scale.set(sx,sy,sz);asset.root.position.set(targetFit.center.x-sourceFit.center.x*sx,targetFit.top-sourceFit.top*sy-.004,targetFit.center.z-sourceFit.center.z*sz);
}
function showHair(id){if(hairRoot){group.remove(hairRoot);hairRoot=null}let asset=hairAssets.get(id);const usable=id!=='original'&&asset&&sourceFit;
 for(let o of originalHair)o.visible=!usable;
 if(usable){hairRoot=asset.root;group.add(hairRoot)}
}
function applyFace(overrideKey=null,override=null){
 if(!current)return;
 const hair=overrideKey==='hair'?override:choice('hair');showHair(hair?.id||'original');
 const hairColor=overrideKey==='hairColor'?override:choice('hairColor');
 for(let m of materialGroups.hairColor)tintMat(m,hairColor,'hairColor');if(hairRoot)hairRoot.traverse(o=>{if(o.isMesh)for(let m of mats(o))tintMat(m,hairColor,'hairColor')});
 for(let key of ['eyeColor','skin']){let opt=overrideKey===key?override:choice(key);for(let m of materialGroups[key])tintMat(m,opt,key)}
}
function resetCamera(){if(!camera)return;const dist=Math.max(.58,headSize*3.1);camera.position.set(headPoint.x+.035,headPoint.y+.01,headPoint.z+dist);controls.target.copy(headPoint);controls.update()}
function locateHead(){current.updateMatrixWorld(true);const bone=current.getObjectByName('mixamorigHead')||current.getObjectByName('Head')||(()=>{let head;current.traverse(o=>{if(!head&&o.isBone&&/head$/i.test(o.name))head=o});return head})();let box=new THREE.Box3().setFromObject(current),size=box.getSize(new THREE.Vector3());headSize=THREE.MathUtils.clamp(size.y*.17,.23,.39);if(bone){bone.getWorldPosition(headPoint);headPoint.y+=headSize*.19;headPoint.z+=.015}else{box.getCenter(headPoint);headPoint.y=box.max.y-headSize*.48}}
function thumbnail(key,opt){
 const w=160,h=144;if(!thumbTarget){thumbTarget=new THREE.WebGLRenderTarget(w,h,{depthBuffer:true});thumbTarget.texture.colorSpace=THREE.SRGBColorSpace}
 const cam=new THREE.PerspectiveCamera(32,w/h,.05,50),dist=Math.max(.53,headSize*(key==='hair'?3.04:2.65));cam.position.set(headPoint.x+(key==='hair'?.17:.035),headPoint.y+.01,headPoint.z+dist);cam.lookAt(headPoint);
 const targetBefore=renderer.getRenderTarget(),clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha();
 try{applyFace(key,opt);renderer.setRenderTarget(thumbTarget);renderer.setClearColor(0xece7f3,1);renderer.clear();renderer.render(scene,cam);let pixels=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(thumbTarget,0,0,w,h,pixels);let c=document.createElement('canvas');c.width=w;c.height=h;let ctx=c.getContext('2d'),im=ctx.createImageData(w,h);for(let y=0;y<h;y++)im.data.set(pixels.subarray((h-y-1)*w*4,(h-y)*w*4),y*w*4);ctx.putImageData(im,0,0);return c.toDataURL('image/webp',.87)}finally{renderer.setRenderTarget(targetBefore);renderer.setClearColor(clear,alpha);applyFace()}
}
function renderGallery(){
 const seq=++thumbToken,grid=$('#optionGrid');selectButtons('[data-category]',category,'category');$('#categoryTitle').textContent=sections.find(([k])=>k===category)[1];
 grid.replaceChildren();const key=category,opts=catalog[key]||[];$('#optionCount').textContent=current&&!busy?(opts.length?opts.length+' options':'Not available'):'';$('#sectionNote').textContent=current&&!busy?notes[key]:'';
 if(busy||!current||!opts.length){let el=document.createElement('div');el.className='empty';el.textContent=busy?'Loading character…':!current?'Retry the preview.':unsupported[key];grid.append(el);return}
 const jobs=[];
 for(let opt of opts){let btn=document.createElement('button');btn.className='option';btn.dataset.option=opt.id;let img=document.createElement('img');img.alt=opt.name+' preview';img.hidden=true;let placeholder=document.createElement('span');placeholder.className='placeholder';placeholder.textContent=key==='hair'?'Loading…':'…';let name=document.createElement('span');name.className='name';name.textContent=opt.name;btn.append(img,placeholder,name);if(opt.tint){let chip=document.createElement('span');chip.className='color-chip';chip.style.background=opt.tint;btn.classList.add('has-chip');btn.append(chip)}if(key==='hair'&&opt.id!=='original')btn.disabled=true;
 btn.onclick=()=>{if(busy||seq!==thumbToken)return;selected[key]=opt.id;applyFace();selectButtons('[data-option]',opt.id,'option');$('#detail').textContent=opt.name+' selected';};grid.append(btn);jobs.push({btn,img,placeholder,opt})}
 selectButtons('[data-option]',selected[key],'option');let i=0;const cacheState=JSON.stringify(selected);
 async function next(){if(seq!==thumbToken||busy||key!==category||i>=jobs.length)return;let {btn,img,placeholder,opt}=jobs[i++];const cacheKey=gender+'|'+key+'|'+opt.id+'|'+cacheState;try{if(key==='hair'&&opt.id!=='original')await prepareHair(opt.id);if(seq!==thumbToken||busy)return;let src=thumbCache.get(cacheKey);if(!src){src=thumbnail(key,opt);thumbCache.set(cacheKey,src);if(thumbCache.size>70)thumbCache.delete(thumbCache.keys().next().value)}img.src=src;img.hidden=false;placeholder.hidden=true;btn.disabled=false}catch(e){if(seq!==thumbToken)return;placeholder.textContent='Unavailable';btn.disabled=true}requestAnimationFrame(next)}requestAnimationFrame(next)
}
function clearAssets(){hairGeneration++;hairPending.clear();if(hairRoot){group.remove(hairRoot);hairRoot=null}for(const item of hairAssets.values()){dispose(item.root);dispose(item.source)}hairAssets.clear();for(const tex of derivedTextures.values())tex.dispose();derivedTextures.clear();sourceFit=null;targetFit=null;originalHair=[]}
async function load(){
 let seq=++request;thumbToken++;busy=true;controller?.abort();controller=new AbortController();catalog={};renderGallery();show('Loading character…');$('#detail').textContent='Loading real 3D textures…';
 try{let res=await fetch('/avatar-models/'+PEOPLE[gender]+'.glb',{signal:controller.signal});if(!res.ok)throw Error('Model download failed ('+res.status+')');let bytes=await res.arrayBuffer();if(seq!==request)return;show('Preparing face editor…');let gltf=await loader.parseAsync(bytes,'/avatar-models/');if(seq!==request){dispose(gltf.scene);return}
 mixer?.stopAllAction();clearAssets();if(current){group.remove(current);dispose(current)}current=gltf.scene;current.traverse(o=>{if(!o.isMesh)return;o.frustumCulled=false;for(let m of mats(o)){if(/^Eyebrows|^Eyelashes/i.test(o.name)&&m.map){m.alphaTest=.05;m.transparent=true;m.depthWrite=false;m.side=THREE.DoubleSide}m.needsUpdate=true}});
 const alternate=new Set(['Outfit_formal','Skin_formal','Top_shirt','Skin_shirt','Top_tee','Skin_tee','Trousers','Shoes']);if(current.getObjectByName('Outfit_original'))current.traverse(o=>{if(alternate.has(o.name))o.visible=false;if(o.name==='Outfit_original'||o.name==='Skin_original')o.visible=true});
 group.add(current);mixer=new THREE.AnimationMixer(current);const idle=gltf.animations.find(x=>x.name.toLowerCase()==='idle')||gltf.animations.find(x=>x.name.toLowerCase().includes('idle'));if(idle){mixer.clipAction(idle).play();mixer.update(.05)}
 locateHead();detect();applyFace();thumbCache.clear();resetCamera();busy=false;$('#status').hidden=true;$('#detail').textContent='3D face ready';renderGallery();
 }catch(e){if(seq!==request||e.name==='AbortError')return;busy=false;clearAssets();if(current){group.remove(current);dispose(current);current=null}mixer=null;show(e.message||'Unable to load character',true);$('#detail').textContent='Model unavailable';renderGallery()}
}
function resize(){const canvas=$('#view'),w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h||!renderer)return;renderer.setPixelRatio(eco?1:Math.min(devicePixelRatio,1.5));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function start(){try{renderer=new THREE.WebGLRenderer({canvas:$('#view'),alpha:true,antialias:true,powerPreference:'low-power'});renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(32,1,.05,50);controls=new OrbitControls(camera,$('#view'));controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.32;controls.maxDistance=2;controls.maxPolarAngle=Math.PI*.72;controls.autoRotateSpeed=1.1;const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();env=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();scene.environment=env.texture;scene.environmentIntensity=.8;scene.add(new THREE.HemisphereLight(0xffffff,0xc6b3da,1.2));for(let [x,y,z,i,c] of [[-3,4,5,2.2,0xfff4e9],[3,2,3,1.2,0xf5f2ff],[1,3,-4,2,0xc9b6ff]]){let l=new THREE.DirectionalLight(c,i);l.position.set(x,y,z);scene.add(l)}group=new THREE.Group();scene.add(group);loader=new GLTFLoader();new ResizeObserver(resize).observe($('#stage'));new IntersectionObserver(entries=>visible=entries[0].isIntersecting).observe($('#stage'));resize();resetCamera();
 function tick(now){requestAnimationFrame(tick);if(document.hidden||!visible){last=now;return}if(now-last<(eco?66:33))return;last=now;controls.update();renderer.render(scene,camera)}requestAnimationFrame(tick);load()}catch(e){show('WebGL viewer could not start. Check graphics acceleration.');$('#detail').textContent='GPU rendering unavailable'}}
buildCategories();
$$('[data-gender]').forEach(b=>b.onclick=()=>{if(gender===b.dataset.gender)return;gender=b.dataset.gender;category='hair';selectButtons('[data-gender]',gender,'gender');if(loader)load()});
$('#retry').onclick=()=>{if(loader)load()};$('#close').onclick=resetCamera;$('#reset').onclick=()=>{if(controls){controls.autoRotate=false;$('#rotate').classList.remove('sel');resetCamera()}};$('#rotate').onclick=()=>{if(controls){controls.autoRotate=!controls.autoRotate;$('#rotate').classList.toggle('sel',controls.autoRotate)}};$('#resetFace').onclick=()=>{if(!current||busy)return;selected=Object.fromEntries(Object.entries(catalog).filter(([k,v])=>v.length).map(([k,v])=>[k,v[0].id]));applyFace();thumbCache.clear();renderGallery();$('#detail').textContent='Face reset'};$('#eco').onclick=()=>{eco=!eco;$('#eco').classList.toggle('sel',eco);$('#eco').setAttribute('aria-pressed',String(eco));resize()};start();
