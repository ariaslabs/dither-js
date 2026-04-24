import sharp from "sharp";

const steps = 1;
const scale = 0.25;

async function Main() {
  const original = await sharp("david_bust.jpg").metadata();
  const originalWidth = original.width!;
  const originalHeight = original.height!;

  const { data, info } = await sharp("david_bust.jpg")
    .resize(
      Math.floor(originalWidth * scale),
      Math.floor(originalHeight * scale),
    )
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  const getIndex = (x: number, y: number) => {
    return (x + y * width) * 4;
  };

  const getPixel = (x: number, y: number) => {
    const index = getIndex(x, y);
    return {
      r: data[index] ?? 0,
      g: data[index + 1] ?? 0,
      b: data[index + 2] ?? 0,
    };
  };

  const setPixel = (x: number, y: number, r: number, g: number, b: number) => {
    const index = getIndex(x, y);
    data[index] = Math.max(0, Math.min(255, r));
    data[index + 1] = Math.max(0, Math.min(255, g));
    data[index + 2] = Math.max(0, Math.min(255, b));
  };

  const getClosestStep = (val: number) => {
    return Math.round((steps * val) / 255) * Math.floor(255 / steps);
  };

  function addError(
    x: number,
    y: number,
    factor: number,
    errR: number,
    errG: number,
    errB: number,
  ) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const { r, g, b } = getPixel(x, y);
    if (r < 10 && g < 10 && b < 10) return; // ← add this
    setPixel(x, y, r + errR * factor, g + errG * factor, b + errB * factor);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const { r, g, b } = getPixel(x, y);
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (gray < 10) continue;

      const newR = getClosestStep(gray);
      const newG = getClosestStep(gray);
      const newB = getClosestStep(gray);

      setPixel(x, y, newR, newG, newB);

      const errR = gray - newR;
      const errG = gray - newG;
      const errB = gray - newB;

      addError(x + 1, y, 7 / 16, errR, errG, errB);
      addError(x - 1, y + 1, 3 / 16, errR, errG, errB);
      addError(x, y + 1, 5 / 16, errR, errG, errB);
      addError(x + 1, y + 1, 1 / 16, errR, errG, errB);
    }
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels: 4, // RGBA
    },
  })
    .resize(originalWidth, originalHeight)
    .toFile("output.jpg");
}

function Draw() {}

Main();
