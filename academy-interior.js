import * as T from 'three';
const rng=(()=>{let n=728;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296)})();
const mat=(color,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
const glow=(color)=>new T.MeshBasicMaterial({color});
function mesh(g,geo,m,x=0,y=0,z=0){let a=new T.Mesh(geo,m);a.position.set(x,y,z);g.add(a);return a}
function box(g,m,w,h,d,x,y,z){return mesh(g,new T.BoxGeometry(w,h,d),m,x,y,z)}
function cylinder(g,m,r,h,x,y,z,r2=r){return mesh(g,new T.CylinderGeometry(r2,r,h,16),m,x,y,z)}
function texture(type){let c=document.createElement('canvas');c.width=c.height=512;let ctx=c.getContext('2d');let base=type==='wall'?[111,106,99]:type==='floor'?[34,32,30]:type==='glass'?[177,175,166]:[190,185,174];let im=ctx.createImageData(512,512);for(let y=0;y<512;y++)for(let x=0;x<512;x++){let i=(y*512+x)*4;let n=(rng()-.5)*(type==='glass'?85:13)+Math.sin(x*.062+Math.sin(y*.013)*2)*4+Math.sin(x*.017+y*.009)*5;for(let k=0;k<3;k++)im.data[i+k]=base[k]+n;im.data[i+3]=255}ctx.putImageData(im,0,0);if(type==='wall'){for(let i=0;i<95;i++){let x=rng()*512,y=rng()*512;ctx.fillStyle=rng()>.5?'rgba(225,214,193,.055)':'rgba(28,25,23,.045)';ctx.fillRect(x,y,2+rng()*24,30+rng()*190)}}if(type==='floor'||type==='tile'){ctx.strokeStyle=type==='floor'?'#776e5c':'#a49c91';ctx.lineWidth=2;ctx.strokeRect(1,1,510,510);if(type==='floor'){ctx.strokeStyle='#504941';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(160,0);ctx.lineTo(210,240);ctx.lineTo(202,310);ctx.lineTo(290,512);ctx.stroke()}}let t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;return t}
function surface(g,type,w,d,x,y,z){let map=texture(type);map.repeat.set(w/(type==='floor'?.72:.8),d/(type==='floor'?.72:.8));let o=mesh(g,new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({map,roughness:type==='floor'?.19:.76,metalness:type==='floor'?.22:0,envMapIntensity:type==='floor'?.7:.25}),x,y,z);o.rotation.x=-Math.PI/2;return o}
function label(g,text,x,y,z,w=.7,h=.25,color='#a51c59'){let c=document.createElement('canvas');c.width=512;c.height=160;let ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,512,160);ctx.fillStyle='#fff';ctx.font='bold 47px Arial';ctx.textAlign='center';ctx.textBaseline='middle';let lines=text.split('|');lines.forEach((s,i)=>ctx.fillText(s,256,80+(i-(lines.length-1)/2)*53,480));let t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return mesh(g,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t}),x,y,z)}
function wall(g,m,w,h,d,x,y,z){return box(g,m,w,h,d,x,y,z)}
function light(g,x,y,z,tx,ty,tz,intensity=12){const l=new T.SpotLight(0xffe6be,intensity,6,Math.PI/3,.8,1.6);l.position.set(x,y,z);l.target.position.set(tx,ty,tz);g.add(l,l.target);return l}
function washTexture(){let c=document.createElement('canvas');c.width=128;c.height=256;let ctx=c.getContext('2d'),gr=ctx.createRadialGradient(64,234,4,64,234,135);gr.addColorStop(0,'rgba(255,235,190,.8)');gr.addColorStop(.24,'rgba(255,221,158,.29)');gr.addColorStop(1,'rgba(255,221,158,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,128,256);let t=new T.CanvasTexture(c);return t}
function arc(g,m,r,depth,height,start,end,x,y,z){const shape=new T.Shape();let N=36;for(let i=0;i<=N;i++){let a=start+(end-start)*i/N;let X=Math.cos(a)*r,Z=Math.sin(a)*r;i?shape.lineTo(X,Z):shape.moveTo(X,Z)}for(let i=N;i>=0;i--){let a=start+(end-start)*i/N;shape.lineTo(Math.cos(a)*(r-depth),Math.sin(a)*(r-depth))}shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.035,curveSegments:12});geo.rotateX(-Math.PI/2);return mesh(g,geo,m,x,y,z)}
export function makeAcademy(scene){
 scene.background=new T.Color(0x171513);scene.fog=new T.Fog(0x25221e,29,65);const g=new T.Group();scene.add(g);
 const concrete=new T.MeshStandardMaterial({map:texture('wall'),roughness:.93}),black=mat(0x222222,.46,.25),frame=mat(0x343632,.45,.55),white=mat(0xd9d1c1,.84),wood=mat(0x895637,.6),mustard=mat(0xb17a1a,.94),cushion=mat(0xc08a24,.95),glass=new T.MeshStandardMaterial({color:0xa9b9b3,transparent:true,opacity:.19,roughness:.16,metalness:.12,depthWrite:false}),warm=glow(0xfff1d5),dark=mat(0x302c29,.88),colliders=[],seats=[];
 const coll=(x,z,w,d)=>colliders.push({x,z,w,d});

 // E PLAZA: photograph-based nighttime approach. Heights use academy floor as zero.
 const plaza=new T.Group();g.add(plaza);const anthracite=mat(0x292a2d,.83),steel=mat(0x18191b,.38,.55),stone=mat(0x504c47,.86),goldTrim=mat(0xb49a55,.32,.65),cream=mat(0xb49b77,.92);
 const exteriorGlass=new T.MeshPhysicalMaterial({color:0x788b91,transparent:true,opacity:.17,roughness:.17,metalness:.1,depthWrite:false});
 const paving=document.createElement('canvas');paving.width=paving.height=512;const pc=paving.getContext('2d');pc.fillStyle='#292622';pc.fillRect(0,0,512,512);for(let row=0;row<8;row++)for(let col=-1;col<9;col++){let n=65+Math.floor(rng()*30);pc.fillStyle='rgb('+n+','+(n-5)+','+(n-11)+')';pc.fillRect(col*64+(row%2)*24+2,row*64+2,60,60)}const paveMap=new T.CanvasTexture(paving);paveMap.colorSpace=T.SRGBColorSpace;paveMap.wrapS=paveMap.wrapT=T.RepeatWrapping;paveMap.repeat.set(12,6);paveMap.anisotropy=8;const pavement=mesh(plaza,new T.PlaneGeometry(22,11.8),new T.MeshStandardMaterial({map:paveMap,roughness:.9}),0,-1.8,28.9);pavement.rotation.x=-Math.PI/2;
 // Facade, window grids, illuminated E PLAZA sign.
 for(const side of [-1,1]){box(plaza,anthracite,7.8,12,.42,side*7.05,4.2,23.1);for(let y of [2.5,5.4,8.3])for(let x of [4.0,5.3,6.6,7.9,9.2]){box(plaza,steel,1.15,1.65,.035,side*x,y,23.34);box(plaza,mat(0x29383d,.24,.18),1.04,1.50,.028,side*x,y,23.38)}}
 box(plaza,anthracite,6.1,7,.45,0,6.5,23.12);for(let y of [5.2,7.6,9.1])for(let x of [-2.4,-1.2,0,1.2,2.4]){box(plaza,steel,1.12,1.4,.04,x,y,23.38);box(plaza,mat(0x38464b,.25,.14),1.02,1.28,.03,x,y,23.42)}
 const logoCanvas=document.createElement('canvas');logoCanvas.width=1024;logoCanvas.height=512;const lc=logoCanvas.getContext('2d');lc.textAlign='center';lc.textBaseline='middle';lc.fillStyle='#fff4db';lc.shadowColor='#fff3d2';lc.shadowBlur=24;lc.strokeStyle='#fff4db';lc.lineWidth=17;lc.strokeRect(414,38,196,192);lc.font='bold 174px Arial';lc.fillText('E',512,137);lc.font='bold 174px Arial';lc.fillText('PLAZA',512,356);const logoMap=new T.CanvasTexture(logoCanvas);logoMap.colorSpace=T.SRGBColorSpace;mesh(plaza,new T.PlaneGeometry(4.7,2.35),new T.MeshBasicMaterial({map:logoMap,transparent:true,depthWrite:false,toneMapped:false}),6.7,.90,23.36);
 // Glazed vestibule, two-leaf exterior entrance; the right leaf is interactive.
 const entryZ=23;for(let z of [18,20.5,23])for(let x of [-3.12,3.12]){box(plaza,steel,.09,4.8,.09,x,.60,z);if(z<23)box(plaza,exteriorGlass,.045,4.6,2.43,x,.60,z+1.25)}
 for(let x of [-3.12,-1.05,1.05,3.12])box(plaza,steel,.09,4.8,.09,x,.60,entryZ);
 for(let x of [-2.08,2.08]){box(plaza,exteriorGlass,1.98,4.65,.045,x,.60,entryZ);box(plaza,steel,1.98,.055,.07,x,.65,entryZ)}
 box(plaza,steel,2.05,.09,.12,0,.93,entryZ);box(plaza,exteriorGlass,2.0,1.7,.04,0,1.82,entryZ);box(plaza,steel,6.4,.18,5.1,0,3.04,20.5);for(let x of [-2.95,2.95])box(plaza,warm,.035,.035,4.8,x,2.92,20.5);box(plaza,warm,5.9,.035,.035,0,2.92,22.86);
 const plazaDoor=new T.Group();plazaDoor.position.set(1.0,-1.8,entryZ);plaza.add(plazaDoor);
 function glazedLeaf(parent,x,y,z){box(parent,exteriorGlass,.94,2.65,.05,x,y+1.325,z);for(let dx of [-.48,.48])box(parent,steel,.045,2.65,.075,x+dx,y+1.325,z);for(let dy of [.03,2.62])box(parent,steel,1,.06,.075,x,y+dy,z);box(parent,steel,.04,.65,.10,x-.33,y+1.15,z+.07)}
 glazedLeaf(plazaDoor,-.5,0,0);glazedLeaf(plaza,-.5,-1.8,entryZ);label(plaza,'EXIT',0,1.13,entryZ+.08,.48,.18,'#285a40');
 // Ten usable stair treads. Surface elevations are shared with the movement controller.
 for(let i=0;i<10;i++){const z=22.1-i*.36,y=-1.8+(i+1)*.18;box(plaza,stone,5.65,y+1.8,.36,0,(y-1.8)/2,z);box(plaza,mat(0x79716a,.85),5.61,.012,.035,0,y+.006,z+.15)}
 box(plaza,stone,6.15,.14,.72,0,-1.87,22.64);box(plaza,stone,6.15,.14,.72,0,-.07,18.32);
 for(let side of [-1,1]){for(let i=0;i<6;i++){let z=22.25-i*.65,y=-1.8+i*.325;box(plaza,steel,.045,.94,.045,side*2.83,y+.47,z)}const p1=new T.Vector3(side*2.83,-.86,22.25),p2=new T.Vector3(side*2.83,.94,18.65),d=p2.clone().sub(p1);let rail=cylinder(plaza,steel,.035,d.length(),0,0,0);rail.position.copy(p1).add(p2).multiplyScalar(.5);rail.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize())}
 for(let x of [-3,-1.24,1.24,3])box(plaza,steel,.065,3.1,.07,x,1.55,18);for(let x of [-2.13,2.13])box(plaza,exteriorGlass,1.67,3.05,.045,x,1.55,18);box(plaza,steel,6.1,.10,.12,0,3.1,18);
 // Marble lobby, ceiling contour lighting and reception desk.
 const lobby=new T.Group();g.add(lobby);const marbleCanvas=document.createElement('canvas');marbleCanvas.width=marbleCanvas.height=512;const mc=marbleCanvas.getContext('2d');mc.fillStyle='#252322';mc.fillRect(0,0,512,512);for(let i=0;i<170;i++){mc.strokeStyle=i%4===0?'#d2c9b8':i%3===0?'#9a9286':'#5a5550';mc.lineWidth=.6+rng()*2.7;mc.beginPath();for(let x=0;x<=512;x+=8){let y=i*3.1+18*Math.sin(x*.014+i*.035)+9*Math.sin(x*.035+i*.09);x?mc.lineTo(x,y):mc.moveTo(x,y)}mc.stroke()}const marbleMap=new T.CanvasTexture(marbleCanvas);marbleMap.colorSpace=T.SRGBColorSpace;marbleMap.wrapS=marbleMap.wrapT=T.RepeatWrapping;marbleMap.repeat.set(3,3);marbleMap.anisotropy=8;const marble=new T.MeshStandardMaterial({map:marbleMap,roughness:.22,metalness:.18,envMapIntensity:.8});const lf=mesh(lobby,new T.PlaneGeometry(10.8,8),marble,0,0,14);lf.rotation.x=-Math.PI/2;
 box(lobby,anthracite,.20,4.4,8,-5.5,2.2,14);box(lobby,anthracite,.20,4.4,8,5.5,2.2,14);box(lobby,anthracite,10.9,.15,8,0,4.45,14);
 for(let x of [-4.12,4.12])box(lobby,anthracite,2.56,4.4,.20,x,2.2,10);
 for(let x of [-4.28,4.28])box(lobby,anthracite,2.65,4.4,.20,x,2.2,18);
 for(let k=0;k<27;k++){let pts=[];for(let i=0;i<=32;i++){let z=10.2+i*7.6/32,x=-5.05+k*.385+.18*Math.sin(z*1.8+k*.35)+.11*Math.cos(z*3.1+k*.26);pts.push(new T.Vector3(x,4.32,z))}mesh(lobby,new T.TubeGeometry(new T.CatmullRomCurve3(pts),64,.017,5,false),warm)}
 for(let x of [-5.34,5.34])for(let z of [10.35,13.9,17.65])box(lobby,warm,.025,4.15,.025,x,2.1,z);
 for(let x of [-5.34,5.34])for(let z=10.3;z<18;z+=.35)box(lobby,steel,.028,4.1,.025,x,2.12,z);
 box(lobby,marble,3.55,1.03,.72,-2.95,.515,12);box(lobby,goldTrim,3.65,.055,.80,-2.95,1.05,12);box(lobby,warm,3.55,.025,.022,-2.95,.98,12.37);for(let x of [-4.12,-2.95,-1.78])box(lobby,goldTrim,.022,.88,.025,x,.52,12.37);coll(-2.95,12,3.65,.8);
 box(lobby,steel,.48,.31,.055,-3.05,1.29,11.98);box(lobby,steel,.055,.16,.10,-3.05,1.12,11.98);
 box(lobby,cream,2.4,.48,.85,-3.55,.26,15.72);box(lobby,cream,2.4,.64,.18,-3.55,.67,16.07);for(let x of [-4.66,-2.44])box(lobby,cream,.19,.38,.85,x,.60,15.72);coll(-3.55,15.72,2.4,.85);
 box(lobby,marble,1.35,.42,.55,-3.55,.21,14.65);coll(-3.55,14.65,1.35,.55);
 for(let z of [13.65,16.75]){box(lobby,cream,.68,.45,.72,-4.85,.26,z);box(lobby,cream,.16,.65,.72,-5.13,.60,z);coll(-4.85,z,.68,.72)}
 for(let x of [-4.2,-3.55,-2.9])seats.push({kind:'lobby sofa',x,z:15.72,height:.50,yaw:Math.PI,approaches:[{x,z:14.99},{x:x+.5,z:15.02},{x:-2.0,z:15.72}]});
 for(let z of [11,17.1]){cylinder(lobby,steel,.23,.37,-4.95,.185,z);for(let i=0;i<12;i++){let leaf=mesh(lobby,new T.SphereGeometry(1,7,5),mat(0x53694a,.9),-4.95+(rng()-.5)*.5,.46+rng()*.65,z+(rng()-.5)*.5);leaf.scale.set(.07,.23,.04);leaf.rotation.z=(rng()-.5)*1.7}coll(-4.95,z,.5,.5)}
 const elevator=mat(0x8c8c83,.31,.65);box(lobby,elevator,1.72,2.55,.15,4.42,1.275,11.1);for(let x of [3.99,4.85])box(lobby,exteriorGlass,.35,1.55,.035,x,1.40,11.19);box(lobby,steel,.025,2.55,.025,4.42,1.275,11.19);label(lobby,'LIFT',4.42,2.75,11.20,.54,.18,'#24282c');coll(4.42,11.1,1.72,.18);
 for(let z of [12,16]){let l=new T.PointLight(0xffedcf,17,12,1.5);l.position.set(0,3.9,z);lobby.add(l)}
 const outdoorLight=new T.PointLight(0xffdfb2,25,18,1.55);outdoorLight.position.set(0,3.7,26);plaza.add(outdoorLight);

 // Entrance reconstructed from the supplied front-facing photograph. Dimensions are estimates.
 surface(g,'floor',3.5,10,0,0,5);
 wall(g,concrete,.25,4.9,10,-1.88,2.45,5);wall(g,concrete,.25,4.9,10,1.88,2.45,5);wall(g,concrete,3.7,.22,10,0,5,5);
 wall(g,concrete,2.72,4.9,.28,-1.46,2.45,0);wall(g,concrete,1.72,4.9,.28,1.96,2.45,0);wall(g,concrete,1.2,2.45,.28,.5,3.675,0);
 wall(g,concrete,.46,4.9,.32,1.43,2.45,.21);box(g,warm,.018,4.78,.019,1.68,2.39,.382);
 box(g,black,5.7,.075,.07,0,.04,.19);
 for(let x of [-2.25,-.48,2.55]){box(g,frame,.29,.045,.18,x,.028,.48);box(g,warm,.23,.022,.10,x,.06,.48);let a=mesh(g,new T.PlaneGeometry(1.55,2.55),new T.MeshBasicMaterial({map:washTexture(),transparent:true,depthWrite:false,blending:T.AdditiveBlending}),x,1.27,.155);light(g,x,.1,.6,x,1.1,0,8)}
 label(g,'Picsart|Academy',-.7,2.02,.153,.45,.15);
 const door=new T.Group();door.position.set(1.1,.03,.16);g.add(door);
 box(g,frame,.075,2.43,.15,-.115,1.215,.04);box(g,frame,.075,2.43,.15,1.115,1.215,.04);box(g,frame,1.3,.075,.15,.5,2.45,.04);
 let frost=new T.MeshStandardMaterial({map:texture('glass'),roughness:.42,metalness:.08,envMapIntensity:.45});
 for(const x of [-1.14,-.06])box(door,frame,.12,2.34,.09,x,1.17,0);box(door,frame,.96,.27,.09,-.6,.135,0);box(door,frame,.96,.15,.09,-.6,2.265,0);box(door,frost,.958,1.92,.065,-.6,1.23,0);box(door,black,.04,.76,.065,-1.03,1.04,.11);box(door,black,.1,.045,.13,-1.03,1.39,.065);box(door,black,.1,.045,.13,-1.03,.69,.065);box(door,black,.24,.07,.09,-.35,2.22,.065);box(door,black,.04,.76,.065,-1.03,1.04,-.11);box(door,black,.1,.045,.13,-1.03,1.39,-.065);box(door,black,.1,.045,.13,-1.03,.69,-.065);
 const wallLamp=glow(0xffe6bc);
 for(let side of [-1,1]){box(g,warm,.023,.028,9.7,side*1.70,4.77,5);for(let z of [1.6,3.1,4.6,6.1,7.6,9.1]){box(g,wallLamp,.08,.045,.22,side*1.63,.025,z)}for(let z of [2.5,6.5,9])light(g,side*1.63,.1,z,side*1.75,1.0,z,4)}
 const duct=cylinder(g,black,.19,8.0,0,4.5,5);duct.rotation.x=Math.PI/2;
 for(const [side,z,sign] of [[-1,7.5,'WC'],[-1,5.5,'WC'],[1,3.8,'']]){let d=new T.Group();d.position.set(side*1.74,0,z);d.rotation.y=-side*Math.PI/2;g.add(d);box(d,frame,.99,2.34,.065,0,1.17,0);box(d,black,.84,2.17,.035,0,1.17,.045);box(d,steel,.17,.04,.07,.31,1.02,.09);if(sign)label(d,sign,.71,1.56,.065,.24,.20,'#444444')}
 
 // Hall beyond the entrance: open double-height lounge, stair and mezzanine.
 surface(g,'tile',18.0,25.9,0,0,-13.05);wall(g,white,.22,5.6,16.0,-9.12,2.8,-8.0);wall(g,dark,.22,5.6,16.0,9.12,2.8,-8.0);wall(g,white,18.2,.2,16.2,0,5.65,-8.0);wall(g,white,6.18,5.6,.28,-5.91,2.8,0);wall(g,white,6.18,5.6,.28,5.91,2.8,0);wall(g,white,5.64,.70,.28,0,5.25,0);
 for(let z of [-2,-5,-8,-11,-14]){box(g,white,18.0,.38,.23,0,5.25,z);box(g,black,12.6,.11,.17,.2,5.02,z);box(g,warm,11.4,.042,.09,.2,4.82,z);for(let x of [-3.1,3.4]){box(g,black,.035,.48,.035,x,5.12,z)}}
 for(let x of [-3.1,2.6]){let duct=cylinder(g,black,.24,12.5,x,5.0,-6.8);duct.rotation.x=Math.PI/2;for(let z of [-3,-8,-12]){let elbow=cylinder(g,black,.25,2.2,x,5.0,z);elbow.rotation.z=Math.PI/2}}
 // Rear mezzanine and the left-hand stairs.
 box(g,black,17.95,.22,7.2,0,2.85,-12.2);box(g,white,17.95,.16,.25,0,2.66,-8.61);
 for(let i=0;i<12;i++){let x=-8.85+i*(17.7/11);box(g,frame,.045,.98,.045,x,3.45,-8.52);if(i<11)box(g,glass,17.7/11-.045,.87,.035,x+17.7/22,3.4,-8.52)}box(g,frame,17.8,.065,.06,0,3.97,-8.52);
 for(let i=0;i<15;i++){let h=(i+1)*.19;box(g,black,1.55,h,.42,-5.45,h/2,-2.2-i*.42)}coll(-5.45,-5.2,1.65,6.6);
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
 const study=new T.Group();study.position.x=2.4;g.add(study);
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
  coll(7.85,z,2.12,2.18);
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
 const office=new T.Group();office.position.z=-2.2;g.add(office);const officeColliderStart=colliders.length,officeSeatStart=seats.length;
 const oak=mat(0x91603d,.62),officeGray=mat(0x40403f,.86),deskWhite=mat(0xe4e2dc,.72),screen=mat(0x10171c,.28,.15),chairFabric=mat(0x303235,.96),blue=mat(0x327cab,.77);
 wall(office,white,.22,2.95,10.3,-9.12,1.47,-18.75);wall(office,white,.22,2.95,10.3,9.12,1.47,-18.75);
 wall(office,white,18.2,2.95,.22,0,1.47,-23.85);wall(office,white,18.2,.20,10.4,0,2.92,-18.7);
 // Close the high level beyond the mezzanine without blocking the ground floor.
 wall(office,white,18.2,2.55,.22,0,4.25,-13.64);

 // Actual first-floor junction: the central white pillar is directly behind the S-sofa.
 box(office,white,1.14,2.74,.79,0,1.37,-11.75);coll(0,-11.75,1.14,.79);
 const way=document.createElement('canvas');way.width=1536;way.height=360;const wc=way.getContext('2d');wc.fillStyle='#ad1456';wc.fillRect(0,0,1536,360);wc.fillStyle='#fff';wc.font='bold 82px Arial';wc.textBaseline='middle';['↙ ADA LOVELACE','← DAVID BLACKWELL','← GRACE HOPPER'].forEach((t,i)=>wc.fillText(t,35,68+i*108));wc.fillRect(864,24,5,312);wc.textAlign='right';wc.fillText('KITCHEN →',1495,120);wc.fillText('TECH SUPPORT ↑',1495,228);const wm=new T.CanvasTexture(way);wm.colorSpace=T.SRGBColorSpace;mesh(office,new T.PlaneGeometry(2.5,.58),new T.MeshBasicMaterial({map:wm,toneMapped:false}),0,2.35,-11.34);
 box(office,deskWhite,.87,.80,.40,0,.40,-11.10);for(let x of [-.22,.22]){box(office,black,.21,.012,.12,x,.805,-11.09);label(office,x<0?'PAPER':'PLASTIC',x,.57,-10.895,.29,.085,'#c7c7bc')}coll(0,-11.10,.87,.40);
 for(let x of [-1.70,1.70]){box(office,officeGray,.16,2.36,1.05,x,1.18,-12.25);box(office,black,.045,.10,.05,x+(x>0?-.11:.11),1.04,-11.87);coll(x,-12.25,.16,1.05)}
 // Small desk under the stairs, a white door and water dispenser.
 box(office,white,2.1,.99,.16,-4.75,.495,-8.35);box(office,white,.14,.99,.90,-3.76,.495,-8.79);box(office,oak,2.1,.06,.72,-4.75,1.01,-8.72);box(office,black,.42,.32,.07,-4.6,1.20,-8.85);coll(-4.75,-8.7,2.1,.85);
 box(office,white,.42,1.03,.38,3.0,.515,-11.55);box(office,black,.25,.22,.035,3.0,.65,-11.34);cylinder(office,new T.MeshPhysicalMaterial({color:0xa2c9d3,transparent:true,opacity:.65,roughness:.12}),.17,.36,3.0,1.20,-11.55);coll(3,-11.55,.45,.42);
 // Crosswise cabinet fronts facing the lounge; open passages at both sides.
 box(office,officeGray,6.1,1.13,.54,0,.565,-13.6);box(office,oak,6.22,.075,.67,0,1.17,-13.6);
 for(let x=-2.8;x<3;x+=.65){box(office,oak,.032,1.10,.56,x,.56,-13.6);for(let y of [.35,.79])box(office,black,.11,.025,.045,x+.28,y,-13.30)}coll(0,-13.6,6.22,.67);
 const beige=mat(0xc6c1aa,.83);for(let x of [-2.65,2.65]){box(office,beige,.47,.36,.40,x,1.40,-13.6);box(office,screen,.35,.24,.025,x,1.42,-13.38);box(office,beige,.40,.04,.42,x,1.21,-13.6)}
 const frosted=new T.MeshStandardMaterial({color:0xb7d5d1,transparent:true,opacity:.58,roughness:.6,depthWrite:false});
 for(let z of [-15.5,-17.3,-19.1]){box(office,glass,.035,2.54,1.76,-2.85,1.35,z);box(office,frosted,.043,.48,1.75,-2.85,1.50,z);box(office,black,.065,2.68,.065,-2.85,1.34,z-.9);box(office,black,.065,.065,1.8,-2.85,2.66,z)}box(office,black,.065,2.68,.065,-2.85,1.34,-14.6);coll(-2.85,-17.3,.09,5.4);
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

 // Photo shows a continuous double-sided white desk, monitors back-to-back.
 box(office,deskWhite,1.74,.075,6.80,0,.75,-18.30);
 for(let x of [-.81,.81])for(let z of [-15.0,-18.3,-21.6])box(office,black,.055,.72,.055,x,.36,z);
 for(let z of [-15.85,-17.48,-19.11,-20.74]){
   const left=workstation(-.32,z,-Math.PI/2),right=workstation(.32,z,Math.PI/2);
   chair(-1.42,z,Math.PI/2,left);chair(1.42,z,-Math.PI/2,right);
 }
 coll(0,-18.30,1.74,6.80);
 // Desktop humidifier, wastebasket, paper and cable details from reference.
 cylinder(office,deskWhite,.15,.35,-.51,.96,-21.18);cylinder(office,deskWhite,.13,.018,-.51,1.145,-21.18);cylinder(office,black,.19,.39,0,.195,-20.9,.22);
 for(let z of [-16.1,-18.1,-20.1]){box(office,deskWhite,.19,.007,.26,.62,.795,z);cylinder(office,deskWhite,.043,.085,-.63,.84,z)}
 // Rear desks, pale blinds and a blue geometric accent column.
 for(let x of [-.8,1.4,6.35]){box(office,mat(0xc4c4bf,.94),1.65,1.46,.055,x,1.72,-23.69);box(office,black,.045,1.50,.055,x-.83,1.72,-23.65)}
 box(office,blue,.83,2.78,.12,3.04,1.39,-23.63);box(office,blue,.95,.34,.12,0,2.62,-13.9);
 for(let i=0;i<4;i++){let m=box(office,deskWhite,.018,.75,.018,3.04+(i%2?.15:-.15),.45+i*.58,-23.55);m.rotation.z=i%2?.62:-.57}
 // Ceiling cable tray and rectangular pendant lamps.
 box(office,black,.46,.10,9.8,-2.2,2.68,-18.7);
 for(let z of [-14.1,-16.1,-18.1,-20.1,-22.1]){box(office,black,.55,.045,.10,-2.2,2.60,z);box(office,black,.023,.20,.023,-2.2,2.81,z);let l=cylinder(office,warm,.13,.025,-4.1,2.79,z);box(office,warm,.28,.045,.40,-2.2,2.61,z)}
 for(let z of [-15.4,-19.1,-22.0]){
  for(let x of [-1.45,1.45]){box(office,black,.10,.12,1.75,x,2.48,z);box(office,warm,.055,.025,1.68,x,2.405,z)}
  for(let zz of [-.875,.875]){box(office,black,2.9,.12,.10,0,2.48,z+zz);box(office,warm,2.82,.025,.055,0,2.405,z+zz)}
 }
 for(let z of [-15.7,-21.5]){let l=new T.PointLight(0xfff1dd,14,10,1.55);l.position.set(1.5,2.58,z);office.add(l)}
 // Green plants in slim dark metal stands.
 const greenLeaves=mat(0x537b42,.88);
 for(let [x,z] of [[6.6,-14.2],[6.5,-22.8],[.2,-23.0]]){cylinder(office,black,.23,.34,x,.57,z);for(let dx of [-.16,.16])for(let dz of [-.16,.16])box(office,black,.025,.52,.025,x+dx,.26,z+dz);for(let i=0;i<13;i++){let leaf=mesh(office,new T.SphereGeometry(1,7,5),greenLeaves,x+(rng()-.5)*.45,.88+rng()*.38,z+(rng()-.5)*.45);leaf.scale.set(.07,.23,.04);leaf.rotation.z=(rng()-.5)*1.5}coll(x,z,.49,.49)}
 // Translate interaction and collision anchors by the same offset as the office geometry.
 for(const c of colliders.slice(officeColliderStart))c.z+=office.position.z;
 for(const seat of seats.slice(officeSeatStart)){seat.z+=office.position.z;for(const pt of seat.approaches)pt.z+=office.position.z}
 let hallLight=new T.PointLight(0xffecd2,14,19,1.3);hallLight.position.set(0,4.4,-6.2);g.add(hallLight);
 let corridorLight=new T.PointLight(0xffe2b6,8,13,1.4);corridorLight.position.set(0,3.7,4);g.add(corridorLight);
 // Local electrical circuits: physical switches on wall/column and independently dimmed light sources.
 const circuits=[
 {id:'plaza',name:'Reception',x:5.32,z:14.4,y:1.16,face:-Math.PI/2,test:o=>o.position.z>10&&o.position.z<=18},
 {id:'entrance',name:'Entrance',x:1.70,z:2.0,y:1.16,face:-Math.PI/2,test:o=>o.position.z>0&&o.position.z<=10},
 {id:'lounge',name:'Lounge',x:-8.99,z:-2.05,y:1.16,face:Math.PI/2,test:o=>o.position.z<=0&&o.position.z >=-15.8},
 {id:'workspace',name:'Workspace',x:-8.99,z:-17.4,y:1.16,face:Math.PI/2,test:o=>o.position.z<-15.8}
 ];
 const v=new T.Vector3();g.updateMatrixWorld(true);for(const c of circuits){c.on=true;c.lights=[];c.fixtures=[];g.traverse(o=>{if(o.isLight&&c.test({position:o.getWorldPosition(v)}))c.lights.push({light:o,intensity:o.intensity});if(o.isMesh&&[warm,wallLamp].includes(o.material)&&c.test({position:o.getWorldPosition(v)})){o.material=o.material.clone();c.fixtures.push({material:o.material,color:o.material.color.clone()})}});
  let sw=new T.Group();sw.position.set(c.x,c.y,c.z);sw.rotation.y=c.face;g.add(sw);box(sw,white,.135,.19,.035,0,0,0);c.rocker=box(sw,black,.075,.11,.038,0,0,.025);c.indicator=box(sw,new T.MeshBasicMaterial({color:0x77e6b2}),.023,.015,.009,0,.062,.049);c.handle=sw;c.approachX=c.x+(c.face>0?.40:-.40);
 }
 return {door,plazaDoor,plazaOpen:false,plazaAngle:0,colliders,seats,circuits,open:false,angle:0};
}
export function doorNearby(state,x,z){return Math.abs(x-.5)<1.6&&Math.abs(z)<1.7}
export function advanceDoor(state,dt){state.angle=T.MathUtils.damp(state.angle,state.open?Math.PI*.53:0,7,dt);state.door.rotation.y=-state.angle;state.plazaAngle=T.MathUtils.damp(state.plazaAngle,state.plazaOpen?Math.PI*.53:0,7,dt);state.plazaDoor.rotation.y=-state.plazaAngle}
export function academyWalkable(state,x,z,r=.27){if(z>34.65-r||z< -25.82+r)return false;const ax=Math.abs(x);if(Math.abs(z-23)<.24+r&&(x<r||x>1-r||state.plazaAngle<1.2))return false;if(Math.abs(z-18)<.24+r&&ax>1.20-r)return false;if(z>23.24){if(ax>10.7-r)return false}else if(z>17.76){if(ax>2.8-r)return false}else if(z>10.24){if(ax>5.35-r)return false}else if(z>.22){if(ax>1.75-r)return false}else if(ax>8.97-r)return false;if(Math.abs(z-10)<.24+r&&ax>1.75-r)return false;if(Math.abs(z)<.29+r){if(x<-.1+r||x>1.1-r||state.angle<1.2)return false}return !state.colliders.some(c=>c.r!==undefined?Math.hypot(x-c.x,z-c.z)<c.r+r:Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r)}

// Choose reachable seat approaches only; never walk through a different obstacle to reach one.
export function nearestAcademySeat(state,x,z,maxDistance=1.55){let best=null;for(const seat of state.seats||[]){for(const a of seat.approaches){let distance=Math.hypot(x-a.x,z-a.z);if(distance>maxDistance||best&&distance>=best.distance||!academyWalkable(state,a.x,a.z))continue;let clear=true;for(let i=1;i<=12;i++){let t=i/12;if(!academyWalkable(state,x+(a.x-x)*t,z+(a.z-z)*t)){clear=false;break}}if(clear)best={seat,approach:a,distance}}}return best}

export function nearbyLightSwitch(state,x,z,max=1.30){let found=null,d=max;for(const c of state.circuits||[]){const n=Math.hypot(x-c.approachX,z-c.z);if(n<d&&academyWalkable(state,c.approachX,c.z)){let clear=true;for(let k=1;k<=10;k++){const t=k/10;if(!academyWalkable(state,x+(c.approachX-x)*t,z+(c.z-z)*t)){clear=false;break}}if(clear){d=n;found=c}}}return found}
export function setLightCircuit(c,on){c.on=!!on;for(const a of c.lights)a.light.intensity=a.intensity*(c.on?1:0);for(const a of c.fixtures)a.material.color.copy(a.color).multiplyScalar(c.on?1:.035);c.rocker.rotation.x=c.on?-.15:.15;c.indicator.material.color.setHex(c.on?0x77e6b2:0x682e27)}

export function academyGround(x,z){if(z>=22.28)return -1.8;if(z<=18.68)return 0;return -1.8+.18*Math.min(10,Math.max(1,Math.floor((22.28-z)/.36)+1))}
export function plazaDoorNearby(state,x,z){return Math.abs(x-.5)<1.65&&Math.abs(z-23)<1.65}
