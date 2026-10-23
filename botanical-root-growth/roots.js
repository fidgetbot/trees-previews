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
function wood(ctx,curve,width,color,seed,material,progress=1,order=0){
 const samples=[];for(let i=0;i<=48;i++){const u=i/48,t=u*progress;const p=point(curve,t),a=point(curve,Math.max(0,t-.004)),b=point(curve,Math.min(1,t+.004));const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
 samples.push({p,n:[-(b[1]-a[1])/d,(b[0]-a[0])/d],w:width*Math.pow(1-u,.72)*(1+.045*Math.sin(t*25+seed)+.018*Math.sin(t*61+seed*.7))});}
 ctx.beginPath();for(const side of [-1,1]){const list=side===-1?samples:[...samples].reverse();list.forEach((s,i)=>{const x=s.p[0]+side*s.n[0]*s.w/2,y=s.p[1]+side*s.n[1]*s.w/2;if(side===-1&&i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});}ctx.closePath();ctx.fillStyle=rgb(color,width<1.5?1.25:.85);ctx.fill();
 if(width<1.7)return;
 if(width>=2.8){ctx.save();ctx.clip();ctx.globalAlpha=.72;for(let i=0;i<samples.length-2;i+=3){const a=samples[i],b=samples[Math.min(samples.length-1,i+4)],dx=b.p[0]-a.p[0],dy=b.p[1]-a.p[1],length=Math.hypot(dx,dy),average=(a.w+b.w)/2;if(!length)continue;ctx.save();ctx.translate(a.p[0],a.p[1]);ctx.rotate(Math.atan2(dy,dx)-Math.PI/2);const sw=material.collar*.82,sy=Math.max(0,material.cutY-34+(i*5+seed*7)%22);ctx.drawImage(material.image,material.cx-sw/2,sy,sw,12,-average*.57,-1,average*1.14,length+3);ctx.restore()}ctx.fillStyle='rgba(45,25,14,.13)';ctx.fill();ctx.restore()}
 ctx.save();ctx.globalAlpha=order?.30:.46;ctx.strokeStyle=rgb(color,1.34);ctx.lineCap='round';ctx.lineWidth=Math.max(.28,width*.12);ctx.beginPath();samples.forEach((s,i)=>i?ctx.lineTo(s.p[0]-s.n[0]*s.w*.16,s.p[1]-s.n[1]*s.w*.16):ctx.moveTo(s.p[0]-s.n[0]*s.w*.16,s.p[1]-s.n[1]*s.w*.16));ctx.stroke();
 ctx.globalAlpha=order?.20:.31;ctx.strokeStyle=rgb(color,.52);ctx.lineWidth=Math.max(.22,width*.07);for(let i=7;i<samples.length-4;i+=7+(seed+i)%4){const s=samples[i],half=s.w*(.22+.09*Math.sin(i+seed));ctx.beginPath();ctx.moveTo(s.p[0]-s.n[0]*half,s.p[1]-s.n[1]*half);ctx.lineTo(s.p[0]+s.n[0]*half,s.p[1]+s.n[1]*half);ctx.stroke()}ctx.restore();
}
const clamp=v=>Math.max(0,Math.min(1,v));
const AXES=[
 {origin:-.39,c1:[-47,15],c2:[-145,34],end:[-218,59],weight:.24,birth:-2.1,layer:-2},
 {origin:-.18,c1:[-34,26],c2:[-91,118],end:[-126,174],weight:.31,birth:-2.4,layer:1},
 {origin:.02,c1:[15,31],c2:[18,142],end:[42,222],weight:.29,birth:-2.7,layer:2},
 {origin:.22,c1:[35,18],c2:[80,94],end:[139,157],weight:.22,birth:-1.7,layer:0},
 {origin:.41,c1:[48,12],c2:[157,31],end:[226,73],weight:.27,birth:-2.2,layer:-1}
];
function roots(p,investments){
 const stageIndex=profiles.indexOf(p);
 const clock=stageIndex*6+investments/4+3;
 p=profiles[3]; // One lifetime scaffold, shared by every age painting.
 const collar=p.collar*260/p.cutY,anchorCollar=Math.min(...profiles.map(q=>q.collar*260/q.cutY)),nodes=[];
 const random=n=>{const v=Math.sin(n*127.1+19.7)*43758.5453;return v-Math.floor(v);};
 function branch(curve,birth,duration,target,parent=null,at=0,order=0,seed=1,layer=0){
  const progress=clamp((clock-birth)/duration);if(progress<=0)return;
  const age=clamp((clock-birth)/23);
  let width=(1.3+target*Math.pow(age,.8));
  if(parent)width=Math.min(width,parent.width*Math.pow(Math.max(0,1-at/parent.progress),.7)*.58);
  const node={id:seed,curve,width,progress,parent:parent?.id??null,at,order,birth,layer};nodes.push(node);
  if(order>=3)return;
  const slots=order===0?5+(seed%2):3;
  for(let j=0;j<slots;j++){
   const spacing=order===0?.115:.205,t=Math.min(.87,.20+j*spacing+random(seed*11+j)*.055),childBirth=birth+duration*t+1.8+order+random(seed+j)*1.6;
   if(clock<=childBirth||progress<=t)continue;
   const origin=point(curve,t),ahead=point(curve,Math.min(1,t+.01));
   const angle=Math.atan2(ahead[1]-origin[1],ahead[0]-origin[0]);
   const side=(j+seed)%2?1:-1;
   let theta=angle+side*(.48+random(seed+j)*.62);
   // Downward bias without a radial fan: laterals can leave either flank.
   if(Math.sin(theta)<-.32)theta=angle-side*.55;
   const parentLength=Math.hypot(curve[3][0]-curve[0][0],curve[3][1]-curve[0][1]);
   const length=parentLength*(.24+random(seed*3+j)*.22);
   const end=[origin[0]+Math.cos(theta)*length+side*(random(seed+j*5)-.5)*10,Math.max(12,origin[1]+Math.sin(theta)*length+length*(.10+random(seed+j)*.12))];
   const child=[origin,[origin[0]+Math.cos(theta)*length*.28,origin[1]+Math.sin(theta)*length*.31],[end[0]-Math.cos(theta+.28*side)*length*.27,end[1]-Math.sin(theta+.28*side)*length*.23],end];
   branch(child,childBirth,6+order*2,target*(.37+random(seed+j)*.08),node,t,order+1,seed*7+j+1,layer);
  }
 }
 AXES.forEach((axis,i)=>{const origin=[axis.origin*anchorCollar,-2],curve=[origin,[origin[0]+axis.c1[0],axis.c1[1]],axis.c2,axis.end];branch(curve,axis.birth,17.5+((i*3)%4),collar*axis.weight,null,0,0,i+1,axis.layer)});
 return {nodes,collar};
}
function draw(canvas,p,investment,depthGrowth,close=false){
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
 const w=rect.width,h=rect.height,ground=close?h*.16:h*.48;
 ctx.fillStyle='#302219';ctx.fillRect(0,0,w,ground);const earth=ctx.createLinearGradient(0,ground,0,h);earth.addColorStop(0,'#261d14');earth.addColorStop(1,'#17120d');ctx.fillStyle=earth;ctx.fillRect(0,ground,w,h-ground);ctx.strokeStyle='#80654666';ctx.beginPath();ctx.moveTo(0,ground);ctx.lineTo(w,ground);ctx.stroke();
 const size=Math.min((w-24)/(profiles[3].spread*2+65),(h-ground-18)/(profiles[3].depth+90),close?10:(ground-14)/260);
 ctx.save();ctx.translate(w/2,ground);ctx.scale(size,size);
 const {nodes}=roots(p,investment);
 const collar=p.collar*260/p.cutY;
 const ordered=[...nodes].sort((a,b)=>a.layer-b.layer||b.order-a.order);for(const node of ordered)wood(ctx,node.curve,node.width,profiles[3].color,node.id,profiles[3],node.progress,node.order);
 ctx.fillStyle=rgb(p.color,.86);ctx.beginPath();ctx.moveTo(-collar*.53,-5);ctx.bezierCurveTo(-collar*.54,1,-collar*.43,7,-collar*.29,11);ctx.quadraticCurveTo(-collar*.13,7,0,12);ctx.quadraticCurveTo(collar*.14,7,collar*.30,11);ctx.bezierCurveTo(collar*.43,7,collar*.54,1,collar*.54,-5);ctx.closePath();ctx.fill();
 ctx.save();ctx.globalAlpha=.34;ctx.strokeStyle=rgb(p.color,1.35);ctx.lineWidth=Math.max(.35,collar*.026);ctx.lineCap='round';for(const offset of [-.32,-.14,.06,.25]){ctx.beginPath();ctx.moveTo(collar*offset,-4);ctx.quadraticCurveTo(collar*(offset+(offset<0?-.035:.035)),3,collar*(offset+(offset<0?-.09:.09)),9);ctx.stroke()}ctx.restore();
 const soil=ctx.createLinearGradient(0,18,0,225);soil.addColorStop(0,'rgba(38,29,20,0)');soil.addColorStop(.52,'rgba(31,24,17,.05)');soil.addColorStop(1,'rgba(23,18,13,.15)');ctx.fillStyle=soil;ctx.fillRect(-250,12,500,225);
 // Source-rectangle cropping preserves every original pixel above this collar.
 const imgScale=260/p.cutY;ctx.drawImage(p.image,0,0,p.image.width,p.cutY,-p.cx*imgScale,-260,p.image.width*imgScale,260);
 ctx.restore();canvas.dataset.nodes=nodes.length;canvas.dataset.collar=collar;canvas.dataset.anchor=p.cx;canvas.dataset.scale=size;
}
let shown=0,frame=0,playing=false;
function render(){if(!ready)return;const p=profiles[stage];document.querySelector('#scene').classList.toggle('focused',focus);draw(document.querySelector('#scene'),p,shown,0,focus);
 for(const c of document.querySelectorAll('[data-snapshot]'))draw(c,p,Number(c.dataset.snapshot),0,true);
 const graph=roots(p,shown);
 document.querySelector('#caption').textContent=`${p.name} · stage growth ${level} / 24 · lifetime ${Math.round(stage*24+shown)} / 96 · ${graph.nodes.length} connected root axes`;
 document.querySelector('#status').textContent='One lifetime root network · no reset between stages';
 document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.stage)===stage));document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.level)===level));
 document.querySelector('#grow').disabled=level>=24;
 document.querySelector('#next').disabled=stage>=3||level<24;
 document.querySelector('#handoff').hidden=stage===3;
 if(stage<3){draw(document.querySelector('#before'),p,24,0,true);draw(document.querySelector('#after'),profiles[stage+1],0,0,true);document.querySelector('#before-label').textContent=p.name+' · established';document.querySelector('#after-label').textContent=profiles[stage+1].name+' · starting';}
 document.querySelector('#timeline').value=shown;
 document.querySelector('#play').textContent=playing?'Pause growth':'Play growth';
}
function stop(){cancelAnimationFrame(frame);playing=false;}
function setLevel(n,animate=false){stop();level=n;const start=shown,time=performance.now();
 if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){shown=n;render();return;}
 function tick(now){const t=clamp((now-time)/850);shown=mix(start,n,t*t*(3-2*t));render();if(t<1)frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
}
document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{stop();shown=level=0;stage=Number(b.dataset.stage);render();});document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>setLevel(Number(b.dataset.level)));
document.querySelector('#next').onclick=()=>{if(stage<3&&level===24){stop();stage++;shown=level=0;render();}};
document.querySelector('#grow').onclick=()=>setLevel(Math.min(24,level+1),true);
document.querySelector('#play').onclick=()=>{if(playing){stop();level=Math.round(shown);shown=level;render();return;}stop();if(shown>=24)shown=0;playing=true;const from=shown,start=performance.now();function tick(now){shown=Math.min(24,from+(now-start)/950);level=Math.floor(shown);if(shown>=24)playing=false;render();if(playing)frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);};
document.querySelector('#timeline').oninput=e=>setLevel(Number(e.target.value));
document.querySelector('#reset').onclick=()=>setLevel(0);document.querySelector('#focus').onchange=e=>{focus=e.target.checked;render();};window.addEventListener('resize',render);
try{await Promise.all(profiles.map(async(p,i)=>{const image=new Image();image.crossOrigin='anonymous';image.src=`https://fidgetbot.github.io/trees/assets/trees/cherry-${p.key}-v1.png`;await image.decode();profiles[i]=prepare(image,p);}));ready=true;render();}catch(error){document.querySelector('#status').textContent='Could not load tree artwork. Please refresh.';console.error(error);}
// Read-only review hooks for checking connected, persistent geometry.
window.rootStudy={getGeometry:(s,n,d)=>roots(profiles[s],n,d),getState:()=>({stage,level,shown,playing,ready})};
