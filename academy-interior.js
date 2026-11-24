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
 wall(g,concrete,2.5,4.9,.28,-1.65,2.45,0);wall(g,concrete,2.0,4.9,.28,1.96,2.45,0);wall(g,concrete,1.2,2.45,.28,.5,3.675,0);
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
 surface(g,'tile',10.4,13.6,0,0,-6.9);wall(g,white,.22,5.6,13.8,-5.32,2.8,-6.9);wall(g,dark,.22,5.6,13.8,5.32,2.8,-6.9);wall(g,white,10.6,5.6,.22,0,2.8,-13.8);wall(g,white,10.6,.2,14,0,5.65,-6.9);
 for(let z of [-2,-5,-8,-11]){box(g,white,10.4,.38,.23,0,5.25,z);box(g,black,7.8,.11,.17,.2,5.02,z);box(g,warm,6.6,.042,.09,.2,4.82,z);for(let x of [-3.1,3.4]){box(g,black,.035,.48,.035,x,5.12,z)}}
 for(let x of [-3.1,2.6]){let duct=cylinder(g,black,.24,12.5,x,5.0,-6.8);duct.rotation.x=Math.PI/2;for(let z of [-3,-8,-12]){let elbow=cylinder(g,black,.25,2.2,x,5.0,z);elbow.rotation.z=Math.PI/2}}
 // Rear mezzanine and the left-hand stairs.
 box(g,black,10.35,.22,5.0,0,2.85,-11.1);box(g,white,10.35,.16,.25,0,2.66,-8.61);
 for(let i=0;i<9;i++){let x=-5.0+i*1.15;box(g,frame,.045,.98,.045,x,3.45,-8.52);if(i<8)box(g,glass,1.11,.87,.035,x+.575,3.4,-8.52)}box(g,frame,10.1,.065,.06,0,3.97,-8.52);
 for(let i=0;i<15;i++){let h=(i+1)*.19;box(g,black,1.55,h,.43,-4.05,h/2,-2.2-i*.42)}coll(-4.05,-5.2,1.65,6.6);
 const railA=new T.Vector3(-3.22,1.02,-2.0),railB=new T.Vector3(-3.22,3.9,-8.58),dir=railB.clone().sub(railA);let rail=cylinder(g,frame,.035,dir.length(),0,0,0);rail.position.copy(railA).add(railB).multiplyScalar(.5);rail.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());for(let i=0;i<8;i++){let z=-2.2-i*.8,h=.25+i*.38;box(g,frame,.035,.95,.035,-3.22,h+.46,z);box(g,glass,.036,.80,.75,-3.22,h+.45,z-.33)}
 // Curved mustard upholstered sofa and green planter visible on the right.
 const sofaX=2.05,sofaZ=-4.8,st=-.56,en=2.02;
 arc(g,mustard,2.45,.78,.30,st,en,sofaX,.08,sofaZ);arc(g,cushion,2.45,.82,.13,st,en,sofaX,.41,sofaZ);arc(g,mustard,1.70,.18,.62,st,en,sofaX,.52,sofaZ);
 for(let i=1;i<6;i++){let a=st+(en-st)*i/6;let z=sofaZ-Math.sin(a)*2.03,x=sofaX+Math.cos(a)*2.03;let seam=box(g,mat(0x98691c,.95),.022,.015,.67,x,.555,z);seam.rotation.y=a-Math.PI/2}
 cylinder(g,dark,1.48,.48,sofaX,.24,sofaZ);cylinder(g,mat(0x4e4435),1.43,.04,sofaX,.49,sofaZ);
 let leaves=new T.InstancedMesh(new T.SphereGeometry(1,6,4),mat(0x6a8352,.95),160),obj=new T.Object3D();for(let i=0;i<160;i++){let a=rng()*Math.PI*2,r=Math.sqrt(rng())*1.32;obj.position.set(sofaX+Math.cos(a)*r,.63+rng()*.40,sofaZ+Math.sin(a)*r);obj.scale.set(.035+rng()*.03,.16+rng()*.19,.045);obj.rotation.set((rng()-.5)*1.3,rng()*6.28,(rng()-.5)*1.5);obj.updateMatrix();leaves.setMatrixAt(i,obj.matrix)}g.add(leaves);coll(sofaX,sofaZ,4.8,4.8);
 // Right-hand shared worktables and shelves.
 for(let z of [-9.6,-12.1]){box(g,black,2.3,.10,1.25,3.55,.82,z);for(let x of [2.65,4.45])for(let zz of [-.46,.46])box(g,wood,.075,.8,.075,x,.4,z+zz);for(let x of [2.95,4.1]){box(g,wood,.48,.08,.46,x,.47,z+.99);box(g,wood,.48,.44,.07,x,.74,z+1.18);for(let dx of [-.18,.18])for(let dz of [-.17,.17])box(g,black,.035,.45,.035,x+dx,.23,z+.99+dz)}coll(3.55,z,2.5,2.6)}
 for(let y of [1.6,2.1,2.6,3.1,3.6,4.1])box(g,wood,.36,.07,3.8,5.0,y,-11.5);for(let z of [-13.3,-12,-10.8,-9.6])box(g,wood,.36,2.7,.055,5.0,2.85,z);
 box(g,white,2.1,1.0,.75,-1.65,.5,-11.6);box(g,black,2.2,.055,.82,-1.65,1.02,-11.6);coll(-1.65,-11.6,2.2,.9);
 label(g,'Picsart Academy',1.0,2.57,-13.66,2.7,.55,'#302c29');
 let hallLight=new T.PointLight(0xffecd2,14,19,1.3);hallLight.position.set(0,4.4,-6.2);g.add(hallLight);
 let corridorLight=new T.PointLight(0xffe2b6,8,13,1.4);corridorLight.position.set(0,3.7,4);g.add(corridorLight);
 return {door,colliders,open:false,angle:0};
}
export function doorNearby(state,x,z){return Math.abs(x-.5)<1.6&&Math.abs(z)<1.7}
export function advanceDoor(state,dt){state.angle=T.MathUtils.damp(state.angle,state.open?Math.PI*.53:0,7,dt);state.door.rotation.y=state.angle}
export function academyWalkable(state,x,z,r=.27){if(z>9.7-r||z< -13.55+r)return false;if(z>.22){if(Math.abs(x)>2.8-r)return false}else if(Math.abs(x)>5.17-r)return false;if(Math.abs(z)<.29+r){if(x<-.1+r||x>1.1-r||state.angle<1.2)return false}return !state.colliders.some(c=>Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r)}
