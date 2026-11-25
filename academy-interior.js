import * as T from 'three';
export const ENTRANCE_OFFSET=-3;
export const ACADEMY_DOOR_X=4.35+ENTRANCE_OFFSET;
const rng=(()=>{let n=728;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296)})();
const mat=(color,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
const glow=(color)=>new T.MeshBasicMaterial({color});
function mesh(g,geo,m,x=0,y=0,z=0){let a=new T.Mesh(geo,m);a.position.set(x,y,z);g.add(a);return a}
function box(g,m,w,h,d,x,y,z){return mesh(g,new T.BoxGeometry(w,h,d),m,x,y,z)}
function cylinder(g,m,r,h,x,y,z,r2=r){return mesh(g,new T.CylinderGeometry(r2,r,h,16),m,x,y,z)}
function texture(type){let c=document.createElement('canvas');c.width=c.height=512;let ctx=c.getContext('2d');let base=type==='wall'?[111,106,99]:type==='floor'?[34,32,30]:type==='glass'?[177,175,166]:[190,185,174];let im=ctx.createImageData(512,512);for(let y=0;y<512;y++)for(let x=0;x<512;x++){let i=(y*512+x)*4;let n=(rng()-.5)*(type==='glass'?85:13)+Math.sin(x*.062+Math.sin(y*.013)*2)*4+Math.sin(x*.017+y*.009)*5;for(let k=0;k<3;k++)im.data[i+k]=base[k]+n;im.data[i+3]=255}ctx.putImageData(im,0,0);if(type==='wall'){for(let i=0;i<95;i++){let x=rng()*512,y=rng()*512;ctx.fillStyle=rng()>.5?'rgba(225,214,193,.055)':'rgba(28,25,23,.045)';ctx.fillRect(x,y,2+rng()*24,30+rng()*190)}}if(type==='floor'||type==='tile'){ctx.strokeStyle=type==='floor'?'#776e5c':'#a49c91';ctx.lineWidth=2;ctx.strokeRect(1,1,510,510);if(type==='floor'){ctx.strokeStyle='#504941';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(160,0);ctx.lineTo(210,240);ctx.lineTo(202,310);ctx.lineTo(290,512);ctx.stroke()}}let t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;return t}
function surface(g,type,w,d,x,y,z){let map=texture(type);map.repeat.set(w/(type==='floor'?.72:.8),d/(type==='floor'?.72:.8));let o=mesh(g,new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({map,roughness:type==='floor'?.82:.82,metalness:0,envMapIntensity:type==='floor'?.12:.25}),x,y,z);o.rotation.x=-Math.PI/2;return o}
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
 const lobby=new T.Group();g.add(lobby);
 const marbleCanvas=document.createElement('canvas');marbleCanvas.width=1024;marbleCanvas.height=1024;const mc=marbleCanvas.getContext('2d');
 mc.fillStyle='#44423e';mc.fillRect(0,0,1024,1024);
 for(let i=0;i<260;i++){mc.strokeStyle=['#c9c4b9','#e0dcd0','#68665f','#95928a','#393834'][i%5];mc.lineWidth=.8+rng()*3.4;mc.beginPath();for(let x=0;x<=1024;x+=5){let y=i*4+22*Math.sin(x*.007+i*.025)+10*Math.sin(x*.019+i*.045);x?mc.lineTo(x,y):mc.moveTo(x,y)}mc.stroke()}
 const marbleMap=new T.CanvasTexture(marbleCanvas);marbleMap.colorSpace=T.SRGBColorSpace;marbleMap.wrapS=marbleMap.wrapT=T.RepeatWrapping;marbleMap.repeat.set(2.7,2);marbleMap.anisotropy=8;const marble=new T.MeshStandardMaterial({map:marbleMap,roughness:.24,metalness:.14,envMapIntensity:.8});
 const lf=mesh(lobby,new T.PlaneGeometry(10.8,8),marble,0,.002,14);lf.rotation.x=-Math.PI/2;
 const lobbyWall=mat(0x454541,.75),mirror=mat(0x737873,.16,.80),gold=mat(0x9d8748,.23,.72),matBlack=mat(0x181918,.95);
 box(lobby,lobbyWall,.20,4.4,8,5.5,2.2,14);box(lobby,anthracite,10.9,.15,8,0,4.45,14);
 // Entrance axis: stairs -> reception straight ahead; lounge extends left, academy corridor exits right.
 for(const x of [-4.28,4.28])box(lobby,lobbyWall,2.65,4.4,.20,x,2.2,18);
 box(lobby,lobbyWall,8.85,4.4,.20,-1.075,2.2,10);box(lobby,lobbyWall,.18,4.4,2.0,3.35,2.2,11.0);coll(3.35,11,.18,2);
 box(lobby,lobbyWall,.20,4.4,.20,5.40,2.2,10);
 const counter=marble.clone();counter.color.setHex(0x494947);
 box(lobby,counter,6.15,1.04,.83,-.30,.52,11.1);box(lobby,goldTrim,6.22,.035,.88,-.30,1.055,11.1);
 box(lobby,goldTrim,6.15,.025,.025,-.30,.07,11.53);
 for(const x of [-3.36,2.76])box(lobby,goldTrim,.025,.98,.025,x,.55,11.53);
 coll(-.30,11.1,6.22,.88);
 box(lobby,steel,.43,.30,.05,-.40,1.22,11.0);box(lobby,steel,.05,.14,.12,-.40,1.10,11.0);
 box(lobby,gold,1.05,4.15,.055,0,2.20,10.15);
 for(const x of [-.54,.54])box(lobby,warm,.022,4.13,.025,x,2.20,10.20);
 // Deep left waiting area, with sofas and a chess table.
 const wingFloor=mesh(lobby,new T.PlaneGeometry(9.0,8),marble,-9.90,.002,14);wingFloor.rotation.x=-Math.PI/2;
 box(lobby,lobbyWall,.20,4.4,8,-14.50,2.2,14);box(lobby,lobbyWall,9.0,4.4,.20,-9.90,2.2,10);box(lobby,lobbyWall,9.0,4.4,.20,-9.90,2.2,18);box(lobby,anthracite,9.0,.15,8,-9.90,4.45,14);
 // Remove the original left boundary to join the lounge to the reception.
 function loungeSofa(x,z,face){const q=new T.Group();q.position.set(x,0,z);q.rotation.y=face;lobby.add(q);box(q,cream,2.45,.34,.75,0,.22,0);box(q,cream,2.45,.14,.80,0,.46,0);box(q,cream,2.45,.62,.16,0,.70,-.35);for(const dx of [-1.13,1.13])box(q,cream,.18,.38,.78,dx,.61,0);const rotated=Math.abs(Math.sin(face))>.5;coll(x,z,rotated?.80:2.45,rotated?2.45:.80);for(const dx of [-.65,0,.65]){const fx=Math.sin(face),fz=Math.cos(face),sx=x+Math.cos(face)*dx+fx*.24,sz=z-Math.sin(face)*dx+fz*.24;seats.push({kind:'lobby sofa',x:sx,z:sz,height:.53,yaw:face,approaches:[{x:sx+fx*.70,z:sz+fz*.70}]})}}
 loungeSofa(-13.2,14,Math.PI/2);loungeSofa(-10.5,11.0,0);loungeSofa(-10.5,17.0,Math.PI);loungeSofa(-7.8,14,-Math.PI/2);
 box(lobby,marble,.95,.07,.95,-10.5,.66,14);for(const dx of [-.38,.38])for(const dz of [-.38,.38])box(lobby,steel,.045,.63,.045,-10.5+dx,.315,14+dz);
 const chessLight=mat(0xd9c4a0),chessDark=mat(0x41352a);for(let i=0;i<8;i++)for(let j=0;j<8;j++)box(lobby,(i+j)%2?chessDark:chessLight,.085,.012,.085,-10.5+(i-3.5)*.085,.702,14+(j-3.5)*.085);
 for(let i=0;i<8;i++)for(const j of [0,1,6,7]){const m=j<2?chessLight:chessDark;const x=-10.5+(i-3.5)*.085,z=14+(j-3.5)*.085;cylinder(lobby,m,.025,.018,x,.72,z);cylinder(lobby,m,.013,j===1||j===6?.045:.070,x,.751,z,.023)}
 coll(-10.5,14,.95,.95);
 for(let k=0;k<60;k++){let pts=[];for(let i=0;i<=32;i++){let z=10.12+i*7.72/32,x=-14.2+k*.337+.19*Math.sin(z*1.7+k*.30);pts.push(new T.Vector3(x,4.30,z))}mesh(lobby,new T.TubeGeometry(new T.CatmullRomCurve3(pts),48,.012,5,false),warm)}
 const elevator=mat(0x777a76,.24,.65);box(lobby,elevator,.055,2.45,1.65,5.20,1.23,14.9);box(lobby,black,.07,2.45,.022,5.16,1.23,14.9);
 // Right exit turns into the academy corridor at the lobby boundary.
 // Direct straight corridor begins at lobby opening.
 const entryMat=box(lobby,matBlack,2.5,.014,1.5,0,.012,17.1);
 for(const z of [12,16]){const l=new T.PointLight(0xfff1dc,13,12,1.5);l.position.set(0,3.95,z);lobby.add(l)}
 const outdoorLight=new T.PointLight(0xffdfb2,25,18,1.55);outdoorLight.position.set(0,3.7,26);plaza.add(outdoorLight);

 // One straight passage from reception to the academy door.
 const hallX=4.35;surface(g,'floor',2,10,hallX,0,5);wall(g,concrete,2.24,.22,10,hallX,4.5,5);
 function hallWall(x,z0,z1){wall(g,concrete,.20,4.4,z1-z0,x,2.2,(z0+z1)/2)}
 hallWall(3.25,0,3.05);hallWall(3.25,5.15,10);hallWall(5.45,0,2.85);hallWall(5.45,5.15,10);
 function branchHall(x0,x1,z0,z1){const w=x1-x0,d=z1-z0,x=(x0+x1)/2,z=(z0+z1)/2;surface(g,'floor',w,d,x,0,z);wall(g,concrete,w,.22,d,x,4.5,z);wall(g,concrete,w,4.4,.20,x,2.2,z0-.10);wall(g,concrete,w,4.4,.20,x,2.2,z1+.10)}
 branchHall(-1.85,3.35,3.05,5.15);hallWall(-1.95,3.05,5.15);branchHall(5.35,10.25,2.85,5.15);hallWall(10.35,2.85,5.15);
 const wallLamp=glow(0xffe6bc);let frost=new T.MeshStandardMaterial({map:texture('glass'),roughness:.62,metalness:.02,envMapIntensity:.12});
 function corridorLeaf(x,z,angle,sign){const d=new T.Group();d.position.set(x,0,z);d.rotation.y=angle;g.add(d);box(d,frame,1.04,2.36,.08,0,1.18,0);box(d,mat(0x273c3a,.55,.03),.90,2.20,.042,0,1.16,.049);box(d,steel,.035,.39,.09,-.33,1.06,.106);if(sign)label(d,sign,0,2.10,.08,.35,.16,'#303330')}
 corridorLeaf(3.365,7.5,Math.PI/2,'');corridorLeaf(7.2,5.13,Math.PI,'WC');corridorLeaf(8.85,5.13,Math.PI,'WC');
 
 const door=new T.Group();door.position.set(4.95,.03,.16);g.add(door);
 for(const x of [3.72,4.98])box(g,frame,.15,2.52,.32,x,1.26,0);box(g,frame,1.41,.14,.32,4.35,2.45,0);
 for(const x of [-1.14,-.06])box(door,frame,.12,2.34,.09,x,1.17,0);box(door,frame,.96,.27,.09,-.6,.135,0);box(door,frame,.96,.15,.09,-.6,2.265,0);box(door,frost,.958,1.92,.065,-.6,1.23,0);
 for(const side of [-1,1]){box(door,black,.04,.76,.065,-1.03,1.04,.11*side);for(const y of [.69,1.39])box(door,black,.10,.045,.13,-1.03,y,.065*side)}
 label(g,'Picsart|Academy',4.35,2.69,.157,1.10,.32,'#ae1b61');
 for(const side of [-1,1]){const x=hallX+side*.97;box(g,warm,.025,.03,9.75,x,4.29,5);for(const z of [1.2,2.3,5.8,7.0,8.6,9.6]){box(g,wallLamp,.075,.035,.18,x,.023,z);light(g,x-side*.04,.12,z,x,1.0,z,1.8)}}
 for(const [x0,x1,z] of [[-1.75,3.25,3.08],[5.45,10.15,2.88]])box(g,warm,x1-x0,.026,.025,(x0+x1)/2,4.28,z);
 // Translate the complete exterior and straight corridor as a unit, retaining the approved reception layout.
 const entryParts=[...g.children],entryGroup=new T.Group();g.add(entryGroup);
 for(const part of entryParts)entryGroup.add(part);entryGroup.position.x=ENTRANCE_OFFSET;
 for(const c of colliders)c.x+=ENTRANCE_OFFSET;
 for(const seat of seats){seat.x+=ENTRANCE_OFFSET;for(const p of seat.approaches)p.x+=ENTRANCE_OFFSET}
 // Solid facade meets the new door jambs exactly; close any visible strips.
 const doorLeft=ACADEMY_DOOR_X-.70,doorRight=ACADEMY_DOOR_X+.70;
 wall(g,white,doorLeft+9.12,5.6,.28,(doorLeft-9.12)/2,2.8,0);
 wall(g,white,11.12-doorRight,5.6,.28,(11.12+doorRight)/2,2.8,0);
 wall(g,white,1.40,3.08,.28,ACADEMY_DOOR_X,4.06,0);
 box(g,white,2.785,5.6,8.71,-7.6175,2.8,-4.495);coll(-7.6175,-4.495,2.785,8.71);const welcomeBoard=label(g,'WELCOME TO|PICSART ACADEMY',-6.214,1.68,-.94,1.32,.43,'#a51c59');welcomeBoard.rotation.y=Math.PI/2;
 // Hall beyond the entrance: open double-height lounge, stair and mezzanine.
 surface(g,'tile',18.0,46.0,0,0,-23.0);surface(g,'tile',2.1,16.0,10.05,0,-8.0);wall(g,white,.22,5.6,16.0,-9.12,2.8,-8.0);wall(g,dark,.22,5.6,16.0,11.12,2.8,-8.0);wall(g,white,2.1,5.6,.22,10.05,2.8,-16);coll(10.05,-16,2.1,.22);wall(g,white,20.2,.2,16.2,1,5.65,-8.0);
 for(let z of [-2,-5,-8,-11,-14]){box(g,white,18.0,.38,.23,0,5.25,z);box(g,black,12.6,.11,.17,.2,5.02,z);box(g,warm,11.4,.042,.09,.2,4.82,z);for(let x of [-3.1,3.4]){box(g,black,.035,.48,.035,x,5.12,z)}}
 for(let x of [-3.1,2.6]){let duct=cylinder(g,black,.24,12.5,x,5.0,-6.8);duct.rotation.x=Math.PI/2;for(let z of [-3,-8,-12]){let elbow=cylinder(g,black,.25,2.2,x,5.0,z);elbow.rotation.z=Math.PI/2}}
 box(g,black,.025,.10,8.71,-6.211,.05,-4.495);
 // Rear mezzanine and the left-hand stairs.
 box(g,black,17.95,.22,7.2,0,2.85,-12.2);box(g,white,17.95,.16,.25,0,2.66,-8.61);
 for(let i=0;i<12;i++){let x=-8.85+i*(17.7/11);if(i!==2)box(g,frame,.045,.98,.045,x,3.45,-8.52);if(i<11&&i!==1&&i!==2)box(g,glass,17.7/11-.045,.87,.035,x+17.7/22,3.4,-8.52)}box(g,frame,1.65,.065,.06,-8.03,3.97,-8.52);box(g,frame,12.9,.065,.06,2.42,3.97,-8.52);
 for(let i=0;i<15;i++){let h=(i+1)*.19;box(g,black,1.55,.16,.42,-5.45,h-.08,-2.2-i*.42)}const stairBeam=box(g,black,.15,.34,7.0,-4.70,1.36,-5.15);stairBeam.rotation.x=Math.atan2(2.66,6.3);
 const railA=new T.Vector3(-4.62,1.02,-2.0),railB=new T.Vector3(-4.62,3.9,-8.58),dir=railB.clone().sub(railA);let rail=cylinder(g,frame,.035,dir.length(),0,0,0);rail.position.copy(railA).add(railB).multiplyScalar(.5);rail.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());for(let i=0;i<8;i++){let z=-2.2-i*.8,h=.25+i*.38;box(g,frame,.035,.95,.035,-4.62,h+.46,z);box(g,glass,.036,.80,.75,-4.62,h+.45,z-.33)}
 // Photo reference: elongated S-shaped, double-sided seating island.
 const spine=new T.CatmullRomCurve3([
  new T.Vector3(.78,0,-3.25),new T.Vector3(-.38,0,-3.75),new T.Vector3(-.52,0,-4.95),
  new T.Vector3(.28,0,-6.2),new T.Vector3(.97,0,-7.35),new T.Vector3(.91,0,-8.6),
  new T.Vector3(.14,0,-9.55),new T.Vector3(-.38,0,-9.75)
 ].map(p=>{p.x+=.85;return p}),false,'centripetal');
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
 for(const t of [0,1]){const p=spine.getPointAt(t),d=spine.getTangentAt(t),q=mesh(g,new T.SphereGeometry(1,24,12),seatMat,p.x,.45,p.z);q.scale.set(.77,.12,.26);q.rotation.y=Math.atan2(-d.z,d.x)+Math.PI/2;const endBack=mesh(g,new T.SphereGeometry(1,20,12),backMat,p.x,.76,p.z);endBack.scale.set(.27,.32,.13);endBack.rotation.copy(q.rotation)}
 // Soft cushion joins and silver-green foliage follow the same curve.
 for(let i=1;i<13;i++){let t=i/13,p=spine.getPointAt(t),d=spine.getTangentAt(t);for(let side of [-1,1]){let m=box(g,seamMat,.016,.009,.56,p.x-d.z*side*.57,.565,p.z+d.x*side*.57);m.rotation.y=Math.atan2(d.x,d.z)}}
 const leafColors=[0x8a9b75,0xa0ae85,0x657f56];for(let q=0;q<3;q++){
  let leaves=new T.InstancedMesh(new T.SphereGeometry(1,6,4),mat(leafColors[q],.94),100),obj=new T.Object3D();
  for(let i=0;i<100;i++){let t=rng(),p=spine.getPointAt(t),d=spine.getTangentAt(t),off=(rng()-.5)*.38;obj.position.set(p.x-d.z*off,1.03+rng()*.23,p.z+d.x*off);obj.scale.set(.026+rng()*.035,.15+rng()*.18,.028+rng()*.018);obj.rotation.set((rng()-.5)*1.7,rng()*6.28,(rng()-.5)*1.6);obj.updateMatrix();leaves.setMatrixAt(i,obj.matrix)}
  leaves.instanceMatrix.needsUpdate=true;g.add(leaves);
 }
 // Seat anchors follow the exact sofa curve, facing away from its planted center.
 for(let i=1;i<=10;i++){let t=.07+i*.078,p=spine.getPointAt(t),d=spine.getTangentAt(t);for(let side of [-1,1]){let nx=-d.z*side,nz=d.x*side;seats.push({kind:'sofa',x:p.x+nx*.82,z:p.z+nz*.82,height:.57,yaw:Math.atan2(nx,nz),approaches:[{x:p.x+nx*1.40,z:p.z+nz*1.40},{x:p.x+nx*1.60,z:p.z+nz*1.60}]})}}
 // Local circular collision samples preserve the open walkways on both sides.
 for(let i=0;i<=42;i++){let p=spine.getPointAt(i/42),edge=Math.min(i,42-i);colliders.push({x:p.x,z:p.z,r:Math.min(.86,.66+edge*.08)})}
 const study=new T.Group();study.position.x=3.35;g.add(study);
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
  const sx=study.position.x;
  coll(sx+5.71,z,.86,2.12);
  for(const bx of [4.66,6.40]){
   coll(sx+bx,z,.40,2.06);
   const face=bx<5.71?1:-1;
   for(const zz of [-.48,.48]){
    seats.push({kind:'study bench',x:sx+bx,z:z+zz,height:.455,yaw:face*Math.PI/2,approaches:[{x:sx+bx,z:z-1.46},{x:sx+bx,z:z+1.46},{x:sx+bx-face*.64,z:z+zz}]});
   }
  }
 }
 // Oversized, directly illuminated academy lettering above the study tables.
 const fascia=mat(0x252525,.86);box(study,fascia,.075,1.42,11.85,7.59,2.02,-6.65);
 const signCanvas=document.createElement('canvas');signCanvas.width=2048;signCanvas.height=320;
 const sc=signCanvas.getContext('2d');sc.clearRect(0,0,2048,320);sc.textAlign='center';sc.textBaseline='middle';
 sc.font='600 238px Arial';sc.shadowColor='#efffff';sc.shadowBlur=36;sc.fillStyle='#f5ffff';sc.fillText('Picsart Academy',1024,165,1940);
 sc.shadowBlur=0;sc.fillStyle='#ffffff';sc.fillText('Picsart Academy',1024,165,1940);
 const signMap=new T.CanvasTexture(signCanvas);signMap.colorSpace=T.SRGBColorSpace;signMap.anisotropy=4;
 const letters=mesh(study,new T.PlaneGeometry(11.35,1.38),new T.MeshBasicMaterial({map:signMap,transparent:true,depthWrite:false,toneMapped:false}),7.525,2.02,-6.65);letters.rotation.y=-Math.PI/2;
 box(study,warm,.027,.032,11.85,7.52,1.30,-6.65);
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
 wall(office,white,.22,2.95,29.9,-9.12,1.47,-28.45);wall(office,white,.22,2.95,29.9,9.12,1.47,-28.45);
 wall(office,white,18.2,2.95,.22,0,1.47,-43.4);wall(office,white,18.2,.20,29.9,0,2.92,-28.45);
 // Close the high level beyond the mezzanine without blocking the ground floor.
 wall(office,white,18.2,2.55,.22,0,4.25,-13.64);

 const officeShift=-1.25;
 function captureOfficePart(){return {mesh:office.children.length,coll:colliders.length,seat:seats.length}}
 function moveOfficePart(start,dx){for(const o of office.children.slice(start.mesh))o.position.x+=dx;for(const c of colliders.slice(start.coll))c.x+=dx;for(const a of seats.slice(start.seat)){a.x+=dx;for(const p of a.approaches)p.x+=dx}}
 const junctionStart=captureOfficePart();
 // A/B: office entrance and wayfinding pillar toward Ada.
 box(office,white,1.14,2.74,.79,0,1.37,-11.75);coll(0,-11.75,1.14,.79);
 const way=document.createElement('canvas');way.width=1536;way.height=360;const wc=way.getContext('2d');wc.fillStyle='#ad1456';wc.fillRect(0,0,1536,360);wc.fillStyle='#fff';wc.font='bold 82px Arial';wc.textBaseline='middle';['↙ ADA LOVELACE','← DAVID BLACKWELL','← GRACE HOPPER'].forEach((t,i)=>wc.fillText(t,35,68+i*108));wc.fillRect(864,24,5,312);wc.textAlign='right';wc.fillText('KITCHEN →',1495,120);wc.fillText('TECH SUPPORT ↑',1495,228);const wm=new T.CanvasTexture(way);wm.colorSpace=T.SRGBColorSpace;mesh(office,new T.PlaneGeometry(2.5,.58),new T.MeshBasicMaterial({map:wm,toneMapped:false}),0,2.35,-11.34);
 box(office,deskWhite,.87,.80,.40,0,.40,-11.10);for(let x of [-.22,.22]){box(office,black,.21,.012,.12,x,.805,-11.09);label(office,x<0?'PAPER':'PLASTIC',x,.57,-10.895,.29,.085,'#c7c7bc')}coll(0,-11.10,.87,.40);
 box(office,white,.075,1.15,1.32,.61,1.62,-11.75);box(office,officeGray,.025,1.04,1.22,.657,1.62,-11.75);box(office,frame,.14,.045,1.25,.65,1.06,-11.75);
 moveOfficePart(junctionStart,officeShift);
 // Small desk under the stairs, a white door and water dispenser.
 // Vintage hardware display beneath staircase; no seat or active computer.
 const display=new T.Group();display.position.set(-5.37,0,-5.18);display.rotation.y=Math.PI/2;office.add(display);
 const displayStone=mat(0xd2ccc0,.84),oldPlastic=mat(0xc5c0ad,.94),oldMetal=mat(0x979a95,.75);
 box(display,displayStone,2.05,.91,.12,0,.455,.35);for(const x of [-.97,.97]){box(display,displayStone,.12,.91,.80,x,.455,0);box(display,displayStone,.19,.07,.84,x,.945,0)}
 box(display,displayStone,2.10,.07,.19,0,.945,.35);box(display,black,2.05,.065,.13,0,.035,.36);
 box(display,oldMetal,.43,.57,.44,-.64,.34,.02);for(let j=0;j<5;j++)box(display,black,.28,.018,.012,-.64,.43+j*.035,.247);
 for(const dx of [-.11,.10])cylinder(display,black,.065,.012,-.64+dx,.27,.255).rotation.x=Math.PI/2;
 box(display,oldPlastic,.54,.44,.47,.06,.45,-.02);box(display,black,.40,.31,.025,.06,.47,.225);
 box(display,oldPlastic,.52,.12,.25,.60,.16,.03);for(let j=0;j<4;j++)box(display,black,.39,.018,.013,.60,.13+j*.026,.16);
 coll(-5.37,-5.18,.84,2.10);box(office,black,.14,2.72,.14,-4.90,1.36,-6.50);coll(-4.90,-6.50,.14,.14);
 box(office,white,.20,2.72,2.65,-6.315,1.36,-7.75);coll(-6.315,-7.75,.20,2.65);
 const ada=new T.Group();ada.position.set(-6.196,0,-7.48);ada.rotation.y=Math.PI/2;office.add(ada);box(ada,white,1.02,2.18,.055,0,1.09,0);for(const x of [-.53,.53])box(ada,frame,.035,2.24,.06,x,1.12,.008);box(ada,frame,1.09,.035,.06,0,2.23,.008);box(ada,black,.14,.035,.08,.31,1.02,.065);label(ada,'Ada Lovelace',-.89,1.62,.045,.61,.16,'#8d753a');
 
 const mainOfficeStart=captureOfficePart();
 // The two office fronts are parallel, with the open circulation route at either end.
 const beige=mat(0xc6c1aa,.83);
 const cabinet=(x,w)=>{box(office,officeGray,w,1.08,.52,x,.54,-13.65);box(office,oak,w+.08,.065,.62,x,1.11,-13.65);for(let q=x-w/2+.03;q<x+w/2;q+=.73){box(office,oak,.035,1.06,.54,q,.54,-13.65);box(office,oak,.58,.045,.23,q+.31,.35+(Math.round(q*3)%3+3)%3*.21,-13.34)}coll(x,-13.65,w+.08,.62)};
 cabinet(-.10,4.35);
 box(office,beige,.47,.36,.40,-1.65,1.33,-13.65);box(office,screen,.35,.24,.025,-1.65,1.35,-13.43);
 const frosted=new T.MeshStandardMaterial({color:0xb7d5d1,transparent:true,opacity:.58,roughness:.6,depthWrite:false});
 // Glass wall separates the existing office from the adjacent library office on the right.
 for(let z of [-15.5,-17.3,-19.1,-20.9]){
  box(office,glass,.045,2.58,1.77,2.85,1.34,z);
  box(office,frosted,.052,.72,1.76,2.85,1.28,z);
  box(office,black,.065,2.68,.065,2.85,1.34,z-.9);
  box(office,black,.065,.065,1.8,2.85,2.66,z);
  box(office,black,.065,.065,1.8,2.85,.045,z);
 }
 box(office,black,.065,2.68,.065,2.85,1.34,-14.6);coll(2.85,-18.2,.09,7.2);
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
 
 box(office,blue,.35,2.78,.35,5.35,1.39,-23.63);coll(5.35,-23.63,.35,.35);box(office,blue,.95,.34,.12,0,2.62,-13.9);
 
 // Ceiling cable tray and rectangular pendant lamps.
 box(office,black,.46,.10,9.8,-2.2,2.68,-18.7);
 for(let z of [-14.1,-16.1,-18.1,-20.1,-22.1]){box(office,black,.55,.045,.10,-2.2,2.60,z);box(office,black,.023,.20,.023,-2.2,2.81,z);let l=cylinder(office,warm,.13,.025,-4.1,2.79,z);box(office,warm,.28,.045,.40,-2.2,2.61,z)}
 for(let z of [-15.4,-19.1,-22.0]){
  for(let x of [-1.45,1.45]){box(office,black,.10,.12,1.75,x,2.48,z);box(office,warm,.055,.025,1.68,x,2.405,z)}
  for(let zz of [-.875,.875]){box(office,black,2.9,.12,.10,0,2.48,z+zz);box(office,warm,2.82,.025,.055,0,2.405,z+zz)}
 }
 for(let z of [-15.7,-21.5]){let l=new T.PointLight(0xfff1dd,14,10,1.55);l.position.set(1.5,2.58,z);office.add(l)}
 moveOfficePart(mainOfficeStart,officeShift);
 // Green plants in slim dark metal stands.
 const greenLeaves=mat(0x537b42,.88);
 for(let [x,z] of [[7.9,-22.3],[6.5,-22.8],[-3.8,-23.0]]){cylinder(office,black,.23,.34,x,.57,z);for(let dx of [-.16,.16])for(let dz of [-.16,.16])box(office,black,.025,.52,.025,x+dx,.26,z+dz);for(let i=0;i<13;i++){let leaf=mesh(office,new T.SphereGeometry(1,7,5),greenLeaves,x+(rng()-.5)*.45,.88+rng()*.38,z+(rng()-.5)*.45);leaf.scale.set(.07,.23,.04);leaf.rotation.z=(rng()-.5)*1.5}coll(x,z,.49,.49)}

 // First-floor extension reconstructed from the November 25 reference sequence.
 const olive=mat(0x555b41,.96),acoustic=mat(0xb2ada5,.97),green=mat(0x419d59,.85),yellow=mat(0xc6b52d,.85),blind=mat(0x777b7d,.96),windowBlue=mat(0x708fa5,.38,.12),whiteBoard=mat(0xf2f2ee,.45),bookMats=[0x627789,0x9a624f,0xc2b8a4,0x59684e,0x494e65].map(c=>mat(c));
 const partition=(x,z,w,d,m=white,h=2.75)=>{box(office,m,w,h,d,x,h/2,z);coll(x,z,w,d)};
 const desk=(x,z,w,d,m=deskWhite)=>{box(office,m,w,.065,d,x,.75,z);for(const dx of [-w/2+.09,w/2-.09])for(const dz of [-d/2+.08,d/2-.08])box(office,black,.05,.72,.05,x+dx,.36,z+dz);coll(x,z,w,d)};
 function dispenser(x,z,face=0){const q=new T.Group();q.position.set(x,0,z);q.rotation.y=face;office.add(q);box(q,deskWhite,.39,1.03,.37,0,.515,0);box(q,black,.26,.24,.025,0,.69,.191);box(q,deskWhite,.22,.055,.11,0,.53,.24);for(const dx of [-.06,.06])box(q,steel,.025,.08,.035,dx,.74,.22);cylinder(q,deskWhite,.055,.38,.23,.81,0);coll(x,z,.48,.42)}
 // End wall of the academy-sign study strip; dispenser sits flush against its outside face.
 partition(9.30,-10.43,3.30,.15,officeGray,2.65);box(office,warm,3.24,.025,.045,9.30,2.60,-10.34);dispenser(7.75,-10.70,Math.PI);
 // Adjacent office is on the right of the old one, not on the opposite side of the hall.
 const adjacentStart=captureOfficePart();
 // Dark office flooring, wooden display counter at front and a narrow entry beside it.
 box(office,officeGray,5.70,.014,8.1,5.77,.008,-17.7);box(office,officeGray,5.3,.014,8.1,.1,.008,-17.7);
 box(office,oak,2.70,.075,.66,6.12,1.17,-13.72);
 box(office,officeGray,2.60,1.12,.54,6.12,.56,-13.72);
 for(const x of [4.82,6.1,7.42])box(office,oak,.05,1.10,.60,x,.56,-13.72);
 for(const [x,y] of [[5.1,.32],[5.9,.58],[6.8,.83]])box(office,oak,.56,.045,.24,x,y,-13.34);
 coll(6.12,-13.72,2.70,.66);
 box(office,beige,.48,.36,.40,6.7,1.40,-13.72);box(office,screen,.35,.24,.025,6.7,1.42,-13.50);
 desk(5.05,-17.65,1.40,4.8);
 box(office,officeGray,.045,.30,4.66,5.05,.94,-17.65);
 for(const z of [-16.15,-17.65,-19.15]){
  chair(3.94,z,Math.PI/2,workstation(4.77,z,-Math.PI/2));
  chair(6.17,z,-Math.PI/2,workstation(5.33,z,Math.PI/2));
 }
 // Original office ends at the white wall; circulation remains open around both ends.
 partition(-2.55,-21.15,.16,3.0,white,2.72);
 moveOfficePart(adjacentStart,officeShift);
 partition(8.05,-12.72,1.80,.15,white,2.72);
 const libraryStart=captureOfficePart();
 // Slim black structural poles between the library office and the window aisle.
 for(const z of [-14.55,-20.80]){box(office,black,.07,2.72,.07,7.53,1.36,z);coll(7.53,z,.07,.07)}
 partition(-2.55,-16.8,.14,5.5,white,2.72);
 // Library along the outer edge of the adjacent workspace.
 for(const z of [-16.25,-18.35,-20.45]){
  box(office,oak,.055,2.28,1.86,8.68,1.14,z);box(office,oak,.55,.06,1.86,8.24,2.26,z);
  box(office,oak,.50,.48,1.88,8.24,.24,z);
  for(let row=0;row<4;row++){
   const y=.53+row*.43;box(office,oak,.55,.045,1.83,8.24,y,z);
   for(let k=0;k<10;k++){const h=.23+rng()*.12;box(office,bookMats[(k+row)%5],.27,h,.09+rng()*.035,8.15,y+.025+h/2,z-.75+k*.16)}
  }
  for(const zz of [-.92,.92])box(office,oak,.55,2.28,.045,8.24,1.14,z+zz);
  coll(8.38,z,.67,1.9);
 }
 for(let row=0;row<5;row++){const y=.25+row*.40;box(office,black,.40,.035,1.45,8.30,y,-21.95);for(let k=0;k<13;k++)box(office,bookMats[k%5],.26,.27,.075,8.25,y+.15,-22.57+k*.095)}
 for(const z of [-22.68,-21.22])for(const x of [8.10,8.50])box(office,black,.035,2.12,.035,x,1.06,z);
 coll(8.30,-21.95,.42,1.48);
 // Extra library workstation; open approach from the shared circulation aisle.
 desk(5.8,-21.5,1.55,.70);chair(5.8,-20.62,Math.PI,workstation(5.8,-21.5,Math.PI));
 moveOfficePart(libraryStart,officeShift);
 // Window-side workstations and the plant-lined path behind both offices.
 for(const z of [-15.6,-18.0,-20.4]){
  box(office,windowBlue,.045,2.43,2.30,8.985,1.34,z);
  box(office,blind,.045,1.85,2.26,8.94,1.63,z);
  box(office,black,.055,2.5,.055,8.90,1.35,z-1.15);
 }
 // Separate the white-table room from the older office but retain both sides of the circulation loop.
 for(const z of [-23.6,-26.1,-28.6,-31.1,-33.6]){
  box(office,windowBlue,.06,2.42,2.32,8.98,1.35,z);box(office,blind,.045,1.95,2.27,8.92,1.63,z);
  for(const zz of [-1.17,1.17])box(office,black,.085,2.5,.045,8.87,1.35,z+zz);
  box(office,black,.075,.055,2.34,8.87,.15,z);
 }
 desk(8.0,-28.45,.72,10.0);
 for(const z of [-25.0,-27.3,-29.6,-31.9])chair(7.02,z,Math.PI/2,workstation(8.0,z,Math.PI/2));
 for(const [x,z] of [[7.9,-22.9],[5.0,-23.0]]){cylinder(office,black,.24,.40,x,.20,z);for(let i=0;i<12;i++){const leaf=mesh(office,new T.SphereGeometry(1,7,5),greenLeaves,x+(rng()-.5)*.45,.45+rng()*.7,z+(rng()-.5)*.45);leaf.scale.set(.06,.26,.04);leaf.rotation.z=(rng()-.5)*2}coll(x,z,.49,.49)}
 partition(-.25,-22.65,4.6,.17,white,2.73);
 box(office,green,.12,2.7,.18,2.10,1.35,-22.55);
 // Open study hall: white communal benches and two double-sided computer islands.
 for(const z of [-24.5,-27.4]){
  desk(-.25,z,4.2,.95);
  for(const side of [-1,1]){const bz=z+side*.78;box(office,deskWhite,3.95,.065,.34,-.25,.46,bz);for(const x of [-2.0,1.5])box(office,black,.055,.44,.31,x,.22,bz);coll(-.25,bz,3.95,.34);
   for(const x of [-1.4,0,1.1])seats.push({kind:'study bench',x,z:bz,height:.49,yaw:side>0?Math.PI:0,approaches:[{x,z:bz+side*.70},{x:-2.85,z:bz},{x:2.35,z:bz}]});
  }
 }
 for(const z of [-30.6,-33.35]){desk(.1,z,4.1,1.0);box(office,officeGray,3.98,.32,.045,.1,.94,z);
  for(const x of [-1.2,.2,1.4]){chair(x,z+.96,Math.PI,workstation(x,z+.12,Math.PI));chair(x,z-.96,0,workstation(x,z-.12,0))}
 }
 // Three upholstered alcoves against the opposite wall.
 for(const z of [-24.6,-27.1,-29.6]){
  box(office,white,1.10,.20,2.28,-8.30,.10,z);box(office,olive,.95,.14,2.18,-8.28,.43,z);
  box(office,olive,.13,.68,2.18,-8.77,.77,z);box(office,acoustic,.12,1.15,2.18,-8.79,1.68,z);
  for(const zz of [-1.10,1.10]){box(office,olive,1.13,2.15,.11,-8.28,1.17,z+zz);box(office,acoustic,.86,1.18,.055,-8.19,1.67,z+zz)}
  box(office,olive,1.10,.12,2.28,-8.28,2.27,z);coll(-8.30,z,1.12,2.28);
  for(const zz of [-.55,.55])seats.push({kind:'alcove sofa',x:-7.99,z:z+zz,height:.50,yaw:Math.PI/2,approaches:[{x:-7.23,z:z+zz}]});
 }
 // Green geometric divider at the return passage, with clear route back to the first pillar.
 partition(-3.65,-23.05,.22,1.6,white,2.72);
 const greenPanel=box(office,green,.035,1.65,1.05,-3.78,1.15,-23.05);greenPanel.rotation.x=.45;
 for(const z of [-19.9,-21.1]){box(office,officeGray,.52,1.85,.68,-8.48,.925,z);box(office,deskWhite,.035,1.70,.56,-8.20,.96,z);box(office,black,.055,.13,.07,-8.16,1.02,z+.15);coll(-8.48,z,.60,.68)}
 // Return aisle behind the alcoves and office pillar; HACK THE LIMITS counter.
 partition(-5.7,-33.0,.14,3.8,white,2.73);
 desk(-6.3,-33.0,.72,3.4);
 for(const z of [-34,-33,-32])chair(-7.12,z,Math.PI/2,null);
 const scn=document.createElement('canvas');scn.width=1024;scn.height=160;const st=scn.getContext('2d');st.fillStyle='#181818';st.font='bold 94px Arial';st.textAlign='center';st.fillText('HACK THE LIMITS',512,110);const smap=new T.CanvasTexture(scn);smap.colorSpace=T.SRGBColorSpace;const slogan=mesh(office,new T.PlaneGeometry(3.2,.5),new T.MeshBasicMaterial({map:smap,transparent:true,depthWrite:false}),-5.79,1.85,-33);slogan.rotation.y=-Math.PI/2;
 for(const z of [-23.0,-30.0]){box(office,green,.28,2.72,.35,5.35,1.36,z);coll(5.35,z,.28,.35)}
 // Classroom entrance: partition with a passable opening, glass side panel and water cooler.
 partition(-1.95,-36.5,13.7,.16,white,2.73);
 partition(8.35,-36.5,1.05,.16,yellow,2.73);
 box(office,black,.07,2.4,.10,5.0,1.2,-36.5);box(office,black,.07,2.4,.10,7.78,1.2,-36.5);box(office,black,2.84,.07,.10,6.39,2.40,-36.5);
 box(office,glass,.04,2.30,1.10,7.73,1.15,-37.05);box(office,black,.06,.56,.06,7.68,1.10,-37.48);coll(7.73,-37.05,.08,1.10);
 dispenser(8.45,-35.9,Math.PI);
 // Classroom interior: timber desks face the whiteboard and large presentation screen.
 for(const z of [-38.5,-40.5]){for(const x of [-5.8,-1.8,2.2]){desk(x,z,2.35,.62,oak);for(const dx of [-.57,.57])chair(x+dx,z+.76,Math.PI,null)}}
 box(office,whiteBoard,3.8,1.18,.065,1.4,1.57,-43.20);
 box(office,black,1.9,1.08,.10,-3.9,1.65,-43.04);box(office,screen,1.78,.96,.035,-3.9,1.65,-42.97);
 for(const x of [-4.55,-3.25])box(office,black,.055,1.08,.08,x,.54,-43.02);
 desk(4.9,-42.05,1.5,.65,oak);
 label(office,'CLASSROOM',6.35,2.54,-36.4,1.35,.20,'#444746');
 // Ceiling trays, downlights and rectangular fixtures in the extended wing.
 for(const z of [-23,-26,-29,-32,-35,-38,-41]){
  for(const x of [-6.0,0,6.0])cylinder(office,warm,.12,.025,x,2.79,z);
  box(office,black,.30,.10,2.95,-5.1,2.67,z);
  box(office,warm,.10,.025,2.4,-5.1,2.60,z);
  if(z>-36){for(const dx of [-1.35,1.35])box(office,warm,.055,.045,1.55,dx,2.51,z);for(const dz of [-.775,.775])box(office,warm,2.7,.045,.055,0,2.51,z+dz)}
 }
 for(const z of [-24,-30,-35,-41]){const l=new T.PointLight(0xfff2e3,9,10,1.5);l.position.set(0,2.64,z);office.add(l)}

 // Additional details visible in the walkthrough: floor finishes, desktop accessories, ceiling services and the return corridor.
 const rubber=mat(0x363738,.98),paper=mat(0xe7e4dc,.92),magenta=mat(0xb52061,.7),silver=mat(0x9b9d9d,.42,.45);
 box(office,rubber,.65,.012,.72,5.75,.009,-10.15);
 // The library office has a black perimeter frame and low-profile gray carpet.
 for(const x of [3.0,8.60])box(office,black,.028,.016,8.10,x+officeShift,.017,-17.7);
 for(const z of [-13.65,-21.75])box(office,black,5.60,.016,.028,5.8+officeShift,.017,z);
 for(const z of [-16.25,-18.35,-20.45])for(let k=0;k<3;k++)box(office,paper,.25,.035,.28,8.10+officeShift,.59+k*.037,z+.48);
 // Laptop, notebooks, mouse pads and small magenta reserved desk signs.
 function laptop(x,z,angle){const q=new T.Group();q.position.set(x,.787,z);q.rotation.y=angle;office.add(q);box(q,silver,.32,.018,.23,0,.012,0);const lid=box(q,silver,.32,.20,.016,0,.105,-.105);lid.rotation.x=-.18;const scr=box(q,screen,.29,.17,.006,0,.105,-.094);scr.rotation.x=-.18;box(q,black,.27,.006,.13,0,.024,.018)}
 laptop(5.47+officeShift,-19.12,Math.PI/2);laptop(4.57+officeShift,-16.12,-Math.PI/2);
 for(const z of [-24.5,-27.4]){for(const x of [-1.4,1.25]){box(office,paper,.22,.012,.30,x,.79,z+.06);const tag=box(office,magenta,.22,.07,.05,x+.38,.825,z-.18);tag.rotation.x=.24}}
 for(const z of [-30.6,-33.35])for(const x of [-1.2,1.4]){box(office,paper,.21,.012,.29,x+.24,.79,z+.27);cylinder(office,deskWhite,.035,.08,x-.20,.82,z+.28)}
 // White drawer cabinet and plants beside the rear window; green window pier leads to classroom.
 box(office,deskWhite,.60,.67,.48,8.25,.335,-23.45);
 for(const y of [.19,.39,.59]){box(office,silver,.14,.025,.035,7.94,y,-23.45);box(office,officeGray,.012,.012,.44,7.94,y-.09,-23.45)}
 coll(8.25,-23.45,.60,.48);
 // Classroom approach: standalone teacher workstation and yellow doorway reveal.
 desk(7.3,-35.0,1.20,.65);chair(7.3,-34.15,Math.PI,workstation(7.3,-35.0,Math.PI));
 box(office,yellow,.12,2.68,1.05,8.86,1.34,-36.95);
 box(office,black,.035,2.34,.065,7.77,1.17,-37.05);
 // A narrow return passage has a coat rack, closed utility door and cable trays.
 for(const x of [-8.55,-7.92])box(office,black,.038,1.88,.038,x,.94,-22.1);
 box(office,black,.72,.038,.038,-8.24,1.88,-22.1);
 for(let k=0;k<3;k++){box(office,black,.025,.18,.06,-8.46+k*.22,1.73,-22.08)}
 coll(-8.24,-22.1,.72,.15);
 // X: redundant utility door removed.
 // F: short wall with built-in bag cabinet; C remains clear.
 const bagWallX=-8.05,bagWallZ=-10.85;
 box(office,white,1.86,2.72,.16,bagWallX,1.36,bagWallZ);coll(bagWallX,bagWallZ,1.86,.16);
 const cubby=new T.Group();cubby.position.set(bagWallX,0,bagWallZ+.32);office.add(cubby);
 const bagWood=mat(0xb58c63,.86),bagBack=mat(0x77736b,.92);
 box(cubby,bagBack,1.68,1.64,.055,0,.86,-.24);
 for(const x of [-.84,-.28,.28,.84])box(cubby,bagWood,.045,1.68,.47,x,.86,0);
 for(const y of [.025,.57,1.12,1.69])box(cubby,bagWood,1.72,.045,.49,0,y,0);
 const bagMats=[mat(0x343b44,.94),mat(0x63564a,.94),mat(0x354f57,.94),mat(0x7a353b,.94)];
 for(const [x,y,k] of [[-.56,.24,0],[.56,.24,1],[0,.79,2],[-.56,1.34,3]]){box(cubby,bagMats[k],.29,.39,.25,x,y+.08,.045);box(cubby,bagMats[k],.23,.13,.07,x,y-.02,.196);box(cubby,black,.11,.045,.045,x,y+.30,.045)}
 coll(bagWallX,bagWallZ+.32,1.72,.49);
 // Visible cable-tray supports and recessed ceiling spots; keep the walking floor unobstructed.
 for(const z of [-15,-18,-21,-24,-27,-30,-33,-35]){
  box(office,black,.48,.055,.07,-7.60,2.69,z);
  for(const x of [-7.80,-7.40])box(office,black,.02,.16,.02,x,2.77,z);
  cylinder(office,warm,.105,.021,4.1,2.79,z);
 }
 for(const z of [-16.9,-20.0,-26.0,-31.8]){box(office,black,.055,2.69,.055,-3.15,1.345,z);coll(-3.15,z,.055,.055)}
 // Extra classroom row, wall-mounted light strips, and teaching screen details.
 for(const x of [-5.8,-1.8,2.2]){box(office,warm,2.2,.035,.075,x,2.57,-42.85)}
 // Keep front row on classroom side of entrance partition instead of blocking the hallway.
 // The first two rows remain the usable classroom rows; no additional collision across the entrance.
 // Translate interaction and collision anchors by the same offset as the office geometry.
 for(const c of colliders.slice(officeColliderStart))c.z+=office.position.z;
 for(const seat of seats.slice(officeSeatStart)){seat.z+=office.position.z;for(const pt of seat.approaches)pt.z+=office.position.z}

 // Second floor: reference-based workspace, with an open route from the stair landing.
 const upper=new T.Group();upper.position.y=2.96;g.add(upper);
 const upperColliders=[],upperSeats=[];const uc=(x,z,w,d)=>upperColliders.push({x,z,w,d});
 const upperWood=mat(0xb58251,.72),upperDark=mat(0x343638,.84),upperWhite=mat(0xe4e1db,.8);
 surface(upper,'tile',17.8,7.1,0,.014,-12.2);
 // Remove the visual barrier at the stair arrival by replacing the front rail segment separately.
 function upperDesk(x,z,w,d,wooden){
  const top=wooden?upperWood:upperWhite,legs=wooden?upperWood:black;
  box(upper,top,w,.065,d,x,.76,z);
  for(const dx of [-w/2+.10,w/2-.10])for(const dz of [-d/2+.10,d/2-.10])box(upper,legs,.065,.73,.065,x+dx,.365,z+dz);
  uc(x,z,w,d);
 }
 function upperChair(x,z,face,wooden,computer=null){
  const c=new T.Group();c.position.set(x,0,z);c.rotation.y=face+Math.PI;upper.add(c);
  box(c,chairFabric,.46,.10,.46,0,.47,0);box(c,chairFabric,.44,.42,.07,0,.73,.20);
  if(wooden){for(const dx of [-.18,.18])for(const dz of [-.18,.18])box(c,upperWood,.055,.43,.055,dx,.22,dz);for(const dx of [-.25,.25])box(c,upperWood,.045,.045,.38,dx,.67,0);}
  else{cylinder(c,black,.055,.43,0,.23,0);for(let k=0;k<5;k++){let a=box(c,black,.045,.045,.25,Math.sin(k*1.257)*.11,.07,Math.cos(k*1.257)*.11);a.rotation.y=k*1.257}}
  uc(x,z,.49,.50);const dx=Math.sin(face),dz=Math.cos(face);upperSeats.push({kind:wooden?'library chair':'chair',x,z,height:.52,yaw:face,computer,approaches:[{x:x+dz*.65,z:z-dx*.65},{x:x-dz*.65,z:z+dx*.65},{x:x-dx*.65,z:z-dz*.65}]});
 }
 function upperPC(x,z,face){
  const p=new T.Group();p.position.set(x,.80,z);p.rotation.y=face;upper.add(p);
  const display=screen.clone();box(p,display,.53,.32,.045,0,.28,0);box(p,black,.05,.16,.06,0,.10,0);box(p,black,.26,.025,.16,0,.012,0);box(p,black,.32,.018,.11,0,.012,.25);return {display,on:false};
 }
 function glassPartition(x,z,length){
  box(upper,glass,.045,2.3,length,x,1.15,z);box(upper,frosted,.061,.48,length,x,1.22,z);
  for(const zz of [z-length/2,z+length/2])box(upper,black,.065,2.4,.065,x,1.2,zz);
  box(upper,black,.065,.065,length,x,2.35,z);box(upper,black,.065,.065,length,x,.035,z);uc(x,z,.08,length);
 }
 // Upstairs arrival is at x=-5.45, facing negative Z. Left: meeting rooms; straight ahead: PC office; right: library.
 // Keep the landing and transverse aisle open, and reserve a continuous corridor at x=-5.45.
 glassPartition(-6.65,-12.75,3.7);
 glassPartition(-6.65,-15.25,.65);
 // Meeting room furniture behind the glass, accessible through the gap in the partition.
 upperDesk(-7.72,-12.95,1.15,2.3,false);
 for(const z of [-12.3,-13.6]){upperChair(-8.48,z,Math.PI/2,false);upperChair(-6.96,z,-Math.PI/2,false);}
 // Computer office directly ahead and to the left of the central cross-aisle.
 for(const z of [-12.15,-14.65]){
  upperDesk(-3.0,z,2.65,1.10,false);
  box(upper,upperDark,2.60,.37,.055,-3.0,1.0,z);
  for(const x of [-3.68,-2.32]){const front=upperPC(x,z+.13,0),back=upperPC(x,z-.13,Math.PI);upperChair(x,z+.91,Math.PI,false,front);upperChair(x,z-.91,0,false,back);}
 }
 // Right: warm yellow-oak reading tables, timber chairs and open bookcase.
 const libraryYellow=mat(0xc99b51,.8);
 for(const z of [-10.65,-13.25]){
  upperDesk(4.8,z,2.65,1.15,true);
  for(const x of [4.05,5.55]){upperChair(x,z+.94,Math.PI,true);upperChair(x,z-.94,0,true);}
  box(upper,upperWhite,.24,.014,.31,4.08,.802,z+.18);
 }
 for(let i=0;i<4;i++)box(upper,libraryYellow,3.05,.075,.40,5.6,.12+i*.64,-15.35);
 for(let i=0;i<4;i++)box(upper,libraryYellow,.065,2.12,.40,4.12+i*.985,1.06,-15.35);
 for(let k=0;k<30;k++)box(upper,mat([0xb56b4e,0x536e86,0xc4b99d,0x78816d][k%4]),.105,.19+(k%3)*.04,.22,4.24+(k%10)*.135,.28+Math.floor(k/10)*.64,-15.35);
 uc(5.6,-15.35,3.05,.40);
 // Ceiling beams, exposed cable trays, strip and rectangular pendant fixtures.
 for(const z of [-10.15,-12.45,-14.75]){
  box(upper,white,17.7,.18,.24,0,2.49,z);
  for(const x of [-5.7,3.35,7.6]){box(upper,black,.11,.09,1.65,x,2.23,z);box(upper,warm,.075,.035,1.59,x,2.165,z);}
  for(const dx of [-1.05,1.05])box(upper,warm,.045,.045,1.15,-3.0+dx,2.18,z);
  for(const dz of [-.575,.575])box(upper,warm,2.1,.045,.045,-3.0,2.18,z+dz);
 }
 box(upper,black,.30,.12,6.8,-5.7,2.37,-12.15);
 for(const x of [-4.5,4.5]){const l=new T.PointLight(0xfff1df,10,9,1.6);l.position.set(x,2.1,-12.3);upper.add(l);}
 for(const [x,z] of [[-8.1,-15.1],[8.2,-14.7]]){cylinder(upper,black,.22,.38,x,.19,z);for(let i=0;i<9;i++){const a=mesh(upper,new T.SphereGeometry(1,7,5),greenLeaves,x+(rng()-.5)*.35,.55+rng()*.45,z+(rng()-.5)*.35);a.scale.set(.07,.26,.04);a.rotation.z=(rng()-.5)*1.5;}uc(x,z,.46,.46);}
 let hallLight=new T.PointLight(0xffecd2,14,19,1.3);hallLight.position.set(0,4.4,-6.2);g.add(hallLight);
 let corridorLight=new T.PointLight(0xffe2b6,8,13,1.4);corridorLight.position.set(ACADEMY_DOOR_X,3.7,4);g.add(corridorLight);
 // Local electrical circuits: physical switches on wall/column and independently dimmed light sources.
 const circuits=[
 {id:'plaza',name:'Reception',x:5.32+ENTRANCE_OFFSET,z:14.4,y:1.16,face:-Math.PI/2,test:o=>o.position.z>10&&o.position.z<=18},
 {id:'entrance',name:'Entrance',x:5.332+ENTRANCE_OFFSET,z:6.6,y:1.16,face:-Math.PI/2,test:o=>o.position.z>0&&o.position.z<=10},
 {id:'lounge',name:'Lounge',x:-6.195,z:-1.60,y:1.16,face:Math.PI/2,test:o=>o.position.z<=0&&o.position.z >=-15.8},
 {id:'workspace',name:'Workspace',x:-8.99,z:-17.4,y:1.16,face:Math.PI/2,test:o=>o.position.z<-15.8}
 ];
 const v=new T.Vector3();g.updateMatrixWorld(true);for(const c of circuits){c.on=true;c.lights=[];c.fixtures=[];g.traverse(o=>{if(o.isLight&&c.test({position:o.getWorldPosition(v)}))c.lights.push({light:o,intensity:o.intensity});if(o.isMesh&&[warm,wallLamp].includes(o.material)&&c.test({position:o.getWorldPosition(v)})){o.material=o.material.clone();c.fixtures.push({material:o.material,color:o.material.color.clone()})}});
  let sw=new T.Group();sw.position.set(c.x,c.y,c.z);sw.rotation.y=c.face;g.add(sw);box(sw,white,.135,.19,.035,0,0,0);c.rocker=box(sw,black,.075,.11,.038,0,0,.025);c.indicator=box(sw,new T.MeshBasicMaterial({color:0x77e6b2}),.023,.015,.009,0,.062,.049);c.handle=sw;c.approachX=c.x+(c.face>0?.40:-.40);
 }
 return {upperColliders,upperSeats,level:0,door,plazaDoor,plazaOpen:false,plazaAngle:0,colliders,seats,circuits,open:false,angle:0};
}
export function doorNearby(state,x,z){return Math.abs(x-ACADEMY_DOOR_X)<1.6&&Math.abs(z)<1.7}
export function advanceDoor(state,dt){state.angle=T.MathUtils.damp(state.angle,state.open?Math.PI*.53:0,7,dt);state.door.rotation.y=-state.angle;state.plazaAngle=T.MathUtils.damp(state.plazaAngle,state.plazaOpen?Math.PI*.53:0,7,dt);state.plazaDoor.rotation.y=-state.plazaAngle}
export function academyWalkable(state,x,z,r=.27){
 const stair=Math.abs(x+5.45)<.775-r&&z>=-8.65&&z<=-1.95;
 if(state.level===1){if(stair||Math.abs(x+5.45)<.775-r&&z>=-8.98&&z< -8.65)return true;if(z> -8.65+r||z< -15.8+r||Math.abs(x)>8.86-r)return false;return !state.upperColliders.some(c=>Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r)}
 if(stair)return true;
 if(Math.abs(x+5.45)<.775+r&&z>=-8.65&&z<=-1.99)return false;
 if(z>34.65-r||z< -45.45+r)return false;
 const ex=x-ENTRANCE_OFFSET,ax=Math.abs(ex),inside=(l,h,f,n)=>ex>=l+r&&ex<=h-r&&z>=f+r&&z<=n-r;
 if(z>23.24){if(ax>10.7-r)return false}
 else if(z>18.24){if(ax>2.8-r)return false}
 else if(z>=17.76){if(ax>1.20-r)return false}
 else if(z>10.24){if(ex< -14.40+r||ex>5.35-r)return false}
 else if(z>.29){const main=inside(3.35,5.35,-.1,10.7),right=inside(4.35,10.25,2.85,5.15),left=inside(-1.85,4.35,3.05,5.15);if(!main&&!right&&!left)return false;} else if(z<-.29&&(x< -8.97+r||x>(z> -15.8?10.97:8.97)-r))return false;
 if(Math.abs(z-23)<.24+r&&(ex<r||ex>1-r||state.plazaAngle<1.2))return false;
 if(Math.abs(z-18)<.24+r&&ax>1.20-r)return false;
 if(Math.abs(z)<.29+r&&(x<ACADEMY_DOOR_X-.60+r||x>ACADEMY_DOOR_X+.60-r||state.angle<1.2))return false;
 return !state.colliders.some(c=>c.r!==undefined?Math.hypot(x-c.x,z-c.z)<c.r+r:Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r);
}

// Choose reachable seat approaches only; never walk through a different obstacle to reach one.
export function nearestAcademySeat(state,x,z,maxDistance=1.55){let best=null;for(const seat of (state.level===1?state.upperSeats:state.seats)||[]){for(const a of seat.approaches){let distance=Math.hypot(x-a.x,z-a.z);if(distance>maxDistance||best&&distance>=best.distance||!academyWalkable(state,a.x,a.z))continue;let clear=true;for(let i=1;i<=12;i++){let t=i/12;if(!academyWalkable(state,x+(a.x-x)*t,z+(a.z-z)*t)){clear=false;break}}if(clear)best={seat,approach:a,distance}}}return best}

export function nearbyLightSwitch(state,x,z,max=1.30){if(state.level===1)return null;let found=null,d=max;for(const c of state.circuits||[]){const n=Math.hypot(x-c.approachX,z-c.z);if(n<d&&academyWalkable(state,c.approachX,c.z)){let clear=true;for(let k=1;k<=10;k++){const t=k/10;if(!academyWalkable(state,x+(c.approachX-x)*t,z+(c.z-z)*t)){clear=false;break}}if(clear){d=n;found=c}}}return found}
export function setLightCircuit(c,on){c.on=!!on;for(const a of c.lights)a.light.intensity=a.intensity*(c.on?1:0);for(const a of c.fixtures)a.material.color.copy(a.color).multiplyScalar(c.on?1:.035);c.rocker.rotation.x=c.on?-.15:.15;c.indicator.material.color.setHex(c.on?0x77e6b2:0x682e27)}

export function academyGround(x,z,level=0){if(Math.abs(x+5.45)<.80&&z>=-8.65&&z<=-1.99)return z<-8.29?2.96:Math.min(2.85,Math.max(0,(Math.floor((-1.99-z)/.42)+1)*.19));if(level===1)return 2.96;if(z>=22.28)return -1.8;if(z<=18.68)return 0;return -1.8+.18*Math.min(10,Math.max(1,Math.floor((22.28-z)/.36)+1))}
export function plazaDoorNearby(state,x,z){return Math.abs(x-(.5+ENTRANCE_OFFSET))<1.65&&Math.abs(z-23)<1.65}
