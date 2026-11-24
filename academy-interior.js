import * as T from 'three';
const rng=(()=>{let n=728;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296)})();
const mat=(color,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
const glow=(color)=>new T.MeshBasicMaterial({color});
function mesh(g,geo,m,x=0,y=0,z=0){let a=new T.Mesh(geo,m);a.position.set(x,y,z);g.add(a);return a}
function box(g,m,w,h,d,x,y,z){return mesh(g,new T.BoxGeometry(w,h,d),m,x,y,z)}
function cylinder(g,m,r,h,x,y,z,r2=r){return mesh(g,new T.CylinderGeometry(r2,r,h,16),m,x,y,z)}
function texture(type){let c=document.createElement('canvas');c.width=c.height=512;let ctx=c.getContext('2d');let base=type==='wall'?[111,106,99]:type==='floor'?[34,32,30]:type==='glass'?[177,175,166]:[190,185,174];let im=ctx.createImageData(512,512);for(let y=0;y<512;y++)for(let x=0;x<512;x++){let i=(y*512+x)*4;let n=(rng()-.5)*(type==='glass'?85:13)+Math.sin(x*.062+Math.sin(y*.013)*2)*4+Math.sin(x*.017+y*.009)*5;for(let k=0;k<3;k++)im.data[i+k]=base[k]+n;im.data[i+3]=255}ctx.putImageData(im,0,0);if(type==='wall'){for(let i=0;i<95;i++){let x=rng()*512,y=rng()*512;ctx.fillStyle=rng()>.5?'rgba(225,214,193,.055)':'rgba(28,25,23,.045)';ctx.fillRect(x,y,2+rng()*24,30+rng()*190)}}if(type==='floor'||type==='tile'){ctx.strokeStyle=type==='floor'?'#776e5c':'#a49c91';ctx.lineWidth=2;ctx.strokeRect(1,1,510,510);if(type==='floor'){ctx.strokeStyle='#504941';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(160,0);ctx.lineTo(210,240);ctx.lineTo(202,310);ctx.lineTo(290,512);ctx.stroke()}}let t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t}
function surface(g,type,w,d,x,y,z){let map=texture(type);map.repeat.set(w/(type==='floor'?.72:.8),d/(type==='floor'?.72:.8));let o=mesh(g,new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({map,roughness:type==='floor'?.19:.76,metalness:type==='floor'?.22:0,envMapIntensity:type==='floor'?.7:.25}),x,y,z);o.rotation.x=-Math.PI/2;return o}
function label(g,text,x,y,z,w=.7,h=.25,color='#a51c59'){let c=document.createElement('canvas');c.width=512;c.height=160;let ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,512,160);ctx.fillStyle='#fff';ctx.font='bold 47px Arial';ctx.textAlign='center';ctx.textBaseline='middle';let lines=text.split('|');lines.forEach((s,i)=>ctx.fillText(s,256,80+(i-(lines.length-1)/2)*53,480));let t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return mesh(g,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t}),x,y,z)}
function wall(g,m,w,h,d,x,y,z){return box(g,m,w,h,d,x,y,z)}
function light(g,x,y,z,tx,ty,tz,intensity=12){const l=new T.SpotLight(0xffe6be,intensity,6,Math.PI/3,.8,1.6);l.position.set(x,y,z);l.target.position.set(tx,ty,tz);g.add(l,l.target);return l}
function washTexture(){let c=document.createElement('canvas');c.width=128;c.height=256;let ctx=c.getContext('2d'),gr=ctx.createRadialGradient(64,234,4,64,234,135);gr.addColorStop(0,'rgba(255,235,190,.8)');gr.addColorStop(.24,'rgba(255,221,158,.29)');gr.addColorStop(1,'rgba(255,221,158,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,128,256);let t=new T.CanvasTexture(c);return t}
function arc(g,m,r,depth,height,start,end,x,y,z){const shape=new T.Shape();let N=36;for(let i=0;i<=N;i++){let a=start+(end-start)*i/N;let X=Math.cos(a)*r,Z=Math.sin(a)*r;i?shape.lineTo(X,Z):shape.moveTo(X,Z)}for(let i=N;i>=0;i--){let a=start+(end-start)*i/N;shape.lineTo(Math.cos(a)*(r-depth),Math.sin(a)*(r-depth))}shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.035,curveSegments:12});geo.rotateX(-Math.PI/2);return mesh(g,geo,m,x,y,z)}
export function makeAcademy(scene){
 scene.background=new T.Color(0x171513);scene.fog=new T.Fog(0x25221e,22,47);const g=new T.Group();scene.add(g);
 const concrete=new T.MeshStandardMaterial({map:texture('wall'),roughness:.93}),black=mat(0x222222,.46,.25),frame=mat(0x343632,.45,.55),white=mat(0xd9d1c1,.84),wood=mat(0x895637,.6),mustard=mat(0xb17a1a,.94),cushion=mat(0xc08a24,.95),glass=new T.MeshStandardMaterial({color:0xa9b9b3,transparent:true,opacity:.19,roughness:.16,metalness:.12,depthWrite:false}),warm=glow(0xfff1d5),dark=mat(0x302c29,.88),colliders=[];
 const coll=(x,z,w,d)=>colliders.push({x,z,w,d});
 // Entrance reconstructed from the supplied front-facing photograph. Dimensions are estimates.
 surface(g,'floor',5.6,10,0,0,5);
 wall(g,concrete,.25,4.9,10,-2.93,2.45,5);wall(g,concrete,.25,4.9,10,2.93,2.45,5);wall(g,concrete,5.8,.22,10,0,5,5);
 wall(g,concrete,2.72,4.9,.28,-1.46,2.45,0);wall(g,concrete,1.72,4.9,.28,1.96,2.45,0);wall(g,concrete,1.2,2.45,.28,.5,3.675,0);
 wall(g,concrete,.46,4.9,.32,1.43,2.45,.21);box(g,warm,.018,4.78,.019,1.68,2.39,.382);
 box(g,black,5.7,.075,.07,0,.04,.19);
 for(let x of [-2.25,-.48,2.55]){box(g,frame,.29,.045,.18,x,.028,.48);box(g,warm,.23,.022,.10,x,.06,.48);let a=mesh(g,new T.PlaneGeometry(1.55,2.55),new T.MeshBasicMaterial({map:washTexture(),transparent:true,depthWrite:false,blending:T.AdditiveBlending}),x,1.27,.155);light(g,x,.1,.6,x,1.1,0,8)}
 label(g,'Picsart|Academy',-.7,2.02,.153,.45,.15);
 const door=new T.Group();door.position.set(1.1,.03,.16);g.add(door);
 box(g,frame,.075,2.43,.15,-.115,1.215,.04);box(g,frame,.075,2.43,.15,1.115,1.215,.04);box(g,frame,1.3,.075,.15,.5,2.45,.04);
 let frost=new T.MeshStandardMaterial({map:texture('glass'),roughness:.42,metalness:.08,envMapIntensity:.45});
 box(door,frame,1.2,2.34,.07,-.6,1.17,0);box(door,frost,.96,1.92,.083,-.6,1.23,.006);box(door,black,.04,.76,.065,-1.03,1.04,.11);box(door,black,.1,.045,.13,-1.03,1.39,.065);box(door,black,.1,.045,.13,-1.03,.69,.065);box(door,black,.24,.07,.09,-.35,2.22,.065);
 const wallLamp=glow(0xffe6bc);
 for(let z of [3,7,9]){box(g,wallLamp,.08,.045,.27,2.7,.03,z);light(g,2.72,.1,z,2.8,1.2,z,5)}
 // Hall beyond the entrance: open double-height lounge, stair and mezzanine.
 surface(g,'tile',13.2,13.6,0,0,-6.9);wall(g,white,.22,5.6,13.8,-6.72,2.8,-6.9);wall(g,dark,.22,5.6,13.8,6.72,2.8,-6.9);wall(g,white,13.4,5.6,.22,0,2.8,-13.8);wall(g,white,13.4,.2,14,0,5.65,-6.9);wall(g,white,6.5,5.6,.28,-3.35,2.8,0);wall(g,white,5.5,5.6,.28,3.85,2.8,0);wall(g,white,1.2,3.15,.28,.5,4.025,0);
 for(let z of [-2,-5,-8,-11]){box(g,white,13.2,.38,.23,0,5.25,z);box(g,black,10.6,.11,.17,.2,5.02,z);box(g,warm,9.4,.042,.09,.2,4.82,z);for(let x of [-3.1,3.4]){box(g,black,.035,.48,.035,x,5.12,z)}}
 for(let x of [-3.1,2.6]){let duct=cylinder(g,black,.24,12.5,x,5.0,-6.8);duct.rotation.x=Math.PI/2;for(let z of [-3,-8,-12]){let elbow=cylinder(g,black,.25,2.2,x,5.0,z);elbow.rotation.z=Math.PI/2}}
 // Rear mezzanine and the left-hand stairs.
 box(g,black,13.15,.22,5.0,0,2.85,-11.1);box(g,white,13.15,.16,.25,0,2.66,-8.61);
 for(let i=0;i<12;i++){let x=-6.45+i*(12.9/11);box(g,frame,.045,.98,.045,x,3.45,-8.52);if(i<11)box(g,glass,12.9/11-.045,.87,.035,x+12.9/22,3.4,-8.52)}box(g,frame,13.0,.065,.06,0,3.97,-8.52);
 for(let i=0;i<15;i++){let h=(i+1)*.19;box(g,black,1.55,h,.43,-5.45,h/2,-2.2-i*.42)}coll(-5.45,-5.2,1.65,6.6);
 const railA=new T.Vector3(-4.62,1.02,-2.0),railB=new T.Vector3(-4.62,3.9,-8.58),dir=railB.clone().sub(railA);let rail=cylinder(g,frame,.035,dir.length(),0,0,0);rail.position.copy(railA).add(railB).multiplyScalar(.5);rail.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());for(let i=0;i<8;i++){let z=-2.2-i*.8,h=.25+i*.38;box(g,frame,.035,.95,.035,-4.62,h+.46,z);box(g,glass,.036,.80,.75,-4.62,h+.45,z-.33)}
 // Photo reference: elongated S-shaped, double-sided seating island.
 const spine=new T.CatmullRomCurve3([
  new T.Vector3(.78,0,-2.05),new T.Vector3(-.38,0,-2.55),new T.Vector3(-.52,0,-3.75),
  new T.Vector3(.28,0,-5.0),new T.Vector3(.97,0,-6.15),new T.Vector3(.91,0,-7.4),
  new T.Vector3(.14,0,-8.35),new T.Vector3(-.38,0,-8.55)
 ],false,'centripetal');
 const sofaFrame=mat(0x98630f,.92),seatMat=mat(0xd39a28,.94),backMat=mat(0xbf8620,.94),soil=mat(0x4c4636,.95),seamMat=mat(0xa87520,.95);
 // Sweep a rounded upholstered cross-section along the spine. Shared vertices give smooth curves.
 function sweep(material,offset,height,width,thickness,from=0,to=1){
  const steps=Math.max(6,Math.ceil((to-from)*88)),sides=12,verts=[],indices=[];
  for(let i=0;i<=steps;i++){
   const t=from+(to-from)*i/steps,p=spine.getPointAt(t),d=spine.getTangentAt(t);
   const nx=-d.z,nz=d.x;const cap=Math.min(1,.7+Math.min(i,steps-i)*.15);
   for(let k=0;k<sides;k++){let a=2*Math.PI*k/sides,v=offset+Math.cos(a)*width*.5*cap;verts.push(p.x+nx*v,height+Math.sin(a)*thickness*.5,p.z+nz*v)}
   if(i){for(let k=0;k<sides;k++){let a=(i-1)*sides+k,b=(i-1)*sides+(k+1)%sides,c=i*sides+k,d2=i*sides+(k+1)%sides;indices.push(a,c,b,b,c,d2)}}
  }
  for(let k=1;k<sides-1;k++){indices.push(0,k,k+1);let b=steps*sides;indices.push(b,b+k+1,b+k)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();return mesh(g,geo,material);
 }
 sweep(sofaFrame,0,.21,1.84,.40);
 for(let side of [-1,1]){
  sweep(seatMat,side*.57,.45,.72,.24);
  sweep(backMat,side*.24,.76,.22,.64);
 }
 sweep(soil,0,.91,.30,.12);
 // Soft cushion joins and silver-green foliage follow the same curve.
 for(let i=1;i<13;i++){let t=i/13,p=spine.getPointAt(t),d=spine.getTangentAt(t);for(let side of [-1,1]){let m=box(g,seamMat,.016,.009,.56,p.x-d.z*side*.57,.565,p.z+d.x*side*.57);m.rotation.y=Math.atan2(d.x,d.z)}}
 const leafColors=[0x8a9b75,0xa0ae85,0x657f56];for(let q=0;q<3;q++){
  let leaves=new T.InstancedMesh(new T.SphereGeometry(1,6,4),mat(leafColors[q],.94),100),obj=new T.Object3D();
  for(let i=0;i<100;i++){let t=rng(),p=spine.getPointAt(t),d=spine.getTangentAt(t),off=(rng()-.5)*.38;obj.position.set(p.x-d.z*off,1.03+rng()*.23,p.z+d.x*off);obj.scale.set(.026+rng()*.035,.15+rng()*.18,.028+rng()*.018);obj.rotation.set((rng()-.5)*1.7,rng()*6.28,(rng()-.5)*1.6);obj.updateMatrix();leaves.setMatrixAt(i,obj.matrix)}
  leaves.instanceMatrix.needsUpdate=true;g.add(leaves);
 }
 // Local circular collision samples preserve the open walkways on both sides.
 for(let i=0;i<=28;i++){let p=spine.getPointAt(i/28);colliders.push({x:p.x,z:p.z,r:.94})}
 // Reference: dark raised study strip with parallel long tables and wooden benches.
 const timber=mat(0xb77a3b,.65),topMat=mat(0x343638,.65),platform=mat(0x252729,.85);
 box(g,platform,2.55,.085,11.65,5.28,.0425,-6.65);
 box(g,warm,.022,.025,11.65,4.00,.075,-6.65);
 for(let z of [-2.55,-5.25,-7.95,-10.65]){
  box(g,topMat,.86,.075,2.12,5.71,.84,z);
  for(let zz of [-.91,.91])for(let x of [5.34,6.08])box(g,black,.045,.79,.045,x,.425,z+zz);
  // Wood modesty panel facing the lounge, on the outer bench side.
  box(g,timber,.055,.49,2.05,4.40,.35,z);
  box(g,timber,.40,.065,2.06,4.66,.51,z);box(g,timber,.36,.065,2.06,6.40,.51,z);
  for(let zz of [-.86,.86])for(let x of [4.66,6.40]){box(g,black,.045,.47,.045,x,.28,z+zz);box(g,black,.32,.045,.045,x,.10,z+zz)}
  coll(5.45,z,2.12,2.18);
 }
 // Oversized, directly illuminated academy lettering above the study tables.
 const fascia=mat(0x252525,.86);box(g,fascia,.075,1.53,11.85,6.54,3.72,-6.65);
 const signCanvas=document.createElement('canvas');signCanvas.width=2048;signCanvas.height=320;
 const sc=signCanvas.getContext('2d');sc.clearRect(0,0,2048,320);sc.textAlign='center';sc.textBaseline='middle';
 sc.font='600 238px Arial';sc.shadowColor='#efffff';sc.shadowBlur=36;sc.fillStyle='#f5ffff';sc.fillText('Picsart Academy',1024,165,1940);
 sc.shadowBlur=0;sc.fillStyle='#ffffff';sc.fillText('Picsart Academy',1024,165,1940);
 const signMap=new T.CanvasTexture(signCanvas);signMap.colorSpace=T.SRGBColorSpace;signMap.anisotropy=4;
 const letters=mesh(g,new T.PlaneGeometry(11.35,1.50),new T.MeshBasicMaterial({map:signMap,transparent:true,depthWrite:false,toneMapped:false}),6.475,3.72,-6.65);letters.rotation.y=-Math.PI/2;
 box(g,warm,.027,.032,11.85,6.47,2.95,-6.65);
 const signLight=new T.PointLight(0xfff5df,7,8,1.6);signLight.position.set(6.0,3.2,-6.65);g.add(signLight);
 // Warm rectangular pendant outlines over the desks.
 for(let z of [-3.3,-7.1,-10.9]){
  box(g,warm,.045,.045,2.6,4.95,4.48,z);box(g,warm,.045,.045,2.6,6.35,4.48,z);
  box(g,warm,1.4,.045,.045,5.65,4.48,z-1.3);box(g,warm,1.4,.045,.045,5.65,4.48,z+1.3);
  for(let x of [4.95,6.35])box(g,black,.018,.55,.018,x,4.78,z);
 }
 box(g,white,2.1,1.0,.75,-1.65,.5,-11.6);box(g,black,2.2,.055,.82,-1.65,1.02,-11.6);coll(-1.65,-11.6,2.2,.9);
 let hallLight=new T.PointLight(0xffecd2,14,19,1.3);hallLight.position.set(0,4.4,-6.2);g.add(hallLight);
 let corridorLight=new T.PointLight(0xffe2b6,8,13,1.4);corridorLight.position.set(0,3.7,4);g.add(corridorLight);
 return {door,colliders,open:false,angle:0};
}
export function doorNearby(state,x,z){return Math.abs(x-.5)<1.6&&Math.abs(z)<1.7}
export function advanceDoor(state,dt){state.angle=T.MathUtils.damp(state.angle,state.open?Math.PI*.53:0,7,dt);state.door.rotation.y=-state.angle}
export function academyWalkable(state,x,z,r=.27){if(z>9.7-r||z< -13.55+r)return false;if(z>.22){if(Math.abs(x)>2.8-r)return false}else if(Math.abs(x)>6.57-r)return false;if(Math.abs(z)<.29+r){if(x<-.1+r||x>1.1-r||state.angle<1.2)return false}return !state.colliders.some(c=>c.r!==undefined?Math.hypot(x-c.x,z-c.z)<c.r+r:Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r)}
