const ASSET_ROOT = 'https://fidgetbot.github.io/trees/assets/trees';
const EXTENSION_URL = '../painted-roots/assets/root-woody-v2.png';
const SPECIES = 'cherry';
const FORK_Y = 720;
const VARIANTS = Object.freeze({
  fan: { type:'fan', factor:0, overlap:.18 },
  layered: { type:'layered', strands:2, laterals:2 },
  dense: { type:'layered', strands:3, laterals:3 },
});
const ATTACHMENTS = Object.freeze([
  [.38,-1,.62],[.49,1,.58],[.61,-1,.54],[.72,1,.50],
  [.80,-1,.45],[.56,1,.43],[.69,-1,.40],[.86,1,.37],
]);
const STAGES = Object.freeze([
  { key:'sapling', label:'Sapling', width:66, height:82, groundRatio:.59, zoom:1.75, additions:3 },
  { key:'young-tree', label:'Young Tree', width:94, height:105, groundRatio:.61, zoom:1.18, additions:4 },
  { key:'mature-tree', label:'Mature Tree', width:142, height:122, groundRatio:.63, zoom:.86, additions:5 },
  { key:'ancient', label:'Ancient', width:174, height:136, groundRatio:.65, zoom:.74, additions:6 },
]);

const clamp = value => Math.max(0, Math.min(1, value));
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
  return { sx, sy, maxY:1352, inletWidth:Math.max(1,row.length?row.at(-1)-row[0]+1:4), width:pixel.width, height:pixel.height };
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

function cubicPoint(curve,t){
  const inverse=1-t;
  return {
    x:inverse**3*curve[0].x+3*inverse**2*t*curve[1].x+3*inverse*t**2*curve[2].x+t**3*curve[3].x,
    y:inverse**3*curve[0].y+3*inverse**2*t*curve[1].y+3*inverse*t**2*curve[2].y+t**3*curve[3].y,
  };
}

function drawTaperedCurve(context,curve,startWidth,endWidth,opacity=1){
  const steps=28;
  let previous=cubicPoint(curve,0);
  context.save();
  context.lineCap='round';
  context.lineJoin='round';
  context.globalAlpha=opacity;
  for(let index=1;index<=steps;index++){
    const t=index/steps;
    const point=cubicPoint(curve,t);
    const width=startWidth+(endWidth-startWidth)*Math.pow(t,.82);
    context.strokeStyle='#3a1d15';
    context.lineWidth=width+Math.max(.16,startWidth*.28);
    context.beginPath();context.moveTo(previous.x,previous.y);context.lineTo(point.x,point.y);context.stroke();
    context.strokeStyle=t<.62?'#9d573d':'#b87551';
    context.lineWidth=width;
    context.beginPath();context.moveTo(previous.x,previous.y);context.lineTo(point.x,point.y);context.stroke();
    context.strokeStyle='rgba(238,177,120,.34)';
    context.lineWidth=Math.max(.08,width*.22);
    context.beginPath();context.moveTo(previous.x-width*.1,previous.y-width*.08);context.lineTo(point.x-width*.1,point.y-width*.08);context.stroke();
    previous=point;
  }
  context.restore();
}

function layeredCurve(geometry,layer,strand,strandCount){
  const side=layer%2?-1:1;
  const depth=geometry.height*(1-geometry.groundRatio);
  const pathIndex=layer*strandCount+strand;
  const lane=pathIndex%5;
  const start={x:side*geometry.width*(.035+layer*.006),y:depth*(.035+strand*.018)};
  const end={
    x:side*geometry.width*(.18+lane*.055+layer*.004),
    y:depth*(.56+((pathIndex*3)%5)*.085),
  };
  return [
    start,
    {x:side*geometry.width*(.07+lane*.012),y:depth*(.15+strand*.025)},
    {x:end.x*(.61+strand*.04),y:end.y*(.58+((pathIndex+2)%3)*.06)},
    end,
  ];
}

function drawLayeredRoots(context,geometry,amount,option){
  const layers=Math.max(1,amount);
  for(let layer=0;layer<layers;layer++){
    for(let strand=0;strand<option.strands;strand++){
      const curve=layeredCurve(geometry,layer,strand,option.strands);
      const baseWidth=geometry.width*(.0082-layer*.00035)*(1-strand*.12);
      drawTaperedCurve(context,curve,baseWidth,Math.max(.09,baseWidth*.13),.90);
      for(let branch=0;branch<option.laterals;branch++){
        const t=.43+branch*.19+strand*.035;
        const origin=cubicPoint(curve,t);
        const direction=(layer+branch+strand)%2?-1:1;
        const side=layer%2?-1:1;
        const reach=geometry.width*(.032+branch*.009);
        const drop=geometry.height*(1-geometry.groundRatio)*(.075+branch*.026);
        const lateral=[
          origin,
          {x:origin.x+side*reach*.28,y:origin.y+drop*.12},
          {x:origin.x+side*reach*.62,y:origin.y+drop*(.58+direction*.10)},
          {x:origin.x+side*reach,y:origin.y+drop},
        ];
        const branchWidth=baseWidth*(.48-branch*.08);
        drawTaperedCurve(context,lateral,branchWidth,Math.max(.07,branchWidth*.16),.82);
      }
    }
  }
}

function drawRootGrowth(context,stageImage,extensionImage,metrics,geometry,amount,variantKey){
  const option=VARIANTS[variantKey];
  if(option.type==='layered'){
    drawLayeredRoots(context,geometry,amount,option);
    context.drawImage(stageImage,-geometry.width*.5,-geometry.height*geometry.groundRatio,geometry.width,geometry.height);
    return;
  }
  const variant=shortenedExtension(extensionImage,metrics,option.factor);
  for(const part of rootLayout(stageImage,geometry,amount)){
    const desired=geometry.height*part.size;
    // The original image remains the scale reference: the network stays the
    // same size while only the narrow connector relinquishes space.
    const scale=Math.min(desired/Math.max(1,metrics.maxY-metrics.sy),part.parentWidth*.8/metrics.inletWidth);
    if(!(scale>0))continue;
    // The tip-attached concept removes the entire narrow connector. A small
    // overlap places its first branching node beneath the painted endpoint,
    // so the established root masks the seam and the new fork begins there.
    const overlap=part.parentWidth*option.overlap;
    context.save();
    context.translate(part.x,part.y);
    context.rotate(part.side<0?.64:-.59);
    context.scale(part.side<0?-1:1,1);
    context.drawImage(variant,-metrics.sx*scale,-metrics.sy*scale-overlap,variant.width*scale,variant.height*scale);
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
  caption.innerHTML=`<strong>${stage.label}</strong><span>${stage.additions} growth layers</span>`;
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
  const sceneScale=Math.min(width/260,height/205)*stage.zoom;
  context.translate(width*.5,groundY);
  context.scale(sceneScale,sceneScale);
  drawRootGrowth(context,stageImage,extensionImage,metrics,stage,stage.additions,variantKey);
  context.restore();
}

let currentVariant='layered';
const assets={};
for(const stage of STAGES)makeCard(stage);

async function render(){
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
