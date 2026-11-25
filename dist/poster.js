// Luminance-only sharpening keeps saturated poster edges free of color fringes.
const tone = Uint8ClampedArray.from({length: 256}, (_, value) => {
  const x = value / 255;
  const contrast = .92 * (x - .5) * (1 - Math.abs(2 * x - 1));
  const highlight = .50 * Math.max(0, x - .45) * (1 - x);
  return 255 * (x + contrast + highlight);
});
let luminance;
export function finishPoster(context) {
  const {width, height} = context.canvas;
  const frame = context.getImageData(0, 0, width, height);
  const pixels = frame.data;
  if (luminance?.length !== width * height) luminance = new Uint8Array(width * height);
  for (let i = 0, j = 0; i < pixels.length; i += 4, j++) {
    luminance[j] = (pixels[i] * 54 + pixels[i+1] * 183 + pixels[i+2] * 19) >> 8;
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const j = y * width + x, i = 4 * j;
      const neighbors = luminance[j - Number(x > 0)] + luminance[j + Number(x < width-1)]
        + luminance[j - (y > 0 ? width : 0)] + luminance[j + (y < height-1 ? width : 0)];
      const detail = Math.max(-16, Math.min(16, 1.2 * (luminance[j] - neighbors / 4)));
      for (let k = 0; k < 3; k++) pixels[i+k] = tone[pixels[i+k]] + detail;
    }
  }
  context.putImageData(frame, 0, 0);
}
