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
 const concrete=new T.MeshStandardMaterial({map:texture('wall'),roughness:.93}),black=mat(0x222222,.46,.25),frame=mat(0x343632,.45,.55),white=mat(0xd9d1c1,.84),wood=mat(0x895637,.6),mustard=mat(0xb17a1a,.94),cushion=mat(0xc08a24,.95),glass=new T.MeshStandardMaterial({color:0xa9b9b3,transparent:true,opacity:.19,roughness:.16,metalness:.12,depthWrite:false}),warm=glow(0xfff1d5),dark=mat(0x302c29,.88),colliders=[],seats=[];
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
 box(door,frame,1.2,2.34,.07,-.6,1.17,0);box(door,frost,.96,1.92,.083,-.6,1.23,.006);box(door,black,.04,.76,.065,-1.03,1.04,.11);box(door,black,.1,.045,.13,-1.03,1.39,.065);box(door,black,.1,.045,.13,-1.03,.69,.065);box(door,black,.24,.07,.09,-.35,2.22,.065);box(door,black,.04,.76,.065,-1.03,1.04,-.11);box(door,black,.1,.045,.13,-1.03,1.39,-.065);box(door,black,.1,.045,.13,-1.03,.69,-.065);
 const wallLamp=glow(0xffe6bc);
 for(let z of [3,7,9]){box(g,wallLamp,.08,.045,.27,2.7,.03,z);light(g,2.72,.1,z,2.8,1.2,z,5)}
 // Hall beyond the entrance: open double-height lounge, stair and mezzanine.
 surface(g,'tile',15.2,23.7,0,0,-11.95);wall(g,white,.22,5.6,13.8,-7.72,2.8,-6.9);wall(g,dark,.22,5.6,13.8,7.72,2.8,-6.9);wall(g,white,15.4,.2,14,0,5.65,-6.9);wall(g,white,4.78,5.6,.28,-5.21,2.8,0);wall(g,white,4.78,5.6,.28,5.21,2.8,0);wall(g,white,5.64,.70,.28,0,5.25,0);
 for(let z of [-2,-5,-8,-11]){box(g,white,15.2,.38,.23,0,5.25,z);box(g,black,12.6,.11,.17,.2,5.02,z);box(g,warm,11.4,.042,.09,.2,4.82,z);for(let x of [-3.1,3.4]){box(g,black,.035,.48,.035,x,5.12,z)}}
 for(let x of [-3.1,2.6]){let duct=cylinder(g,black,.24,12.5,x,5.0,-6.8);duct.rotation.x=Math.PI/2;for(let z of [-3,-8,-12]){let elbow=cylinder(g,black,.25,2.2,x,5.0,z);elbow.rotation.z=Math.PI/2}}
 // Rear mezzanine and the left-hand stairs.
 box(g,black,15.15,.22,5.0,0,2.85,-11.1);box(g,white,15.15,.16,.25,0,2.66,-8.61);
 for(let i=0;i<12;i++){let x=-7.45+i*(14.9/11);box(g,frame,.045,.98,.045,x,3.45,-8.52);if(i<11)box(g,glass,14.9/11-.045,.87,.035,x+14.9/22,3.4,-8.52)}box(g,frame,15.0,.065,.06,0,3.97,-8.52);
 for(let i=0;i<15;i++){let h=(i+1)*.19;box(g,black,1.55,h,.43,-5.45,h/2,-2.2-i*.42)}coll(-5.45,-5.2,1.65,6.6);
 const railA=new T.Vector3(-4.62,1.02,-2.0),railB=new T.Vector3(-4.62,3.9,-8.58),dir=railB.clone().sub(railA);let rail=cylinder(g,frame,.035,dir.length(),0,0,0);rail.position.copy(railA).add(railB).multiplyScalar(.5);rail.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());for(let i=0;i<8;i++){let z=-2.2-i*.8,h=.25+i*.38;box(g,frame,.035,.95,.035,-4.62,h+.46,z);box(g,glass,.036,.80,.75,-4.62,h+.45,z-.33)}
 // Photo reference: elongated S-shaped, double-sided seating island.
 const spine=new T.CatmullRomCurve3([
  new T.Vector3(.78,0,-3.25),new T.Vector3(-.38,0,-3.75),new T.Vector3(-.52,0,-4.95),
  new T.Vector3(.28,0,-6.2),new T.Vector3(.97,0,-7.35),new T.Vector3(.91,0,-8.6),
  new T.Vector3(.14,0,-9.55),new T.Vector3(-.38,0,-9.75)
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
 // Seat anchors follow the exact sofa curve, facing away from its planted center.
 for(let i=1;i<=10;i++){let t=.07+i*.078,p=spine.getPointAt(t),d=spine.getTangentAt(t);for(let side of [-1,1]){let nx=-d.z*side,nz=d.x*side;seats.push({kind:'sofa',x:p.x+nx*.64,z:p.z+nz*.64,height:.57,yaw:Math.atan2(nx,nz),approaches:[{x:p.x+nx*1.40,z:p.z+nz*1.40},{x:p.x+nx*1.60,z:p.z+nz*1.60}]})}}
 // Local circular collision samples preserve the open walkways on both sides.
 for(let i=0;i<=28;i++){let p=spine.getPointAt(i/28);colliders.push({x:p.x,z:p.z,r:.94})}
 const study=new T.Group();study.position.x=1;g.add(study);
 // Reference: dark raised study strip with parallel long tables and wooden benches.
 const timber=mat(0xb77a3b,.65),topMat=mat(0x343638,.65),platform=mat(0x252729,.85);
 box(study,platform,2.55,.085,11.65,5.28,.0425,-6.65);
 box(study,warm,.022,.025,11.65,4.00,.075,-6.65);
 for(let z of [-2.55,-5.25,-7.95,-10.65]){
  box(study,topMat,.86,.075,2.12,5.71,.84,z);
  for(let zz of [-.91,.91])for(let x of [5.34,6.08])box(study,black,.045,.79,.045,x,.425,z+zz);
  // Wood modesty panel facing the lounge, on the outer bench side.
  box(study,timber,.055,.49,2.05,4.40,.35,z);
  box(study,timber,.40,.065,2.06,4.66,.51,z);box(study,timber,.36,.065,2.06,6.40,.51,z);
  for(let zz of [-.86,.86])for(let x of [4.66,6.40]){box(study,black,.045,.47,.045,x,.28,z+zz);box(study,black,.32,.045,.045,x,.10,z+zz)}
  coll(6.45,z,2.12,2.18);
 }
 // Oversized, directly illuminated academy lettering above the study tables.
 const fascia=mat(0x252525,.86);box(study,fascia,.075,1.42,11.85,6.54,2.02,-6.65);
 const signCanvas=document.createElement('canvas');signCanvas.width=2048;signCanvas.height=320;
 const sc=signCanvas.getContext('2d');sc.clearRect(0,0,2048,320);sc.textAlign='center';sc.textBaseline='middle';
 sc.font='600 238px Arial';sc.shadowColor='#efffff';sc.shadowBlur=36;sc.fillStyle='#f5ffff';sc.fillText('Picsart Academy',1024,165,1940);
 sc.shadowBlur=0;sc.fillStyle='#ffffff';sc.fillText('Picsart Academy',1024,165,1940);
 const signMap=new T.CanvasTexture(signCanvas);signMap.colorSpace=T.SRGBColorSpace;signMap.anisotropy=4;
 const letters=mesh(study,new T.PlaneGeometry(11.35,1.38),new T.MeshBasicMaterial({map:signMap,transparent:true,depthWrite:false,toneMapped:false}),6.475,2.02,-6.65);letters.rotation.y=-Math.PI/2;
 box(study,warm,.027,.032,11.85,6.47,1.30,-6.65);
 const signLight=new T.PointLight(0xfff5df,7,8,1.6);signLight.position.set(6.0,2.45,-6.65);study.add(signLight);
 // Warm rectangular pendant outlines over the desks.
 for(let z of [-3.3,-7.1,-10.9]){
  box(study,warm,.045,.045,2.6,4.95,4.48,z);box(study,warm,.045,.045,2.6,6.35,4.48,z);
  box(study,warm,1.4,.045,.045,5.65,4.48,z-1.3);box(study,warm,1.4,.045,.045,5.65,4.48,z+1.3);
  for(let x of [4.95,6.35])box(study,black,.018,.55,.018,x,4.78,z);
 }
 // Expanded rear workspace, based on the three supplied reference photographs.
 const office=new T.Group();g.add(office);
 const oak=mat(0x91603d,.62),officeGray=mat(0x40403f,.86),deskWhite=mat(0xe4e2dc,.72),screen=mat(0x10171c,.28,.15),chairFabric=mat(0x303235,.96),blue=mat(0x327cab,.77);
 wall(office,white,.22,2.95,10.3,-7.72,1.47,-18.75);wall(office,white,.22,2.95,10.3,7.72,1.47,-18.75);
 wall(office,white,15.4,2.95,.22,0,1.47,-23.85);wall(office,white,15.4,.20,10.4,0,2.92,-18.7);
 // Close the high level beyond the mezzanine without blocking the ground floor.
 wall(office,white,15.4,2.55,.22,0,4.25,-13.64);
 // Counter on the right side of a continuous open aisle; shelves face the aisle.
 box(office,officeGray,.13,1.13,6.7,.95,.565,-16.9);
 box(office,oak,.66,.085,6.95,.95,1.18,-16.9);
 for(let z of [-20.25,-18.56,-16.87,-15.18,-13.5]){
  box(office,oak,.35,1.17,.09,.84,.585,z);
  for(let y of [.42,.79])box(office,oak,.32,.055,.65,.60,y,z+.31);
 }
 box(office,oak,.60,1.15,.07,.95,.575,-20.35);box(office,oak,.60,1.15,.07,.95,.575,-13.45);
 coll(.95,-16.9,.9,6.95);
 // Period-style CRTs on the two ends of the counter.
 const beige=mat(0xc6c1aa,.83);
 function crt(z){let group=new T.Group();group.position.set(.94,1.23,z);office.add(group);
  box(group,beige,.32,.39,.48,.07,.23,0);box(group,beige,.25,.33,.40,.27,.23,0);box(group,screen,.018,.25,.35,-.10,.23,0);
  box(group,beige,.37,.05,.51,.07,.025,0);box(group,beige,.25,.027,.38,-.22,.018,0);
 }
 crt(-14.05);crt(-19.8);
 // Glass dividers with black frames and frosted horizontal stripe.
 const frosted=new T.MeshStandardMaterial({color:0xb7d5d1,transparent:true,opacity:.58,roughness:.6,depthWrite:false});
 for(let z of [-14.3,-16.1,-17.9]){box(office,glass,.035,1.68,1.76,2.05,1.9,z);box(office,frosted,.041,.48,1.76,2.05,1.9,z);box(office,black,.065,2.66,.065,2.05,1.33,z-.9);box(office,black,.065,.065,1.8,2.05,2.75,z)}
 box(office,black,.065,2.66,.065,2.05,1.33,-13.4);coll(2.05,-15.65,.09,5.4);
 // Shared desk islands with monitors, keyboards and mesh-backed swivel chairs.
 function chair(x,z,angle,computer){
  let c=new T.Group();c.position.set(x,0,z);c.rotation.y=angle+Math.PI;office.add(c);
  box(c,chairFabric,.49,.10,.48,0,.49,0);box(c,chairFabric,.46,.50,.075,0,.79,.21);
  for(let xx of [-.27,.27]){box(c,black,.065,.055,.34,xx,.72,.02);box(c,black,.035,.24,.035,xx,.59,.10)}
  cylinder(c,black,.055,.43,0,.23,0);
  for(let k=0;k<5;k++){let arm=box(c,black,.045,.035,.26,Math.sin(k*1.257)*.11,.075,Math.cos(k*1.257)*.11);arm.rotation.y=k*1.257}
  coll(x,z,.54,.55);const dx=Math.sin(angle),dz=Math.cos(angle);seats.push({kind:'chair',x,z,height:.54,yaw:angle,computer,approaches:[{x:x+dz*.65,z:z-dx*.65},{x:x-dz*.65,z:z+dx*.65},{x:x-dx*.60+dz*.66,z:z-dz*.60-dx*.66},{x:x-dx*.60-dz*.66,z:z-dz*.60+dx*.66}]});
 }
 function workstation(x,z,face){
  let d=new T.Group();d.position.set(x,.79,z);d.rotation.y=face;office.add(d);
  const display=screen.clone();box(d,display,.54,.33,.055,0,.32,-.22);box(d,black,.055,.18,.065,0,.13,-.22);box(d,black,.28,.025,.18,0,.012,-.22);
  box(d,black,.35,.022,.13,0,.015,.12);box(d,black,.075,.025,.11,.25,.018,.12);return {display,on:false};
 }
 for(let z of [-15.1,-18.35,-21.65]){
  box(office,deskWhite,1.20,.07,2.35,4.4,.75,z);
  for(let x of [3.9,4.9])for(let zz of [-1.02,1.02])box(office,black,.045,.72,.045,x,.36,z+zz);
  for(let zz of [-.55,.55]){
   const left=workstation(4.13,z+zz,-Math.PI/2),right=workstation(4.67,z+zz,Math.PI/2);
   chair(3.31,z+zz,Math.PI/2,left);chair(5.49,z+zz,-Math.PI/2,right);
  }
  coll(4.4,z,1.2,2.35);
 }
 // Rear desks, pale blinds and a blue geometric accent column.
 for(let x of [-.8,1.4,6.35]){box(office,mat(0xc4c4bf,.94),1.65,1.46,.055,x,1.72,-23.69);box(office,black,.045,1.50,.055,x-.83,1.72,-23.65)}
 box(office,blue,.83,2.78,.12,3.04,1.39,-23.63);
 for(let i=0;i<4;i++){let m=box(office,deskWhite,.018,.75,.018,3.04+(i%2?.15:-.15),.45+i*.58,-23.55);m.rotation.z=i%2?.62:-.57}
 // Ceiling cable tray and rectangular pendant lamps.
 box(office,black,.46,.10,9.8,-2.2,2.68,-18.7);
 for(let z of [-14.1,-16.1,-18.1,-20.1,-22.1]){box(office,black,.55,.045,.10,-2.2,2.60,z);box(office,black,.023,.20,.023,-2.2,2.81,z);let l=cylinder(office,warm,.13,.025,-4.1,2.79,z);box(office,warm,.28,.045,.40,-2.2,2.61,z)}
 for(let z of [-15.4,-19.1,-22.0]){
  for(let x of [3.0,5.9]){box(office,black,.10,.12,1.75,x,2.48,z);box(office,warm,.055,.025,1.68,x,2.405,z)}
  for(let zz of [-.875,.875]){box(office,black,2.9,.12,.10,4.45,2.48,z+zz);box(office,warm,2.82,.025,.055,4.45,2.405,z+zz)}
 }
 for(let z of [-15.7,-21.5]){let l=new T.PointLight(0xfff1dd,14,10,1.55);l.position.set(1.5,2.58,z);office.add(l)}
 // Green plants in slim dark metal stands.
 const greenLeaves=mat(0x537b42,.88);
 for(let [x,z] of [[6.6,-14.2],[6.5,-22.8],[.2,-23.0]]){cylinder(office,black,.23,.34,x,.57,z);for(let dx of [-.16,.16])for(let dz of [-.16,.16])box(office,black,.025,.52,.025,x+dx,.26,z+dz);for(let i=0;i<13;i++){let leaf=mesh(office,new T.SphereGeometry(1,7,5),greenLeaves,x+(rng()-.5)*.45,.88+rng()*.38,z+(rng()-.5)*.45);leaf.scale.set(.07,.23,.04);leaf.rotation.z=(rng()-.5)*1.5}coll(x,z,.49,.49)}
 let hallLight=new T.PointLight(0xffecd2,14,19,1.3);hallLight.position.set(0,4.4,-6.2);g.add(hallLight);
 let corridorLight=new T.PointLight(0xffe2b6,8,13,1.4);corridorLight.position.set(0,3.7,4);g.add(corridorLight);
 return {door,colliders,seats,open:false,angle:0};
}
export function doorNearby(state,x,z){return Math.abs(x-.5)<1.6&&Math.abs(z)<1.7}
export function advanceDoor(state,dt){state.angle=T.MathUtils.damp(state.angle,state.open?Math.PI*.53:0,7,dt);state.door.rotation.y=-state.angle}
export function academyWalkable(state,x,z,r=.27){if(z>9.7-r||z< -23.62+r)return false;if(z>.22){if(Math.abs(x)>2.8-r)return false}else if(Math.abs(x)>7.57-r)return false;if(Math.abs(z)<.29+r){if(x<-.1+r||x>1.1-r||state.angle<1.2)return false}return !state.colliders.some(c=>c.r!==undefined?Math.hypot(x-c.x,z-c.z)<c.r+r:Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r)}

// Choose reachable seat approaches only; never walk through a different obstacle to reach one.
export function nearestAcademySeat(state,x,z,maxDistance=1.55){let best=null;for(const seat of state.seats||[]){for(const a of seat.approaches){let distance=Math.hypot(x-a.x,z-a.z);if(distance>maxDistance||best&&distance>=best.distance||!academyWalkable(state,a.x,a.z))continue;let clear=true;for(let i=1;i<=12;i++){let t=i/12;if(!academyWalkable(state,x+(a.x-x)*t,z+(a.z-z)*t)){clear=false;break}}if(clear)best={seat,approach:a,distance}}}return best}
