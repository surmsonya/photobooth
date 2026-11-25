// Print-like tonal separations. Sample the neighbouring video pixels for the
// narrow foil edges so that the artwork follows the camera image.
const stops = [
  [0,23,24,26], [.10,49,49,50], [.23,83,89,93], [.36,109,119,129],
  [.52,147,148,146], [.68,176,175,171], [.84,205,202,195], [1,242,239,231]
];
const silver = Array.from({length:256}, (_,i)=>{
  const tone=i/255, end=stops.findIndex(stop=>stop[0]>=tone);
  const a=stops[Math.max(0,end-1)], b=stops[end];
  const t=(tone-a[0])/(b[0]-a[0]||1);
  return a.slice(1).map((v,k)=>v+(b[k+1]-v)*t);
});
const clamp = x=>Math.max(0,Math.min(1,x));
let luminance;
export function applyChrome(context){
  const {width,height}=context.canvas;
  const frame=context.getImageData(0,0,width,height), rgb=frame.data;
  if(luminance?.length!==width*height) luminance=new Float32Array(width*height);
  for(let j=0,i=0;j<luminance.length;j++,i+=4)
    luminance[j]=(.30*rgb[i]+.58*rgb[i+1]+.12*rgb[i+2])/255;
  for(let y=0;y<height;y++) for(let x=0;x<width;x++){
    const j=y*width+x,i=j*4;
    const left=luminance[j-Math.min(2,x)], right=luminance[j+Math.min(2,width-1-x)];
    const up=luminance[j-Math.min(2,y)*width], down=luminance[j+Math.min(2,height-1-y)*width];
    const tone=(4*luminance[j]+left+right+up+down)/8;
    const plate=clamp(.78*tone+.22*Math.round(tone*10)/10);
    const base=silver[Math.round(255*plate)];
    const warmth=(rgb[i]-rgb[i+2])/255;
    const field=tone*1.95+warmth*.78+.15*x/width-.13*y/height;
    const blue=clamp(1-Math.abs(field-.51)/.13)*.86;
    const rose=clamp(1-Math.abs(field-1.16)/.17)*.76;
    const edge=right-left+.72*(down-up);
    const rim=clamp((edge-.038)*5), ink=clamp((-edge-.045)*4);
    const gilt=clamp(1-Math.abs(field-.77)/.13)*rim;
    for(let k=0;k<3;k++){
      let color=base[k]+blue*[-63,9,77][k]+rose*[54,-37,-13][k];
      color+=( [242,238,224][k]-color)*rim*.85;
      rgb[i+k]=color*(1-.62*ink)+gilt*[11,-32,-99][k];
    }
  }
  context.putImageData(frame,0,0);
}
