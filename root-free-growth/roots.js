const profiles=[
 {key:'sapling',name:'Sapling',cut:.65,count:5,spread:150,depth:155},
 {key:'young-tree',name:'Young tree',cut:.65,count:7,spread:180,depth:180},
 {key:'mature-tree',name:'Mature tree',cut:.63,count:9,spread:215,depth:200},
 {key:'ancient',name:'Ancient tree',cut:.61,count:11,spread:235,depth:210}
];
let stage=0,level=0,deep=0,focus=false,ready=false;
const mix=(a,b,t)=>a+(b-a)*t;
const point=(p,t)=>{const u=1-t,r=[0,1].map(k=>u*u*u*p[0][k]+3*u*u*t*p[1][k]+3*u*t*t*p[2][k]+t*t*t*p[3][k]);
 const dx=p[3][0]-p[0][0],dy=p[3][1]-p[0][1],length=Math.hypot(dx,dy)||1;
 const bend=Math.sin(Math.PI*t)**2*Math.sin(t*8+p[3][0]*.04)*Math.min(7,length*.065);
 return [r[0]-dy/length*bend,r[1]+dx/length*bend];};
function prepare(image,p){
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d');x.drawImage(image,0,0);
 const y=Math.round(image.height*p.cut),data=x.getImageData(0,y,image.width,1).data;
 const spans=[];let start=-1;for(let i=0;i<=image.width;i++){if(i<image.width&&data[i*4+3]>160){if(start<0)start=i;}else if(start>=0){spans.push([start,i-1]);start=-1;}}
 const span=spans.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];
 const cx=(span[0]+span[1])/2;const samples=[];for(let i=span[0]+2;i<span[1]-1;i++)if(data[i*4+3]>220)samples.push([data[i*4],data[i*4+1],data[i*4+2]]);
 const color=[0,1,2].map(k=>Math.round(samples.reduce((n,c)=>n+c[k],0)/samples.length));
 return {...p,image:c,cutY:y,cx,collar:span[1]-span[0]+1,color};
}
const rgb=(c,f=1)=>`rgb(${c.map(v=>Math.max(0,Math.min(255,Math.round(v*f)))).join(',')})`;
function wood(ctx,curve,width,color,seed,material){
 const samples=[];for(let i=0;i<=70;i++){const t=i/70;const p=point(curve,t),a=point(curve,Math.max(0,t-.005)),b=point(curve,Math.min(1,t+.005));const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
 samples.push({p,n:[-(b[1]-a[1])/d,(b[0]-a[0])/d],w:width*Math.pow(1-t,1.25)*(1+.035*Math.sin(t*32+seed))});}
 ctx.beginPath();for(const side of [-1,1]){const list=side===-1?samples:[...samples].reverse();list.forEach((s,i)=>{const x=s.p[0]+side*s.n[0]*s.w/2,y=s.p[1]+side*s.n[1]*s.w/2;if(side===-1&&i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});}ctx.closePath();ctx.fillStyle=rgb(color,width<1.5?1.25:.85);ctx.fill();
 if(width<1.5)return;
 // Wrap real trunk bark around the tapered curve; all root generations use this same material.
 ctx.save();ctx.clip();
 for(let i=0;i<samples.length-1;i++){
  const a=samples[i],b=samples[i+1],dx=b.p[0]-a.p[0],dy=b.p[1]-a.p[1],length=Math.hypot(dx,dy);
  ctx.save();ctx.translate(a.p[0],a.p[1]);ctx.rotate(Math.atan2(dy,dx)-Math.PI/2);
  const sw=material.collar*.72,sy=material.cutY-24+(i*3+seed*7)%16;
  ctx.drawImage(material.image,material.cx-sw/2,sy,sw,5,-a.w*.55,-.3,a.w*1.1,length+.8);
  ctx.restore();
 }
 ctx.fillStyle='rgba(40,22,12,.16)';ctx.fill();ctx.restore();

}
function roots(p,investments,depthGrowth){
 const scale=260/p.cutY,collar=p.collar*scale;
 const nodes=[];
 // One short winding central root; its path stays fixed when its tip extends.
 nodes.push({curve:[[0,-1],[0,40],[-collar*.15-8,p.depth*.50],[8,p.depth*.72]],width:collar,color:p.color});
 const pairs=(p.count-1)/2;
 for(let i=0;i<pairs;i++)for(const side of [-1,1]){
 const f=i/Math.max(1,pairs-1),reach=p.spread*(1-f*.46)*(side<0?1:.91),drop=38+f*p.depth*.73+(side>0?14:0);
 const origin=i===pairs-1?point(nodes[0].curve,.23):[side*collar*.18,7+i*1.5];
 nodes.push({curve:[origin,[side*(collar*.45+reach*.15),18+f*24],[side*reach*.64,drop*.72+Math.sin(i+side)*12],[side*reach,drop]],width:collar*(.30-f*.11),color:p.color});
 }
 const primaries=nodes.slice();
 for(let n=0;n<investments;n++){
 const parent=primaries[1+n%(primaries.length-1)],round=Math.floor(n/(primaries.length-1));
 const t=[.43,.57,.49,.70,.64,.80][round],origin=point(parent.curve,t),side=Math.sign(parent.curve[3][0]);
 const reach=(35+12*Math.sin(n*2.3))*(1-round*.12),drop=30+12*Math.cos(n*1.7);
 const end=[origin[0]+side*reach,origin[1]+drop];
 const child={curve:[origin,[origin[0]+side*reach*.25,origin[1]+drop*.2],[end[0]-side*reach*.2,end[1]-drop*.25],end],width:parent.width*Math.pow(1-t,1.25)*.65,color:p.color};nodes.push(child);
 for(let j=0;j<(round>0?3:2);j++){const q=.38+j*.19,s=point(child.curve,q),flip=j%2?1:-1;nodes.push({curve:[s,[s[0]+side*6,s[1]+4],[s[0]+side*(12+flip*7),s[1]+12],[s[0]+side*(17+flip*9),s[1]+19+j*3]],width:child.width*Math.pow(1-q,1.25)*.50,color:p.color});}
 }
 // Deep growth adds connected narrow laterals on the central axis, then continues its tip.
 for(let n=0;n<depthGrowth;n++){
 const parent=primaries[0],t=.48+n*.13,s=point(parent.curve,t),side=n%2?1:-1;
 nodes.push({curve:[s,[s[0]+side*12,s[1]+12],[s[0]+side*37,s[1]+28],[s[0]+side*48,s[1]+52]],width:parent.width*Math.pow(1-t,1.25)*.28,color:p.color});
 }
 if(depthGrowth){const p0=nodes[0];const end=p0.curve[3]; // extend beyond a near-terminal point, retaining the proximal curve
 const s=point(p0.curve,.88);nodes.push({curve:[s,[end[0]+5,end[1]+10],[end[0]-12,end[1]+depthGrowth*19],[end[0]-6,end[1]+depthGrowth*27]],width:p0.width*Math.pow(.12,1.25),color:p.color});}
 return {nodes,collar};
}
function draw(canvas,p,investment,depthGrowth,close=false){
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
 const w=rect.width,h=rect.height,ground=close?h*.16:h*.48;
 ctx.fillStyle='#302219';ctx.fillRect(0,0,w,ground);const earth=ctx.createLinearGradient(0,ground,0,h);earth.addColorStop(0,'#261d14');earth.addColorStop(1,'#17120d');ctx.fillStyle=earth;ctx.fillRect(0,ground,w,h-ground);ctx.strokeStyle='#80654666';ctx.beginPath();ctx.moveTo(0,ground);ctx.lineTo(w,ground);ctx.stroke();
 const size=Math.min((w-24)/(p.spread*2+65),(h-ground-18)/(p.depth+90),close?10:(ground-14)/260);
 ctx.save();ctx.translate(w/2,ground);ctx.scale(size,size);
 const {nodes,collar}=roots(p,investment,depthGrowth);
 for(let i=nodes.length-1;i>=0;i--)wood(ctx,nodes[i].curve,nodes[i].width,nodes[i].color,i,p);
 // Source-rectangle cropping preserves every original pixel above this collar.
 const imgScale=260/p.cutY;ctx.drawImage(p.image,0,0,p.image.width,p.cutY,-p.cx*imgScale,-260,p.image.width*imgScale,260);
 ctx.restore();canvas.dataset.nodes=nodes.length;canvas.dataset.collar=collar;canvas.dataset.anchor=p.cx;canvas.dataset.scale=size;
}
function render(){if(!ready)return;const p=profiles[stage];document.querySelector('#scene').classList.toggle('focused',focus);draw(document.querySelector('#scene'),p,level,deep,focus);
 for(const c of document.querySelectorAll('[data-snapshot]'))draw(c,p,Number(c.dataset.snapshot),0,true);
 document.querySelector('#caption').textContent=`${p.name} · ${p.count} starting main roots · ${level} branching investments · ${deep} deeper-growth investments`;
 document.querySelector('#status').textContent='Ready · one root material · stable connections · production unchanged';
 document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.stage)===stage));document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.level)===level&&deep===0));
 document.querySelector('#grow').disabled=level>=24;document.querySelector('#deepen').disabled=deep>=3;
}
document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{stage=Number(b.dataset.stage);render();});document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{level=Number(b.dataset.level);deep=0;render();});
document.querySelector('#grow').onclick=()=>{level=Math.min(24,level+1);render();};document.querySelector('#deepen').onclick=()=>{deep=Math.min(3,deep+1);render();};document.querySelector('#reset').onclick=()=>{level=0;deep=0;render();};document.querySelector('#focus').onchange=e=>{focus=e.target.checked;render();};window.addEventListener('resize',render);
try{await Promise.all(profiles.map(async(p,i)=>{const image=new Image();image.crossOrigin='anonymous';image.src=`https://fidgetbot.github.io/trees/assets/trees/cherry-${p.key}-v1.png`;await image.decode();profiles[i]=prepare(image,p);}));ready=true;render();}catch(error){document.querySelector('#status').textContent='Could not load tree artwork. Please refresh.';console.error(error);}
// Read-only review hooks for checking connected, persistent geometry.
window.rootStudy={getGeometry:(s,n,d)=>roots(profiles[s],n,d),getState:()=>({stage,level,deep,ready})};
