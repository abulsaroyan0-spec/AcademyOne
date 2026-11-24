import * as T from 'three';
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const clamp=T.MathUtils.clamp;
export function createHumanoidMotion(root){
 root.updateWorldMatrix(true,true);
 const bones=[];root.traverse(b=>{if(b.isBone)bones.push(b)});
 const find=n=>bones.find(b=>norm(b.name)===norm(n));
 const hips=find('Hips'),chest=find('Chest'),head=find('Head'),legs=['L','R'].map(s=>({upper:find('UpperLeg'+s),lower:find('LowerLeg'+s),foot:find('Foot'+s),arm:find('UpperArm'+s),elbow:find('LowerArm'+s),hand:find('Hand'+s)}));
 if(!hips||legs.some(l=>!l.upper||!l.lower||!l.foot||!l.arm||!l.elbow||!l.hand))return null;
 const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
 const local=b=>root.worldToLocal(b.getWorldPosition(V()));
 const rest=new Map(bones.map(b=>[b,{q:b.quaternion.clone(),p:b.position.clone(),world:root.getWorldQuaternion(new T.Quaternion()).invert().multiply(b.getWorldQuaternion(new T.Quaternion()))}]));
 const hp=local(hips);
 for(let l of legs){l.ankle=local(l.foot);l.a=local(l.upper).distanceTo(local(l.lower));l.b=local(l.lower).distanceTo(l.ankle);l.side=Math.sign(local(l.arm).x-hp.x)||Math.sign(local(l.upper).x-hp.x)||1;l.upperDir=l.lower.position.clone().normalize();l.lowerDir=l.foot.position.clone().normalize();l.armDir=l.elbow.position.clone().normalize();l.elbowDir=l.hand.position.clone().normalize()}
 if(legs.some(l=>l.a<.05||l.b<.05))return null;
 let phase=0,blend=0,clock=0,gaitSpeed=0,waveTime=-1,reach=null,blinkAt=2.6,seatWeight=0,seatHeight=.55,airWeight=0;
 // The modular models use separate eye meshes. Compress only eye geometry visually during a blink.
 const eyes=[];root.traverse(o=>{if(!o.isMesh||!o.geometry?.attributes.position)return;const mats=Array.isArray(o.material)?o.material:[o.material];if(!mats.length||!mats.every(m=>/^eyes?$/i.test(m?.name||'')))return;
  o.geometry=o.geometry.clone();const pos=o.geometry.attributes.position,base=pos.array.slice(),bounds=new T.Box3().setFromBufferAttribute(pos);const size=bounds.getSize(V()),center=bounds.getCenter(V());
  // Convert upright direction to the mesh's coordinate space, including FBX's rotated root.
  const up=V(0,1,0).applyQuaternion(root.getWorldQuaternion(new T.Quaternion())).applyQuaternion(o.getWorldQuaternion(new T.Quaternion()).invert()).normalize();
  eyes.push({pos,base,center,up});
 });
 let lastBlink=-1;function blink(amount){if(Math.abs(amount-lastBlink)<.002)return;lastBlink=amount;for(const e of eyes){for(let i=0;i<e.pos.count;i++){const k=i*3,dx=e.base[k]-e.center.x,dy=e.base[k+1]-e.center.y,dz=e.base[k+2]-e.center.z,d=(dx*e.up.x+dy*e.up.y+dz*e.up.z)*amount;e.pos.setXYZ(i,e.base[k]-e.up.x*d,e.base[k+1]-e.up.y*d,e.base[k+2]-e.up.z*d)}e.pos.needsUpdate=true}}
 const cape=root.getObjectByName('RoyalCape');
 const parentQ=new T.Quaternion(),q=new T.Quaternion(),v=V(),rootQ=new T.Quaternion(),axis=V(1,0,0);
 function aim(b,childDir,target){b.parent.getWorldQuaternion(parentQ).invert();v.copy(target).applyQuaternion(rootQ).applyQuaternion(parentQ).normalize();q.setFromUnitVectors(childDir.clone().applyQuaternion(rest.get(b).q),v);b.quaternion.copy(q).multiply(rest.get(b).q);b.updateWorldMatrix(false,true)}
 function orient(b,angle){if(!b)return;b.parent.getWorldQuaternion(parentQ).invert();q.setFromAxisAngle(axis,angle);b.quaternion.copy(parentQ).multiply(rootQ).multiply(q).multiply(rest.get(b).world);b.updateWorldMatrix(false,true)}
 function update(dt,speed=0){
  clock+=dt;if(waveTime>=0){waveTime+=dt;if(waveTime>1.9)waveTime=-1}if(clock>blinkAt+.19)blinkAt=clock+2.4+Math.random()*2.4;blink(clock<blinkAt?0:Math.sin(Math.PI*clamp((clock-blinkAt)/.19,0,1))*.96);gaitSpeed=T.MathUtils.damp(gaitSpeed,Math.max(0,speed),14,dt);let running=clamp((gaitSpeed-1.4)/1.15,0,1);blend=T.MathUtils.damp(blend,clamp(gaitSpeed/.65,0,1),12,dt);
  let stride=1.34+running*.54;phase=(phase+gaitSpeed*dt/stride)%1;
  root.updateWorldMatrix(true,true);root.getWorldQuaternion(rootQ);
  for(let b of bones){let r=rest.get(b);b.quaternion.copy(r.q);b.position.copy(r.p)}
  root.updateWorldMatrix(true,true);
  const bob=(.012*Math.cos(phase*Math.PI*4)-.028)*blend+.003*Math.sin(clock*2.2)*(1-blend);
  const h=hp.clone().add(V(.018*Math.sin(phase*2*Math.PI)*blend,bob,0));h.y=T.MathUtils.lerp(h.y,seatHeight+.10,seatWeight);h.z-=.018*seatWeight;hips.position.copy(hips.parent.worldToLocal(root.localToWorld(h)));hips.updateWorldMatrix(false,true);
  if(chest){orient(chest,T.MathUtils.lerp(.025+running*.09+Math.sin(phase*2*Math.PI)*.026*blend,.035,seatWeight));const twist=new T.Quaternion().setFromAxisAngle(V(0,1,0),Math.sin(phase*2*Math.PI)*.045*blend);chest.quaternion.premultiply(chest.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(rootQ).multiply(twist).multiply(rootQ.clone().invert()).multiply(chest.parent.getWorldQuaternion(new T.Quaternion())));chest.updateWorldMatrix(false,true)}
  if(head){orient(head,(-.012+Math.sin(clock*1.4)*.012)*(1-seatWeight))}
  for(let i=0;i<legs.length;i++){
   let l=legs[i],t=(phase+i*.5)%1,stance=.62-running*.12,travel=stride*stance*.5;
   let z,y;if(t<stance){z=travel*(1-2*t/stance);y=0}else{let f=(t-stance)/(1-stance),smooth=f*f*(3-2*f);z=travel*(2*smooth-1);y=Math.sin(Math.PI*f)*(.085+running*.10)}
   let ankle=l.ankle.clone().add(V(0,y*blend,z*blend));const seated=l.ankle.clone();seated.z+=l.a*.91;seated.y=Math.max(l.ankle.y,seatHeight+.10-l.b);ankle.lerp(seated,seatWeight);ankle.y+=airWeight*.10;ankle.z+=airWeight*.045*(i===0?1:-1);let hip=local(l.upper),delta=ankle.clone().sub(hip),dist=clamp(delta.length(),Math.abs(l.a-l.b)+.001,l.a+l.b-.001),dir=delta.normalize();
   let bend=V(0,0,1).addScaledVector(dir,-dir.z).normalize();if(bend.lengthSq()<.01)bend.set(0,1,0);
   let along=(l.a*l.a-l.b*l.b+dist*dist)/(2*dist),height=Math.sqrt(Math.max(0,l.a*l.a-along*along)),knee=hip.clone().addScaledVector(dir,along).addScaledVector(bend,height);
   ankle=hip.clone().addScaledVector(dir,dist);
   aim(l.upper,l.upperDir,knee.clone().sub(hip));aim(l.lower,l.lowerDir,ankle.clone().sub(knee));orient(l.foot,(t<stance?-.06*Math.sin(t/stance*Math.PI):.19*Math.sin((t-stance)/(1-stance)*Math.PI))*blend);
   // Arms hang at the sides, with a restrained opposing swing and relaxed elbows.
   const swing=-Math.cos(t*2*Math.PI)*(.24+running*.19)*blend;
   const elbowFlex=.085+running*.33;
   const outward=.20+running*.035;
   aim(l.arm,l.armDir,V(l.side*outward,-1,swing).lerp(V(l.side*.18,-1,.20),seatWeight).lerp(V(l.side*.27,-.85,.25),airWeight));
   aim(l.elbow,l.elbowDir,V(l.side*.13,-1,swing+elbowFlex).lerp(V(-l.side*.08,-.28,1),seatWeight).lerp(V(l.side*.13,-.45,.9),airWeight));
   // Keep the relaxed wrist aligned with its parent instead of forcing the bind-pose world rotation.
   l.hand.quaternion.copy(rest.get(l.hand).q);l.hand.updateWorldMatrix(false,true);
   // Keep the elbow and wrist outside the torso with a minimum lateral clearance.
   const shoulder=local(l.arm),elbow=local(l.elbow),wrist=local(l.hand),minX=Math.abs(shoulder.x-hp.x)+.035;
   if((wrist.x-hp.x)*l.side<minX){wrist.x=hp.x+l.side*minX;aim(l.elbow,l.elbowDir,wrist.sub(elbow))}
  }
  const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
  // Gesture layer overrides the right arm only, blending in and out of gait.
  if(waveTime>=0&&!reach){let l=legs[1],weight=smooth(waveTime/.32)*smooth((1.9-waveTime)/.38),upper=l.arm.quaternion.clone(),lower=l.elbow.quaternion.clone();
   aim(l.arm,l.armDir,V(l.side*.78,.34,.36));aim(l.elbow,l.elbowDir,V(l.side*(.15+.45*Math.sin(waveTime*14)),1,.22));const goalUpper=l.arm.quaternion.clone(),goalLower=l.elbow.quaternion.clone();
   l.arm.quaternion.copy(upper).slerp(goalUpper,weight);l.elbow.quaternion.copy(lower).slerp(goalLower,weight);l.arm.updateWorldMatrix(false,true);
  }
  if(reach){const target=root.worldToLocal(reach.target.clone()),l=legs[1],shoulder=local(l.arm),elbow=local(l.elbow),wrist=local(l.hand),aa=shoulder.distanceTo(elbow),bb=elbow.distanceTo(wrist),delta=target.clone().sub(shoulder),d=clamp(delta.length(),Math.abs(aa-bb)+.001,aa+bb-.004),dir=delta.normalize(),bend=V(l.side*.5,-1,0).addScaledVector(dir,-V(l.side*.5,-1,0).dot(dir)).normalize(),along=(aa*aa-bb*bb+d*d)/(2*d),height=Math.sqrt(Math.max(0,aa*aa-along*along)),mid=shoulder.clone().addScaledVector(dir,along).addScaledVector(bend,height),end=shoulder.clone().addScaledVector(dir,d),u=l.arm.quaternion.clone(),f=l.elbow.quaternion.clone();
   aim(l.arm,l.armDir,mid.clone().sub(shoulder));aim(l.elbow,l.elbowDir,end.sub(mid));const uq=l.arm.quaternion.clone(),fq=l.elbow.quaternion.clone();l.arm.quaternion.copy(u).slerp(uq,reach.weight);l.elbow.quaternion.copy(f).slerp(fq,reach.weight);l.arm.updateWorldMatrix(false,true);
  }
  cape?.userData.updateCloth?.(dt,gaitSpeed,seatWeight,airWeight);
 }
 update(0,0);return {update,setSeat(weight,height=.55){seatWeight=clamp(weight,0,1);seatHeight=height;if(seatWeight>0)waveTime=-1},setAir(weight){airWeight=clamp(weight,0,1)},wave(){if(!reach&&seatWeight<.1)waveTime=0},setReach(target,weight){reach=target?{target,weight:clamp(weight,0,1)}:null;if(reach)waveTime=-1}};
}
export function royalFinish(root){
 root.updateWorldMatrix(true,true);
 root.traverse(o=>{if(!o.isMesh)return;for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){
  if(/gold/i.test(m.name)){m.color.setHex(0xe6b84d);m.metalness=.84;m.roughness=.24}
  else if(/metal_dark/i.test(m.name)){m.color.setHex(0x312332);m.metalness=.45;m.roughness=.33}
  else if(/metal/i.test(m.name)){m.color.setHex(0xc6a66a);m.metalness=.70;m.roughness=.30}
  else if(/blue/i.test(m.name)){m.color.setHex(0x6f1026);m.roughness=.68;m.metalness=.06}
  else if(/beige/i.test(m.name)){m.color.setHex(0xf0d5a2);m.roughness=.75}
  m.needsUpdate=true;
 }});
 let chest=null;root.traverse(b=>{if(b.isBone&&norm(b.name)==='chest'&&!chest)chest=b});if(!chest)return;
 const cape=new T.Group();cape.name='RoyalCape';root.add(cape);
 const gold=new T.MeshStandardMaterial({color:0xe5bb61,metalness:.7,roughness:.38,side:T.DoubleSide}),velvet=new T.MeshStandardMaterial({color:0x820e2e,roughness:.88,side:T.DoubleSide});
 const rows=24,cols=22,verts=[],indices=[],edgeIndices=[];
 const chestAt=root.worldToLocal(chest.getWorldPosition(new T.Vector3())),top=chestAt.y+.11,back=chestAt.z-.20;
 for(let y=0;y<=rows;y++){let t=y/rows,width=.19+.11*t;for(let x=0;x<=cols;x++){let u=x/cols*2-1;verts.push(u*width,top-.90*t,back-.025*u*u-.035*t+.016*Math.cos(u*3*Math.PI)*t);if(y&&x){let i=y*(cols+1)+x;const list=x===1||x===cols||y===rows?edgeIndices:indices;list.push(i-cols-2,i-1,i-cols-1,i-cols-1,i-1,i)}}}
 const geo=new T.BufferGeometry(),pos=new T.Float32BufferAttribute(verts,3);pos.setUsage(T.DynamicDrawUsage);geo.setAttribute('position',pos);geo.setIndex(indices.concat(edgeIndices));geo.addGroup(0,indices.length,0);geo.addGroup(indices.length,edgeIndices.length,1);geo.computeVertexNormals();
 const cloth=new T.Mesh(geo,[velvet,gold]);cloth.frustumCulled=false;cape.add(cloth);root.updateWorldMatrix(true,true);chest.attach(cape);
 let angle=root.rotation.y,turn=0,trail=0,clock=0,fold=0;
 cape.userData.updateCloth=(dt,speed,seat,air)=>{
  dt=clamp(dt,0,.065);clock+=dt;const delta=Math.atan2(Math.sin(root.rotation.y-angle),Math.cos(root.rotation.y-angle));angle=root.rotation.y;
  turn=T.MathUtils.damp(turn,clamp(-delta/Math.max(dt,.016)*.045,-.23,.23),7,dt);trail=T.MathUtils.damp(trail,clamp(speed*.13+air*.06,0,.33),6,dt);fold=T.MathUtils.damp(fold,seat,9,dt);
  for(let y=0;y<=rows;y++){const t=y/rows,w=t*t;for(let x=0;x<=cols;x++){let i=y*(cols+1)+x,k=i*3,u=x/cols*2-1;
    const flutter=w*(.012+trail*.13)*Math.sin(clock*(4+speed*2)-t*6+u*3);
    // Pinned shoulder edge, increasing freedom toward the hem; gather above seat when seated.
    pos.setXYZ(i,verts[k]+(turn*w+flutter*.45)*(1-fold),verts[k+1]+.72*t*fold+trail*.12*w*(1-fold),verts[k+2]-trail*w*(1-fold)+flutter*(1-fold)+.015*t*fold);
  }}pos.needsUpdate=true;geo.computeVertexNormals();
 };

}
