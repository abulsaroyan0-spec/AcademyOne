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

const approvedLayout=(function(){
 const items=[],solids=[],areas=[],names=[];
 const room=(x0,x1,z0,z1,title,kind='tile')=>{areas.push({x0,x1,z0,z1,title});items.push({type:'floor',x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0,kind});names.push({title,x:(x0+x1)/2,z:(z0+z1)/2})};
 const box=(x,y,z,w,h,d,c,block=false,extra={})=>{items.push({type:'box',x,y,z,w,h,d,c,...extra});if(block)solids.push({x,z,w,d})};
 const wall=(x0,z0,x1,z1,h=2.9,c='ivory')=>{if(x0!==x1&&z0!==z1)throw Error('nonorthogonal wall');box((x0+x1)/2,h/2,(z0+z1)/2,Math.abs(x1-x0)||.16,h,Math.abs(z1-z0)||.16,c,true)};
 const ceiling=(x,z,w,d,h=2.9)=>box(x,h+.08,z,w,.16,d,'ivory',false,{ceiling:true});
 const sign=(t,x,y,z,w,h,rot=0,c='pink')=>items.push({type:'sign',t,x,y,z,w,h,rot,c});
 const light=(x,z,y=2.72,kind='spot')=>items.push({type:'light',x,y,z,kind});
 const glass=(x0,z0,x1,z1,h=2.65)=>{const along=x0===x1;box((x0+x1)/2,h/2,(z0+z1)/2,along?.045:Math.abs(x1-x0),h,along?Math.abs(z1-z0):.045,'glass',true);box((x0+x1)/2,1.25,(z0+z1)/2,along?.055:Math.abs(x1-x0),.72,along?Math.abs(z1-z0):.055,'frost');const len=Math.hypot(x1-x0,z1-z0),n=Math.ceil(len/1.4);for(let i=0;i<=n;i++)box(x0+(x1-x0)*i/n,h/2,z0+(z1-z0)*i/n,.045,h,.045,'black')};
 const door=(x,z,rot=0,t='',color='ivory')=>{items.push({type:'door',x,z,rot,t,color})};
 const desk=(x,z,w,d,col='white',rot=0)=>{items.push({type:'desk',x,z,w,d,col,rot});solids.push({x,z,w:rot?w===d?w:d:w,d:rot?w:d})};
 const chair=(x,z,rot=0)=>{items.push({type:'chair',x,z,rot});solids.push({x,z,w:.54,d:.54})};
 const pc=(x,z,rot=0)=>items.push({type:'pc',x,z,rot});
 const shelf=(x,z,w,d,rot=0,metal=false)=>{items.push({type:'shelf',x,z,w,d,rot,metal});solids.push({x,z,w:rot?d:w,d:rot?w:d})};
 const plant=(x,z)=>{items.push({type:'plant',x,z});solids.push({x,z,w:.45,d:.45})};
 const win=(x,z,w,rot=0)=>items.push({type:'window',x,z,w,rot});
 const deskPair=(x,z,w,d,col='white',count=2)=>{desk(x,z,w,d,col);for(let i=0;i<count;i++)chair(x+(i-(count-1)/2)*.75,z+.85,Math.PI)};

 // USER CORRECTED PNG: trace the walls and furniture in normalized 973 x 990 image coordinates.
 // 21.2 px per estimated metre, entrance door is origin. Floor labels displaced in editor
 // are not physical rooms; actual classroom floors follow their enclosing walls.
 const scale=21.2,X=p=>(p-704)/scale,Z=p=>(p-790)/scale,M=p=>p/scale;
 const R=(l,t,r,b,name,kind='tile',h=2.9)=>{room(X(l),X(r),Z(t),Z(b),name,kind);ceiling(X((l+r)/2),Z((t+b)/2),M(r-l),M(b-t),h)};
 const W=(l,t,r,b,h=2.9,c='ivory')=>wall(X(l),Z(t),X(r),Z(b),h,c);
 const G=(l,t,r,b)=>glass(X(l),Z(t),X(r),Z(b));
 const B=(l,t,r,b,y,h,c,block=false,extra={})=>box(X((l+r)/2),y,Z((t+b)/2),M(r-l),h,M(b-t),c,block,extra);
 const D=(l,t,r,b,c='white')=>desk(X((l+r)/2),Z((t+b)/2),M(r-l),M(b-t),c);
 const C=(x,z,a=0)=>chair(X(x),Z(z),a);
 const P=(x,z,a=0)=>pc(X(x),Z(z),a);
 const S=(txt,x,y,z,w,h,rot=0,c='pink')=>sign(txt,X(x),y,Z(z),w,h,rot,c);
 const CP=(n,x,z)=>[n,X(x),Z(z)];
 // Entrance and double-height lounge: kept at exact drawn outline and furniture centers.
 R(682,790,726,956,'Entrance corridor','dark',3.4);W(682,790,682,956,3.4,'concrete');W(726,790,726,956,3.4,'concrete');W(682,956,726,956,3.4,'concrete');
 for(let z=815;z<950;z+=25){for(let x of [684,724]){B(x-1,z-2,x+1,z+2,.06,.07,'warm');light(X(x),Z(z),.3,'wall')}}
 R(574,558,833,790,'Main lounge','tile',5.6);W(574,558,574,574.7,5.6);W(574,603.3,574,790,5.6);B(572.3,574.7,575.7,603.3,2.68,.56,'ivory');W(833,558,833,790,5.6,'charcoal');W(574,790,690,790,5.6);W(718,790,833,790,5.6);door(X(704),Z(790),0,'Picsart Academy','glass');
 // Wider lower landing, original upper connection retained.
 const stairFront=749,stairEnd=615,stairLeft=577,stairRight=623,step=(stairFront-stairEnd)/16;
 B(576,749,648,788,.008,.016,'charcoal');
 for(let i=0;i<16;i++){let z=stairFront-(i+.5)*step;B(stairLeft,z-step/2,stairRight,z+step/2,(i+1)*2.96/16-.08,.16,'black')}
 items.push({type:'stairrail',x:X(stairRight+1),z:Z(stairFront),run:M(stairFront-stairEnd)});
 solids.push({x:X((stairLeft+stairRight)/2),z:Z((stairFront+stairEnd)/2),w:M(stairRight-stairLeft),d:M(stairFront-stairEnd)});
 // Vintage technology and Ada behind stairs, visible in original video, not represented separately in plan.
 // G: restore open vintage computer display beneath the stairs, away from Ada's door.
 items.push({type:'vintage',x:X(598),z:Z(652),rot:Math.PI/2});solids.push({x:X(598),z:Z(652),w:.84,d:2.10});
 B(615,625,618,628,1.38,2.76,'black',true);
 door(X(575),Z(589),Math.PI/2,'Ada Lovelace');
 items.push({type:'directory',x:X(576.6),y:1.62,z:Z(768)});
 for(const [p,h] of [[746,1.85],[715,2.58],[684,3.25],[653,3.95],[622,4.60]])items.push({type:'stairSconce',x:X(577.5),y:h,z:Z(p)});
 // S-shaped sofa exactly follows the corrected picture.
 const points=[[700,615],[712,627],[715,642],[710,657],[702,678],[695,699],[694,719],[698,734],[708,747]].map(([x,z])=>[X(x),Z(z)]);
 items.push({type:'sofa',points});
 // A: solid end wall of study strip. B: fourth study table and two timber benches.
 W(772,558,833,558,2.9,'ivory');
 B(772,565,826,779,.0425,.085,'charcoal');B(772,565,773,779,.085,.025,'warm');
 for(let z of [591,643,695,747]){
  B(791,z-21,808,z+21,.84,.075,'charcoal',true);
  for(let x of [792,807])for(let zz of [-18,18])B(x-.45,z+zz-.45,x+.45,z+zz+.45,.425,.79,'black');
  B(778,z-21,779,z+21,.35,.49,'wood');
  for(let x of [783,818]){B(x-4.2,z-20.6,x+4.2,z+20.6,.51,.065,'wood',true,{studyBench:true,face:x<799?Math.PI/2:-Math.PI/2});for(let zz of [-17,17]){B(x-.5,z+zz-.5,x+.5,z+zz+.5,.28,.47,'black');B(x-3.3,z+zz-.5,x+3.3,z+zz+.5,.10,.045,'black')}}
 }
 // C: water dispenser. D: wayfinding column with recycling unit.
 const water=(x,z,rot=0)=>{items.push({type:'water',x:X(x),z:Z(z),rot});solids.push({x:X(x),z:Z(z),w:.49,d:.45})};
 water(760,570,0);
 B(652,553,668,569,1.48,2.96,'ivory',true);
 S('← ADA LOVELACE|TECH SUPPORT →',660,2.38,570,1.65,.38);
 B(652,570,668,577,.41,.82,'white',true);for(let x of [656,664])B(x-2,571,x+2,575,.825,.015,'black');
 B(831,565,833,779,2.04,1.48,'charcoal');
 S('Picsart Academy',830,2.04,672,M(210),1.22,-Math.PI/2,'charcoal');B(830,565,831,779,1.29,.025,'warm');
 for(let z of [595,645,695,745])light(X(704),Z(z),5.1,'rect');
 // Main workspace + extended left wing, traced from visible outline. No detached floor labels.
 R(492,203,937,558,'Workspace / offices');R(44,218,215,458,'White classroom');R(215,214,382,458,'Wood classroom');R(44,458,492,558,'Left corridor');R(382,203,492,458,'Workspace connection');R(215,448,382,458,'Glass classroom edge');
 // Exterior walls (windows on rear line); front left wall from x34 to x574.
 W(44,218,44,558);W(44,218,215,218);W(215,214,382,214);W(382,214,382,203);W(382,203,937,203);
 W(937,203,937,472.7);W(937,501.3,937,558);B(935.3,472.7,938.7,501.3,2.64,.52,'ivory');W(833,558,937,558);W(34,558,574,558);
 // White classroom opens into lower corridor at marked green doorway.
 W(44,458,170,458);W(199,458,215,458);door(X(184.5),Z(458),0,'White classroom','glass');
 W(215,214,215,458);W(382,245,382,458);door(X(382),Z(229.5),Math.PI/2,'Wood classroom','glass');G(215,458,382,458);
 // Blinds and classroom desks exactly at the pictured positions, with chairs facing the tables.
 for(let x of [78,132,186])win(X(x),Z(219),M(50));
 for(let x of [242,298,354])win(X(x),Z(215),M(49));
 for(let x of [435,492,555,618,681,744,807,870,915])win(X(x),Z(204),M(56));
 for(let z of [323,357,391,425])for(let x of [91,171]){D(x-23,z-7,x+23,z+7);for(let dx of [-11,11])C(x+dx,z-17,0)}
 for(let z of [267,299,333])for(let x of [261,341]){D(x-24,z-7,x+24,z+7,'wood');for(let dx of [-11,11])C(x+dx,z-17,0)}
 B(45,249,48,310,1.6,1.1,'white');B(217,224,220,281,1.6,1.1,'white');
 // Bottom corridor desk and green seating alcoves in a horizontal row as drawn.
 D(247,533,415,548);for(let x of [266,301,337,374,402])C(x,515,0);
 S('HACK THE LIMITS',331,1.8,556,M(165),.42,Math.PI,'ivory');
 // L: individual upholstered alcoves and full-height gray dividers.
 for(let x of [457,506,555]){B(x-22,527,x+22,549,.25,.50,'olive',true);B(x-22,544,x+22,549,.76,.55,'olive');B(x-22,548,x+22,552,1.36,2.72,'ivory',true);B(x-22,527,x+22,549,2.71,.12,'charcoal');B(x-22,549,x+22,552,1.61,1.15,'acoustic')}
 for(let x of [432,481.5,530.5,580])B(x-1.2,526,x+1.2,552,1.36,2.72,'acoustic',true);
 B(480,550,558,555,.54,1.08,'white',true);
 // Central tables: two wide horizontal and two vertical white communal sets.
 // K: two independent tables, exactly 2 m between tabletop edges, no embedded chairs.
 for(let z of [353,425.4]){D(438,z-15,529,z+15);for(let x of [451,483.5,516]){C(x,z-29,0);C(x,z+29,Math.PI)}}
 // I and J: water station and single workstation at the window, left of long desk.
 water(400,225,0);D(433,213,481,229);C(457,244,Math.PI);P(457,219,Math.PI);
 for(let x of [569,604]){D(x-9,353,x+9,438);for(let dx of [-13,13])B(x+dx-2,349,x+dx+2,442,.47,.085,'white',true)}
 // Rear independent workstations and four seats at the long desk.
 D(514,211,686,227);for(let x of [548,595,631,667]){C(x,245,Math.PI);P(x,220,Math.PI)}
 D(876,223,915,235);C(896,255,Math.PI);P(896,228,Math.PI);
 // P: director's workstation, independent desk with monitor and plants.
 D(760,212,820,231);C(790,249,Math.PI);P(790,220,Math.PI);plant(X(749),Z(218));plant(X(831),Z(220));
 // Office 1 / Office 2: carpet and counter follow the actual corrected shapes, even though
 // carpet rectangles are slightly offset relative to the desks in the source.
 B(725,335,809,516,.012,.024,'charcoal');B(809,335,927,516,.012,.024,'charcoal');
 W(646,312,646,478);G(736,312,736,478);
 B(641,477,828,490,.55,1.10,'charcoal',true);B(641,477,828,490,1.14,.075,'wood');
 for(let x=650;x<828;x+=18){B(x-1,485,x+1,490,.55,1.10,'wood');B(x,490,x+12,495,.38+(Math.round(x/18)%3)*.18,.045,'wood')}
 B(797,478,807,486,1.37,.40,'old');B(798,486,806,487,1.38,.24,'black');
 for(let x of [692,781]){D(x-13,327,x+13,444);B(x-1,329,x+1,442,.95,.32,'charcoal');for(let z of [341,372,402,429])for(let side of [-1,1]){C(x+side*23,z,-side*Math.PI/2);P(x+side*7,z,-side*Math.PI/2)}}
 // Right-hand library along the drawn outer edge, separate desk remains at rear.
 W(933,307,933,463);for(let z of [325,363,401,443])shelf(X(927),Z(z),M(36),M(11),Math.PI/2,z===443);
 // R/S: labeled closed doors to non-modelled service rooms; H: full height clothing cupboards.
 door(X(935),Z(487),-Math.PI/2,'Kitchen');door(X(935),Z(533),-Math.PI/2,'Staff only');
 for(let x of [851,873,895,917]){items.push({type:'locker',x:X(x),z:Z(550),rot:Math.PI});solids.push({x:X(x),z:Z(550),w:1.0,d:.55})}
 for(let x of [95,165,265,335,421,515,610,700,800,895])for(let z of [265,365,525]){if((x<215&&z===525)||(x>=215&&x<382&&z===525)||x>=382||z!==525)light(X(x),Z(z))}
 // User plan coordinates are the layout authority; use reachable standing positions rather than old checkpoints.
 return {items,solids,areas,names,checkpoints:[CP('Entrance',704,890),CP('Lobby',650,740),CP('Ada',635,589),CP('Workspace',630,510),CP('Left corridor',230,495),CP('White classroom',128,440),CP('Wood classroom',300,235),CP('Window aisle',720,270),CP('Office 1',712,460),CP('Office 2',850,460)]};

})();

export const STAIR_X=ACADEMY_DOOR_X+(596-704)/21.2,STAIR_TOP=(615-790)/21.2,STAIR_BOTTOM=(749-790)/21.2;
const STAIR_LEFT=STAIR_X-19/21.2,STAIR_RIGHT=STAIR_X+27/21.2;
function stairRightAt(z){return STAIR_X+1.0+(STAIR_RIGHT-STAIR_X-1.0)*Math.max(0,Math.min(1,(z-STAIR_TOP)/1.0))}
export function onAcademyStairs(x,z,r=0){return z>=STAIR_TOP-.40&&z<=STAIR_BOTTOM+.45&&x>=STAIR_LEFT+r&&x<=stairRightAt(z)-r}
export function academyStairLevel(x,z,level){if(!onAcademyStairs(x,z,.12))return level;if(z<=STAIR_TOP+.12)return 1;if(z>=STAIR_BOTTOM-.08)return 0;return level}

// Static scene batching: preserve transforms and materials; never batch moving doors,
// interactive displays, transparent glass or independently switchable fixtures.
function batchGround(root,materials,doors,extraMaterials){
 const allowed=new Set([...Object.values(materials),...extraMaterials].filter(m=>!m.transparent&&!m.isMeshBasicMaterial));
 const dynamic=new Set(doors.map(d=>d.leaf));const buckets=new Map(),origin=new T.Matrix4(),m=new T.Matrix4(),scale=new T.Matrix4(),pt=new T.Vector3();
 const shared={box:new T.BoxGeometry(1,1,1),cylinder:new T.CylinderGeometry(1,1,1,12),sphere:new T.SphereGeometry(1,6,4)};
 root.updateWorldMatrix(true,true);origin.copy(root.matrixWorld).invert();
 root.traverse(o=>{
  if(!o.isMesh||!allowed.has(o.material))return;
  for(let p=o.parent;p&&p!==root;p=p.parent)if(dynamic.has(p))return;
  const p=o.geometry.parameters;let shape,sz;
  if(o.geometry.type==='BoxGeometry'&&p.widthSegments===1&&p.heightSegments===1&&p.depthSegments===1){shape='box';sz=[p.width,p.height,p.depth]}
  else if(o.geometry.type==='CylinderGeometry'&&p.radiusTop===p.radiusBottom&&p.radialSegments===12&&p.heightSegments===1&&!p.openEnded){shape='cylinder';sz=[p.radiusTop,p.height,p.radiusBottom]}
  else if(o.geometry.type==='SphereGeometry'&&p.widthSegments===6&&p.heightSegments===4){shape='sphere';sz=[p.radius,p.radius,p.radius]}
  else return;
  m.multiplyMatrices(origin,o.matrixWorld);pt.setFromMatrixPosition(m);
  const key=shape+'|'+o.material.uuid+'|'+Math.floor(pt.x/7)+'|'+Math.floor(pt.z/7);
  if(!buckets.has(key))buckets.set(key,{shape,mat:o.material,objects:[],matrices:[]});
  let b=buckets.get(key);scale.makeScale(...sz);b.objects.push(o);b.matrices.push(m.clone().multiply(scale));
 });
 let before=0,after=0;const used=new Set();
 for(const b of buckets.values()){
  if(b.objects.length<2)continue;
  const mesh=new T.InstancedMesh(shared[b.shape],b.mat,b.objects.length);mesh.name='Static batch: '+b.shape;mesh.instanceMatrix.setUsage(T.StaticDrawUsage);
  b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();root.add(mesh);used.add(b.shape);
  for(const o of b.objects){o.removeFromParent();o.geometry.dispose()}before+=b.objects.length;after++;
 }
 for(const [k,g] of Object.entries(shared))if(!used.has(k))g.dispose();
 const empty=[];root.traverse(o=>{if(o.isGroup&&o!==root&&!o.children.length)empty.push(o)});empty.forEach(o=>o.removeFromParent());
 return {before,after};
}
// Fixed light budget prevents dozens of lights from expanding every PBR shader.
// The original lights retain their intensity and circuit membership; the small pool
// follows the player using nearby sources, without changing the shader's light count.
function createLightBudget(root,scene){
 root.updateWorldMatrix(true,true);
 const sources={point:[],spot:[]};root.traverse(o=>{
  if(!o.isPointLight&&!o.isSpotLight)return;
  const source={light:o,pos:o.getWorldPosition(new T.Vector3()),target:o.isSpotLight?o.target.getWorldPosition(new T.Vector3()):null};
  sources[o.isSpotLight?'spot':'point'].push(source);o.visible=false;
 });
 const points=Array.from({length:5},()=>{const l=new T.PointLight(0xffffff,0,9,2);scene.add(l);return l});
 const spots=Array.from({length:2},()=>{const l=new T.SpotLight(0xffffff,0,6,Math.PI/3,.8,1.6);scene.add(l,l.target);return l});
 function update(x,y,z){
  const score=s=>{const d=Math.hypot(s.pos.x-x,s.pos.y-y,s.pos.z-z);return s.light.intensity>0?d/Math.max(4,s.light.distance||12):Infinity};
  for(const [list,pool] of [[sources.point,points],[sources.spot,spots]]){
   const selected=list.filter(s=>s.light.intensity>0).map(s=>({s,score:score(s)})).sort((a,b)=>a.score-b.score).slice(0,pool.length);
   pool.forEach((l,i)=>{const a=selected[i]?.s;if(!a){l.intensity=0;return}l.position.copy(a.pos);l.color.copy(a.light.color);l.intensity=a.light.intensity;l.distance=a.light.distance;l.decay=a.light.decay;if(l.isSpotLight){l.target.position.copy(a.target);l.angle=a.light.angle;l.penumbra=a.light.penumbra}});
  }
 }
 update(ACADEMY_DOOR_X,0,0);return {update,sourceCount:sources.point.length+sources.spot.length,activeCount:points.length+spots.length};
}
function buildApprovedGround(parent,colliders,seats){
 const scene=new T.Group();scene.position.x=ACADEMY_DOOR_X;parent.add(scene);const data=approvedLayout;
 const palette={ivory:0xe0dcd2,white:0xf3f3ed,black:0x252528,charcoal:0x414143,acoustic:0xb2ada5,concrete:0x77716b,wood:0xb77d47,olive:0x666e48,green:0x6eb954,blue:0x4286b1,yellow:0xd5b52a,old:0xc8c3af,marble:0xc4c1b7,warm:0xffebc6,pink:0xad2059,glass:0x98b6b8,frost:0xb7d0cd};
const materials={};for(const [k,c] of Object.entries(palette))materials[k]=k==='warm'?new T.MeshBasicMaterial({color:c}):new T.MeshStandardMaterial({color:c,roughness:k==='wood'?.68:.84,transparent:k==='glass'||k==='frost',opacity:k==='glass'?.24:k==='frost'?.66:1,depthWrite:k!=='glass'&&k!=='frost'});
function cube(x,y,z,w,h,d,c,parent=scene){const o=new T.Mesh(new T.BoxGeometry(w,h,d),typeof c==='string'?materials[c]:c);o.position.set(x,y,z);parent.add(o);return o}
function group(x,z,rot=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);return g}
const roof=[],doors=[],computers=[],staticDoorLeaves=[];const bookMaterials=[0x8b7a6a,0x7d8e9e,0xa89b7b,0x526d65,0x9b6058].map(c=>new T.MeshStandardMaterial({color:c}));const windowMaterial=new T.MeshStandardMaterial({color:0x84a5bf,roughness:.28,emissive:0x36516c,emissiveIntensity:.25}),blindMaterial=new T.MeshStandardMaterial({color:0x777a7d,roughness:1});let rng=123;const rand=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
function tile(kind){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=kind==='dark'?'#353230':'#c9c4bb';ctx.fillRect(0,0,256,256);for(let i=0;i<3500;i++){ctx.fillStyle=rand()>.5?'#ffffff09':'#0000000a';ctx.fillRect(rand()*256,rand()*256,rand()*16+1,1)}ctx.strokeStyle=kind==='dark'?'#8b8172':'#aaa69f';ctx.lineWidth=1.5;ctx.strokeRect(1,1,254,254);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t}
function plaque(t,w,h,c){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;let ctx=canvas.getContext('2d');ctx.fillStyle='#'+palette[c].toString(16).padStart(6,'0');ctx.fillRect(0,0,1024,256);if(t==='Picsart Academy'){ctx.shadowColor='#efffff';ctx.shadowBlur=18;}ctx.fillStyle=c==='ivory'?'#292929':'white';ctx.font='bold '+(t.includes('|')?62:100)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';const lines=t.split('|');lines.forEach((l,i)=>ctx.fillText(l,512,128+(i-(lines.length-1)/2)*86,980));const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,side:T.DoubleSide,toneMapped:t!=='Picsart Academy'}))}
function cylinder(x,y,z,r,h,c,g=scene){let o=new T.Mesh(new T.CylinderGeometry(r,r,h,12),materials[c]);o.position.set(x,y,z);g.add(o);return o}
for(const a of data.items){if(a.type==='floor'&&a.z>0||a.type==='door'&&a.z===0||a.type==='box'&&a.z>0||a.type==='light'&&a.z>0)continue;const {x,y,z,w,h,d,c,rot=0}=a;
 if(a.type==='floor'){const map=tile(a.kind);map.repeat.set(w/.8,d/.8);const o=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({map,roughness:.66}));o.rotation.x=-Math.PI/2;o.position.set(x,0,z);scene.add(o)}
 if(a.type==='box'){
  if(a.ceiling&&h===.16&&y<3.1){const o=cube(x,Math.min(y,2.86),z,w,h,d,c);roof.push(o)}
  else if(h>4&&y-h/2<.1&&d>1&&w<.5&&z-d/2<STAIR_TOP){
   const boundary=STAIR_TOP,lo=z-d/2,hi=z+d/2;
   if(boundary>lo)cube(x,1.40,(lo+Math.min(hi,boundary))/2,w,2.8,Math.min(hi,boundary)-lo,c);
   if(hi>boundary)cube(x,y,(Math.max(lo,boundary)+hi)/2,w,h,hi-Math.max(lo,boundary),c);
  }else{const o=cube(x,y,z,w,h,d,c);if(a.ceiling)roof.push(o)}
 }
 if(a.type==='sign'){let o=plaque(a.t,w,h,a.c);o.position.set(x,y,z);o.rotation.y=rot;scene.add(o)}
 if(a.type==='light'){const o=cube(x,y,z,a.kind==='rect'?2.3:.16,.035,a.kind==='rect'?1.1:.16,'warm');roof.push(o);if(a.kind!=='wall'){const p=new T.PointLight(0xffebd2,a.kind==='rect'?11:5,6,1.8);p.position.set(x,y-.13,z);scene.add(p)}}
 if(a.type==='door'){let g=group(x,z,rot);for(let xx of [-.63,.63])cube(xx,1.18,0,.09,2.36,.14,'black',g);cube(0,2.35,0,1.35,.09,.14,'black',g);let leaf=new T.Group();leaf.position.x=.58;g.add(leaf);cube(-.58,1.13,0,1.14,2.26,.055,a.color==='glass'?'frost':'white',leaf);if(a.color==='glass'){for(let xx of [-1.12,-.04])cube(xx,1.13,.02,.08,2.26,.085,'black',leaf);for(let yy of [.06,2.2])cube(-.58,yy,.02,1.14,.12,.085,'black',leaf)}cube(-1.01,1.05,.06,.09,.32,.06,'black',leaf);if(a.t){let p=plaque(a.t,1.1,.19,a.t==='Ada Lovelace'?'wood':'pink');p.position.set(0,2.53,.095);g.add(p)}staticDoorLeaves.push({leaf});if(a.t!=='Staff only')doors.push({x:x+ACADEMY_DOOR_X,z,rot,leaf,open:false,angle:0})}
 if(a.type==='desk'){let g=group(x,z,rot);cube(0,.75,0,w,.065,d,a.col,g);for(let xx of [-w/2+.06,w/2-.06])for(let zz of [-d/2+.06,d/2-.06])cube(xx,.35,zz,.045,.70,.045,'black',g)}
 if(a.type==='chair'){let g=group(x,z,rot);cube(0,.47,0,.49,.10,.46,'charcoal',g);cube(0,.77,-.22,.46,.48,.055,'charcoal',g);for(let xx of [-.25,.25]){cube(xx,.62,-.03,.04,.24,.045,'black',g);cube(xx,.73,.03,.04,.05,.33,'black',g)}cylinder(0,.24,0,.04,.42,'black',g);for(let i=0;i<5;i++){let ang=i*Math.PI*2/5;let b=cube(Math.sin(ang)*.10,.06,Math.cos(ang)*.10,.035,.035,.26,'black',g);b.rotation.y=ang;cylinder(Math.sin(ang)*.23,.035,Math.cos(ang)*.23,.035,.06,'black',g)}}
 if(a.type==='pc'){let g=group(x,z,rot);const display=new T.MeshStandardMaterial({color:0x20272c,roughness:.48});cube(0,1.09,-.16,.51,.30,.055,display,g);computers.push({x,z,rot,display,on:false});cube(0,.90,-.16,.04,.18,.05,'black',g);cube(0,.795,-.16,.25,.025,.15,'black',g);cube(0,.79,.10,.32,.025,.12,'black',g)}
 if(a.type==='shelf'){let g=group(x,z,rot),col=a.metal?'black':'wood';cube(0,1.1,-d/2,w,2.2,.045,col,g);for(let xx of [-w/2,w/2])cube(xx,1.1,0,.045,2.2,d,col,g);for(let j=0;j<5;j++){let y=.22+j*.44;cube(0,y,0,w,.045,d,col,g);for(let k=0;k<Math.floor(w/.10)-1;k++){let h=.18+rand()*.15;cube(-w/2+.10+k*.10,y+.025+h/2,0,.067,h,.24,bookMaterials[k%5],g)}}}
 if(a.type==='bags'){let g=group(x,z,rot);cube(0,.98,-.21,1.1,1.96,.055,'charcoal',g);for(let j=0;j<4;j++){cube(0,.12+j*.48,0,1.12,.045,.43,'charcoal',g);cube(.04,.32+j*.48,.025,.33,.34,.25,j%2?'black':'blue',g);cube(.04,.27+j*.48,.17,.25,.10,.07,'black',g)}}
 if(a.type==='window'){let g=group(x,z,rot);cube(0,1.5,0,w,2.9,.045,windowMaterial,g);for(let xx of [-w/2,w/2,0])cube(xx,1.5,.05,.045,2.9,.07,'black',g);cube(0,.13,.05,w,.06,.07,'black',g);cube(0,1.25,.07,w,.055,.065,'black',g);cube(0,1.9,.10,w-.08,1.95,.035,blindMaterial,g)}
 if(a.type==='plant'){let g=group(x,z);cylinder(0,.24,0,.20,.30,'black',g);for(let i=0;i<14;i++){let q=new T.Mesh(new T.SphereGeometry(1,7,5),materials.olive);q.position.set((rand()-.5)*.45,.65+rand()*.38,(rand()-.5)*.45);q.scale.set(.06,.23,.035);q.rotation.z=(rand()-.5)*2;g.add(q)}}
 if(a.type==='stairrail'){
  const run=a.run||6.3,rise=2.96,n=10;
  const p0=new T.Vector3(x,1,z),p1=new T.Vector3(x,1+rise,z-run),v=p1.clone().sub(p0);
  let o=new T.Mesh(new T.CylinderGeometry(.035,.035,v.length(),12),materials.black);o.position.copy(p0).add(p1).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());scene.add(o);
  for(let i=0;i<=n;i++){let t=i/n;cube(x,.50+t*rise,z-t*run,.055,1,.055,'black');if(i<n){let q=(i+.5)/n;let pane=cube(x,.50+q*rise,z-q*run,.035,.76,run/n,'glass');pane.rotation.x=Math.atan2(rise,run)}}
 }
 if(a.type==='directory'){
  const g=group(x,z,Math.PI/2);cube(0,y,0,.78,1.04,.055,'black',g);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=700;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#b82e60';ctx.fillRect(0,0,512,700);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 51px Arial';ctx.fillText('WHERE TO GO',256,80);
  const rows=[['STUDENT ZONE','1 FLOOR'],['CLASSROOMS','1 FLOOR'],['ADMINISTRATION','2 FLOOR'],['FOR INTERVIEWS','2 FLOOR'],['EDUCATION DEPT.','2 FLOOR'],['MEETING ROOMS','2 FLOOR'],['CLASSROOMS','2 FLOOR']];
  rows.forEach(([l,r],i)=>{const py=156+i*77;if(i===2){ctx.strokeStyle='#ffffffa0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(24,py-40);ctx.lineTo(488,py-40);ctx.stroke()}ctx.fillStyle='#fff';ctx.font='bold 22px Arial';ctx.textAlign='left';ctx.fillText('◆ '+l,25,py);ctx.textAlign='right';ctx.font='21px Arial';ctx.fillText(r,484,py)});
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;const panel=new T.Mesh(new T.PlaneGeometry(.70,.96),new T.MeshBasicMaterial({map}));panel.position.set(0,y,.031);g.add(panel);
 }
 if(a.type==='stairSconce'){
  const g=group(x,z,Math.PI/2);cube(0,y,.035,.15,.20,.12,'black',g);cube(0,y+.103,.036,.12,.012,.075,'warm',g);cube(0,y-.103,.036,.12,.012,.075,'warm',g);
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;const ctx=canvas.getContext('2d');
  const fade=ctx.createLinearGradient(0,128,0,0);fade.addColorStop(0,'rgba(255,213,151,.42)');fade.addColorStop(1,'rgba(255,213,151,0)');ctx.fillStyle=fade;ctx.beginPath();ctx.moveTo(58,125);ctx.lineTo(70,125);ctx.lineTo(128,0);ctx.lineTo(0,0);ctx.closePath();ctx.fill();
  const down=ctx.createLinearGradient(0,128,0,256);down.addColorStop(0,'rgba(255,213,151,.40)');down.addColorStop(1,'rgba(255,213,151,0)');ctx.fillStyle=down;ctx.beginPath();ctx.moveTo(58,131);ctx.lineTo(70,131);ctx.lineTo(128,256);ctx.lineTo(0,256);ctx.closePath();ctx.fill();
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;const wash=new T.Mesh(new T.PlaneGeometry(1.05,1.75),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));wash.position.set(0,y,-.015);g.add(wash);
  const l=new T.PointLight(0xffd4a1,5,3.6,1.8);l.position.set(0,y,.30);g.add(l);
 }
 if(a.type==='sofa'){
  const spine=new T.CatmullRomCurve3(a.points.map(p=>new T.Vector3(p[0],0,p[1])),false,'centripetal');
  const sofaFrame=mat(0x98630f,.92),seatMat=mat(0xd39a28,.94),backMat=mat(0xbf8620,.94),soil=mat(0x4c4636,.95),seamMat=mat(0xa87520,.95);
  function sweep(material,offset,height,width,thickness){
   const steps=88,sides=12,verts=[],indices=[];
   for(let i=0;i<=steps;i++){const t=i/steps,p=spine.getPointAt(t),d=spine.getTangentAt(t),nx=-d.z,nz=d.x,cap=Math.min(1,.7+Math.min(i,steps-i)*.15);for(let k=0;k<sides;k++){let a=2*Math.PI*k/sides,v=offset+Math.cos(a)*width*.5*cap;verts.push(p.x+nx*v,height+Math.sin(a)*thickness*.5,p.z+nz*v)}if(i)for(let k=0;k<sides;k++){let a=(i-1)*sides+k,b=(i-1)*sides+(k+1)%sides,c=i*sides+k,d2=i*sides+(k+1)%sides;indices.push(a,c,b,b,c,d2)}}
   for(let k=1;k<sides-1;k++){indices.push(0,k,k+1);let b=steps*sides;indices.push(b,b+k+1,b+k)}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();scene.add(new T.Mesh(geo,material));
  }
  sweep(sofaFrame,0,.21,1.84,.40);for(let side of [-1,1]){sweep(seatMat,side*.57,.45,.72,.24);sweep(backMat,side*.24,.76,.22,.64)}sweep(soil,0,.91,.30,.12);
  for(const t of [0,1]){const p=spine.getPointAt(t),d=spine.getTangentAt(t),q=mesh(scene,new T.SphereGeometry(1,24,12),seatMat,p.x,.45,p.z);q.scale.set(.77,.12,.26);q.rotation.y=Math.atan2(-d.z,d.x)+Math.PI/2;const back=mesh(scene,new T.SphereGeometry(1,20,12),backMat,p.x,.76,p.z);back.scale.set(.27,.32,.13);back.rotation.copy(q.rotation)}
  for(let i=1;i<13;i++){let t=i/13,p=spine.getPointAt(t),d=spine.getTangentAt(t);for(let side of [-1,1]){let m=cube(p.x-d.z*side*.57,.565,p.z+d.x*side*.57,.016,.009,.56,seamMat);m.rotation.y=Math.atan2(d.x,d.z)}}
  for(let color of [0x8a9b75,0xa0ae85,0x657f56]){let leaves=new T.InstancedMesh(new T.SphereGeometry(1,6,4),mat(color,.94),100),obj=new T.Object3D();for(let i=0;i<100;i++){let t=rand(),p=spine.getPointAt(t),d=spine.getTangentAt(t),off=(rand()-.5)*.38;obj.position.set(p.x-d.z*off,1.03+rand()*.23,p.z+d.x*off);obj.scale.set(.026+rand()*.035,.15+rand()*.18,.028+rand()*.018);obj.rotation.set((rand()-.5)*1.7,rand()*6.28,(rand()-.5)*1.6);obj.updateMatrix();leaves.setMatrixAt(i,obj.matrix)}leaves.instanceMatrix.needsUpdate=true;leaves.computeBoundingSphere();scene.add(leaves)}
  for(let i=0;i<=42;i++){let p=spine.getPointAt(i/42),edge=Math.min(i,42-i);colliders.push({x:p.x+ACADEMY_DOOR_X,z:p.z,r:Math.min(.86,.66+edge*.08)})}
 }
 if(a.type==='vintage'){let g=group(x,z,rot);cube(0,.455,.35,2.05,.91,.12,'marble',g);for(let xx of [-.97,.97]){cube(xx,.455,0,.12,.91,.80,'marble',g);cube(xx,.945,0,.19,.07,.84,'marble',g)}cube(0,.945,.35,2.10,.07,.19,'marble',g);cube(0,.035,.36,2.05,.065,.13,'black',g);
  cube(-.64,.34,.02,.43,.57,.44,'acoustic',g);for(let j=0;j<5;j++)cube(-.64,.43+j*.035,.247,.28,.018,.012,'black',g);cube(.06,.45,-.02,.54,.44,.47,'old',g);cube(.06,.47,.225,.40,.31,.025,'black',g);cube(.60,.16,.03,.52,.12,.25,'old',g);for(let j=0;j<4;j++)cube(.60,.13+j*.026,.16,.39,.018,.013,'black',g)}
 if(a.type==='water'){let g=group(x,z,rot);cube(0,.515,0,.39,1.03,.37,'white',g);cube(0,.69,.191,.26,.24,.025,'black',g);cube(0,.53,.24,.22,.055,.11,'white',g);for(let dx of [-.06,.06])cube(dx,.74,.22,.025,.08,.035,'acoustic',g);cylinder(.23,.81,0,.055,.38,'white',g);cube(0,1.12,0,.22,.18,.22,'blue',g)}
 if(a.type==='locker'){let g=group(x,z,rot);cube(0,1.13,0,1.0,2.26,.55,'wood',g);for(let dx of [-.25,.25]){cube(dx,1.13,.285,.475,2.20,.04,'acoustic',g);cube(dx+.16,1.16,.32,.025,.22,.045,'black',g);for(let j=0;j<3;j++)cube(dx,1.94+j*.045,.313,.25,.013,.015,'charcoal',g)}}

}

 const addSeat=(kind,x,z,yaw,height,computer=null,reach=.72)=>{const dx=Math.sin(yaw),dz=Math.cos(yaw);seats.push({kind,x:x+ACADEMY_DOOR_X,z,height,yaw,computer,approaches:[{x:x+ACADEMY_DOOR_X+dz*reach,z:z-dx*reach},{x:x+ACADEMY_DOOR_X-dz*reach,z:z+dx*reach},{x:x+ACADEMY_DOOR_X-dx*reach,z:z-dz*reach},{x:x+ACADEMY_DOOR_X+dx*reach,z:z+dz*reach}]})};
 for(const a of data.items){
  if(a.type==='chair'){const face=a.rot||0,fx=Math.sin(face),fz=Math.cos(face);let pc=computers.filter(p=>Math.hypot(p.x-a.x,p.z-a.z)<1.55&&(p.x-a.x)*fx+(p.z-a.z)*fz>.15).sort((p,q)=>Math.hypot(p.x-a.x,p.z-a.z)-Math.hypot(q.x-a.x,q.z-a.z))[0];addSeat('chair',a.x,a.z,face,.52,pc||null)}
  if(a.type==='sofa'){const curve=new T.CatmullRomCurve3(a.points.map(p=>new T.Vector3(p[0],0,p[1])),false,'centripetal');for(let i=1;i<=10;i++){let p=curve.getPointAt(.07+i*.078),d=curve.getTangentAt(.07+i*.078);for(let side of [-1,1]){let nx=-d.z*side,nz=d.x*side;addSeat('sofa',p.x+nx*.82,p.z+nz*.82,Math.atan2(nx,nz),.57,null,.78)}}}
  if(a.type==='box'&&a.c==='olive'&&a.h===.50)for(let dx of [-.42,.42])addSeat('alcove sofa',a.x+dx,a.z-.16,Math.PI,.51,null,.8);
  if(a.studyBench)for(let dz of [-.48,.48])addSeat('study bench',a.x,a.z+dz,a.face,.455,null,.76);
  if(a.type==='box'&&a.c==='white'&&a.h===.085&&a.z<STAIR_TOP)for(let dz of [-1,0,1])addSeat('study bench',a.x,a.z+dz,a.x<0?Math.PI/2:-Math.PI/2,.52);
 }
 for(const c of data.solids)if(c.z<0)colliders.push({...c,x:c.x+ACADEMY_DOOR_X});
 cube(0,4.02,0,1.4,3.08,.22,'ivory');
 const batchStats=batchGround(scene,materials,staticDoorLeaves,[...bookMaterials,windowMaterial,blindMaterial]);
 return {batchStats,areas:data.areas.filter(a=>a.z0<0).map(a=>({...a,x0:a.x0+ACADEMY_DOOR_X,x1:a.x1+ACADEMY_DOOR_X})),interiorDoors:doors,fixtures:materials.warm};
}


const upperLayout=(function(){
 const items=[],solids=[],areas=[],names=[];
 const room=(x0,x1,z0,z1,title,kind='tile')=>{areas.push({x0,x1,z0,z1,title});items.push({type:'floor',x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0,kind});names.push({title,x:(x0+x1)/2,z:(z0+z1)/2})};
 const box=(x,y,z,w,h,d,c,block=false,extra={})=>{items.push({type:'box',x,y,z,w,h,d,c,...extra});if(block)solids.push({x,z,w,d})};
 const wall=(x0,z0,x1,z1,h=2.9,c='ivory')=>{if(x0!==x1&&z0!==z1)throw Error('nonorthogonal wall');box((x0+x1)/2,h/2,(z0+z1)/2,Math.abs(x1-x0)||.16,h,Math.abs(z1-z0)||.16,c,true)};
 const ceiling=(x,z,w,d,h=2.9)=>box(x,h+.08,z,w,.16,d,'ivory',false,{ceiling:true});
 const sign=(t,x,y,z,w,h,rot=0,c='pink')=>items.push({type:'sign',t,x,y,z,w,h,rot,c});
 const light=(x,z,y=2.72,kind='spot')=>items.push({type:'light',x,y,z,kind});
 const glass=(x0,z0,x1,z1,h=2.65)=>{const along=x0===x1;box((x0+x1)/2,h/2,(z0+z1)/2,along?.045:Math.abs(x1-x0),h,along?Math.abs(z1-z0):.045,'glass',true);box((x0+x1)/2,1.25,(z0+z1)/2,along?.055:Math.abs(x1-x0),.72,along?Math.abs(z1-z0):.055,'frost');const len=Math.hypot(x1-x0,z1-z0),n=Math.ceil(len/1.4);for(let i=0;i<=n;i++)box(x0+(x1-x0)*i/n,h/2,z0+(z1-z0)*i/n,.045,h,.045,'black')};
 const door=(x,z,rot=0,t='',color='ivory')=>{items.push({type:'door',x,z,rot,t,color})};
 const desk=(x,z,w,d,col='white',rot=0)=>{items.push({type:'desk',x,z,w,d,col,rot});solids.push({x,z,w:rot?w===d?w:d:w,d:rot?w:d})};
 const chair=(x,z,rot=0)=>{items.push({type:'chair',x,z,rot});solids.push({x,z,w:.54,d:.54})};
 const pc=(x,z,rot=0)=>items.push({type:'pc',x,z,rot});
 const shelf=(x,z,w,d,rot=0,metal=false)=>{items.push({type:'shelf',x,z,w,d,rot,metal});solids.push({x,z,w:rot?d:w,d:rot?w:d})};
 const plant=(x,z)=>{items.push({type:'plant',x,z});solids.push({x,z,w:.45,d:.45})};
 const win=(x,z,w,rot=0)=>items.push({type:'window',x,z,w,rot});
 const deskPair=(x,z,w,d,col='white',count=2)=>{desk(x,z,w,d,col);for(let i=0;i<count;i++)chair(x+(i-(count-1)/2)*.75,z+.85,Math.PI)};


 const X=p=>(p-892)/24,Z=p=>(p-501)/24,M=p=>p/24;
 const R=(l,t,r,b,n)=>{room(X(l),X(r),Z(t),Z(b),n);ceiling(X((l+r)/2),Z((t+b)/2),M(r-l),M(b-t),2.85)};
 const W=(l,t,r,b)=>wall(X(l),Z(t),X(r),Z(b),2.85);
 const G=(l,t,r,b,h=2.7)=>glass(X(l),Z(t),X(r),Z(b),h);
 const B=(l,t,r,b,y,h,c,block=false)=>box(X((l+r)/2),y,Z((t+b)/2),M(r-l),h,M(b-t),c,block);
 const D=(x,z,w,d,c='white')=>desk(X(x),Z(z),M(w),M(d),c);
 const C=(x,z,a)=>chair(X(x),Z(z),a),P=(x,z,a)=>pc(X(x),Z(z),a),L=(x,z,a)=>items.push({type:'laptop',x:X(x),z:Z(z),rot:a});
 const doorAt=(x,z,rot,t)=>door(X(x),Z(z),rot,t,'glass');
 const board=(x,z,w,rot)=>items.push({type:'board',x:X(x),z:Z(z),w:M(w),rot});
 const windows=(l,r,z)=>{W(l,z,r,z);for(let x=l+30;x<r-10;x+=60)win(X(x),Z(z+2),M(Math.min(58,r-x+28)))};
 R(74,86,409,359,'Լսարան 1');R(47,501,305,859,'Լսարան 2');R(409,86,916,415,'Բաց աշխատանքային տարածք');R(194,359,409,415,'Ձախ միջանցք');R(194,415,305,501,'Ձախ անցուղի');R(305,415,448,501,'Փոքր գրասենյակ');R(448,415,700,501,'Մեծ հանդիպումների սենյակ');R(700,415,874,501,'Փոքր հանդիպումների սենյակ');R(874,415,916,501,'Աստիճանների հարթակ');R(916,86,1232,375,'Լսարան 3');R(916,375,1232,501,'Համագործակցության գոտի');R(1232,86,1610,501,'Մեծ լսարան');
 windows(74,1610,86);W(74,86,74,359);G(74,359,365,359);doorAt(387,359,0,'Լսարան 1');G(409,86,409,359);
 W(194,359,194,501);G(47,501,256,501);doorAt(278,501,0,'Լսարան 2');W(300,501,305,501);W(47,501,47,859);W(47,859,305,859);G(305,501,305,859);
 W(1610,86,1610,501);W(1232,501,1610,501);W(916,86,916,375);G(916,375,1172,375);doorAt(1192,375,0,'Լսարան 3');G(1212,375,1232,375);W(1232,86,1232,415);doorAt(1232,438,Math.PI/2,'Մեծ լսարան');G(1232,460,1232,501);
 G(305,415,305,501);G(305,501,448,501);G(448,501,700,501);G(700,501,874,501);G(448,415,448,501);G(700,415,700,501);G(874,415,874,501);
 G(305,415,393,415);doorAt(414,415,0,'Գրասենյակ');G(435,415,448,415);G(448,415,646,415);doorAt(667,415,0,'Հանդիպումների սենյակ');G(688,415,700,415);G(700,415,718,415);doorAt(739,415,0,'Փոքր հանդիպումների սենյակ');G(760,415,874,415);
 // Low railing at the edge of the mezzanine.
 B(916,499,1232,501,.55,1.10,'glass',true);B(916,499,1232,502,1.12,.055,'black');
 const stair={x:0,z0:0,z1:7.36,w:1.79,rise:2.96};
 board(405,225,155,-Math.PI/2);board(1228,225,155,-Math.PI/2);board(176,855,170,Math.PI);board(1421,497,220,Math.PI);
 for(let x of [146,235,324])for(let z of [143,218,293]){D(x,z,20,50);C(x-27,z,Math.PI/2)}
 for(let x of [975,1065,1155])for(let z of [145,220,295]){D(x,z,20,50);C(x-27,z,Math.PI/2)}
 for(let z of [575,655,735,805])for(let x of [101,176,251]){D(x,z,52,19);C(x,z-25,0)}
 // Far right: three rows, touching middle pair of desks.
 for(let z of [180,282,384])for(let [x,w] of [[1283,52],[1385,78],[1463,78],[1560,52]]){D(x,z,w,22);C(x,z-27,0)}
 for(let [i,x] of [488,602,718,834].entries()){D(x,246,40,194);for(let [j,z] of [180,245,310].entries())for(let side of [-1,1]){C(x+side*35,z,-side*Math.PI/2);if((i+j+(side>0?1:0))%3===0)L(x+side*10,z,-side*Math.PI/2);else P(x+side*9,z,-side*Math.PI/2)}}
 for(let [x,z] of [[850,115],[878,105],[896,132],[428,478]]){items.push({type:'pouf',x:X(x),z:Z(z)});solids.push({x:X(x),z:Z(z),w:.78,d:.78})}
 D(377,458,58,18);C(377,435,0);P(377,456,0);C(377,482,Math.PI);B(326,439,351,470,.55,1.1,'charcoal',true);
 D(574,458,162,28,'wood');for(let x of [517,555,593,631]){C(x,431,0);C(x,485,Math.PI)}
 // Shift chairs off the door axis; leave a continuous entrance aisle.
 D(797,458,88,24);for(let x of [766,797,828]){C(x,431,0);C(x,485,Math.PI)}
 for(let x of [1018,1130]){D(x,450,30,55,'wood');for(let z of [436,464]){C(x-30,z,Math.PI/2);C(x+30,z,-Math.PI/2)}}
 for(let a of areas){let x=(a.x0+a.x1)/2,z=(a.z0+a.z1)/2;items.push({type:'light',x,y:2.72,z,kind:'rect'})}
 return {items,solids,areas,names,stair,checkpoints:[["Աստիճանների հարթակ",0,-4.65],["Լսարան 1",-26.7,-11.549999999999999],["Լսարան 2",-29.849999999999998,7.5],["Բաց աշխատանքային տարածք",-9.6,-10.5],["Ձախ միջանցք",-24.599999999999998,-4.8],["Ձախ անցուղի",-26.7,-1.7999999999999998],["Փոքր գրասենյակ",-22.05,-1.2],["Մեծ հանդիպումների սենյակ",-10.35,-0.8999999999999999],["Փոքր հանդիպումների սենյակ",-5.85,-1.05],["Լսարան 3",7.949999999999999,-11.25],["Համագործակցության գոտի",7.6499999999999995,-2.6999999999999997],["Մեծ լսարան",22.05,-8.4],["Աստիճաններ",0,3.75]]};

})();

function buildApprovedUpper(parent){
 const scene=new T.Group();scene.position.set(STAIR_X,2.96,STAIR_TOP);parent.add(scene);const data=upperLayout;
 const palette={ivory:0xe0dcd2,white:0xf3f3ed,black:0x252528,charcoal:0x414143,concrete:0x77716b,wood:0xb77d47,olive:0x666e48,acoustic:0xc8c1b7,green:0x6eb954,blue:0x4286b1,yellow:0xd5b52a,old:0xc8c3af,marble:0xc4c1b7,warm:0xffebc6,pink:0xad2059,glass:0x98b6b8,frost:0xb7d0cd};
const materials={};for(const [k,c] of Object.entries(palette))materials[k]=k==='warm'?new T.MeshBasicMaterial({color:c}):new T.MeshStandardMaterial({color:c,roughness:k==='wood'?.68:.84,transparent:k==='glass'||k==='frost',opacity:k==='glass'?.24:k==='frost'?.66:1,depthWrite:k!=='glass'&&k!=='frost'});
function cube(x,y,z,w,h,d,c,parent=scene){const o=new T.Mesh(new T.BoxGeometry(w,h,d),typeof c==='string'?materials[c]:c);o.position.set(x,y,z);parent.add(o);return o}
function group(x,z,rot=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);return g}
const roof=[],doors=[],computers=[];const windowMat=mat(0x84a5bf,.28),blindMat=mat(0x777a7d,1);windowMat.emissive.setHex(0x36516c);windowMat.emissiveIntensity=.25;let rng=123;const rand=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
function tile(kind){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=kind==='dark'?'#353230':'#c9c4bb';ctx.fillRect(0,0,256,256);for(let i=0;i<3500;i++){ctx.fillStyle=rand()>.5?'#ffffff09':'#0000000a';ctx.fillRect(rand()*256,rand()*256,rand()*16+1,1)}ctx.strokeStyle=kind==='dark'?'#8b8172':'#aaa69f';ctx.lineWidth=1.5;ctx.strokeRect(1,1,254,254);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t}
function plaque(t,w,h,c){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;let ctx=canvas.getContext('2d');ctx.fillStyle='#'+palette[c].toString(16).padStart(6,'0');ctx.fillRect(0,0,1024,256);ctx.fillStyle=c==='ivory'?'#292929':'white';ctx.font='bold '+(t.includes('|')?62:100)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';const lines=t.split('|');lines.forEach((l,i)=>ctx.fillText(l,512,128+(i-(lines.length-1)/2)*86,980));const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,side:T.DoubleSide}))}
function cylinder(x,y,z,r,h,c,g=scene){let o=new T.Mesh(new T.CylinderGeometry(r,r,h,12),materials[c]);o.position.set(x,y,z);g.add(o);return o}
for(const a of data.items){const {x,y,z,w,h,d,c,rot=0}=a;
 if(a.type==='floor'){const map=tile(a.kind);map.repeat.set(w/.8,d/.8);const o=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({map,roughness:.66}));o.rotation.x=-Math.PI/2;o.position.set(x,0,z);scene.add(o);cube(x,-.07,z,w,.13,d,'ivory')}
 if(a.type==='box'){const o=cube(x,y,z,w,h,d,c);if(a.ceiling)roof.push(o)}
 if(a.type==='sign'){let o=plaque(a.t,w,h,a.c);o.position.set(x,y,z);o.rotation.y=rot;scene.add(o)}
 if(a.type==='light'){const o=cube(x,y,z,a.kind==='rect'?2.3:.16,.035,a.kind==='rect'?1.1:.16,'warm');roof.push(o);const l=new T.PointLight(0xfff0d9,4.5,8,1.8);l.position.set(x,y-.13,z);scene.add(l);}
 if(a.type==='door'){let g=group(x,z,rot);for(let xx of [-.63,.63])cube(xx,1.18,0,.09,2.36,.14,'black',g);cube(0,2.35,0,1.35,.09,.14,'black',g);let leaf=new T.Group();leaf.position.x=.58;g.add(leaf);cube(-.58,1.13,0,1.14,2.26,.055,a.color==='glass'?'frost':'white',leaf);if(a.color==='glass'){for(let xx of [-1.12,-.04])cube(xx,1.13,.02,.08,2.26,.085,'black',leaf);for(let yy of [.06,2.2])cube(-.58,yy,.02,1.14,.12,.085,'black',leaf)}cube(-1.01,1.05,.06,.09,.32,.06,'black',leaf);if(a.t){let p=plaque(a.t,1.1,.19,a.t==='Ada Lovelace'?'wood':'pink');p.position.set(0,2.53,.095);g.add(p)}doors.push({x:x+STAIR_X,z:z+STAIR_TOP,rot,leaf,open:true,angle:1.5});leaf.rotation.y=-1.5}
 if(a.type==='board'){let g=group(x,z,rot);cube(0,1.55,0,w,1.18,.08,'black',g);cube(0,1.55,.055,w-.10,1.07,.035,'white',g);cube(0,.94,.09,w,.045,.12,'charcoal',g);cube(w*.3,.98,.12,.12,.028,.035,'blue',g);cube(w*.35,.98,.12,.12,.028,.035,'pink',g)}
 if(a.type==='pouf'){let g=group(x,z,rot);cylinder(0,.24,0,.39,.48,'yellow',g);cylinder(0,.49,0,.385,.06,'yellow',g)}
 if(a.type==='laptop'){let g=group(x,z,rot+Math.PI);cube(0,.79,0,.32,.025,.25,'charcoal',g);const display=mat(0x20272c,.48);let lid=cube(0,.915,-.11,.32,.245,.022,display,g);computers.push({x,z,rot,display,on:false});lid.rotation.x=-.18;cube(0,.81,.03,.26,.008,.12,'black',g)}
 if(a.type==='desk'){let g=group(x,z,rot);cube(0,.75,0,w,.065,d,a.col,g);for(let xx of [-w/2+.06,w/2-.06])for(let zz of [-d/2+.06,d/2-.06])cube(xx,.35,zz,.045,.70,.045,'black',g)}
 if(a.type==='chair'){let g=group(x,z,rot);cube(0,.47,0,.49,.10,.46,'charcoal',g);cube(0,.77,-.22,.46,.48,.055,'charcoal',g);for(let xx of [-.25,.25]){cube(xx,.62,-.03,.04,.24,.045,'black',g);cube(xx,.73,.03,.04,.05,.33,'black',g)}cylinder(0,.24,0,.04,.42,'black',g);for(let i=0;i<5;i++){let ang=i*Math.PI*2/5;let b=cube(Math.sin(ang)*.10,.06,Math.cos(ang)*.10,.035,.035,.26,'black',g);b.rotation.y=ang;cylinder(Math.sin(ang)*.23,.035,Math.cos(ang)*.23,.035,.06,'black',g)}}
 if(a.type==='pc'){let g=group(x,z,rot+Math.PI);const display=mat(0x20272c,.48);cube(0,1.09,-.16,.51,.30,.055,display,g);computers.push({x,z,rot,display,on:false});cube(0,.90,-.16,.04,.18,.05,'black',g);cube(0,.795,-.16,.25,.025,.15,'black',g);cube(0,.79,.10,.32,.025,.12,'black',g)}
 if(a.type==='window'){let g=group(x,z,rot);cube(0,1.5,0,w,2.9,.045,windowMat,g);for(let xx of [-w/2,w/2,0])cube(xx,1.5,.05,.045,2.9,.07,'black',g);cube(0,.13,.05,w,.06,.07,'black',g);cube(0,1.25,.07,w,.055,.065,'black',g);cube(0,1.9,.10,w-.08,1.95,.035,blindMat,g)}
}

 const upperColliders=data.solids.map(c=>({...c,x:c.x+STAIR_X,z:c.z+STAIR_TOP}));
 const upperAreas=data.areas.map(a=>({...a,x0:a.x0+STAIR_X,x1:a.x1+STAIR_X,z0:a.z0+STAIR_TOP,z1:a.z1+STAIR_TOP}));
 const upperSeats=[];
 for(const a of data.items){
  if(a.type!=='chair'&&a.type!=='pouf')continue;
  const x=a.x+STAIR_X,z=a.z+STAIR_TOP,yaw=a.rot||0,dx=Math.sin(yaw),dz=Math.cos(yaw),reach=.72;
  const computer=a.type==='chair'?computers.filter(p=>Math.hypot(p.x-a.x,p.z-a.z)<1.6&&(p.x-a.x)*dx+(p.z-a.z)*dz>.12).sort((p,q)=>Math.hypot(p.x-a.x,p.z-a.z)-Math.hypot(q.x-a.x,q.z-a.z))[0]||null:null;
  upperSeats.push({kind:a.type==='pouf'?'pouf':'chair',x,z,height:a.type==='pouf'?.52:.52,yaw,computer,approaches:[{x:x+dz*reach,z:z-dx*reach},{x:x-dz*reach,z:z+dx*reach},{x:x-dx*reach,z:z-dz*reach},{x:x+dx*reach,z:z+dz*reach}]});
 }
 const upperBatchStats=batchGround(scene,materials,doors,[windowMat,blindMat]);
 return {upperRoot:scene,upperColliders,upperAreas,upperSeats,upperDoors:doors,upperBatchStats};
}


const adaLayout=(()=>{
 const items=[],solids=[],areas=[{x0:-6,x1:6,z0:-15.5,z1:1.5,title:'Ada Lovelace'}];
 const box=(x,y,z,w,h,d,c,block=false,extra={})=>{items.push({type:'box',x,y,z,w,h,d,c,...extra});if(block)solids.push({x,z,w,d})};
 const height=z=>Math.max(0,Math.min(6,Math.floor((-z-2.1)/1.75)))*.18;
 // Front wall, entry vestibule, auditorium, uninterrupted side aisles.
 box(0,-.08,-7,12,.16,17,'charcoal');
 box(-6,3.0,-7, .16,6,17,'ivory',true);
 box(0,3,-15.5,12,6,.16,'charcoal',true);
 box(-.7625,3,1.5,10.475,6,.16,'ivory',true);box(5.9125,3,1.5,.175,6,.16,'ivory',true);box(5.15,4.18,1.5,1.35,3.64,.16,'ivory');
 // Existing Academy door is used instead; internal threshold remains open.
 box(6,1.48,-7,.16,2.96,17,'ivory',true);
 box(0,6.08,-7,12,.16,17,'ivory',false,{ceiling:true});
 // Dark teaching wall: three framed, two-part sliding chalkboard sections.
 for(let i=0;i<3;i++){let x=-3.5+i*2.65;
  box(x,2.0,1.30,2.6,2.95,.13,'black');
  box(x,2.72,1.20,2.49,1.38,.075,'chalk');
  box(x,1.26,1.18,2.49,1.46,.085,'chalk');
  for(let dx of [-1.29,1.29])box(x+dx,2.0,1.13,.065,3.04,.11,'metal');
  box(x,2.02,1.12,2.56,.055,.10,'metal');
 }
 items.push({type:'chalktitle',x:-.85,y:2.95,z:1.15});
 box(-.85,.52,1.07,8.0,.08,.19,'black');
 for(let x of [-4.7,-2,1,3])box(x,.24,1.1,.065,.48,.07,'black');
 // Teacher workstation and lectern at the side of the entrance.
 items.push({type:'desk',x:-4.9,z:-.1,w:1.25,d:.65,col:'white',rot:0,base:0});solids.push({x:-4.9,z:-.1,w:1.25,d:.65});
 items.push({type:'chair',x:-4.9,z:-.76,rot:0,base:0});solids.push({x:-4.9,z:-.76,w:.5,d:.5});
 box(5.65,.50,-2.78,.62,1,.58,'white',true);box(5.65,1.05,-2.78,.74,.07,.65,'white');
 // Seven continuous white desk rows, rising toward the timber rear wall.
 for(let row=0;row<7;row++){
  let z=-2.7-row*1.75,base=height(z);
  if(row>0){let edge=-2.1-row*1.75;box(0,base/2,edge-.875,11.8,base,1.75,'step');}
  // Desk surface and modesty panel on the front of every row.
  box(0,base+.76,z,9.05,.065,.74,'white',true);
  if(row>0)box(0,base+.46,z+.33,9.05,.48,.055,'white');
  for(let x of [-4.46,-1.5,1.5,4.46]){box(x,base+.37,z-.30,.045,.70,.045,'black');box(x,base+.37,z+.30,.045,.70,.045,'black')}
  for(let x of [-3.98,-2.985,-1.99,-.995,0,.995,1.99,2.985,3.98]){items.push({type:'chair',x,z:z-.83,rot:0,base:height(z-.83)});solids.push({x,z:z-.83,w:.52,d:.52})}
 }
 // Rear tier extension and dark edge trim across each riser.
 const backH=height(-15);box(0,backH/2,-14.925,11.8,backH,1.15,'step');
 for(let i=1;i<=6;i++){let z=-2.1-i*1.75;box(0,i*.18+.005,z,.0+11.8,.035,.045,'black')}
 // Acoustic wall treatment, columns and vertical wood slats at the rear.
 for(let x=-5.75;x<=5.75;x+=.125)box(x,3.45,-15.36,.065,4.6,.095,'wood');
 for(let z of [-2,-6.1,-10.2,-14.3]){
  box(-5.88,2.8,z,.22,5.6,.42,'charcoal',true);
  box(5.88,1.45,z,.24,2.9,.44,'charcoal',true);
  box(5.72,2.10,z,.075,.90,.75,'acoustic');
 }
 box(-5.89,2.35,-7,.09,.88,16,'acoustic');
 for(let z=-14.8;z<-1;z+=.14)box(-5.82,2.35,z,.028,.87,.045,'charcoal');
 for(let z of [-13,-8,-3])box(-5.80,2.95,z,.11,.14,.14,'white');
 // Upper glazing is the actual second-floor meeting-room frontage, not duplicated preview rooms.
 // Black suspended acoustic ceiling rafts, longitudinal strip lights, two projectors.
 for(let z of [-1.6,-4.4,-7.2,-10,-12.8]){
  for(let x of [-3.6,0,3.6])box(x,5.48,z,3.05,.14,2.2,'acoustic',false,{ceiling:true});
  box(0,5.36,z+1.2,10.9,.045,.055,'warm',false,{ceiling:true});
  box(0,5.72,z,11.7,.17,.15,'ivory',false,{ceiling:true});
  for(let x of [-5.4,5.4])box(x,2.82,z,.18,.025,.18,'warm');
 }
 for(let z of [-4.5,-10]){box(0,5.18,z,.045,.58,.045,'metal',false,{ceiling:true});box(0,4.84,z,.42,.15,.34,'white',false,{ceiling:true});box(0,4.85,z+.18,.13,.075,.035,'black',false,{ceiling:true})}
 // Water cooler beside entry pillar, black bin.
 box(5.55,.45,-2.0,.40,.90,.39,'black',true);box(5.55,1.1,-2.0,.29,.42,.29,'blue');box(5.55,.62,-1.79,.24,.17,.035,'metal');box(5.35,.23,-.95,.29,.46,.30,'charcoal',true);
 return {items,solids,areas,height,checkpoints:[['Մուտք',4.75,.05],['Գրատախտակի մոտ',0,-.5],['Աջ անցուղի',5.25,-6],['Վերջին շարք',5.25,-14.4],['Ձախ անցուղի',-5.2,-8.5]]};
})();

// Auditorium occupies the west side of the lounge. Its east-facing entry is reached
// through the existing Ada door. Its north wall shares the real mezzanine frontage.
const ADA_DOOR_X=ACADEMY_DOOR_X+(575-704)/21.2,ADA_DOOR_Z=(589-790)/21.2;
const ADA_FRONT_X=ACADEMY_DOOR_X+(574-704)/21.2-.04,ADA_RIGHT_Z=ADA_DOOR_Z-.85;
function adaWorld(x,z){return {x:ADA_FRONT_X+z-1.5,z:ADA_RIGHT_Z+6-x}}
const ADA_ROOM={x0:ADA_FRONT_X-17,x1:ADA_FRONT_X,z0:ADA_RIGHT_Z,z1:ADA_RIGHT_Z+12,title:'Ada Lovelace'};
export function inAdaHall(x,z){return x>=ADA_ROOM.x0&&x<=ADA_ROOM.x1&&z>=ADA_ROOM.z0&&z<=ADA_ROOM.z1}
function inAdaAccess(x,z){return inAdaHall(x,z)||(x>=ADA_FRONT_X&&x<=ADA_DOOR_X+.24&&Math.abs(z-ADA_DOOR_Z)<=.675)}
function adaSolids(){return adaLayout.solids.map(c=>{const p=adaWorld(c.x,c.z);return {...p,w:c.d,d:c.w}})}
function buildAda(parent,colliders,seats){
 const scene=new T.Group();scene.name='Ada Lovelace auditorium';scene.position.set(ADA_FRONT_X-1.5,0,ADA_RIGHT_Z+6);scene.rotation.y=Math.PI/2;parent.add(scene);const data=adaLayout;
 const palette={ivory:0xe0dcd2,white:0xf3f3ed,black:0x252528,charcoal:0x414143,step:0x85817b,chalk:0x323536,metal:0x9c9c99,concrete:0x77716b,wood:0xb77d47,olive:0x666e48,acoustic:0xc8c1b7,green:0x6eb954,blue:0x4286b1,yellow:0xd5b52a,old:0xc8c3af,marble:0xc4c1b7,warm:0xffebc6,pink:0xad2059,glass:0x98b6b8,frost:0xb7d0cd};
const materials={};for(const [k,c] of Object.entries(palette))materials[k]=k==='warm'?new T.MeshBasicMaterial({color:c}):new T.MeshStandardMaterial({color:c,roughness:k==='wood'?.68:.84,transparent:k==='glass'||k==='frost',opacity:k==='glass'?.24:k==='frost'?.66:1,depthWrite:k!=='glass'&&k!=='frost'});
function cube(x,y,z,w,h,d,c,parent=scene){const o=new T.Mesh(new T.BoxGeometry(w,h,d),typeof c==='string'?materials[c]:c);o.position.set(x,y,z);parent.add(o);return o}
function group(x,z,rot=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);return g}
const roof=[],doors=[];let rng=123;const rand=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
function tile(kind){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=kind==='dark'?'#353230':'#c9c4bb';ctx.fillRect(0,0,256,256);for(let i=0;i<3500;i++){ctx.fillStyle=rand()>.5?'#ffffff09':'#0000000a';ctx.fillRect(rand()*256,rand()*256,rand()*16+1,1)}ctx.strokeStyle=kind==='dark'?'#8b8172':'#aaa69f';ctx.lineWidth=1.5;ctx.strokeRect(1,1,254,254);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t}
function plaque(t,w,h,c){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;let ctx=canvas.getContext('2d');ctx.fillStyle='#'+palette[c].toString(16).padStart(6,'0');ctx.fillRect(0,0,1024,256);ctx.fillStyle=c==='ivory'?'#292929':'white';ctx.font='bold '+(t.includes('|')?62:100)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';const lines=t.split('|');lines.forEach((l,i)=>ctx.fillText(l,512,128+(i-(lines.length-1)/2)*86,980));const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,side:T.DoubleSide}))}
function cylinder(x,y,z,r,h,c,g=scene){let o=new T.Mesh(new T.CylinderGeometry(r,r,h,12),materials[c]);o.position.set(x,y,z);g.add(o);return o}
for(const a of data.items){const {x,y,z,w,h,d,c,rot=0}=a;
 if(a.type==='box'){const o=cube(x,y,z,w,h,d,c);if(a.ceiling)roof.push(o)}
 if(a.type==='chalktitle'){let c=document.createElement('canvas');c.width=512;c.height=300;let ctx=c.getContext('2d');ctx.clearRect(0,0,512,300);ctx.fillStyle='#d6b5b1';ctx.font='bold 70px Arial';ctx.textAlign='center';ctx.fillText('PICSART',256,110);ctx.fillStyle='#dddcd2';ctx.fillText('ACADEMY',256,202);let tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;let m=new T.Mesh(new T.PlaneGeometry(1.7,1),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));m.position.set(x,y,z-.02);m.rotation.y=Math.PI;scene.add(m)}
 if(a.type==='desk'){let g=group(x,z,rot);cube(0,.75,0,w,.065,d,a.col,g);for(let xx of [-w/2+.06,w/2-.06])for(let zz of [-d/2+.06,d/2-.06])cube(xx,.35,zz,.045,.70,.045,'black',g)}
 if(a.type==='chair'){let g=group(x,z,rot);g.position.y=a.base||0;cube(0,.47,0,.49,.075,.46,'acoustic',g);cube(0,.77,-.22,.46,.43,.045,'acoustic',g);for(let xx of [-.25,.25]){cube(xx,.62,-.03,.04,.24,.045,'black',g);cube(xx,.73,.03,.04,.05,.33,'black',g)}for(let xx of [-.20,.20])for(let zz of [-.18,.18]){let leg=cube(xx,.22,zz,.033,.43,.033,'metal',g);leg.rotation.x=zz*.55;leg.rotation.z=-xx*.55;}}
}

 for(const z of [-1,-7,-13]){const l=new T.PointLight(0xfff2de,12,12,1.8);l.position.set(0,5.1,z);scene.add(l)}
 colliders.push(...adaSolids());
 for(const a of data.items)if(a.type==='chair'&&a.base<2){
  const p=adaWorld(a.x,a.z),yaw=(a.rot||0)+Math.PI/2,approaches=[[-.69,0],[.69,0],[0,-.64],[0,.64]].map(([dx,dz])=>adaWorld(a.x+dx,a.z+dz));
  seats.push({kind:'chair',x:p.x,z:p.z,height:.51,yaw,computer:null,approaches});
 }
 return {adaRoot:scene,adaBatchStats:batchGround(scene,materials,[],[])};
}


const KITCHEN_X=ACADEMY_DOOR_X+(937-704)/21.2,KITCHEN_Z=(487-790)/21.2;
const KITCHEN_WIDTH=7.4,KITCHEN_NORTH=-7.55,KITCHEN_SOUTH=1.78;
export function inKitchen(x,z){return x>=KITCHEN_X-.15&&x<=KITCHEN_X+KITCHEN_WIDTH&&z>=KITCHEN_Z+KITCHEN_NORTH&&z<=KITCHEN_Z+KITCHEN_SOUTH}
function kitchenLayout(){
 const items=[],solids=[],seats=[];
 const B=(x,y,z,w,h,d,c,block=false)=>{items.push({type:'box',x,y,z,w,h,d,c});if(block)solids.push({x:KITCHEN_X+x,z:KITCHEN_Z+z,w,d})};
 const C=(x,y,z,r,h,c,r2=r)=>items.push({type:'cyl',x,y,z,r,h,c,r2});
 const L=(x,y,z,color=0xfff2dd,intensity=7)=>items.push({type:'light',x,y,z,color,intensity});
 const S=(x,z,yaw,height,approaches,kind='chair')=>seats.push({kind,x:KITCHEN_X+x,z:KITCHEN_Z+z,height,yaw,computer:null,approaches:approaches.map(([a,b])=>({x:KITCHEN_X+a,z:KITCHEN_Z+b}))});
 // Layout traced from the corrected plan: door stays fixed, room extends north.
 const capture=()=>[items.length,solids.length,seats.length];
 // Transform a whole furniture group, including its collision and seat approaches.
 const move=(mark,dx,dz,scale=1)=>{
  const map=(x,z)=>[z+dx,dz-x*scale];
  for(const a of items.slice(mark[0])){[a.x,a.z]=map(a.x,a.z);if(a.type==='box'){[a.w,a.d]=[a.d,a.w*scale]}if(a.type==='stool')a.yaw+=Math.PI/2;}
  for(const c of solids.slice(mark[1])){const p=map(c.x-KITCHEN_X,c.z-KITCHEN_Z);c.x=KITCHEN_X+p[0];c.z=KITCHEN_Z+p[1];[c.w,c.d]=[c.d,c.w*scale]}
  for(const a of seats.slice(mark[2])){const p=map(a.x-KITCHEN_X,a.z-KITCHEN_Z);a.x=KITCHEN_X+p[0];a.z=KITCHEN_Z+p[1];a.yaw+=Math.PI/2;for(const p of a.approaches){const v=map(p.x-KITCHEN_X,p.z-KITCHEN_Z);p.x=KITCHEN_X+v[0];p.z=KITCHEN_Z+v[1]}}
 };
 const mid=(KITCHEN_NORTH+KITCHEN_SOUTH)/2,depth=KITCHEN_SOUTH-KITCHEN_NORTH;
 B(3.7,-.08,mid,7.4,.16,depth,'ivory');B(3.7,2.86,mid,7.4,.16,depth,'ivory');
 for(let z of [KITCHEN_NORTH,KITCHEN_SOUTH]){B(3.7,1.43,z,7.4,2.86,.15,'ivory',true);B(3.7,.05,z+(z<0?.09:-.09),7.25,.10,.025,'charcoal')}
 for(const [lo,hi] of [[KITCHEN_NORTH,-.64],[.64,KITCHEN_SOUTH]]){B(0,1.43,(lo+hi)/2,.16,2.86,hi-lo,'ivory',true)}
 B(0,2.62,0,.16,.48,1.28,'ivory');
 // Full-height exterior glazing on the right side of the corrected plan.
 B(7.37,.18,mid,.16,.36,depth,'ivory',true);B(7.37,2.70,mid,.16,.32,depth,'ivory');
 for(let i=0;i<4;i++){let z=KITCHEN_NORTH+(i+.5)*depth/4;B(7.37,1.50,z,.045,2.28,depth/4-.05,'window');B(7.35,1.07,z,.08,.075,depth/4-.05,'black')}
 for(let i=0;i<=4;i++)B(7.34,1.50,KITCHEN_NORTH+i*depth/4,.10,2.30,.09,'black');
 B(7.85,1.55,mid,.08,2.70,depth,'sky');for(let i=0;i<4;i++){let z=KITCHEN_NORTH+(i+.5)*depth/4;B(7.8,1.37,z,.07,1.8,1.45,'building');B(7.74,1.48,z,.02,.82,.68,'blue')}
 for(let x=.6;x<7.4;x+=.6)B(x,.002,mid,.012,.004,depth-.1,'grout');for(let z=KITCHEN_NORTH+.6;z<KITCHEN_SOUTH;z+=.6)B(3.7,.003,z,7.25,.004,.012,'grout');
 const counterStart=capture();
 // Counter, graphite drawers, double sink and accessories.
 for(let x of [1.15,2,2.85,3.7,4.55,5.4,6.25,7.1]){B(x,.45,3.22,.84,.90,.72,'cabinet',true);let n=x<3||x>5.9?3:1;for(let j=0;j<n;j++){let h=.74/n,y=.13+(j+.5)*h;B(x,y,2.85,.80,h-.018,.035,'cabinet');B(x,y+h*.34,2.816,.50,.027,.035,'black')}}
 B(2.5,.94,3.22,3.56,.075,.79,'counter');B(6.66,.94,3.22,1.72,.075,.79,'counter');
 for(let z of [2.865,3.575])B(4.98,.94,z,1.40,.075,.08,'counter');
 for(let x of [4.29,4.98,5.67])B(x,.94,3.22,.08,.075,.79,'counter');
 for(let x of [4.63,5.32]){B(x,.925,3.22,.56,.045,.65,'steel');B(x,.949,3.22,.46,.009,.52,'sink');for(let side of [-1,1]){B(x+side*.25,.975,3.22,.035,.05,.60,'steel');B(x,.975,3.22+side*.30,.53,.05,.035,'steel')}C(x,.958,3.22,.045,.014,'steel')}
 B(4.98,1.12,3.53,.036,.34,.036,'steel');B(4.98,1.29,3.39,.036,.036,.30,'steel');B(4.98,1.23,3.25,.036,.12,.036,'steel');
 B(4.9,1.07,3.64,6.95,.20,.06,'counter');
 for(let i=0;i<8;i++)B(5.86+i*.065,1.05,3.18,.018,.15,.44,'steel');for(let i=0;i<5;i++)B(5.94+i*.08,1.16,3.2,.025,.28,.28,'white');
 C(4.15,1.09,3.48,.055,.23,'soap');C(4.15,1.23,3.48,.028,.05,'white');B(4.02,.994,2.94,.16,.04,.09,'yellow');
 for(let y of [1.67,2.25]){B(4.05,y,3.40,6.35,.045,.44,'wood');for(let x of [1,3.05,5.15,7.17])B(x,(y+2.79)/2,3.16,.032,2.79-y,.032,'black');B(4.05,y-.036,3.16,6.35,.035,.03,'black')}
 for(let i=0;i<25;i++){let x=1.12+i*.242,h=i>11&&i<18?.19:.10+(i%3)*.025,c=['white','ceramic','cream','charcoal','yellow'][i%5];C(x,1.70+h/2,3.39,.052,h,c,.064);if(i%3===0)B(x+.071,1.70+h*.55,3.39,.035,.068,.028,c)}
 for(let i=0;i<11;i++)C(1.19+i*.51,2.35,3.39,.075,.14,['steel','white','yellow'][i%3]);
 B(7.05,1.12,3.22,.66,.32,.44,'steel');B(7.05,1.13,2.991,.49,.23,.025,'black');B(7.05,1.13,2.975,.40,.17,.012,'darkGlass');B(7.325,1.11,2.973,.075,.18,.025,'charcoal');
 B(8.18,.98,3.18,.99,1.96,.84,'steel',true);
 for(let x of [7.94,8.43]){B(x,1.37,2.74,.47,1.17,.045,'steel');B(x,.39,2.74,.47,.74,.045,'steel')}
 B(8.43,1.44,2.71,.40,1,.025,'darkGlass');B(7.94,1.42,2.71,.29,.46,.025,'black');B(7.94,1.30,2.69,.20,.055,.025,'steel');for(let x of [8.12,8.25])B(x,1.39,2.67,.027,.59,.04,'black');B(7.86,1.69,2.68,.18,.24,.009,'white');
 C(1.05,1.10,3.23,.11,.24,'steel',.085);C(1.05,1.235,3.23,.071,.035,'black');B(1.18,1.11,3.23,.035,.19,.06,'black');
 for(let x of [1.5,3.4,6.8]){B(x,1.22,3.60,.22,.09,.035,'white');for(let dx of [-.055,.055])B(x+dx,1.22,3.578,.045,.045,.008,'charcoal')}
 move(counterStart,3.69,2.17,.77);
 // White high table, metal stools and three green booth bays.
 const islandStart=capture();
 B(4.8,1.04,.45,4.8,.065,1,'white',true);for(let x of [2.48,7.12])for(let z of [0,.9])B(x,.52,z,.055,1.04,.055,'black');for(let z of [0,.9])B(4.8,.12,z,4.65,.045,.045,'black');
 function stool(x,z,yaw,high=true){let h=high?.76:.47;items.push({type:'stool',x,z,yaw,h,c:high?'white':'charcoal'});solids.push({x:KITCHEN_X+x,z:KITCHEN_Z+z,w:.46,d:.46});let dx=Math.sin(yaw),dz=Math.cos(yaw);S(x,z,yaw,h+.035,[[x-dx*.78,z-dz*.78],[x+dz*.68,z-dx*.68],[x-dz*.68,z+dx*.68]])}
 for(let x of [3.55,4.8,6.05]){stool(x,-.48,0);stool(x,1.38,Math.PI)}
 B(2.58,1.15,.45,.18,.17,.16,'white');
 move(islandStart,4,3.19,.78);
 const boothStart=capture();
 for(let x of [1.72,3.82,5.92]){
  B(x,.012,-2.47,1.98,.024,2.18,'charcoal');B(x,.75,-2.48,.90,.065,1.58,'cream',true);for(let z of [-2.99,-1.98])B(x,.36,z,.10,.72,.10,'black');
  for(let side of [-1,1]){let bx=x+side*.70;B(bx,.22,-2.49,.51,.44,1.78,'white',true);B(bx,.47,-2.49,.53,.11,1.78,'green');B(bx+side*.24,.78,-2.49,.13,.62,1.78,'green');for(let y of [1.30,1.95,2.55])B(bx+side*.27,y,-2.49,.10,.59,1.78,'acoustic');for(let z of [-2.18,-2.91])S(bx-side*.05,z,-side*Math.PI/2,.525,[[bx,-1.36],[bx-side*.3,-1.32]],'sofa')}
  B(x,1.50,-3.59,1.98,2.65,.12,'darkPanel');B(x,.86,-2.98,.15,.15,.12,'white');C(x,2.72,-2.47,.07,.055,'black');B(x,2.48,-2.47,.015,.46,.015,'black');items.push({type:'pendant',x,y:2.23,z:-2.47});L(x,2.12,-2.47,0xffd49c,4.2)
 }
 for(let x of [.70,2.77,4.87,6.94])B(x,1.42,-2.48,.075,2.84,2.16,'green',true);
 move(boothStart,3.7,-.65,.80);
 const windowDeskStart=capture();
 B(8.99,.78,-.6,.75,.07,4.65,'wood',true);for(let z of [-2.70,1.53])B(8.99,.38,z,.055,.76,.055,'black');for(let z of [-2.32,-1.20,-.08,1.05])stool(8.20,z,Math.PI/2,false);
 move(windowDeskStart,5.2,1.95);
 // White open shelves, storage and waste bin.
 const shelfStart=capture();
 B(8.43,1.18,-3.57,1.65,2.25,.045,'white');for(let x of [7.62,9.24])B(x,1.18,-3.29,.045,2.25,.60,'white',true);
 for(let y of [.72,1.34,1.99])B(8.43,y,-3.29,1.58,.045,.54,'white');for(let j=0;j<8;j++)B(7.83+j*.16,1.48,-3.29,.11,.23,.18,['cream','blue','yellow','white'][j%4]);
 B(7.9,.32,-3.25,.46,.64,.45,'cabinet',true);B(7.9,.65,-3.25,.49,.08,.48,'black');
 move(shelfStart,4.15,1.80);
 // Slim columns and lighting follow the corrected aisle layout.
 for(let x of [1.00,3.9])B(x,1.4,-.78,.07,2.8,.07,'black',true);
 B(7.03,2.62,mid,.27,.27,depth-.25,'charcoal');B(.22,2.63,mid,.28,.29,depth-.25,'charcoal');
 for(let z of [-6,-3.8,-1.5,.85]){B(5.9,2.72,z,.16,.035,.16,'warm');L(5.9,2.61,z)}
 for(let x of [3.90,5]){B(x,2.61,-.55,.075,.08,3.86,'black');B(x,2.56,-.55,.045,.025,3.78,'warm')}
 for(let z of [-2.48,1.38]){B(4.45,2.61,z,1.10,.08,.075,'black');B(4.45,2.56,z,1.02,.025,.045,'warm')}
 B(4.6,2.71,-7,.045,.06,.8,'black');L(4.6,2.63,-6.65);
 return {items,solids,seats};
}
function buildKitchen(parent,colliders,seats){
 const root=new T.Group();root.name='Kitchen';root.position.set(KITCHEN_X,0,KITCHEN_Z);parent.add(root);
 const palette={ivory:0xe5e0d6,white:0xf5f3ef,black:0x242526,charcoal:0x373a3c,cabinet:0x646d76,counter:0x202225,steel:0xa2abb0,sink:0x24292d,darkGlass:0x17242c,wood:0x96694b,green:0x385b55,acoustic:0xb8ada5,darkPanel:0x5e5955,grout:0xbab6af,window:0x8ab1ce,sky:0xaac8e0,building:0x9299a2,blue:0x407da6,cream:0xe5ddbf,ceramic:0xb79f86,yellow:0xe4bf38,soap:0x96b965,warm:0xffedce};
 const materials=Object.fromEntries(Object.entries(palette).map(([k,c])=>[k,mat(c,k==='counter'?.23:k==='steel'?.3:.8,k==='steel'?.65:0)]));
 materials.window=new T.MeshStandardMaterial({color:palette.window,transparent:true,opacity:.34,roughness:.24,depthWrite:false});materials.warm=glow(palette.warm);materials.sky=glow(palette.sky);
 const B=(g,x,y,z,w,h,d,c)=>box(g,materials[c],w,h,d,x,y,z);
 const C=(g,x,y,z,r,h,c,r2=r)=>mesh(g,new T.CylinderGeometry(r2,r,h,12),materials[c],x,y,z);
 const data=kitchenLayout();
 for(const a of data.items){
  if(a.type==='box')B(root,a.x,a.y,a.z,a.w,a.h,a.d,a.c);
  if(a.type==='cyl')C(root,a.x,a.y,a.z,a.r,a.h,a.c,a.r2);
  if(a.type==='light'){const l=new T.PointLight(a.color,a.intensity,6,1.8);l.position.set(a.x,a.y,a.z);root.add(l)}
  if(a.type==='pendant'){mesh(root,new T.SphereGeometry(.19,16,10,0,Math.PI*2,0,Math.PI*.72),new T.MeshStandardMaterial({color:0xe2b275,transparent:true,opacity:.54,side:T.DoubleSide,roughness:.25}),a.x,a.y,a.z);mesh(root,new T.SphereGeometry(.065,12,8),materials.warm,a.x,a.y-.065,a.z)}
  if(a.type==='stool'){let g=new T.Group();g.position.set(a.x,0,a.z);g.rotation.y=a.yaw;root.add(g);let h=a.h;let seat=mesh(g,new T.SphereGeometry(1,12,8),materials[a.c],0,h,0);seat.scale.set(.24,.045,.225);let back=mesh(g,new T.SphereGeometry(1,12,8),materials[a.c],0,h+.14,-.195);back.scale.set(.24,.18,.055);for(let xx of [-.17,.17])for(let zz of [-.16,.16]){let leg=B(g,xx,h/2,zz,.025,h,.025,'steel');leg.rotation.x=zz*.35;leg.rotation.z=-xx*.35}if(h>.6)B(g,0,.30,.17,.37,.022,.025,'steel')}
 }
 colliders.push(...data.solids);seats.push(...data.seats);
 return {kitchenRoot:root,kitchenBatchStats:batchGround(root,materials,[],[]),areas:[{x0:KITCHEN_X-.15,x1:KITCHEN_X+KITCHEN_WIDTH,z0:KITCHEN_Z+KITCHEN_NORTH,z1:KITCHEN_Z+KITCHEN_SOUTH,title:'Kitchen'}]};
}


 // Additive reference-video detail pass. No changes to approved geometry or seats.
 function addVideoDetails(parent,colliders,seats,areas){
  const materials={black:mat(0x22272a,.82),grey:mat(0x777d80,.85),white:mat(0xf0eee5,.84),paper:mat(0xe7e2d6,.96),pink:mat(0xb52960,.86),blue:mat(0x375a79,.85),green:mat(0x669352,.91),leaf:mat(0x3f6941,.92),olive:mat(0x7d945e,.90),wood:mat(0x9a704b,.87),steel:mat(0x92999a,.36,.55),cream:mat(0xd0c7b3,.76),yellow:mat(0xd4b330,.8),warm:glow(0xffeed5)};
  let count=0;const added=[];const root=new T.Group();root.name='Reference video details';parent.add(root);
  const sub=(x,y,z,rot=0)=>{let g=new T.Group();g.position.set(x,y,z);g.rotation.y=rot;root.add(g);return g};
  const b=(g,c,w,h,d,x=0,y=0,z=0)=>{count++;return box(g,materials[c],w,h,d,x,y,z)};
  const cy=(g,c,r,h,x,y,z)=>{count++;return mesh(g,new T.CylinderGeometry(r,r,h,12),materials[c],x,y,z)};
  const paper=(g,x,y,z,n=3)=>{for(let i=0;i<n;i++)b(g,'paper',.21,.009,.29,x+(i%2)*.008,y+.0045+i*.009,z)};
  const book=(g,x,y,z,c='blue')=>{b(g,c,.18,.024,.24,x,y+.012,z);b(g,'paper',.166,.017,.228,x,y+.014,z+.002)};
  const mouse=(g,x,y,z)=>{b(g,'black',.063,.028,.105,x,y+.014,z);b(g,'grey',.012,.004,.034,x,y+.03,z+.012)};
  const cup=(g,x,y,z,c='white')=>{cy(g,c,.041,.09,x,y+.045,z);cy(g,'grey',.033,.005,x,y+.092,z);b(g,c,.025,.044,.019,x+.047,y+.045,z)};
  const bag=(g,x,y,z,c='black')=>{b(g,c,.30,.36,.17,x,y+.18,z);b(g,c,.27,.12,.21,x,y+.105,z+.025);b(g,'grey',.22,.012,.025,x,y+.17,z+.12);for(let dx of [-.09,.09])b(g,'black',.035,.23,.026,x+dx,y+.18,z-.095);b(g,'black',.11,.035,.04,x,y+.37,z)};
  const planter=(g,x,y,z,r=.14,h=.40)=>{cy(g,'black',r,.20,x,y+.10,z);cy(g,'wood',r*.87,.015,x,y+.202,z);for(let i=0;i<9;i++){let a=i*2.399,rr=r*.78*(.45+(i%3)*.25);b(g,'leaf',.012,h*.68,.012,x+Math.cos(a)*rr*.35,y+.20+h*.34,z+Math.sin(a)*rr*.35);let o=mesh(g,new T.SphereGeometry(1,6,4),materials[i%3?'green':'olive'],x+Math.cos(a)*rr,y+.20+h*(.55+(i%4)*.12),z+Math.sin(a)*rr);o.scale.set(.055,.13,.032);o.rotation.z=Math.cos(a)*.95;o.rotation.x=Math.sin(a)*.85;count++}};
  const floorProp=(x,z,w,d,as,build)=>{
   if(!as.some(a=>x-w/2>=a.x0+.12&&x+w/2<=a.x1-.12&&z-d/2>=a.z0+.12&&z+d/2<=a.z1-.12))return false;
   if(colliders.some(c=>Math.abs(c.x-x)<(c.r??c.w/2)+w/2+.40&&Math.abs(c.z-z)<(c.r??c.d/2)+d/2+.40))return false;
   if(seats.some(s=>Math.hypot(s.x-x,s.z-z)<.90||s.approaches.some(a=>Math.hypot(a.x-x,a.z-z)<.72)))return false;
   const c={x,z,w,d};colliders.push(c);added.push(c);build(sub(x,0,z));return true;
  };
  const ground=(x,z,y=0,rot=0)=>sub(ACADEMY_DOOR_X+(x-704)/21.2,y,(z-790)/21.2,rot);
  const world=(x,z)=>[ACADEMY_DOOR_X+(x-704)/21.2,(z-790)/21.2];
  // Video 3938/3963: workstations, folders, mouse and desktop accessories.
  for(const [layout,ox,oy,oz,upper] of [[approvedLayout,ACADEMY_DOOR_X,0,0,false],[upperLayout,STAIR_X,2.96,STAIR_TOP,true]]){
   const desks=layout.items.filter(a=>a.type==='desk'),pcs=layout.items.filter(a=>a.type==='pc');
   for(const [i,a] of pcs.entries()){
    const table=desks.find(d=>Math.abs(a.x-d.x)<d.w/2+.05&&Math.abs(a.z-d.z)<d.d/2+.05);if(!table)continue;
    const angle=(a.rot||0)+(upper?Math.PI:0);
    let g=sub(a.x+ox,oy,a.z+oz,angle);
    const mx=a.x+Math.cos(angle)*.23+Math.sin(angle)*.10,mz=a.z-Math.sin(angle)*.23+Math.cos(angle)*.10;
    if(Math.abs(mx-table.x)<table.w/2-.04&&Math.abs(mz-table.z)<table.d/2-.04){mouse(g,.23,.783,.10)}
    const dx=Math.cos(angle)*.36,dz=-Math.sin(angle)*.36;
    if(!upper&&i%3===0&&Math.abs(a.x+dx-table.x)<table.w/2-.10&&Math.abs(a.z+dz-table.z)<table.d/2-.10){b(g,'black',.14,.31,.25,.36,.938,-.07);b(g,'grey',.08,.018,.009,.36,1.04,.059)}
   }
   if(!upper)for(const [i,d] of desks.entries()){
    if(d.z>0||d.w<.35||d.d<.35||pcs.some(a=>Math.abs(a.x-d.x)<d.w/2+.12&&Math.abs(a.z-d.z)<d.d/2+.12))continue;
    let g=sub(d.x+ox,oy,d.z+oz,d.rot||0);
    if(i%3===0){paper(g,0,.783,0,2);b(g,'black',.12,.012,.013,.10,.808,.09)}
    if(i%3===1&&d.w>.70){book(g,-d.w*.25,.783,0);b(g,'pink',.18,.066,.045,d.w*.24,.816,0)}
   }
  }
  // Library: add folder spines and paper stacks to existing shelving and cabinet.
  for(const a of approvedLayout.items.filter(a=>a.type==='shelf')){
   let g=sub(a.x+ACADEMY_DOOR_X,0,a.z,a.rot||0);
   for(let j=0;j<5;j++){let y=.245+j*.44;for(let k=0;k<3;k++)b(g,k%2?'white':'grey',.025,.065,.006,-a.w/2+.11+k*.10,y+.085,.125)}
  }
  {let g=ground(755,483);paper(g,-.18,1.178,0,4);book(g,.16,1.178,0,'blue')}
  // Backpack shelves near green alcoves and tall plant stands by windows.
  for(const [px,pz] of [[420,545],[425,543],[425,552],[417,550],[427,521]]){
   const [x,z]=world(px,pz);
   if(floorProp(x,z,.42,.46,areas,g=>{for(let dx of [-.19,.19])b(g,'grey',.035,1.85,.045,dx,.925,-.20);for(let j=0;j<4;j++){let y=.12+j*.43;b(g,'grey',.42,.045,.43,0,y,0);bag(g,0,y+.025,0,j===1?'blue':'black')}}))break;
  }
  for(const [px,pz] of [[724,255],[848,274],[611,274],[475,250]]){
   const [x,z]=world(px,pz);
   floorProp(x,z,.47,.47,areas,g=>{for(let xx of [-.20,.20])for(let zz of [-.20,.20])b(g,'black',.026,.88,.026,xx,.44,zz);b(g,'black',.44,.035,.44,0,.86,0);b(g,'black',.44,.035,.44,0,.12,0);planter(g,0,.88,0,.17,.54);planter(g,0,.14,0,.13,.30)});
  }
  for(const a of approvedLayout.items.filter(a=>a.type==='plant')){let g=sub(a.x+ACADEMY_DOOR_X,0,a.z);for(let i=0;i<4;i++)b(g,'leaf',.012,.38,.012,Math.cos(i*1.57)*.07,.44,Math.sin(i*1.57)*.07)}
  // Ground-floor overhead frames, cable trays, AC cassettes and projectors.
  for(const [px,pz,w,d] of [[692,387,1.50,3.65],[781,387,1.50,3.65],[483,389,2.5,1.25],[131,300,3.7,1.65],[300,285,3.9,1.65]]){
   let g=ground(px,pz);
   for(let side of [-1,1]){b(g,'black',.055,.095,d,side*w/2,2.66,0);b(g,'warm',.023,.018,d-.06,side*w/2,2.602,0);b(g,'black',w,.095,.055,0,2.66,side*d/2);b(g,'warm',w-.06,.018,.023,0,2.602,side*d/2);for(let dx of [-w/2,w/2])b(g,'steel',.016,.14,.016,dx,2.78,side*d/2)}
  }
  for(const [px,pz,d] of [[425,508,2.0],[600,300,3.8],[905,292,3.8],[330,414,2.5]]){
   let g=ground(px,pz);b(g,'black',.26,.15,d,0,2.71,0);for(let i=0;i<Math.floor(d/.22);i++){let z=-d/2+.12+i*.22;b(g,'grey',.04,.035,.028,-.12,2.69,z);b(g,'grey',.04,.035,.028,.12,2.69,z)}
  }
  for(const [px,pz] of [[128,272],[300,257]]){
   let g=ground(px,pz);b(g,'white',.82,.11,.82,0,2.79,0);b(g,'grey',.63,.025,.63,0,2.72,0);for(let i=0;i<7;i++)b(g,'white',.59,.024,.026,0,2.70,(i-3)*.085);
   b(g,'steel',.028,.24,.028,0,2.75,.95);b(g,'white',.30,.10,.23,0,2.59,.95);b(g,'black',.075,.045,.012,0,2.59,1.073);
  }
  // Entry footage: plants beside lounge, reception papers and cup.
  for(const [x,z] of [[-13.85,10.65],[-13.85,17.38]])floorProp(x+ENTRANCE_OFFSET,z,.42,.42,[{x0:-14.4+ENTRANCE_OFFSET,x1:5.35+ENTRANCE_OFFSET,z0:10.24,z1:17.76}],g=>planter(g,0,0,0,.19,.82));
  {let g=sub(-.30+ENTRANCE_OFFSET,1.074,11.1);paper(g,-.75,0,0,4);cup(g,.89,0,0)}
  // Ada footage: chalk, eraser, small electrical sockets on long desk rows.
  {let g=sub(ADA_FRONT_X-1.5,0,ADA_RIGHT_Z+6,Math.PI/2);
   b(g,'white',.085,.012,.013,-1.1,.574,1.05);b(g,'grey',.12,.035,.05,-.68,.57,1.05);
   for(let row=0;row<7;row++){let z=-2.7-row*1.75,base=adaLayout.height(z);for(let x of [-3,0,3]){b(g,'grey',.09,.012,.055,x,base+.799,z+.20);for(let dx of [-.022,.022])b(g,'black',.012,.003,.015,x+dx,base+.806,z+.20)}}
  }
  // Kitchen footage: cutting board, tissues, additional small table accessories.
  {let g=sub(KITCHEN_X,0,KITCHEN_Z);b(g,'wood',.19,.018,.26,6.83,.988,-2.35);b(g,'cream',.17,.028,.11,6.84,1.006,-2.35);for(let z of [-2.026,-3.706,-5.386]){b(g,'white',.10,.08,.10,1.65,.822,z);b(g,'paper',.055,.025,.055,1.65,.874,z)}}
  return {root,stats:batchGround(root,materials,[],[]),count,added};
 }

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
 const approved=buildApprovedGround(g,colliders,seats);
 const chairFabric=mat(0x414143,.9),frosted=new T.MeshStandardMaterial({color:0xb7d0cd,transparent:true,opacity:.66,roughness:.84,depthWrite:false}),screen=mat(0x20272c,.48),greenLeaves=mat(0x658e58,.9);
 // Approved second-floor plan, using the real stair top as origin.
 const upstairs=buildApprovedUpper(g);
 const ada=buildAda(g,colliders,seats);
 const kitchen=buildKitchen(g,colliders,seats);approved.areas.push(...kitchen.areas);
 const {upperColliders,upperSeats}=upstairs;
 let hallLight=new T.PointLight(0xffecd2,14,19,1.3);hallLight.position.set(0,4.4,-6.2);g.add(hallLight);
 let corridorLight=new T.PointLight(0xffe2b6,8,13,1.4);corridorLight.position.set(ACADEMY_DOOR_X,3.7,4);g.add(corridorLight);
 // Local electrical circuits: physical switches on wall/column and independently dimmed light sources.
 const circuits=[
 {id:'plaza',name:'Reception',x:5.32+ENTRANCE_OFFSET,z:14.4,y:1.16,face:-Math.PI/2,test:o=>o.position.z>10&&o.position.z<=18},
 {id:'entrance',name:'Entrance',x:5.332+ENTRANCE_OFFSET,z:6.6,y:1.16,face:-Math.PI/2,test:o=>o.position.z>0&&o.position.z<=10},
 {id:'lounge',name:'Lounge',x:ACADEMY_DOOR_X+(833-704)/21.2-.12,z:-.35,y:1.16,face:-Math.PI/2,test:o=>o.position.z<=0&&o.position.z>=-10.94},
 {id:'workspace',name:'Workspace',x:ACADEMY_DOOR_X+(937-704)/21.2-.13,z:-25,y:1.16,face:-Math.PI/2,test:o=>o.position.z<-10.94}
 ];
 const v=new T.Vector3();g.updateMatrixWorld(true);for(const c of circuits){c.on=true;c.lights=[];c.fixtures=[];g.traverse(o=>{for(let p=o;p;p=p.parent)if(p===upstairs.upperRoot)return;if(o.isLight&&c.test({position:o.getWorldPosition(v)}))c.lights.push({light:o,intensity:o.intensity});if(o.isMesh&&[warm,wallLamp,approved.fixtures].includes(o.material)&&c.test({position:o.getWorldPosition(v)})){o.material=o.material.clone();c.fixtures.push({material:o.material,color:o.material.color.clone()})}});
  let sw=new T.Group();sw.position.set(c.x,c.y,c.z);sw.rotation.y=c.face;g.add(sw);box(sw,white,.135,.19,.035,0,0,0);c.rocker=box(sw,black,.075,.11,.038,0,0,.025);c.indicator=box(sw,new T.MeshBasicMaterial({color:0x77e6b2}),.023,.015,.009,0,.062,.049);c.handle=sw;c.approachX=c.x+(c.face>0?.40:-.40);
 }
 const videoDetails=addVideoDetails(g,colliders,seats,approved.areas);
 const lightBudget=createLightBudget(g,scene);
 return {upperColliders,upperSeats,level:0,door,plazaDoor,plazaOpen:false,plazaAngle:0,colliders,seats,circuits,open:false,angle:0,lightBudget,videoDetailStats:{count:videoDetails.count,batch:videoDetails.stats},...approved,...upstairs,...ada,kitchenRoot:kitchen.kitchenRoot,kitchenBatchStats:kitchen.kitchenBatchStats};
}
export function doorNearby(state,x,z){return Math.abs(x-ACADEMY_DOOR_X)<1.6&&Math.abs(z)<1.7}
export function advanceDoor(state,dt){state.angle=T.MathUtils.damp(state.angle,state.open?Math.PI*.53:0,7,dt);state.door.rotation.y=-state.angle;state.plazaAngle=T.MathUtils.damp(state.plazaAngle,state.plazaOpen?Math.PI*.53:0,7,dt);state.plazaDoor.rotation.y=-state.plazaAngle;for(const d of [...(state.interiorDoors||[]),...(state.upperDoors||[])]){d.angle=T.MathUtils.damp(d.angle,d.open?1.5:0,7,dt);d.leaf.rotation.y=-d.angle}}
export function nearbyInteriorDoor(state,x,z){return ((state.level===1?state.upperDoors:state.interiorDoors)||[]).filter(d=>Math.hypot(d.x-x,d.z-z)<1.55).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0]||null}
// Broad phase collision grid. Geometry remains unchanged; only nearby candidates
// are checked during movement, camera avoidance and seat approach tests.
function hitsCollider(list,x,z,r){
 if(!list)return false;
 const cell=2;let index=collisionIndices.get(list);
 if(!index){index=new Map();for(const c of list){let hw=c.r??c.w/2,hd=c.r??c.d/2;for(let ix=Math.floor((c.x-hw)/cell);ix<=Math.floor((c.x+hw)/cell);ix++)for(let iz=Math.floor((c.z-hd)/cell);iz<=Math.floor((c.z+hd)/cell);iz++){let k=ix+','+iz;let a=index.get(k);if(!a)index.set(k,a=[]);a.push(c)}}collisionIndices.set(list,index)}
 for(let ix=Math.floor((x-r)/cell);ix<=Math.floor((x+r)/cell);ix++)for(let iz=Math.floor((z-r)/cell);iz<=Math.floor((z+r)/cell);iz++){const a=index.get(ix+','+iz);if(!a)continue;for(const c of a){if(c.r!==undefined?Math.hypot(x-c.x,z-c.z)<c.r+r:Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r)return true}}
 return false;
}
const collisionIndices=new WeakMap();
export function academyWalkable(state,x,z,r=.27){
 const stair=onAcademyStairs(x,z,r);
 if(state.level===1){
  if(stair)return true;
  if(![[0,0],[-r,0],[r,0],[0,-r],[0,r]].every(([dx,dz])=>state.upperAreas.some(a=>x+dx>=a.x0&&x+dx<=a.x1&&z+dz>=a.z0&&z+dz<=a.z1)))return false;
  if((state.upperDoors||[]).some(d=>d.angle<1.2&&(Math.abs(Math.sin(d.rot))>.5?Math.abs(x-d.x)<.10+r&&Math.abs(z-d.z)<.58+r:Math.abs(z-d.z)<.10+r&&Math.abs(x-d.x)<.58+r)))return false;
  return !hitsCollider(state.upperColliders,x,z,r);
 }
 if(inAdaAccess(x,z)&&x<ADA_DOOR_X-.03){
  if((state.interiorDoors||[]).some(d=>d.angle<1.2&&(Math.abs(Math.sin(d.rot))>.5?Math.abs(x-d.x)<.10+r&&Math.abs(z-d.z)<.58+r:Math.abs(z-d.z)<.10+r&&Math.abs(x-d.x)<.58+r)))return false;
  return !hitsCollider(state.colliders,x,z,r);
 }
 if(stair)return true;
 if(x>STAIR_LEFT-r&&x<STAIR_RIGHT+r&&z>=STAIR_TOP&&z<=STAIR_BOTTOM)return false;
 if(z>34.65-r||z< -45.45+r)return false;
 const ex=x-ENTRANCE_OFFSET,ax=Math.abs(ex),inside=(l,h,f,n)=>ex>=l+r&&ex<=h-r&&z>=f+r&&z<=n-r;
 if(z>23.24){if(ax>10.7-r)return false}
 else if(z>18.24){if(ax>2.8-r)return false}
 else if(z>=17.76){if(ax>1.20-r)return false}
 else if(z>10.24){if(ex< -14.40+r||ex>5.35-r)return false}
 else if(z>.29){const main=inside(3.35,5.35,-.1,10.7),right=inside(4.35,10.25,2.85,5.15),left=inside(-1.85,4.35,3.05,5.15);if(!main&&!right&&!left)return false;} else if(z<-.29&&!state.areas.some(a=>x>=a.x0&&x<=a.x1&&z>=a.z0&&z<=a.z1))return false;
 if(Math.abs(z-23)<.24+r&&(ex<r||ex>1-r||state.plazaAngle<1.2))return false;
 if(Math.abs(z-18)<.24+r&&ax>1.20-r)return false;
 if(Math.abs(z)<.29+r&&(x<ACADEMY_DOOR_X-.60+r||x>ACADEMY_DOOR_X+.60-r||state.angle<1.2))return false;
 if((state.interiorDoors||[]).some(d=>d.angle<1.2&&(Math.abs(Math.sin(d.rot))>.5?Math.abs(x-d.x)<.10+r&&Math.abs(z-d.z)<.58+r:Math.abs(z-d.z)<.10+r&&Math.abs(x-d.x)<.58+r)))return false;
 return !hitsCollider(state.colliders,x,z,r);
}

// Choose reachable seat approaches only; never walk through a different obstacle to reach one.
export function nearestAcademySeat(state,x,z,maxDistance=1.55){let best=null;for(const seat of (state.level===1?state.upperSeats:state.seats)||[]){for(const a of seat.approaches){let distance=Math.hypot(x-a.x,z-a.z);if(distance>maxDistance||best&&distance>=best.distance||!academyWalkable(state,a.x,a.z))continue;let clear=true;for(let i=1;i<=12;i++){let t=i/12;if(!academyWalkable(state,x+(a.x-x)*t,z+(a.z-z)*t)){clear=false;break}}if(clear)best={seat,approach:a,distance}}}return best}

export function nearbyLightSwitch(state,x,z,max=1.30){if(state.level===1)return null;let found=null,d=max;for(const c of state.circuits||[]){const n=Math.hypot(x-c.approachX,z-c.z);if(n<d&&academyWalkable(state,c.approachX,c.z)){let clear=true;for(let k=1;k<=10;k++){const t=k/10;if(!academyWalkable(state,x+(c.approachX-x)*t,z+(c.z-z)*t)){clear=false;break}}if(clear){d=n;found=c}}}return found}
export function setLightCircuit(c,on){c.on=!!on;for(const a of c.lights)a.light.intensity=a.intensity*(c.on?1:0);for(const a of c.fixtures)a.material.color.copy(a.color).multiplyScalar(c.on?1:.035);c.rocker.rotation.x=c.on?-.15:.15;c.indicator.material.color.setHex(c.on?0x77e6b2:0x682e27)}

export function academyGround(x,z,level=0){if(level===0&&inAdaHall(x,z))return adaLayout.height(x-ADA_FRONT_X+1.5);if(onAcademyStairs(x,z,-.03)){if(z>=STAIR_BOTTOM)return 0;if(z<=STAIR_TOP)return 2.96;const step=(STAIR_BOTTOM-STAIR_TOP)/16;return Math.min(2.96,Math.max(0,(Math.floor((STAIR_BOTTOM-z)/step)+1)*2.96/16))}if(level===1)return 2.96;if(z>=22.28)return -1.8;if(z<=18.68)return 0;return -1.8+.18*Math.min(10,Math.max(1,Math.floor((22.28-z)/.36)+1))}
export function plazaDoorNearby(state,x,z){return Math.abs(x-(.5+ENTRANCE_OFFSET))<1.65&&Math.abs(z-23)<1.65}
