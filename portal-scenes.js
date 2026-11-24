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
['05 / NETWORK','Follow the<br><em>signal.</em>','Travel through data streams and server infrastructure.'],
['06 / VERSION CONTROL','Every change<br><em>has a story.</em>','Follow branching commits into the next dimension.'],
['07 / ALGORITHMS','Find a<br><em>better path.</em>','Explore the structure of graphs and connected decisions.'],
['08 / OPERATING SYSTEM','Beyond the<br><em>kernel.</em>','Threads, processes and scheduling in motion.'],
['09 / DATABASE','Unlock<br><em>knowledge.</em>','Records and indexes connect the information around us.'],
['10 / CLOUD','Scale beyond<br><em>one machine.</em>','Distributed nodes exchange signals in a connected system.'],
['11 / SECURITY','Into the<br><em>deep core.</em>','Descend through layers of encryption and access control.'],
['12 / ACCESS GRANTED','Your world<br><em>is ready.</em>','One last gateway. Welcome to AcademyOne.']];
export function journeyCurve(){
 const knots=[[0,0,16],[0,0,-14],[0,0,-44],[0,0,-74],[0,0,-104],[0,0,-134],[5,0,-162],[29,1,-176],[62,1,-176],[95,1,-176],[126,0,-177],[151,-8,-182],[172,-23,-191],[190,-37,-200],[205,-40,-203]];
 const curve=new T.CatmullRomCurve3(knots.map(p=>new T.Vector3(...p)),false,'centripetal');curve.arcLengthDivisions=1600;curve.updateArcLengths();return curve;
}

/* Red signal atmosphere follows the complete curved route. */
function createSignalWind(scene,curve,length){
 const rng=rand(9182),samples=1024,frames=[],Y=new T.Vector3(0,1,0);
 for(let i=0;i<=samples;i++){
  const u=i/samples,c=curve.getPointAt(u),t=curve.getTangentAt(u).normalize(),r=new T.Vector3().crossVectors(t,Y).normalize(),up=new T.Vector3().crossVectors(r,t).normalize();
  frames.push({c,r,up});
 }
 const pos=[],uv=[],laneAttr=[],rights=[],ups=[],indices=[],lanes=7,segments=320;
 for(let lane=0;lane<lanes;lane++){
  let base=pos.length/3,offset=(lane-(lanes-1)/2)*1.8;
  for(let i=0;i<=segments;i++){
   let u=i/segments,f=frames[Math.round(u*samples)],x=offset+Math.sin(u*28+lane*1.8)*.55,y=3.2+(lane%3)*.92+.36*Math.sin(u*40+lane),width=.20+(lane%3)*.085;
   for(let side of [-1,1]){
    let point=f.c.clone().addScaledVector(f.r,x).addScaledVector(f.up,y+side*width);
    pos.push(...point.toArray());uv.push(u,side*.5+.5);laneAttr.push(lane);rights.push(...f.r.toArray());ups.push(...f.up.toArray());
   }
   if(i<segments){let a=base+i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2)}
  }
 }
 const ribbonGeo=new T.BufferGeometry();
 ribbonGeo.setAttribute('position',new T.Float32BufferAttribute(pos,3));ribbonGeo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));ribbonGeo.setAttribute('aLane',new T.Float32BufferAttribute(laneAttr,1));ribbonGeo.setAttribute('aRight',new T.Float32BufferAttribute(rights,3));ribbonGeo.setAttribute('aUp',new T.Float32BufferAttribute(ups,3));ribbonGeo.setIndex(indices);
 const ribbonMat=new T.ShaderMaterial({uniforms:{uTime:{value:0},uProgress:{value:0}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
 vertexShader:'uniform float uTime; attribute float aLane; attribute vec3 aRight; attribute vec3 aUp; varying vec2 vUv; varying float vLane; varying float vDepth; void main(){vUv=uv;vLane=aLane;vec3 p=position+aUp*(sin(uv.x*95.0-uTime*1.9+aLane*1.6)*.27)+aRight*(sin(uv.x*58.0-uTime*.8+aLane*2.4)*.35);vec4 mv=modelViewMatrix*vec4(p,1.0);vDepth=-mv.z;gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform float uTime; uniform float uProgress; varying vec2 vUv; varying float vLane; varying float vDepth; float pulse(float x){return smoothstep(.05,.18,x)*(1.0-smoothstep(.31,.85,x));} void main(){float line=abs(vUv.y-.5)*2.0;float glow=pow(max(0.0,1.0-line),2.2);float core=exp(-line*line*24.0);float wave=pulse(fract(vUv.x*29.0+uTime*.63+vLane*.173));float signal=pulse(fract(vUv.x*61.0+uTime*1.1+vLane*.27));float fade=smoothstep(1.2,4.0,vDepth)*(1.0-smoothstep(25.0,67.0,vDepth));float gate=1.0-.55*smoothstep(.94,.99,uProgress);vec3 color=mix(vec3(.95,.025,.07),vec3(1.0,.28,.13),core*.76+signal*.18);float alpha=(glow*(.045+.29*wave)+core*(.035+.32*signal))*fade*gate;gl_FragColor=vec4(color,alpha);}'
 });
 const ribbons=new T.Mesh(ribbonGeo,ribbonMat);ribbons.frustumCulled=false;scene.add(ribbons);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');
 ctx.font='bold 37px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#ff233e';ctx.shadowBlur=10;ctx.fillStyle='#ffb0a0';
 ['0','1','+','/'].forEach((g,i)=>ctx.fillText(g,i*64+32,33));
 const atlas=new T.CanvasTexture(canvas);atlas.minFilter=T.LinearFilter;atlas.magFilter=T.LinearFilter;atlas.generateMipmaps=false;
 const count=420,coords=new Float32Array(count*3),glyphs=new Float32Array(count),sizes=new Float32Array(count),alphas=new Float32Array(count),particles=[];
 for(let i=0;i<count;i++){let seed=rng();glyphs[i]=seed<.42?0:seed<.84?1:seed<.93?2:3;sizes[i]=.75+rng()*1.15;particles.push({offset:rng(),speed:(7+rng()*15)/length,x:(rng()-.5)*13,y:2.7+rng()*3.1,phase:rng()*Math.PI*2})}
 const glyphGeo=new T.BufferGeometry(),pa=new T.BufferAttribute(coords,3).setUsage(T.DynamicDrawUsage),aa=new T.BufferAttribute(alphas,1).setUsage(T.DynamicDrawUsage);
 glyphGeo.setAttribute('position',pa);glyphGeo.setAttribute('aGlyph',new T.BufferAttribute(glyphs,1));glyphGeo.setAttribute('aSize',new T.BufferAttribute(sizes,1));glyphGeo.setAttribute('aAlpha',aa);
 const glyphMat=new T.ShaderMaterial({uniforms:{uAtlas:{value:atlas}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
 vertexShader:'attribute float aGlyph; attribute float aSize; attribute float aAlpha; varying float vGlyph; varying float vAlpha; void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);float d=-mv.z;vGlyph=aGlyph;vAlpha=aAlpha*smoothstep(1.4,4.0,d)*(1.0-smoothstep(28.0,65.0,d));gl_Position=projectionMatrix*mv;gl_PointSize=clamp((205.0/max(d,1.0))*aSize,4.0,36.0);}',
 fragmentShader:'uniform sampler2D uAtlas; varying float vGlyph; varying float vAlpha; void main(){vec2 uv=vec2((vGlyph+gl_PointCoord.x)*.25,1.0-gl_PointCoord.y);vec4 tex=texture2D(uAtlas,uv);gl_FragColor=vec4(vec3(1.0,.11,.13)*mix(.6,1.4,tex.r),tex.a*vAlpha);}'
 });
 const cloud=new T.Points(glyphGeo,glyphMat);cloud.frustumCulled=false;scene.add(cloud);
 const axes=['x','y','z'];
 function update(time,p){
  ribbonMat.uniforms.uTime.value=time;ribbonMat.uniforms.uProgress.value=p;
  for(let i=0;i<count;i++){
   let a=particles[i],u=((a.offset-time*a.speed)%1+1)%1,n=u*samples,k=Math.min(samples-1,Math.floor(n)),f=n-k,A=frames[k],B=frames[k+1],w=a.x+.65*Math.sin(time*1.3+a.phase+u*18),h=a.y+.46*Math.cos(time*1.7+a.phase+u*22);
   for(let axis=0;axis<3;axis++){let key=axes[axis];coords[i*3+axis]=T.MathUtils.lerp(A.c[key]+A.r[key]*w+A.up[key]*h,B.c[key]+B.r[key]*w+B.up[key]*h,f)}
   alphas[i]=(.32+.36*(.5+.5*Math.sin(time*2+a.phase)))*ease(0,.014,u)*(1-ease(.977,1,u))*(1-.5*ease(.94,.99,p));
  }
  pa.needsUpdate=true;aa.needsUpdate=true;
 }
 return {update,dispose:()=>atlas.dispose()};
}

export function makeJourney(scene){
 scene.background=new T.Color(0x020910);scene.fog=new T.FogExp2(0x020910,.026);scene.add(new T.AmbientLight(0x86c4c9,2.1));
 const curve=journeyCurve(),length=curve.getLength(),half=length/24,forward=new T.Vector3(0,0,-1),rng=rand(317);
 const green=basic(0x42f7c9),blue=basic(0x489eff),purple=basic(0xae85ff),gold=basic(0xffc77a),dark=solid(0x0b2029),metal=solid(0x24434b),cyan=solid(0x247c76,0x0b4743);
 const rings=[],spinners=[],packets=[],pulseMaterials=[],sections=[];
 function station(p){const g=new T.Group();g.position.copy(curve.getPointAt(p));g.quaternion.setFromUnitVectors(forward,curve.getTangentAt(p).normalize());scene.add(g);return g}
 function link(g,a,b,m,r=.027){let x=new T.Vector3(...a),y=new T.Vector3(...b),d=y.clone().sub(x);const o=mesh(g,new T.CylinderGeometry(r,r,d.length(),5),m);o.position.copy(x.add(y).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
 function loop(g,z,r=4.3,m=green){const o=mesh(g,new T.TorusGeometry(r,.055,6,64),m,0,0,z);rings.push(o);return o}
 function panel(g,t,x,y,z,w=4){let a=sign(g,t,x,y,z,w,.7);a.rotation.y=x>0?-.22:x<0?.22:0;return a}
 function stripe(g,z,m=cyan){box(g,m,9,.04,.07,0,-2.9,z)}
 function stream(g,from,to,count,m){for(let i=0;i<count;i++){const obj=mesh(g,new T.BoxGeometry(.07,.07,.65),m);packets.push({obj,from:new T.Vector3(...from),to:new T.Vector3(...to),offset:i/count,speed:.17+rng()*.12})}}
 // Curved circuit rails and suspended frames join every room continuously.
 const railPts=[[],[]],dust=[];
 for(let i=0;i<=240;i++){let p=i/240,c=curve.getPointAt(p),t=curve.getTangentAt(p),right=new T.Vector3().crossVectors(t,new T.Vector3(0,1,0)).normalize(),up=new T.Vector3().crossVectors(right,t).normalize();for(let side=0;side<2;side++)railPts[side].push(c.clone().addScaledVector(right,side?4.7:-4.7).addScaledVector(up,-2.8));if(i%6===0){const g=station(p);box(g,dark,10,.12,1.6,0,-3.05,0);box(g,cyan,9,.035,.055,0,-2.96,0)}for(let k=0;k<4;k++){let v=c.clone().addScaledVector(right,(rng()-.5)*17).addScaledVector(up,(rng()-.5)*11);dust.push(v.x,v.y,v.z)}}
 for(let pts of railPts){let geo=new T.BufferGeometry().setFromPoints(pts);scene.add(new T.Line(geo,new T.LineBasicMaterial({color:0x2bcfae,transparent:true,opacity:.8})))}
 const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(dust,3));scene.add(new T.Points(pg,new T.PointsMaterial({color:0x79ddd9,size:.055,transparent:true,opacity:.62})));
 for(let k=0;k<12;k++){let g=station((k+.5)/12);sections.push(g);let l=half*.78;panel(g,chapters[k][0],0,3.4,-l,5.1);
  switch(k){
   case 0:{for(let i=0;i<5;i++){let z=l-i*l*.42;loop(g,z,4.5,i%2?blue:green);stripe(g,z)}panel(g,'SYSTEM ONLINE',0,1.8,-l,4.7);panel(g,'BOOT SEQUENCE',-3,1.6,3);panel(g,'HELLO, WORLD',3,1.6,-3);break}
   case 1:{for(let i=0;i<8;i++){let z=l-i*2*l/8;loop(g,z,4.6,i%3?green:blue);for(let s of [-1,1])panel(g,Array.from({length:12},()=>rng()>.5?'1':'0').join(''),s*(2.6+rng()),1+rng()*1.6,z-.35,2.7)}break}
   case 2:{let code=['#include <iostream>','int main() {','std::cout <<','"Hello, world!";','return 0;','}','g++ main.cpp','BUILD SUCCESS'];for(let i=0;i<code.length;i++){let z=l-i*2*l/8;panel(g,code[i],i%2?3:-3,1.2,z,4.5);stripe(g,z)}break}
   case 3:{const chip=new T.Group();g.add(chip);chip.position.set(0,-2.55,0);box(chip,metal,6,.4,6,0,0,0);box(chip,cyan,3.8,.18,3.8,0,.3,0);panel(chip,'CPU / 64 BIT',0,1.2,0,3.6);let pins=[],banks=[],bits=[];for(let i=0;i<14;i++)for(let s of [-1,1]){pins.push([s*3.3,.12,-2.7+i*.41,.7,.12,.17]);pins.push([-2.7+i*.41,.12,s*3.3,.17,.12,.7])}instances(chip,new T.BoxGeometry(1,1,1),green,pins);for(let s of [-1,1])for(let i=0;i<6;i++){let z=l-i*2*l/6;banks.push([s*4.2,-.3,z,.65,4.1,1.5]);for(let j=0;j<6;j++)bits.push([s*3.84,-1.7+j*.55,z,.04,.18,1.05])}instances(g,new T.BoxGeometry(1,1,1),metal,banks);instances(g,new T.BoxGeometry(1,1,1),purple,bits);break}
   case 4:{let racks=[],slots=[],leds=[];for(let s of [-1,1])for(let i=0;i<7;i++){let z=l-i*2*l/7;racks.push([s*4,-.65,z,1.65,4.5,1.8]);for(let j=0;j<10;j++){slots.push([s*4,-2.4+j*.37,z+.93,1.45,.28,.06]);for(let k=0;k<3;k++)leds.push([s*4-.45+k*.18,-2.4+j*.37,z+.98,.065,.065,.04])}}instances(g,new T.BoxGeometry(1,1,1),dark,racks);instances(g,new T.BoxGeometry(1,1,1),metal,slots);const led=basic(0x53ffba);pulseMaterials.push(led);instances(g,new T.BoxGeometry(1,1,1),led,leds);for(let s of [-1,1])stream(g,[s*2.6,2.4,l],[s*2.6,2.4,-l],7,blue);panel(g,'TCP / IP',0,2.5,0);break}
   case 5:{let lanes=[[-3,1.1],[-1.6,1.8],[1.6,1.8],[3,1.1]],nodes=[];for(let [x,y] of lanes){link(g,[0,0,l],[x,y,l-4],purple,.045);link(g,[x,y,l-4],[x,y,-l+4],green,.045);link(g,[x,y,-l+4],[0,0,-l],purple,.045);for(let i=0;i<5;i++)nodes.push([x,y,l-4-i*(2*l-8)/4,.32,.32,.32]);stream(g,[x,y,l-4],[x,y,-l+4],3,gold)}instances(g,new T.IcosahedronGeometry(1,1),green,nodes);panel(g,'git commit',-3,2.7,4);panel(g,'git merge',3,2.7,-4);panel(g,'BRANCH / MAIN',0,3,-l+2);break}
   case 6:{let nodes=[];for(let i=0;i<18;i++){let a=i*Math.PI*2/6,z=l-3-Math.floor(i/6)*5;nodes.push([Math.cos(a)*3.4,Math.sin(a)*3,z])}for(let i=0;i<nodes.length;i++){let a=nodes[i];link(g,a,nodes[Math.floor(i/6)*6+(i+1)%6],blue);if(i+6<nodes.length)link(g,a,nodes[i+6],green)}instances(g,new T.IcosahedronGeometry(.2,1),purple,nodes);for(let z of [l-3,0,-l+3]){let o=mesh(g,new T.TorusKnotGeometry(.95,.09,90,8,2,3),green,0,-.3,z);spinners.push({o,axis:'y',speed:.32})}panel(g,'O(log n)',-3,2.2,0);panel(g,'GRAPH SEARCH',3,2.2,-5);break}
   case 7:{let tiles=[],indicators=[];for(let s of [-1,1])for(let i=0;i<7;i++){let z=l-i*2*l/7;tiles.push([s*3.4,-.45,z,1.15,3.9,1.7]);for(let j=0;j<5;j++)indicators.push([s*2.8,-1.65+j*.6,z,.045,.26,1.15])}instances(g,new T.BoxGeometry(1,1,1),metal,tiles);instances(g,new T.BoxGeometry(1,1,1),blue,indicators);for(let i=0;i<5;i++)stream(g,[-2.3,-1+i*.65,l],[2.3,-1+i*.65,-l],4,i%2?gold:green);panel(g,'SCHEDULER',0,3,3);panel(g,'THREAD / 01',-3,2,-3);panel(g,'CONTEXT SWITCH',3,2,-7);break}
   case 8:{let rows=[];for(let s of [-1,1])for(let i=0;i<4;i++){let z=l-2-i*(2*l-4)/3;let tower=new T.Group();tower.position.set(s*3.4,-2.5,z);g.add(tower);for(let j=0;j<4;j++){mesh(tower,new T.CylinderGeometry(.8,.8,.32,32),metal,0,.4+j*.52,0);let ring=mesh(tower,new T.TorusGeometry(.81,.027,5,40),purple,0,.58+j*.52,0);ring.rotation.x=Math.PI/2}for(let j=0;j<4;j++)rows.push([s*2.55,-1.9+j*.5,z,.06,.13,.3])}instances(g,new T.BoxGeometry(1,1,1),green,rows);panel(g,'SELECT * FROM',0,2.7,2,4.7);panel(g,'INDEX / B-TREE',0,2.7,-5,4.7);break}
   case 9:{let nodes=[];for(let i=0;i<12;i++){let a=i*2.399,z=l-2-i*(2*l-4)/11;nodes.push([Math.cos(a)*3.7,Math.sin(a)*2.7,z])}for(let i=0;i<nodes.length-1;i++){link(g,nodes[i],nodes[i+1],blue,.035);stream(g,nodes[i],nodes[i+1],2,green)}instances(g,new T.IcosahedronGeometry(.43,1),cyan,nodes);for(let a of nodes){let o=mesh(g,new T.TorusGeometry(.64,.035,6,32),blue,...a);spinners.push({o,axis:'y',speed:.4})}panel(g,'CLOUD / CLUSTER',0,3,0,5);break}
   case 10:{for(let i=0;i<9;i++){let z=l-i*2*l/9;let o=loop(g,z,4.4-i*.12,i%2?gold:green);o.rotation.z=i*.2;panel(g,i%2?'AES / ENCRYPTED':'0101 / VERIFIED',i%2?2.9:-2.9,1.6,z-.5,2.8)}panel(g,'AUTHENTICATING',0,3,0,5);break}
   case 11:{for(let i=0;i<5;i++){let z=l-i*2*l/5;let o=loop(g,z,4.4-i*.15,i%2?blue:green);o.rotation.z=i*.2}const gate=station(.975);for(let i=0;i<5;i++){let o=mesh(gate,new T.TorusGeometry(3.4+i*.4,.07,8,96),i%2?blue:green,0,0,i*.19);spinners.push({o,axis:'z',speed:i%2?.22:-.18})}const center=mesh(gate,new T.CircleGeometry(3.35,80),new T.MeshBasicMaterial({color:0xcffff2,transparent:true,opacity:.9,side:T.DoubleSide}),0,0,-.3);panel(gate,'ACCESS GRANTED',0,4.3,-.4,5.5);break}
  }
 }
 const signalWind=createSignalWind(scene,curve,length);
 return {curve,length,rings,spinners,packets,pulseMaterials,sections,signalWind};
}
export function animateJourney(state,camera,p,time){
 const q=T.MathUtils.clamp(p,0,1),c=state.curve.getPointAt(q),tan=state.curve.getTangentAt(q).normalize(),right=new T.Vector3().crossVectors(tan,new T.Vector3(0,1,0)).normalize();
 const up=new T.Vector3().crossVectors(right,tan).normalize();const sway=Math.sin(q*Math.PI*8)*.16*Math.sin(Math.PI*q);
 camera.position.copy(c).addScaledVector(right,sway).addScaledVector(up,.12);const ahead=state.curve.getPointAt(Math.min(1,q+.019));if(q>.98)ahead.copy(c).addScaledVector(tan,6);camera.up.set(0,1,0);camera.lookAt(ahead);camera.rotateZ(-.10*ease(.45,.52,q)*(1-ease(.61,.69,q))+.045*Math.sin(q*Math.PI*8)*Math.sin(Math.PI*q));
 const fov=42+8*ease(.40,.52,q)-5*ease(.65,.76,q)+8*ease(.81,.91,q);if(Math.abs(camera.fov-fov)>.02){camera.fov=fov;camera.updateProjectionMatrix()}
 for(let [i,o] of state.rings.entries())o.scale.setScalar(1+.025*Math.sin(time*1.8+i));for(let {o,axis,speed} of state.spinners)o.rotation[axis]=time*speed;
 for(let a of state.packets){let f=(time*a.speed+a.offset)%1;a.obj.position.lerpVectors(a.from,a.to,f);const direction=a.to.clone().sub(a.from).normalize();a.obj.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction)}
 state.signalWind.update(time,q);
 for(let m of state.pulseMaterials)m.color.setHSL(.43,.85,.48+.12*Math.sin(time*3));
 // Only adjacent chapters need to draw; all are already constructed.
 let n=Math.min(11,Math.floor(q*12));state.sections.forEach((g,i)=>g.visible=Math.abs(i-n)<=2);
}
export function makePlaza(scene){scene.background=new T.Color(0xb6dcd9);scene.fog=new T.Fog(0xb6dcd9,27,75);const floor=solid(0xc4dcd6),path=solid(0xe3ede5),structure=solid(0x203f48),trim=solid(0x57cdb5,0x103a36),glass=solid(0x70a3ac,0x0b252c);box(scene,floor,52,.25,52,0,-.15,0);box(scene,path,7,.04,40,0,-.01,0);box(scene,path,31,.04,6,0,-.009,-2);const grid=new T.GridHelper(50,50,0x97bdb1,0xaec8c3);grid.position.y=.015;scene.add(grid);
for(const [x,z,w,h,d,label] of [[0,-12,13,7,6,'ACADEMY.ONE'],[-12,-3,7,5,8,'CODE LAB'],[12,-3,7,5,8,'SERVER LAB']]){box(scene,structure,w,h,d,x,h/2,z);box(scene,trim,w+.3,.24,d+.3,x,h+.08,z);for(let i=0;i<Math.floor(w/1.4);i++)box(scene,glass,.95,h*.51,.075,x-w/2+.85+i*1.4,h*.57,z+d/2+.04);sign(scene,label,x,h-.52,z+d/2+.09,Math.min(w-1,6),.8);box(scene,trim,2.4,2.5,.09,x,1.25,z+d/2+.1)}
for(let s of [-1,1])for(let z of [7,0,-7]){box(scene,structure,1.4,.45,1.4,s*5,.2,z);mesh(scene,new T.CylinderGeometry(.07,.13,1.4,8),solid(0x4e6b60),s*5,.9,z);mesh(scene,new T.IcosahedronGeometry(.78,1),solid(0x429a83),s*5,1.85,z)}
const gate=new T.Group();gate.position.set(0,2.1,11);scene.add(gate);mesh(gate,new T.TorusGeometry(2.1,.12,12,64),trim);mesh(gate,new T.TorusGeometry(2.3,.045,8,64),basic(0x9affee),0,0,.05);
}
