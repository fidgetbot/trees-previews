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
function wood(ctx,curve,width,color,seed,material,progress=1){
 const samples=[];for(let i=0;i<=36;i++){const u=i/36,t=u*progress;const p=point(curve,t),a=point(curve,Math.max(0,t-.005)),b=point(curve,Math.min(1,t+.005));const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
 samples.push({p,n:[-(b[1]-a[1])/d,(b[0]-a[0])/d],w:width*Math.pow(1-u,.7)*(1+.035*Math.sin(t*32+seed))});}
 ctx.beginPath();for(const side of [-1,1]){const list=side===-1?samples:[...samples].reverse();list.forEach((s,i)=>{const x=s.p[0]+side*s.n[0]*s.w/2,y=s.p[1]+side*s.n[1]*s.w/2;if(side===-1&&i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});}ctx.closePath();ctx.fillStyle=rgb(color,width<1.5?1.25:.85);ctx.fill();
 if(width<3)return;
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
const clamp=v=>Math.max(0,Math.min(1,v));
function roots(p,investments){
 const collar=p.collar*260/p.cutY,nodes=[],clock=investments+3;
 const random=n=>{const v=Math.sin(n*127.1+19.7)*43758.5453;return v-Math.floor(v);};
 function branch(curve,birth,duration,target,parent=null,at=0,order=0,seed=1){
  const progress=clamp((clock-birth)/duration);if(progress<=0)return;
  const age=clamp((clock-birth)/23);
  let width=(1.3+target*Math.pow(age,.8));
  if(parent)width=Math.min(width,parent.width*Math.pow(Math.max(0,1-at/parent.progress),.7)*.58);
  const node={id:seed,curve,width,progress,parent:parent?.id??null,at,order,birth};nodes.push(node);
  if(order>=3)return;
  const slots=order===0?5:3;
  for(let j=0;j<slots;j++){
   const t=.25+j*(order===0?.135:.22),childBirth=birth+duration*t+2.3+order;
   if(clock<=childBirth||progress<=t)continue;
   const origin=point(curve,t),ahead=point(curve,Math.min(1,t+.01));
   const angle=Math.atan2(ahead[1]-origin[1],ahead[0]-origin[0]);
   const side=(j+seed)%2?1:-1;
   let theta=angle+side*(.55+random(seed+j)*.48);
   // Downward bias without a radial fan: laterals can leave either flank.
   if(Math.sin(theta)<-.32)theta=angle-side*.55;
   const parentLength=Math.hypot(curve[3][0]-curve[0][0],curve[3][1]-curve[0][1]);
   const length=parentLength*(.27+random(seed*3+j)*.15);
   const end=[origin[0]+Math.cos(theta)*length,Math.max(12,origin[1]+Math.sin(theta)*length+length*.15)];
   const child=[origin,[origin[0]+Math.cos(theta)*length*.32,origin[1]+Math.sin(theta)*length*.32],[end[0]-Math.cos(theta+.24*side)*length*.25,end[1]-Math.sin(theta+.24*side)*length*.25],end];
   branch(child,childBirth,6+order*2,target*.42,node,t,order+1,seed*7+j+1);
  }
 }
 const count=5; // Few persistent axes, never new parallel tentacles on investment.
 for(let i=0;i<count;i++){
  const side=i<2?-1:i>2?1:0,rank=i<2?i:i>2?4-i:0;
  const x=side*p.spread*(rank===0?.83:.48),y=side?(rank===0?48:p.depth*.65):p.depth*.98;
  const origin=[(i-2)*collar*.16,-2];
  const curve=[origin,[origin[0]+side*42,20],[x*.72+(side?0:-18),y*.65],[x+(side?0:9),y]];
  branch(curve,-2,18,collar*(side?.22:.26),null,0,0,i+1);
 }
 return {nodes,collar};
}
function draw(canvas,p,investment,depthGrowth,close=false){
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
 const w=rect.width,h=rect.height,ground=close?h*.16:h*.48;
 ctx.fillStyle='#302219';ctx.fillRect(0,0,w,ground);const earth=ctx.createLinearGradient(0,ground,0,h);earth.addColorStop(0,'#261d14');earth.addColorStop(1,'#17120d');ctx.fillStyle=earth;ctx.fillRect(0,ground,w,h-ground);ctx.strokeStyle='#80654666';ctx.beginPath();ctx.moveTo(0,ground);ctx.lineTo(w,ground);ctx.stroke();
 const size=Math.min((w-24)/(p.spread*2+65),(h-ground-18)/(p.depth+90),close?10:(ground-14)/260);
 ctx.save();ctx.translate(w/2,ground);ctx.scale(size,size);
 const {nodes,collar}=roots(p,investment,depthGrowth);
 for(let i=nodes.length-1;i>=0;i--)wood(ctx,nodes[i].curve,nodes[i].width,p.color,nodes[i].id,p,nodes[i].progress);
 ctx.fillStyle=rgb(p.color,.90);ctx.beginPath();ctx.moveTo(-collar/2,-2);ctx.bezierCurveTo(-collar*.48,5,-collar*.35,10,-collar*.31,12);ctx.quadraticCurveTo(0,6,collar*.31,12);ctx.bezierCurveTo(collar*.35,10,collar*.48,5,collar/2,-2);ctx.closePath();ctx.fill();ctx.save();ctx.clip();ctx.drawImage(p.image,p.cx-p.collar/2,p.cutY-12,p.collar,12,-collar/2,-2,collar,15);ctx.restore();
 // Source-rectangle cropping preserves every original pixel above this collar.
 const imgScale=260/p.cutY;ctx.drawImage(p.image,0,0,p.image.width,p.cutY,-p.cx*imgScale,-260,p.image.width*imgScale,260);
 ctx.restore();canvas.dataset.nodes=nodes.length;canvas.dataset.collar=collar;canvas.dataset.anchor=p.cx;canvas.dataset.scale=size;
}
let shown=0,frame=0,playing=false;
function render(){if(!ready)return;const p=profiles[stage];document.querySelector('#scene').classList.toggle('focused',focus);draw(document.querySelector('#scene'),p,shown,0,focus);
 for(const c of document.querySelectorAll('[data-snapshot]'))draw(c,p,Number(c.dataset.snapshot),0,true);
 const graph=roots(p,shown);
 document.querySelector('#caption').textContent=`${p.name} · growth step ${level} / 24 · ${graph.nodes.length} connected root axes`;
 document.querySelector('#status').textContent='Tips extend · smaller roots branch · older wood thickens';
 document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.stage)===stage));document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.level)===level));
 document.querySelector('#grow').disabled=level>=24;
 document.querySelector('#timeline').value=shown;
 document.querySelector('#play').textContent=playing?'Pause growth':'Play growth';
}
function stop(){cancelAnimationFrame(frame);playing=false;}
function setLevel(n,animate=false){stop();level=n;const start=shown,time=performance.now();
 if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){shown=n;render();return;}
 function tick(now){const t=clamp((now-time)/850);shown=mix(start,n,t*t*(3-2*t));render();if(t<1)frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
}
document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{stop();shown=level;stage=Number(b.dataset.stage);render();});document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>setLevel(Number(b.dataset.level)));
document.querySelector('#grow').onclick=()=>setLevel(Math.min(24,level+1),true);
document.querySelector('#play').onclick=()=>{if(playing){stop();level=Math.round(shown);shown=level;render();return;}stop();if(shown>=24)shown=0;playing=true;const from=shown,start=performance.now();function tick(now){shown=Math.min(24,from+(now-start)/950);level=Math.floor(shown);if(shown>=24)playing=false;render();if(playing)frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);};
document.querySelector('#timeline').oninput=e=>setLevel(Number(e.target.value));
document.querySelector('#reset').onclick=()=>setLevel(0);document.querySelector('#focus').onchange=e=>{focus=e.target.checked;render();};window.addEventListener('resize',render);
try{await Promise.all(profiles.map(async(p,i)=>{const image=new Image();image.crossOrigin='anonymous';image.src=`https://fidgetbot.github.io/trees/assets/trees/cherry-${p.key}-v1.png`;await image.decode();profiles[i]=prepare(image,p);}));ready=true;render();}catch(error){document.querySelector('#status').textContent='Could not load tree artwork. Please refresh.';console.error(error);}
// Read-only review hooks for checking connected, persistent geometry.
window.rootStudy={getGeometry:(s,n,d)=>roots(profiles[s],n,d),getState:()=>({stage,level,shown,playing,ready})};
