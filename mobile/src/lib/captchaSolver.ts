/**
 * D-Campus Mobile - Serverless CAPTCHA Solver Engine
 * 100% pure TypeScript/JavaScript, zero-dependency, sub-millisecond OCR.
 * Ported from extension/utils/captcha_solver.js for Node.js / Next.js API routes.
 */

import { PNG } from 'pngjs';

// Precompiled 20x24 bitmask templates for alphanumeric characters (0-9, A-Z)
const TEMPLATES: Record<string, number[]> = {
  "0": [16320,65520,123000,245820,491550,458766,917511,917511,917511,917511,917511,917511,917511,917511,983055,458766,491548,245820,127224,32736,8160,240,120,56],
  "1": [65408,1048448,1044352,528256,3968,3968,3968,3968,3968,3968,3968,3968,3968,3968,3968,3968,3968,3968,3968,3968,3968,4032,524287,524287],
  "2": [65408,524272,1040892,917566,30,31,15,15,30,30,60,120,248,992,1984,3968,15872,31744,63488,258048,516096,1032192,1048575,1048575],
  "3": [65472,524272,516604,262206,30,31,31,30,62,124,32752,32736,508,62,31,15,15,15,15,31,786494,1016316,1048560,131008],
  "4": [496,1008,1008,2032,3824,7920,7408,14576,28912,61680,57584,114928,229616,491760,983280,983280,1048575,1048575,240,240,240,240,240,240],
  "5": [262136,262136,245760,229376,229376,229376,229376,229376,262080,262128,229884,60,30,31,15,15,15,15,31,62,786556,1033208,1048544,130944],
  "6": [4088,32764,64572,122880,245760,491520,491520,983040,991168,1015792,1046780,1032252,1015838,1015823,983055,983055,983055,458767,491535,229406,245820,129272,65520,8128],
  "7": [1048575,1048575,62,30,60,124,120,248,240,496,480,480,960,960,1920,1920,3840,3840,7680,15872,15360,31744,30720,63488],
  "8": [16320,131064,258300,507966,1015838,1015839,1015839,491550,491582,254076,65520,65520,258300,507966,1015839,983055,983055,983055,983055,1015839,507966,258300,131064,32736],
  "9": [16256,65520,127480,245820,491548,983070,983070,983055,983055,983071,983071,491551,507967,258559,131055,16271,14,30,28,60,120,230384,262080,130816],
  "A": [3840,3840,3840,8064,6528,14720,14784,12480,28896,28896,24672,57456,57456,49200,114744,131064,262136,229404,229404,458764,458766,458766,917511,917511],
  "B": [1048512,1048560,1016060,983100,983070,983070,983070,983070,983100,983160,1048560,1048544,983292,983070,983070,983055,983055,983055,983055,983071,983070,1016060,1048568,1048544],
  "C": [4080,32764,64543,126983,245761,491520,491520,983040,983040,917504,917504,917504,917504,917504,917504,983040,983040,491520,491520,245761,126983,64543,32764,4080],
  "D": [1048320,1048512,984048,917624,917564,917534,917534,917518,917519,917519,917511,917511,917511,917511,917519,917519,917518,917534,917534,917564,917624,984048,1048512,1048320],
  "E": [1048575,1048575,1015808,983040,983040,983040,983040,983040,983040,983040,1048574,1048574,1015808,983040,983040,983040,983040,983040,983040,983040,983040,1015808,1048575,1048575],
  "F": [1048575,1048575,1015808,1015808,1015808,1015808,1015808,1015808,1015808,1015808,1048574,1048574,1015808,1015808,1015808,1015808,1015808,1015808,1015808,1015808,1015808,1015808,1015808,1015808],
  "G": [8176,32764,63550,122887,245763,491520,458752,983040,983040,917504,917504,917504,917759,917759,917511,983047,983047,458759,491527,245767,122887,63551,32764,8176],
  "H": [983047,983047,983047,983047,983047,983047,983047,983047,983047,983047,1048575,1048575,983055,983047,983047,983047,983047,983047,983047,983047,983047,983047,983047,983047],
  "I": [1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575,1048575],
  "J": [255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,510,510,4088,1048560,1048064],
  "K": [917564,917624,917744,917984,918464,919424,925440,933376,949248,1044480,1040384,1040384,1044480,1046528,949248,925184,921344,919424,918464,917984,917752,917628,917566,917535],
  "L": [983040,983040,983040,983040,983040,983040,983040,983040,983040,983040,983040,983040,983040,983040,983040,983040,983040,983040,983040,983040,983040,1015808,1048575,1048575],
  "M": [1015839,1015839,1015839,1032255,1032255,966711,974967,974967,942183,946407,929991,929991,932295,924039,924039,925575,921351,921351,921351,917511,917511,917511,917511,917511],
  "N": [1015823,1032207,1032207,1040399,1040399,978959,948239,948239,932879,924687,925199,921103,921359,919439,918415,918479,917967,917999,917759,917631,917631,917567,917567,917535],
  "O": [16320,65520,123000,245820,491550,458766,917511,917511,917511,917511,917511,917511,917511,917511,983055,458766,491548,245820,127224,32736,8160,240,120,56],
  "P": [1048512,1048568,1016316,983102,983071,983055,983055,983055,983055,983071,983070,983166,1048568,1048560,1015808,983040,983040,983040,983040,983040,983040,983040,983040,983040],
  "Q": [16320,65520,123000,245820,491550,458766,917511,917511,917511,917511,917511,917511,917511,917511,983055,458766,491548,245820,127224,32736,8160,240,120,56],
  "R": [1048320,1048512,985056,983280,983280,983152,983152,983152,983152,983280,983280,985056,1048512,1048448,984000,983520,983280,983160,983160,983100,983068,983070,983054,983055],
  "S": [32752,131068,258174,507916,1015808,983040,983040,983040,1015808,516096,261888,65520,8188,510,31,15,15,15,15,31,917566,1040636,524280,65504],
  "T": [1048575,1048575,3840,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536],
  "U": [983047,983047,983047,983047,983047,983047,983047,983047,983047,983047,983047,983047,983047,983047,983047,983047,983047,983055,458767,491550,245790,258300,65520,16320],
  "V": [917511,917519,458766,458766,458780,229404,229404,229432,114744,114744,49264,57456,57456,28896,28896,28896,14784,14784,14720,8064,8064,3840,3840,3840],
  "W": [787971,787971,790275,921351,397062,397062,395526,395526,399750,203148,203148,203148,200844,200844,209100,110812,110808,110808,106584,123000,123000,57456,57456,57456],
  "X": [491534,229406,114716,122936,57464,28784,30944,14816,8128,8064,3968,3840,8064,8064,15296,31200,28896,57584,57456,114744,229436,491550,458766,983055],
  "Y": [983055,458766,229404,245820,114744,57456,61680,28896,14784,16320,8064,3840,3840,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536,1536],
  "Z": [1048575,1048575,63,30,60,120,240,480,480,960,1920,3840,7680,15872,15360,30720,61440,122880,245760,507904,491520,1015808,1048575,1048575],
};

interface Component {
  minR: number;
  maxR: number;
  minC: number;
  maxC: number;
  pts: number;
  w: number;
  h: number;
  area: number;
  isIStem?: boolean;
}

export function solveFromImageData(width: number, height: number, data: Buffer | Uint8Array | Uint8ClampedArray): string {
  if (!width || !height || !data || data.length < width * height * 4) {
    return '';
  }

  // Step 1: Binary Luminance Thresholding
  const totalPixels = width * height;
  const grid = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    if (a > 80 && r < 85 && g < 85 && b < 85) {
      grid[i] = 1;
    }
  }

  // Step 2: 8-Directional Connected-Component BFS Segmentation
  const visited = new Uint8Array(totalPixels);
  const comps: Component[] = [];
  const queue = new Int32Array(totalPixels * 2);

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const idx = r * width + c;
      if (grid[idx] === 1 && visited[idx] === 0) {
        let head = 0, tail = 0;
        queue[tail++] = r;
        queue[tail++] = c;
        visited[idx] = 1;

        let minR = r, maxR = r;
        let minC = c, maxC = c;
        let pts = 0;

        while (head < tail) {
          const cr = queue[head++];
          const cc = queue[head++];
          pts++;

          if (cr < minR) minR = cr;
          if (cr > maxR) maxR = cr;
          if (cc < minC) minC = cc;
          if (cc > maxC) maxC = cc;

          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = cr + dr;
              const nc = cc + dc;
              if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
                const nidx = nr * width + nc;
                if (grid[nidx] === 1 && visited[nidx] === 0) {
                  visited[nidx] = 1;
                  queue[tail++] = nr;
                  queue[tail++] = nc;
                }
              }
            }
          }
        }

        const compW = maxC - minC + 1;
        const compH = maxR - minR + 1;
        if (pts >= 20 && compW >= 4 && compH >= 12) {
          comps.push({
            minR, maxR, minC, maxC, pts,
            w: compW,
            h: compH,
            area: compW * compH
          });
        }
      }
    }
  }

  if (comps.length === 0) return '';

  // Step 3: Adaptive Touching Character Splitting
  const glyphBoxes: Component[] = [];
  for (const c of comps) {
    if (c.w <= 12 && c.h >= 50) {
      c.isIStem = true;
      glyphBoxes.push(c);
      continue;
    }

    if (c.w >= 130) {
      // 3 merged characters
      const partW = Math.floor(c.w / 3);
      glyphBoxes.push({ minR: c.minR, maxR: c.maxR, minC: c.minC, maxC: c.minC + partW, pts: c.pts / 3, w: partW, h: c.h, area: partW * c.h });
      glyphBoxes.push({ minR: c.minR, maxR: c.maxR, minC: c.minC + partW, maxC: c.minC + partW * 2, pts: c.pts / 3, w: partW, h: c.h, area: partW * c.h });
      glyphBoxes.push({ minR: c.minR, maxR: c.maxR, minC: c.minC + partW * 2, maxC: c.maxC, pts: c.pts / 3, w: partW, h: c.h, area: partW * c.h });
    } else if (c.w >= 85) {
      // 2 merged characters - find vertical projection valley
      let splitC = Math.floor((c.minC + c.maxC) / 2);
      let minColDensity = Infinity;
      const scanStart = c.minC + Math.floor(c.w * 0.3);
      const scanEnd = c.minC + Math.floor(c.w * 0.7);

      for (let col = scanStart; col <= scanEnd; col++) {
        let count = 0;
        for (let row = c.minR; row <= c.maxR; row++) {
          if (grid[row * width + col] === 1) count++;
        }
        if (count < minColDensity) {
          minColDensity = count;
          splitC = col;
        }
      }

      glyphBoxes.push({ minR: c.minR, maxR: c.maxR, minC: c.minC, maxC: splitC, pts: c.pts / 2, w: splitC - c.minC + 1, h: c.h, area: (splitC - c.minC + 1) * c.h });
      glyphBoxes.push({ minR: c.minR, maxR: c.maxR, minC: splitC + 1, maxC: c.maxC, pts: c.pts / 2, w: c.maxC - splitC, h: c.h, area: (c.maxC - splitC) * c.h });
    } else {
      glyphBoxes.push(c);
    }
  }

  // Sort left-to-right
  glyphBoxes.sort((a, b) => a.minC - b.minC);

  // Take the 6 primary glyphs
  const finalGlyphs = glyphBoxes.slice(0, 6);

  // Step 4: 20x24 Normalized Bitmask Template Matching (IoU)
  const normW = 20;
  const normH = 24;
  let result = '';

  for (const box of finalGlyphs) {
    if (box.isIStem) {
      result += 'I';
      continue;
    }

    // Downsample bounding box into 20x24 bitmask
    const candMask = new Uint32Array(normH);
    for (let nr = 0; nr < normH; nr++) {
      const srcR = box.minR + Math.floor((nr / normH) * box.h);
      let rowBits = 0;
      for (let nc = 0; nc < normW; nc++) {
        const srcC = box.minC + Math.floor((nc / normW) * box.w);
        if (srcR < height && srcC < width && grid[srcR * width + srcC] === 1) {
          rowBits |= (1 << (normW - 1 - nc));
        }
      }
      candMask[nr] = rowBits;
    }

    // Match against precompiled bitmask templates using IoU
    let bestChar = '?';
    let bestIoU = -1;

    for (const [char, tMask] of Object.entries(TEMPLATES)) {
      let intersection = 0;
      let union = 0;

      for (let r = 0; r < normH; r++) {
        const cRow = candMask[r];
        const tRow = tMask[r];
        const andRow = cRow & tRow;
        const orRow = cRow | tRow;

        intersection += countBits(andRow);
        union += countBits(orRow);
      }

      const iou = union > 0 ? intersection / union : 0;
      if (iou > bestIoU) {
        bestIoU = iou;
        bestChar = char;
      }
    }

    result += bestChar;
  }

  return result;
}

function countBits(n: number): number {
  let count = 0;
  let val = n >>> 0;
  while (val > 0) {
    count += val & 1;
    val = val >>> 1;
  }
  return count;
}

export function solveCaptchaFromPngBuffer(buffer: Buffer): string {
  try {
    const png = PNG.sync.read(buffer);
    return solveFromImageData(png.width, png.height, png.data);
  } catch (err) {
    console.error('[CaptchaSolver] PNG decode error:', err);
    return '';
  }
}

export function solveCaptchaFromBase64(base64Str: string): string {
  try {
    const clean = base64Str.includes('base64,') ? base64Str.split('base64,')[1] : base64Str;
    const buf = Buffer.from(clean, 'base64');
    return solveCaptchaFromPngBuffer(buf);
  } catch (err) {
    console.error('[CaptchaSolver] Base64 solve error:', err);
    return '';
  }
}
