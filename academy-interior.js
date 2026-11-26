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
 R(574,558,833,790,'Main lounge','tile',5.6);W(574,558,574,790,5.6);W(833,558,833,790,5.6,'charcoal');W(574,790,690,790,5.6);W(718,790,833,790,5.6);door(X(704),Z(790),0,'Picsart Academy','glass');
 // Stair footprint from x577..615 and y615..771.
 for(let i=0;i<16;i++){let z=771-(i+.5)*9.75;B(577,z-4.875,615,z+4.875,(i+1)*.19-.08,.16,'black')}
 items.push({type:'stairrail',x:X(616),z:Z(771)});solids.push({x:X(596),z:Z(693),w:M(38),d:M(156)});
 // Vintage technology and Ada behind stairs, visible in original video, not represented separately in plan.
 B(577,572,596,612,.46,.92,'marble',true);B(580,580,590,590,.28,.44,'old');B(581,594,592,604,.46,.43,'old');B(595,573,598,576,1.36,2.72,'black',true);
 door(X(575),Z(589),Math.PI/2,'Ada Lovelace');
 S('WHERE TO GO|CLASSROOMS',575,1.65,757,.70,.82,Math.PI/2);
 // S-shaped sofa exactly follows the corrected picture.
 const points=[[700,615],[712,627],[715,642],[710,657],[702,678],[695,699],[694,719],[698,734],[708,747]].map(([x,z])=>[X(x),Z(z)]);
 items.push({type:'sofa',points});for(let i=0;i<points.length-1;i++){let [x,z]=points[i],[a,b]=points[i+1];for(let j=0;j<4;j++){let f=j/4;solids.push({x:x+(a-x)*f,z:z+(b-z)*f,w:1.72,d:1.72})}}
 B(772,615,826,779,.025,.045,'charcoal');
 for(let z of [648,700,752]){D(791,z-21,808,z+21,'charcoal');for(let x of [783,818]){B(x-5,z-21,x+5,z+21,.46,.10,'wood',true);B(x-4,z-20,x+4,z+20,.22,.39,'wood')}}
 S('Picsart Academy',831,3.5,697,M(154),.9,-Math.PI/2,'charcoal');
 for(let z of [595,645,695,745])light(X(704),Z(z),5.1,'rect');
 // Main workspace + extended left wing, traced from visible outline. No detached floor labels.
 R(492,203,937,558,'Workspace / offices');R(44,218,215,448,'White classroom');R(215,214,382,458,'Wood classroom');R(44,448,492,558,'Left corridor');R(382,203,492,448,'Workspace connection');R(215,448,382,458,'Glass classroom edge');
 // Exterior walls (windows on rear line); front left wall from x34 to x574.
 W(44,218,44,558);W(44,218,215,218);W(215,214,382,214);W(382,214,382,203);W(382,203,937,203);
 W(937,203,937,558);W(833,558,937,558);W(34,558,574,558);
 // White classroom opens into lower corridor at marked green doorway.
 W(44,448,170,448);W(199,448,215,448);door(X(184.5),Z(448),0,'White classroom','glass');
 W(215,214,215,458);W(382,245,382,458);door(X(382),Z(229.5),Math.PI/2,'Wood classroom','glass');G(215,458,382,458);
 // Blinds and classroom desks exactly at the pictured positions, with chairs facing the tables.
 for(let x of [78,132,186])win(X(x),Z(219),M(50));
 for(let x of [242,298,354])win(X(x),Z(215),M(49));
 for(let x of [435,492,555,618,681,744,807,870,915])win(X(x),Z(204),M(56));
 for(let z of [323,357,391,425])for(let x of [91,171]){D(x-23,z-7,x+23,z+7);for(let dx of [-11,11])C(x+dx,z-17,0)}
 for(let z of [267,299,333])for(let x of [261,341]){D(x-24,z-7,x+24,z+7,'wood');for(let dx of [-11,11])C(x+dx,z-17,0)}
 B(45,249,48,310,1.6,1.1,'white');B(217,224,220,281,1.6,1.1,'white');
 // Bottom corridor desk and green seating alcoves in a horizontal row as drawn.
 D(259,533,390,548);for(let x of [272,301,333,364])C(x,515,0);
 S('HACK THE LIMITS',324,1.8,556,M(132),.42,Math.PI,'ivory');
 for(let x of [457,506,555]){B(x-22,527,x+22,549,.25,.50,'olive',true);B(x-22,544,x+22,549,.76,.55,'olive');B(x-22,548,x+22,552,1.36,2.72,'ivory',true)}
 B(480,550,558,555,.54,1.08,'white',true);
 // Central tables: two wide horizontal and two vertical white communal sets.
 for(let z of [376,417]){D(438,z-17,529,z+17);for(let x of [437,490,542]){if(x===437&&z===376)continue;C(x,z+13,x===542?-Math.PI/2:Math.PI)}}
 for(let [x,z] of [[490,361],[490,385],[490,408],[542,361],[542,385],[542,408],[542,429]])C(x,z,Math.PI/2);
 for(let x of [569,604]){D(x-9,353,x+9,438);for(let dx of [-13,13])B(x+dx-2,349,x+dx+2,442,.47,.085,'white',true)}
 // Rear independent workstations and four seats at the long desk.
 D(514,211,686,227);for(let x of [548,595,631,667]){C(x,245,Math.PI);P(x,220,Math.PI)}
 D(876,223,915,235);C(896,255,Math.PI);P(896,228,Math.PI);
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
 for(let x of [95,165,265,335,421,515,610,700,800,895])for(let z of [265,365,525]){if((x<215&&z===525)||(x>=215&&x<382&&z===525)||x>=382||z!==525)light(X(x),Z(z))}
 // User plan coordinates are the layout authority; use reachable standing positions rather than old checkpoints.
 return {items,solids,areas,names,checkpoints:[CP('Entrance',704,890),CP('Lobby',650,740),CP('Ada',635,589),CP('Workspace',630,510),CP('Left corridor',230,495),CP('White classroom',128,440),CP('Wood classroom',300,235),CP('Window aisle',720,270),CP('Office 1',712,460),CP('Office 2',850,460)]};

})();

export const STAIR_X=ACADEMY_DOOR_X+(596-704)/21.2,STAIR_TOP=(615-790)/21.2,STAIR_BOTTOM=(771-790)/21.2;
const STAIR_HALF=19/21.2,UPPER_DX=STAIR_X+5.45,UPPER_DZ=STAIR_TOP+8.65;
function buildApprovedGround(parent,colliders,seats){
 const scene=new T.Group();scene.position.x=ACADEMY_DOOR_X;parent.add(scene);const data=approvedLayout;
 const palette={ivory:0xe0dcd2,white:0xf3f3ed,black:0x252528,charcoal:0x414143,concrete:0x77716b,wood:0xb77d47,olive:0x666e48,acoustic:0xc8c1b7,green:0x6eb954,blue:0x4286b1,yellow:0xd5b52a,old:0xc8c3af,marble:0xc4c1b7,warm:0xffebc6,pink:0xad2059,glass:0x98b6b8,frost:0xb7d0cd};
const materials={};for(const [k,c] of Object.entries(palette))materials[k]=k==='warm'?new T.MeshBasicMaterial({color:c}):new T.MeshStandardMaterial({color:c,roughness:k==='wood'?.68:.84,transparent:k==='glass'||k==='frost',opacity:k==='glass'?.24:k==='frost'?.66:1,depthWrite:k!=='glass'&&k!=='frost'});
function cube(x,y,z,w,h,d,c,parent=scene){const o=new T.Mesh(new T.BoxGeometry(w,h,d),typeof c==='string'?materials[c]:c);o.position.set(x,y,z);parent.add(o);return o}
function group(x,z,rot=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);return g}
const roof=[],doors=[],computers=[];let rng=123;const rand=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
function tile(kind){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=kind==='dark'?'#353230':'#c9c4bb';ctx.fillRect(0,0,256,256);for(let i=0;i<3500;i++){ctx.fillStyle=rand()>.5?'#ffffff09':'#0000000a';ctx.fillRect(rand()*256,rand()*256,rand()*16+1,1)}ctx.strokeStyle=kind==='dark'?'#8b8172':'#aaa69f';ctx.lineWidth=1.5;ctx.strokeRect(1,1,254,254);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t}
function plaque(t,w,h,c){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;let ctx=canvas.getContext('2d');ctx.fillStyle='#'+palette[c].toString(16).padStart(6,'0');ctx.fillRect(0,0,1024,256);ctx.fillStyle=c==='ivory'?'#292929':'white';ctx.font='bold '+(t.includes('|')?62:100)+'px Arial';ctx.textAlign='center';ctx.textBaseline='middle';const lines=t.split('|');lines.forEach((l,i)=>ctx.fillText(l,512,128+(i-(lines.length-1)/2)*86,980));const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,side:T.DoubleSide}))}
function cylinder(x,y,z,r,h,c,g=scene){let o=new T.Mesh(new T.CylinderGeometry(r,r,h,12),materials[c]);o.position.set(x,y,z);g.add(o);return o}
for(const a of data.items){if(a.type==='floor'&&a.z>0||a.type==='door'&&a.z===0||a.type==='box'&&a.z>0||a.type==='light'&&a.z>0)continue;const {x,y,z,w,h,d,c,rot=0}=a;
 if(a.type==='floor'){const map=tile(a.kind);map.repeat.set(w/.8,d/.8);const o=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({map,roughness:.66}));o.rotation.x=-Math.PI/2;o.position.set(x,0,z);scene.add(o)}
 if(a.type==='box'){const o=cube(x,y,z,w,h,d,c);if(a.ceiling)roof.push(o)}
 if(a.type==='sign'){let o=plaque(a.t,w,h,a.c);o.position.set(x,y,z);o.rotation.y=rot;scene.add(o)}
 if(a.type==='light'){const o=cube(x,y,z,a.kind==='rect'?2.3:.16,.035,a.kind==='rect'?1.1:.16,'warm');roof.push(o);if(a.kind!=='wall'){const p=new T.PointLight(0xffebd2,a.kind==='rect'?11:5,6,1.8);p.position.set(x,y-.13,z);scene.add(p)}}
 if(a.type==='door'){let g=group(x,z,rot);for(let xx of [-.63,.63])cube(xx,1.18,0,.09,2.36,.14,'black',g);cube(0,2.35,0,1.35,.09,.14,'black',g);let leaf=new T.Group();leaf.position.x=.58;g.add(leaf);cube(-.58,1.13,0,1.14,2.26,.055,a.color==='glass'?'frost':'white',leaf);if(a.color==='glass'){for(let xx of [-1.12,-.04])cube(xx,1.13,.02,.08,2.26,.085,'black',leaf);for(let yy of [.06,2.2])cube(-.58,yy,.02,1.14,.12,.085,'black',leaf)}cube(-1.01,1.05,.06,.09,.32,.06,'black',leaf);if(a.t){let p=plaque(a.t,1.1,.19,a.t==='Ada Lovelace'?'wood':'pink');p.position.set(0,2.53,.095);g.add(p)}if(a.t!=='Ada Lovelace')doors.push({x:x+ACADEMY_DOOR_X,z,rot,leaf,open:false,angle:0})}
 if(a.type==='desk'){let g=group(x,z,rot);cube(0,.75,0,w,.065,d,a.col,g);for(let xx of [-w/2+.06,w/2-.06])for(let zz of [-d/2+.06,d/2-.06])cube(xx,.35,zz,.045,.70,.045,'black',g)}
 if(a.type==='chair'){let g=group(x,z,rot);cube(0,.47,0,.49,.10,.46,'charcoal',g);cube(0,.77,-.22,.46,.48,.055,'charcoal',g);for(let xx of [-.25,.25]){cube(xx,.62,-.03,.04,.24,.045,'black',g);cube(xx,.73,.03,.04,.05,.33,'black',g)}cylinder(0,.24,0,.04,.42,'black',g);for(let i=0;i<5;i++){let ang=i*Math.PI*2/5;let b=cube(Math.sin(ang)*.10,.06,Math.cos(ang)*.10,.035,.035,.26,'black',g);b.rotation.y=ang;cylinder(Math.sin(ang)*.23,.035,Math.cos(ang)*.23,.035,.06,'black',g)}}
 if(a.type==='pc'){let g=group(x,z,rot);const display=new T.MeshStandardMaterial({color:0x20272c,roughness:.48});cube(0,1.09,-.16,.51,.30,.055,display,g);computers.push({x,z,rot,display,on:false});cube(0,.90,-.16,.04,.18,.05,'black',g);cube(0,.795,-.16,.25,.025,.15,'black',g);cube(0,.79,.10,.32,.025,.12,'black',g)}
 if(a.type==='shelf'){let g=group(x,z,rot),col=a.metal?'black':'wood';cube(0,1.1,-d/2,w,2.2,.045,col,g);for(let xx of [-w/2,w/2])cube(xx,1.1,0,.045,2.2,d,col,g);for(let j=0;j<5;j++){let y=.22+j*.44;cube(0,y,0,w,.045,d,col,g);for(let k=0;k<Math.floor(w/.10)-1;k++){let h=.18+rand()*.15;cube(-w/2+.10+k*.10,y+.025+h/2,0,.067,h,.24,new T.MeshStandardMaterial({color:[0x8b7a6a,0x7d8e9e,0xa89b7b,0x526d65,0x9b6058][k%5]}),g)}}}
 if(a.type==='bags'){let g=group(x,z,rot);cube(0,.98,-.21,1.1,1.96,.055,'charcoal',g);for(let j=0;j<4;j++){cube(0,.12+j*.48,0,1.12,.045,.43,'charcoal',g);cube(.04,.32+j*.48,.025,.33,.34,.25,j%2?'black':'blue',g);cube(.04,.27+j*.48,.17,.25,.10,.07,'black',g)}}
 if(a.type==='window'){let g=group(x,z,rot);cube(0,1.5,0,w,2.9,.045,new T.MeshStandardMaterial({color:0x84a5bf,roughness:.28,emissive:0x36516c,emissiveIntensity:.25}),g);for(let xx of [-w/2,w/2,0])cube(xx,1.5,.05,.045,2.9,.07,'black',g);cube(0,.13,.05,w,.06,.07,'black',g);cube(0,1.25,.07,w,.055,.065,'black',g);cube(0,1.9,.10,w-.08,1.95,.035,new T.MeshStandardMaterial({color:0x777a7d,roughness:1}),g)}
 if(a.type==='plant'){let g=group(x,z);cylinder(0,.24,0,.20,.30,'black',g);for(let i=0;i<14;i++){let q=new T.Mesh(new T.SphereGeometry(1,7,5),materials.olive);q.position.set((rand()-.5)*.45,.65+rand()*.38,(rand()-.5)*.45);q.scale.set(.06,.23,.035);q.rotation.z=(rand()-.5)*2;g.add(q)}}
 if(a.type==='stairrail'){const p0=new T.Vector3(x,1,z),p1=new T.Vector3(x,3.95,z-6),v=p1.clone().sub(p0);let o=new T.Mesh(new T.CylinderGeometry(.027,.027,v.length(),12),materials.black);o.position.copy(p0).add(p1).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());scene.add(o);for(let i=0;i<9;i++){let q=i/8;cube(x,.50+q*2.9,z-q*6,.045,1,.045,'black');if(i<8)cube(x,.48+q*2.9,z-q*6-.36,.03,.76,.72,'glass')}}
 if(a.type==='sofa'){const curve=new T.CatmullRomCurve3(a.points.map(p=>new T.Vector3(p[0],0,p[1])));const gold=new T.MeshStandardMaterial({color:0xd6a02b,roughness:.92});function sweep(off,cy,rx,ry,mat){let v=[],ix=[];for(let i=0;i<=100;i++){let p=curve.getPointAt(i/100),d=curve.getTangentAt(i/100),nx=-d.z,nz=d.x;for(let j=0;j<16;j++){let t=j*Math.PI/8,dx=off+rx*Math.cos(t);v.push(p.x+nx*dx,cy+ry*Math.sin(t),p.z+nz*dx)}if(i)for(let j=0;j<16;j++){let a=(i-1)*16+j,b=(i-1)*16+(j+1)%16,c=i*16+j,d=i*16+(j+1)%16;ix.push(a,b,c,b,d,c)}}for(let j=1;j<15;j++)ix.push(0,j+1,j,1600,1600+j,1600+j+1);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(ix);geo.computeVertexNormals();scene.add(new T.Mesh(geo,mat))}sweep(0,.23,.93,.21,gold);for(let side of [-1,1]){sweep(side*.57,.44,.39,.13,gold);sweep(side*.22,.73,.18,.33,gold)}sweep(0,.91,.27,.08,materials.charcoal);for(let i=0;i<160;i++){let p=curve.getPointAt(rand()),o=new T.Mesh(new T.SphereGeometry(1,6,4),materials.olive);o.position.set(p.x+(rand()-.5)*.30,1.03+rand()*.22,p.z+(rand()-.5)*.30);o.scale.set(.035,.17,.025);o.rotation.z=(rand()-.5)*1.8;scene.add(o)}}
}

 const addSeat=(kind,x,z,yaw,height,computer=null,reach=.72)=>{const dx=Math.sin(yaw),dz=Math.cos(yaw);seats.push({kind,x:x+ACADEMY_DOOR_X,z,height,yaw,computer,approaches:[{x:x+ACADEMY_DOOR_X+dz*reach,z:z-dx*reach},{x:x+ACADEMY_DOOR_X-dz*reach,z:z+dx*reach},{x:x+ACADEMY_DOOR_X-dx*reach,z:z-dz*reach},{x:x+ACADEMY_DOOR_X+dx*reach,z:z+dz*reach}]})};
 for(const a of data.items){
  if(a.type==='chair'){const face=a.rot||0,fx=Math.sin(face),fz=Math.cos(face);let pc=computers.filter(p=>Math.hypot(p.x-a.x,p.z-a.z)<1.55&&(p.x-a.x)*fx+(p.z-a.z)*fz>.15).sort((p,q)=>Math.hypot(p.x-a.x,p.z-a.z)-Math.hypot(q.x-a.x,q.z-a.z))[0];addSeat('chair',a.x,a.z,face,.52,pc||null)}
  if(a.type==='sofa'){const curve=new T.CatmullRomCurve3(a.points.map(p=>new T.Vector3(p[0],0,p[1])));for(let i=1;i<=7;i++){let p=curve.getPointAt(i/8),d=curve.getTangentAt(i/8);for(let side of [-1,1]){let nx=-d.z*side,nz=d.x*side;addSeat('sofa',p.x+nx*.84,p.z+nz*.84,Math.atan2(nx,nz),.53,null,.77)}}}
  if(a.type==='box'&&a.c==='olive'&&a.h===.50)for(let dx of [-.42,.42])addSeat('alcove sofa',a.x+dx,a.z-.16,Math.PI,.51,null,.8);
  if(a.type==='box'&&a.c==='wood'&&a.h===.10&&a.z<0&&a.z>STAIR_TOP)addSeat('study bench',a.x,a.z,a.x>(808-704)/21.2?-Math.PI/2:Math.PI/2,.51);
  if(a.type==='box'&&a.c==='white'&&a.h===.085&&a.z<STAIR_TOP)for(let dz of [-1,0,1])addSeat('study bench',a.x,a.z+dz,a.x<0?Math.PI/2:-Math.PI/2,.52);
 }
 for(const c of data.solids)if(c.z<0)colliders.push({...c,x:c.x+ACADEMY_DOOR_X});
 cube(0,4.02,0,1.4,3.08,.22,'ivory');
 return {areas:data.areas.filter(a=>a.z0<0).map(a=>({...a,x0:a.x0+ACADEMY_DOOR_X,x1:a.x1+ACADEMY_DOOR_X})),interiorDoors:doors,fixtures:materials.warm};
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
 // Second floor: reference-based workspace, with an open route from the stair landing.
 const upper=new T.Group();upper.position.set(UPPER_DX,2.96,UPPER_DZ);g.add(upper);
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
 for(const x of [-8.96,8.96])box(upper,white,.18,2.60,7.2,x,1.30,-12.2);
 box(upper,white,18.0,2.6,.18,0,1.3,-15.8);box(upper,white,18.0,.15,7.2,0,2.65,-12.2);
 for(const [l,h] of [[-8.9,-6.45],[-4.45,8.9]]){box(upper,glass,h-l,.92,.055,(l+h)/2,.49,-8.65);box(upper,frame,h-l,.06,.07,(l+h)/2,.98,-8.65);}
 for(const c of upperColliders){c.x+=UPPER_DX;c.z+=UPPER_DZ}
 for(const a of upperSeats){a.x+=UPPER_DX;a.z+=UPPER_DZ;for(const p of a.approaches){p.x+=UPPER_DX;p.z+=UPPER_DZ}}
 let hallLight=new T.PointLight(0xffecd2,14,19,1.3);hallLight.position.set(0,4.4,-6.2);g.add(hallLight);
 let corridorLight=new T.PointLight(0xffe2b6,8,13,1.4);corridorLight.position.set(ACADEMY_DOOR_X,3.7,4);g.add(corridorLight);
 // Local electrical circuits: physical switches on wall/column and independently dimmed light sources.
 const circuits=[
 {id:'plaza',name:'Reception',x:5.32+ENTRANCE_OFFSET,z:14.4,y:1.16,face:-Math.PI/2,test:o=>o.position.z>10&&o.position.z<=18},
 {id:'entrance',name:'Entrance',x:5.332+ENTRANCE_OFFSET,z:6.6,y:1.16,face:-Math.PI/2,test:o=>o.position.z>0&&o.position.z<=10},
 {id:'lounge',name:'Lounge',x:ACADEMY_DOOR_X+(833-704)/21.2-.12,z:-.35,y:1.16,face:-Math.PI/2,test:o=>o.position.z<=0&&o.position.z>=-10.94},
 {id:'workspace',name:'Workspace',x:ACADEMY_DOOR_X+(937-704)/21.2-.13,z:-25,y:1.16,face:-Math.PI/2,test:o=>o.position.z<-10.94}
 ];
 const v=new T.Vector3();g.updateMatrixWorld(true);for(const c of circuits){c.on=true;c.lights=[];c.fixtures=[];g.traverse(o=>{if(o.isLight&&c.test({position:o.getWorldPosition(v)}))c.lights.push({light:o,intensity:o.intensity});if(o.isMesh&&[warm,wallLamp,approved.fixtures].includes(o.material)&&c.test({position:o.getWorldPosition(v)})){o.material=o.material.clone();c.fixtures.push({material:o.material,color:o.material.color.clone()})}});
  let sw=new T.Group();sw.position.set(c.x,c.y,c.z);sw.rotation.y=c.face;g.add(sw);box(sw,white,.135,.19,.035,0,0,0);c.rocker=box(sw,black,.075,.11,.038,0,0,.025);c.indicator=box(sw,new T.MeshBasicMaterial({color:0x77e6b2}),.023,.015,.009,0,.062,.049);c.handle=sw;c.approachX=c.x+(c.face>0?.40:-.40);
 }
 return {upperColliders,upperSeats,level:0,door,plazaDoor,plazaOpen:false,plazaAngle:0,colliders,seats,circuits,open:false,angle:0,...approved};
}
export function doorNearby(state,x,z){return Math.abs(x-ACADEMY_DOOR_X)<1.6&&Math.abs(z)<1.7}
export function advanceDoor(state,dt){state.angle=T.MathUtils.damp(state.angle,state.open?Math.PI*.53:0,7,dt);state.door.rotation.y=-state.angle;state.plazaAngle=T.MathUtils.damp(state.plazaAngle,state.plazaOpen?Math.PI*.53:0,7,dt);state.plazaDoor.rotation.y=-state.plazaAngle;for(const d of state.interiorDoors||[]){d.angle=T.MathUtils.damp(d.angle,d.open?1.5:0,7,dt);d.leaf.rotation.y=-d.angle}}
export function nearbyInteriorDoor(state,x,z){if(state.level===1)return null;return (state.interiorDoors||[]).filter(d=>Math.hypot(d.x-x,d.z-z)<1.55).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0]||null}
export function academyWalkable(state,x,z,r=.27){
 const stair=Math.abs(x-STAIR_X)<STAIR_HALF-r&&z>=STAIR_TOP-.30&&z<=STAIR_BOTTOM+.20;
 if(state.level===1){if(stair)return true;if(z>STAIR_TOP-r||z< -15.8+UPPER_DZ+r||Math.abs(x-UPPER_DX)>8.86-r)return false;return !state.upperColliders.some(c=>Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r)}
 if(stair)return true;
 if(Math.abs(x-STAIR_X)<STAIR_HALF+r&&z>=STAIR_TOP&&z<=STAIR_BOTTOM)return false;
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
 return !state.colliders.some(c=>c.r!==undefined?Math.hypot(x-c.x,z-c.z)<c.r+r:Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r);
}

// Choose reachable seat approaches only; never walk through a different obstacle to reach one.
export function nearestAcademySeat(state,x,z,maxDistance=1.55){let best=null;for(const seat of (state.level===1?state.upperSeats:state.seats)||[]){for(const a of seat.approaches){let distance=Math.hypot(x-a.x,z-a.z);if(distance>maxDistance||best&&distance>=best.distance||!academyWalkable(state,a.x,a.z))continue;let clear=true;for(let i=1;i<=12;i++){let t=i/12;if(!academyWalkable(state,x+(a.x-x)*t,z+(a.z-z)*t)){clear=false;break}}if(clear)best={seat,approach:a,distance}}}return best}

export function nearbyLightSwitch(state,x,z,max=1.30){if(state.level===1)return null;let found=null,d=max;for(const c of state.circuits||[]){const n=Math.hypot(x-c.approachX,z-c.z);if(n<d&&academyWalkable(state,c.approachX,c.z)){let clear=true;for(let k=1;k<=10;k++){const t=k/10;if(!academyWalkable(state,x+(c.approachX-x)*t,z+(c.z-z)*t)){clear=false;break}}if(clear){d=n;found=c}}}return found}
export function setLightCircuit(c,on){c.on=!!on;for(const a of c.lights)a.light.intensity=a.intensity*(c.on?1:0);for(const a of c.fixtures)a.material.color.copy(a.color).multiplyScalar(c.on?1:.035);c.rocker.rotation.x=c.on?-.15:.15;c.indicator.material.color.setHex(c.on?0x77e6b2:0x682e27)}

export function academyGround(x,z,level=0){if(Math.abs(x-STAIR_X)<STAIR_HALF+.03&&z>=STAIR_TOP-.30&&z<=STAIR_BOTTOM+.20)return z<STAIR_TOP+.32?2.96:Math.max(0,Math.min(2.96,(Math.floor((STAIR_BOTTOM-z)/((STAIR_BOTTOM-STAIR_TOP)/16))+1)*.19));if(level===1)return 2.96;if(z>=22.28)return -1.8;if(z<=18.68)return 0;return -1.8+.18*Math.min(10,Math.max(1,Math.floor((22.28-z)/.36)+1))}
export function plazaDoorNearby(state,x,z){return Math.abs(x-(.5+ENTRANCE_OFFSET))<1.65&&Math.abs(z-23)<1.65}
