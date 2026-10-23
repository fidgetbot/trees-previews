const BG='#281d15';
export async function createSpecimen(spec){
const source=await load(spec.master);
const sourceCanvas=document.createElement('canvas');sourceCanvas.width=source.width;sourceCanvas.height=source.height;const sx=sourceCanvas.getContext('2d');sx.drawImage(source,0,0);
const cutY=Math.round(source.height*spec.cut),row=sx.getImageData(0,cutY,source.width,1).data;
const spans=[];let start=-1;for(let x=0;x<=source.width;x++){if(x<source.width&&row[x*4+3]>160){if(start<0)start=x;}else if(start>=0){spans.push([start,x-1]);start=-1;}}
const [left,right]=spans.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0],cx=(left+right)/2,scale=260/cutY,collar=(right-left+1)*scale;
const rootUnit=collar/59.56656346749226;
const axes=[
 {p:[[-collar*.36,-2],[-52,12],[-145,34],[-215,64]],w:collar*.28,seed:5},
 {p:[[-collar*.17,-1],[-42,40],[-85,105],[-126,174]],w:collar*.33,seed:8},
 {p:[[collar*.04,0],[20,38],[8,134],[43,220]],w:collar*.32,seed:11},
 {p:[[collar*.21,-1],[37,23],[80,94],[140,164]],w:collar*.25,seed:14},
 {p:[[collar*.39,-2],[60,9],[157,31],[225,72]],w:collar*.26,seed:17}
].map(axis=>({...axis,p:axis.p.map((p,i)=>i===0?p:p.map(v=>v*rootUnit))}));
const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
function point(p,t){const u=1-t;return [0,1].map(k=>u*u*u*p[0][k]+3*u*u*t*p[1][k]+3*u*t*t*p[2][k]+t*t*t*p[3][k]);}
function width(w,t){return w*Math.pow(Math.max(0,1-t),.8);}
function wood(ctx,p,w,end=1,seed=1){
 const samples=[];for(let i=0;i<=Math.ceil(end*100);i++){const t=Math.min(end,i/100),a=point(p,Math.max(0,t-.002)),b=point(p,Math.min(1,t+.002)),d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;const tip=smooth((end-t)/.085);samples.push({t,p:point(p,t),n:[-(b[1]-a[1])/d,(b[0]-a[0])/d],w:width(w,t)*tip});}
 ctx.beginPath();for(const side of [-1,1]){const list=side<0?samples:[...samples].reverse();list.forEach((s,i)=>{const x=s.p[0]+side*s.n[0]*s.w/2,y=s.p[1]+side*s.n[1]*s.w/2;if(side<0&&i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});}ctx.closePath();ctx.fillStyle='#7e4935';ctx.fill();
 if(w/rootUnit>2){ctx.save();ctx.clip();for(let i=0;i<samples.length-1;i++){const a=samples[i],b=samples[i+1],d=Math.hypot(b.p[0]-a.p[0],b.p[1]-a.p[1]);ctx.save();ctx.translate(a.p[0],a.p[1]);ctx.rotate(Math.atan2(b.p[1]-a.p[1],b.p[0]-a.p[0])-Math.PI/2);const sw=(right-left)*.8,sy=cutY-70+((Math.floor(a.t/.79*80)+seed*3)%60);ctx.drawImage(sourceCanvas,cx-sw/2,sy,sw,3,-a.w*.53,-.2,a.w*1.06,d+.5);ctx.restore();}ctx.restore();}
}
function graph(ctx,growth){
 for(const [i,axis] of axes.entries()){
  const end=.58+.42*growth;wood(ctx,axis.p,axis.w,end,axis.seed);
  for(let j=0;j<6;j++){const t=.32+j*.103,age=clamp((growth+.3-j*.09)*2);if(!age||t>end-.05)continue;const a=point(axis.p,t),b=point(axis.p,t+.01),angle=Math.atan2(b[1]-a[1],b[0]-a[0])+((i+j)%2?1:-1)*(.58+.12*Math.sin(i+j));const len=(36+12*Math.sin(i*5+j*3))*age*rootUnit;const target=[a[0]+Math.cos(angle)*len,a[1]+Math.sin(angle)*len+8*rootUnit];const p=[a,[a[0]+Math.cos(angle)*len*.25,a[1]+Math.sin(angle)*len*.25],[target[0]-Math.cos(angle+.3)*len*.25,target[1]-Math.sin(angle+.3)*len*.25],target];const w=width(axis.w,t)*.35;wood(ctx,p,w,1,axis.seed+j);if(age>.65){for(let k=0;k<2;k++){const q=point(p,.45+k*.25),an=angle+(k?-.7:.8),l=len*.4;wood(ctx,[q,[q[0]+Math.cos(an)*l*.3,q[1]+Math.sin(an)*l*.3],[q[0]+Math.cos(an)*l*.8,q[1]+Math.sin(an)*l*.8],[q[0]+Math.cos(an)*l,q[1]+Math.sin(an)*l]],w*.3,1,j+k);}}}
 }
}
function original(ctx){const paintY=cutY+27*rootUnit;ctx.drawImage(sourceCanvas,0,0,source.width,paintY,-cx*scale,-260,source.width*scale,paintY*scale);}
// The reference tile maps world [-128,128] × [-90,166] to 1024² pixels.
let patch=null;
if(spec.patch)patch=await load(spec.patch);

function scene(ctx,amount,edited){graph(ctx,amount);original(ctx);if(edited&&patch)ctx.drawImage(patch,-128*rootUnit,-90*rootUnit,256*rootUnit,256*rootUnit);}
function draw(canvas,{growth=.5,edited=true,whole=false}={}){
const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);
const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.fillStyle=BG;ctx.fillRect(0,0,r.width,r.height);ctx.save();
if(whole){const scale=Math.min((r.width-24)/Math.max(540*rootUnit,source.width*260/cutY),(r.height-24)/(270+240*rootUnit));ctx.translate(r.width/2,270*scale);ctx.scale(scale,scale);}
else{const scale=r.width/(256*rootUnit);ctx.translate(r.width/2,90*rootUnit*scale);ctx.scale(scale,scale);}
scene(ctx,growth,edited);ctx.restore();
}
function reference(){const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d');ctx.fillStyle=BG;ctx.fillRect(0,0,1024,1024);ctx.translate(512,360);ctx.scale(4/rootUnit,4/rootUnit);scene(ctx,.5,false);return c.toDataURL();}
return {spec,draw,reference,hasPatch:!!patch,contract:{cutY,cx,collar,rootUnit,axes,sourceWidth:source.width,sourceHeight:source.height}};
}
function load(url){return new Promise((resolve,reject)=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Cannot load '+url));i.src=url;});}

