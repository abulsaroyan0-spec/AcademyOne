import * as T from 'three';
const ease=(a,b,x)=>T.MathUtils.smoothstep(x,a,b);
const rand=(seed)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const basic=(color)=>new T.MeshBasicMaterial({color});
const solid=(color,emissive=0)=>new T.MeshStandardMaterial({color,emissive,roughness:.65,metalness:.12});
function mesh(parent,geo,mat,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m}
function box(parent,mat,w,h,d,x,y,z){return mesh(parent,new T.BoxGeometry(w,h,d),mat,x,y,z)}
function textTexture(text,color='#74ffdc',background='#071b23'){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle=background;x.fillRect(0,0,512,128);x.font='bold 48px monospace';x.textAlign='center';x.textBaseline='middle';x.fillStyle=color;x.fillText(text,256,64);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}
function sign(parent,text,x,y,z,w=3,h=.75){return mesh(parent,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:textTexture(text),side:T.DoubleSide}),x,y,z)}
function instances(parent,geo,mat,positions){const m=new T.InstancedMesh(geo,mat,positions.length),o=new T.Object3D();positions.forEach((p,i)=>{o.position.set(p[0],p[1],p[2]);o.scale.set(p[3]??1,p[4]??1,p[5]??1);o.rotation.set(0,0,p[6]??0);o.updateMatrix();m.setMatrixAt(i,o.matrix)});m.instanceMatrix.needsUpdate=true;parent.add(m);return m}
export const chapters=[
['01 / INITIALIZE','Enter the<br><em>code.</em>','Everything begins with a single instruction.'],
['02 / BINARY WORLD','Beyond<br><em>0 and 1.</em>','Bits become information. Information becomes possibility.'],
['03 / COMPILE','Build the<br><em>impossible.</em>','Source code becomes instructions the machine can execute.'],
['04 / MEMORY CORE','Inside the<br><em>machine.</em>','Memory, registers and the processor work together.'],
['05 / NETWORK','Follow the<br><em>signal.</em>','Travel through data streams and the server infrastructure.'],
['06 / ACCESS GRANTED','Your world<br><em>is ready.</em>','One last gateway. Welcome to AcademyOne.']];
export function makeJourney(scene){
scene.background=new T.Color(0x02090f);scene.fog=new T.FogExp2(0x02090f,.018);scene.add(new T.AmbientLight(0x7bc7cf,1.8));
const green=basic(0x42eacb),blue=basic(0x388cf5),purple=basic(0x9a6cf8),dark=solid(0x10282d),metal=solid(0x1d3d46),cyan=solid(0x2b8b83,0x0b3b37),rng=rand(317),rings=[],lights=[],labels=[],data=[];
box(scene,solid(0x071922),18,.18,158,0,-3.3,-65);
const grid=new T.GridHelper(160,80,0x1b7068,0x10333c);grid.position.set(0,-3.2,-65);scene.add(grid);
for(let i=0;i<19;i++){const z=10-i*2.65;const ring=mesh(scene,new T.TorusGeometry(4.6,.045,6,60),i%3===0?blue:green,0,.05,z);rings.push(ring);for(let side of [-1,1]){const txt=Array.from({length:12},()=>rng()>.5?'1':'0').join('');let s=sign(scene,txt,side*(2.5+rng()*1.3),1.3+rng()*1.9,z-.6,2.5,.48);s.rotation.y=side*.22;labels.push(s)}}
const code=['#include <iostream>','int main() {','std::cout <<','"Hello, world!";','return 0;','}', 'g++ main.cpp','BUILD SUCCESS'];for(let i=0;i<code.length;i++){let s=sign(scene,code[i],i%2?2.55:-2.55,1.4,-43-i*2.6,4.5,1.05);s.rotation.y=i%2?.28:-.28}
for(let i=0;i<8;i++){let z=-43-i*3.1;box(scene,dark,10,.07,1.2,0,-2.9,z);box(scene,cyan,9,.025,.045,0,-2.85,z)}
const chip=new T.Group();chip.position.set(0,-2.4,-69);scene.add(chip);box(chip,metal,6,.45,6,0,0,0);box(chip,cyan,3.8,.2,3.8,0,.32,0);sign(chip,'CPU / 64 BIT',0,1.25,0,3.3,.8);
const pins=[];for(let i=0;i<14;i++)for(const s of [-1,1]){pins.push([s*3.3,.12,-2.7+i*.41,.7,.12,.17]);pins.push([-2.7+i*.41,.12,s*3.3,.17,.12,.7])}instances(chip,new T.BoxGeometry(1,1,1),green,pins);
const mem=[], traces=[];for(let s of [-1,1])for(let i=0;i<7;i++){const z=-71-i*2.5;mem.push([s*4.2,-.5,z,.85,4.5,1.7]);for(let j=0;j<5;j++)traces.push([s*3.74,-1.8+j*.55,z,.04,.24,1.1])}instances(scene,new T.BoxGeometry(1,1,1),metal,mem);instances(scene,new T.BoxGeometry(1,1,1),purple,traces);sign(scene,'MEMORY / CACHE',0,3,-78,4.2,.8);
const racks=[],slots=[],leds=[];for(let s of [-1,1])for(let i=0;i<10;i++){let z=-91-i*2.8;racks.push([s*4,-1,z,1.9,4.5,1.8]);for(let j=0;j<10;j++){slots.push([s*4,-2.8+j*.38,z+.93,1.65,.29,.06]);for(let k=0;k<3;k++)leds.push([s*4-.57+k*.19,-2.8+j*.38,z+.98,.065,.065,.04])}}instances(scene,new T.BoxGeometry(1,1,1),dark,racks);instances(scene,new T.BoxGeometry(1,1,1),metal,slots);const led=instances(scene,new T.BoxGeometry(1,1,1),green,leds);sign(scene,'SERVER / NETWORK',0,3,-100,4.8,.9);
const star=[];for(let i=0;i<900;i++)star.push((rng()-.5)*18,(rng()-.5)*10,12-rng()*150);let sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(star,3));scene.add(new T.Points(sg,new T.PointsMaterial({color:0x6ce7e3,size:.045,transparent:true,opacity:.7})));
for(let i=0;i<42;i++){const z=10-rng()*142;let m=box(scene,i%3?green:blue,.024,.024,.65+rng()*2,(rng()-.5)*8,(rng()-.5)*5,z);data.push({m,z,speed:2+rng()*6})}
const gate=new T.Group();gate.position.set(0,0,-128);scene.add(gate);for(let i=0;i<5;i++){let r=mesh(gate,new T.TorusGeometry(3.4+i*.43,.07,8,96),i%2?blue:green,0,0,i*.35);r.rotation.z=i*.4}
mesh(gate,new T.CircleGeometry(3.35,96),new T.MeshBasicMaterial({color:0xd7fff5,transparent:true,opacity:.93}),0,0,-.2);sign(scene,'ACCESS GRANTED',0,5,-128,6,1.25);
return {rings,data,gate,led,labels};
}
export function animateJourney(state,camera,p,time){const z=T.MathUtils.lerp(12,-130,p);const drift=Math.sin(p*Math.PI*5)*.75*Math.sin(Math.PI*p);camera.position.set(drift,.22+Math.sin(p*Math.PI*4)*.24,z);camera.lookAt(drift*.35,.1,z-8);camera.rotation.z=Math.sin(p*Math.PI*6)*.035*Math.sin(Math.PI*p);camera.fov=38+10*ease(.08,.25,p)-5*ease(.78,1,p);camera.updateProjectionMatrix();for(let i=0;i<state.rings.length;i++){state.rings[i].rotation.z=time*.11+i*.24;state.rings[i].scale.setScalar(1+.025*Math.sin(time*1.6+i))}for(let item of state.data)item.m.position.z=12-(((12-item.z)+time*item.speed)%144);state.gate.rotation.z=time*.075;state.led.material.color.setHSL(.45,.85,.48+.12*Math.sin(time*3));}
export function makePlaza(scene){scene.background=new T.Color(0xb6dcd9);scene.fog=new T.Fog(0xb6dcd9,27,75);const floor=solid(0xc4dcd6),path=solid(0xe3ede5),structure=solid(0x203f48),trim=solid(0x57cdb5,0x103a36),glass=solid(0x70a3ac,0x0b252c);box(scene,floor,52,.25,52,0,-.15,0);box(scene,path,7,.04,40,0,-.01,0);box(scene,path,31,.04,6,0,-.009,-2);const grid=new T.GridHelper(50,50,0x97bdb1,0xaec8c3);grid.position.y=.015;scene.add(grid);
for(const [x,z,w,h,d,label] of [[0,-12,13,7,6,'ACADEMY.ONE'],[-12,-3,7,5,8,'CODE LAB'],[12,-3,7,5,8,'SERVER LAB']]){box(scene,structure,w,h,d,x,h/2,z);box(scene,trim,w+.3,.24,d+.3,x,h+.08,z);for(let i=0;i<Math.floor(w/1.4);i++)box(scene,glass,.95,h*.51,.075,x-w/2+.85+i*1.4,h*.57,z+d/2+.04);sign(scene,label,x,h-.52,z+d/2+.09,Math.min(w-1,6),.8);box(scene,trim,2.4,2.5,.09,x,1.25,z+d/2+.1)}
for(let s of [-1,1])for(let z of [7,0,-7]){box(scene,structure,1.4,.45,1.4,s*5,.2,z);mesh(scene,new T.CylinderGeometry(.07,.13,1.4,8),solid(0x4e6b60),s*5,.9,z);mesh(scene,new T.IcosahedronGeometry(.78,1),solid(0x429a83),s*5,1.85,z)}
const gate=new T.Group();gate.position.set(0,2.1,11);scene.add(gate);mesh(gate,new T.TorusGeometry(2.1,.12,12,64),trim);mesh(gate,new T.TorusGeometry(2.3,.045,8,64),basic(0x9affee),0,0,.05);
}
