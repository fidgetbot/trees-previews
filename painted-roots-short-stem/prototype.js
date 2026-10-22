const ASSET_ROOT = 'https://fidgetbot.github.io/trees/assets/trees';
const EXTENSION_URL = '../painted-roots/assets/root-woody-v2.png';
const SPECIES = 'cherry';
const FORK_Y = 720;
const NETWORK_Y = 610;
let taprootGrowth=0;
let lateralGrowth=0;
const lateralRoots=[];
let growthMessage='Two attachment points available. Try Grow roots three times.';
const VARIANTS = Object.freeze({
  taproot: { type:'taproot' },
  baseline: { type:'compressed', overlap:.18 },
  matched: { type:'matched', widthRatio:1, overlap:.22 },
  slender: { type:'matched', widthRatio:.78, overlap:.18 },
});
const ATTACHMENTS = Object.freeze([
  [.38,-1,.62],[.49,1,.58],[.61,-1,.54],[.72,1,.50],
  [.80,-1,.45],[.56,1,.43],[.69,-1,.40],[.86,1,.37],
]);
const STAGES = Object.freeze([
  { key:'sapling', label:'Sapling', width:66, height:82, groundRatio:.59, zoom:1.75, additions:3 },
  { key:'young-tree', label:'Young Tree', width:94, height:105, groundRatio:.61, zoom:1.18, additions:4 },
  { key:'mature-tree', label:'Mature Tree', width:142, height:122, groundRatio:.63, zoom:.86, additions:5 },
  { key:'ancient', label:'Ancient', width:174, height:136, groundRatio:.65, zoom:.74, additions:6, maxJoinWidthRatio:.0175 },
]);

const loadImage = source => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.decoding = 'async';
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = source;
});

function imagePixels(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently:true });
  context.drawImage(image,0,0);
  return { width:canvas.width, height:canvas.height, data:context.getImageData(0,0,canvas.width,canvas.height).data };
}

function extensionMetrics(image) {
  const pixel = imagePixels(image);
  let sx=pixel.width/2, sy=0, found=false;
  for(let y=0;y<pixel.height&&!found;y++){
    const xs=[];
    for(let x=0;x<pixel.width;x++) if(pixel.data[(y*pixel.width+x)*4+3]>220) xs.push(x);
    if(xs.length>3){ sy=Math.min(pixel.height-1,y+6); sx=xs.reduce((a,b)=>a+b,0)/xs.length; found=true; }
  }
  const row=[];
  for(let x=0;x<pixel.width;x++) if(pixel.data[(sy*pixel.width+x)*4+3]>160) row.push(x);
  const networkRow=[];
  for(let x=0;x<pixel.width;x++) if(pixel.data[(NETWORK_Y*pixel.width+x)*4+3]>220) networkRow.push(x);
  const networkLeft=networkRow[0]??sx-2;
  const networkRight=networkRow.at(-1)??sx+2;
  return {
    sx, sy, maxY:1352,
    inletWidth:Math.max(1,row.length?row.at(-1)-row[0]+1:4),
    networkX:(networkLeft+networkRight)/2,
    networkWidth:Math.max(1,networkRight-networkLeft+1),
    width:pixel.width, height:pixel.height,
  };
}

function attachment(pixel,groundRatio,fraction,side){
  const desired=Math.round(pixel.height*(groundRatio+(1-groundRatio)*fraction));
  for(let radius=0;radius<pixel.height*.12;radius++) for(const y of radius?[desired-radius,desired+radius]:[desired]){
    if(y<0||y>=pixel.height) continue;
    const xs=[];
    for(let x=0;x<pixel.width;x++) if(pixel.data[(y*pixel.width+x)*4+3]>150) xs.push(x);
    if(!xs.length) continue;
    const x=side<0?xs[0]:xs.at(-1); let left=x,right=x;
    while(left>0&&pixel.data[(y*pixel.width+left-1)*4+3]>95) left--;
    while(right<pixel.width-1&&pixel.data[(y*pixel.width+right+1)*4+3]>95) right++;
    return {x,y,parentWidth:right-left+1};
  }
  return null;
}

function rootLayout(stageImage,geometry,amount){
  const pixel=imagePixels(stageImage);
  return ATTACHMENTS.slice(0,amount).map(([fraction,side,size],index)=>{
    const point=attachment(pixel,geometry.groundRatio,fraction,side);
    if(!point)return null;
    return { index,side,size,progress:1,
      x:(point.x/pixel.width-.5)*geometry.width,
      y:(point.y/pixel.height-geometry.groundRatio)*geometry.height,
      parentWidth:point.parentWidth/pixel.width*geometry.width };
  }).filter(Boolean);
}

function shortenedExtension(image,metrics,factor){
  if(factor===1)return image;
  const connectorHeight=FORK_Y-metrics.sy;
  const destinationFork=Math.round(metrics.sy+connectorHeight*factor);
  const removed=FORK_Y-destinationFork;
  const canvas=document.createElement('canvas');
  canvas.width=image.naturalWidth;
  canvas.height=image.naturalHeight-removed;
  const context=canvas.getContext('2d');
  context.drawImage(image,0,0,image.naturalWidth,metrics.sy,0,0,image.naturalWidth,metrics.sy);
  context.drawImage(image,0,metrics.sy,image.naturalWidth,connectorHeight,0,metrics.sy,image.naturalWidth,destinationFork-metrics.sy);
  context.drawImage(image,0,FORK_Y,image.naturalWidth,image.naturalHeight-FORK_Y,0,destinationFork,image.naturalWidth,image.naturalHeight-FORK_Y);
  return canvas;
}

function distalNetwork(image){
  const canvas=document.createElement('canvas');
  canvas.width=image.naturalWidth;
  canvas.height=image.naturalHeight-NETWORK_Y;
  canvas.getContext('2d').drawImage(
    image,0,NETWORK_Y,image.naturalWidth,image.naturalHeight-NETWORK_Y,
    0,0,image.naturalWidth,image.naturalHeight-NETWORK_Y,
  );
  return canvas;
}

function taperedWood(context,points,width){
  const samples=[];
  for(let i=0;i<=48;i++){
    const t=i/48,u=1-t;
    const x=u*u*u*points[0][0]+3*u*u*t*points[1][0]+3*u*t*t*points[2][0]+t*t*t*points[3][0];
    const y=u*u*u*points[0][1]+3*u*u*t*points[1][1]+3*u*t*t*points[2][1]+t*t*t*points[3][1];
    samples.push({x,y,w:width*Math.pow(1-t,1.15)});
  }
  context.beginPath();
  for(const side of [1,-1]){
    const order=side===1?samples:[...samples].reverse();
    order.forEach((p,i)=>{
      const index=samples.indexOf(p),a=samples[Math.max(0,index-1)],b=samples[Math.min(48,index+1)];
      const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1;
      const x=p.x-dy/length*p.w*.5*side,y=p.y+dx/length*p.w*.5*side;
      if(side===1&&i===0)context.moveTo(x,y);else context.lineTo(x,y);
    });
  }
  context.closePath();
  const shade=context.createLinearGradient(-width,0,width,0);
  shade.addColorStop(0,'#543022');shade.addColorStop(.45,'#b77852');shade.addColorStop(1,'#68412d');
  context.fillStyle=shade;context.fill();
}

function drawTaproot(context,stageImage,geometry,amount){
  const depth=geometry.height*(1-geometry.groundRatio)*1.4;
  const width=geometry.width*.045;
  // Stable attachment slots: adding a lateral never moves an existing root.
  const center=t=>[0,depth*t];
  for(let i=0;i<lateralRoots.length;i++){
    const t=.69+i*.105,side=i%2?1:-1,origin=center(t);
    const reach=geometry.width*(.20-i*.012),drop=depth*.16;
    const branchWidth=width*.22/(1+i*.13);
    const end=[origin[0]+side*reach,origin[1]+drop];
    const curve=[origin,[origin[0]+side*reach*.35,origin[1]+drop*.1],[end[0]*.85,end[1]-drop*.3],end];
    taperedWood(context,curve,branchWidth);
    for(let j=0;j<2+lateralRoots[i];j++){
      const q=.2+j*.045,u=1-q;
      const start=[0,1].map(k=>u*u*u*curve[0][k]+3*u*u*q*curve[1][k]+3*u*q*q*curve[2][k]+q*q*q*curve[3][k]);
      taperedWood(context,[start,[start[0]+side*reach*.05,start[1]+drop*.3],[start[0]+side*reach*.12,start[1]+drop*.7],[start[0]+side*reach*.16,start[1]+drop*.9]],branchWidth*(1-q)*.45);
    }
  }
  const grownDepth=depth*(1+taprootGrowth*.22);
  taperedWood(context,[[0,-width],[0,grownDepth*.22],[0,grownDepth*.65],[0,grownDepth]],width);
  // Keep the complete original painting above the new central root.
  context.drawImage(stageImage,-geometry.width*.5,-geometry.height*geometry.groundRatio,geometry.width,geometry.height);
}

function drawRootGrowth(context,stageImage,extensionImage,metrics,geometry,amount,variantKey){
  const option=VARIANTS[variantKey];
  if(option.type==='taproot'){drawTaproot(context,stageImage,geometry,Math.min(8,amount+lateralGrowth));return;}
  const variant=option.type==='compressed'
    ? shortenedExtension(extensionImage,metrics,0)
    : distalNetwork(extensionImage);
  for(const part of rootLayout(stageImage,geometry,amount)){
    const desired=geometry.height*part.size;
    const sourceY=option.type==='compressed'?metrics.sy:0;
    const sourceX=option.type==='compressed'?metrics.sx:metrics.networkX;
    const sourceWidth=option.type==='compressed'?metrics.inletWidth:metrics.networkWidth;
    const sourceHeight=option.type==='compressed'?metrics.maxY-metrics.sy:metrics.maxY-NETWORK_Y;
    // The matched variants use the actual pre-fork stem width as their scale
    // reference. The join can therefore never be wider than the painted tip.
    const joinRatio=option.type==='compressed'?.8:option.widthRatio;
    // Ancient's far-left painted root is nearly horizontal. A horizontal
    // alpha scan crosses 26 pixels along that root instead of measuring its
    // thickness, so constrain matched networks to the stage's ordinary
    // terminal-root width. Earlier stages and the v2 baseline are unchanged.
    const stageJoinWidth=option.type==='compressed'||!geometry.maxJoinWidthRatio
      ? part.parentWidth
      : Math.min(part.parentWidth,geometry.width*geometry.maxJoinWidthRatio);
    const scale=Math.min(desired/Math.max(1,sourceHeight),stageJoinWidth*joinRatio/sourceWidth);
    if(!(scale>0))continue;
    const overlap=stageJoinWidth*option.overlap;
    context.save();
    context.translate(part.x,part.y);
    context.rotate(part.side<0?.64:-.59);
    context.scale(part.side<0?-1:1,1);
    context.drawImage(variant,-sourceX*scale,-sourceY*scale-overlap,variant.width*scale,variant.height*scale);
    context.restore();
  }
  context.drawImage(stageImage,-geometry.width*.5,-geometry.height*geometry.groundRatio,geometry.width,geometry.height);
}

function drawGround(context,width,height,groundY){
  const sky=context.createLinearGradient(0,0,0,groundY);
  sky.addColorStop(0,'#4b2e21'); sky.addColorStop(1,'#2d1d16');
  context.fillStyle=sky; context.fillRect(0,0,width,groundY);
  const earth=context.createLinearGradient(0,groundY,0,height);
  earth.addColorStop(0,'#261a13'); earth.addColorStop(1,'#130e0b');
  context.fillStyle=earth; context.fillRect(0,groundY,width,height-groundY);
  context.strokeStyle='#80604766'; context.lineWidth=1; context.beginPath(); context.moveTo(0,groundY+.5); context.lineTo(width,groundY+.5); context.stroke();
}

function makeCard(stage){
  const figure=document.createElement('figure');
  const canvas=document.createElement('canvas');
  const caption=document.createElement('figcaption');
  caption.innerHTML=`<strong>${stage.label}</strong><span>${stage.additions} added roots</span>`;
  figure.append(canvas,caption);
  document.querySelector('#grid').append(figure);
  stage.canvas=canvas;
}

function renderStage(stage,variantKey,stageImage,extensionImage,metrics){
  const canvas=stage.canvas;
  const rect=canvas.getBoundingClientRect();
  const ratio=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.round(rect.width*ratio); canvas.height=Math.round(rect.height*ratio);
  const context=canvas.getContext('2d');
  context.scale(ratio,ratio);
  const width=rect.width,height=rect.height,groundY=height*.48;
  drawGround(context,width,height,groundY);
  context.save();
  const sceneScale=Math.min(width/260,height/205)*stage.zoom*(variantKey==='taproot'?.72:1);
  context.translate(width*.5,groundY);
  context.scale(sceneScale,sceneScale);
  drawRootGrowth(context,stageImage,extensionImage,metrics,stage,stage.additions,variantKey);
  context.restore();
}

let currentVariant='taproot';
const assets={};
for(const stage of STAGES)makeCard(stage);
document.querySelector('#grow-taproot').addEventListener('click',()=>{taprootGrowth=Math.min(3,taprootGrowth+1);growthMessage='Taproot extended; two new attachment points opened.';currentVariant='taproot';render();});
document.querySelector('#add-lateral').addEventListener('click',()=>{
  if(lateralRoots.length<2+taprootGrowth*2){lateralRoots.push(0);growthMessage='A new lateral root grows from the taproot.';}
  else {const i=lateralRoots.indexOf(Math.min(...lateralRoots));lateralRoots[i]++;growthMessage='Taproot slots full: an existing lateral grows a finer branch.';}
  lateralGrowth++;currentVariant='taproot';render();
});
document.querySelector('#reset-growth').addEventListener('click',()=>{taprootGrowth=0;lateralGrowth=0;lateralRoots.length=0;growthMessage='Two attachment points available. Try Grow roots three times.';render();});

async function render(){
  document.querySelector('#grow-taproot').disabled=taprootGrowth===3;
  document.querySelector('#add-lateral').disabled=lateralGrowth>=24;
  document.querySelector('#growth-status').textContent=`${lateralRoots.length}/${2+taprootGrowth*2} taproot slots occupied · ${lateralRoots.reduce((a,b)=>a+b,0)} additional lateral branches. ${growthMessage}`;
  document.querySelectorAll('button[data-variant]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.variant===currentVariant)));
  for(const stage of STAGES)renderStage(stage,currentVariant,assets[stage.key],assets.extension,assets.metrics);
}

document.querySelectorAll('button[data-variant]').forEach(button=>button.addEventListener('click',()=>{
  currentVariant=button.dataset.variant;
  document.querySelectorAll('button[data-variant]').forEach(candidate=>candidate.setAttribute('aria-pressed',String(candidate===button)));
  render();
}));

try{
  const loaded=await Promise.all([
    loadImage(EXTENSION_URL),
    ...STAGES.map(stage=>loadImage(`${ASSET_ROOT}/${SPECIES}-${stage.key}-v1.png`)),
  ]);
  assets.extension=loaded[0]; assets.metrics=extensionMetrics(assets.extension);
  STAGES.forEach((stage,index)=>assets[stage.key]=loaded[index+1]);
  document.querySelector('#status').textContent='Production Cherry paintings · fixed stage scale in every option';
  await render();
  let timer;
  window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(render,80)});
}catch(error){
  document.querySelector('#status').textContent='The production paintings could not be loaded. Please refresh.';
  console.error(error);
}
