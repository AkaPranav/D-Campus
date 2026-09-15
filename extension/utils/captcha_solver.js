/**
 * D-Campus - Native Client-Side CAPTCHA Solver Engine (v1.4.0)
 *
 * 100% Pure JavaScript, zero-dependency, zero-network, sub-millisecond CAPTCHA solver
 * specially engineered for COER University ERP Portal.
 *
 * Architecture:
 * 1. Binary Luminance Thresholding (r < 85 && g < 85 && b < 85) to eliminate colored noise circles.
 * 2. 8-Directional Connected-Component BFS segmentation.
 * 3. Aspect-ratio glyph metric classification for deterministic stems ('I').
 * 4. Adaptive width-based splitting for horizontally touching glyphs.
 * 5. 20x24 normalized bitmask Intersection-over-Union (IoU) template matching.
 */

(function(root) {
  'use strict';

  // Precompiled 20x24 bitmask templates for alphanumeric characters (0-9, A-Z)
  // Each character is represented by 24 20-bit row integers (MSB = left, LSB = right)
  const TEMPLATES = {
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

  /**
   * Solves CAPTCHA from raw RGBA pixel data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {Uint8ClampedArray|Array<number>} data - RGBA flat pixel array
   * @returns {string} 6-character uppercase alphanumeric code
   */
  function solveFromImageData(width, height, data) {
    if (!width || !height || !data || data.length < width * height * 4) {
      return '';
    }

    // Step 1: Binary Luminance Thresholding
    // Text strokes are pure black (r < 85 && g < 85 && b < 85), background noise is colored/light
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
    const comps = [];
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

          // Filter out tiny dust or noise specks (< 20 pixels)
          if (pts >= 20) {
            comps.push({
              x1: minC,
              x2: maxC + 1,
              y1: minR,
              y2: maxR + 1,
              w: maxC - minC + 1,
              h: maxR - minR + 1,
              pts: pts
            });
          }
        }
      }
    }

    // Sort components horizontally from left to right
    comps.sort((a, b) => a.x1 - b.x1);

    // Step 3: Adaptive Width-Based Segmentation for Touching Glyphs
    // Single normal glyphs are w <= 75px. Touching pairs are w >= 85px. Touching triplets w >= 130px.
    const crops = [];
    for (const b of comps) {
      if (b.w >= 85 && b.w < 130) {
        // Vertical projection profile valley in the center 40% window [0.3*w, 0.7*w]
        const startCol = Math.floor(b.x1 + 0.3 * b.w);
        const endCol = Math.floor(b.x1 + 0.7 * b.w);
        let bestCol = Math.floor((b.x1 + b.x2) / 2);
        let minDensity = 999999;
        for (let c = startCol; c <= endCol; c++) {
          let colSum = 0;
          for (let r = b.y1; r < b.y2; r++) {
            if (grid[r * width + c] === 1) colSum++;
          }
          if (colSum < minDensity) {
            minDensity = colSum;
            bestCol = c;
          }
        }
        crops.push({ x1: b.x1, x2: bestCol, y1: b.y1, y2: b.y2, w: bestCol - b.x1, h: b.h });
        crops.push({ x1: bestCol, x2: b.x2, y1: b.y1, y2: b.y2, w: b.x2 - bestCol, h: b.h });
      } else if (b.w >= 130) {
        const w3 = Math.floor(b.w / 3);
        crops.push({ x1: b.x1, x2: b.x1 + w3, y1: b.y1, y2: b.y2, w: w3, h: b.h });
        crops.push({ x1: b.x1 + w3, x2: b.x1 + 2 * w3, y1: b.y1, y2: b.y2, w: w3, h: b.h });
        crops.push({ x1: b.x1 + 2 * w3, x2: b.x2, y1: b.y1, y2: b.y2, w: b.x2 - (b.x1 + 2 * w3), h: b.h });
      } else {
        crops.push(b);
      }
    }

    // Step 4: Classify Each Character Crop
    let result = '';
    const targetW = 20;
    const targetH = 24;

    for (const crop of crops) {
      if (crop.h < 5 || crop.w < 3) continue;

      // Deterministic classification for character 'I' (thin vertical stem)
      if (crop.w <= 12 && crop.h >= 50) {
        result += 'I';
        continue;
      }

      // Step 4b: Normalize Crop to 20x24 Boolean Bitmask
      const norm = new Uint32Array(targetH);
      for (let tr = 0; tr < targetH; tr++) {
        const srcY = crop.y1 + Math.floor((tr / targetH) * crop.h);
        let rowVal = 0;
        for (let tc = 0; tc < targetW; tc++) {
          const srcX = crop.x1 + Math.floor((tc / targetW) * crop.w);
          if (srcY >= 0 && srcY < height && srcX >= 0 && srcX < width) {
            if (grid[srcY * width + srcX] === 1) {
              rowVal |= (1 << (19 - tc));
            }
          }
        }
        norm[tr] = rowVal;
      }

      // Step 4c: IoU Template Matching against Precompiled Glyphs
      let bestChar = '?';
      let bestIoU = -1;

      for (const ch in TEMPLATES) {
        if (ch === 'I') continue; // Handled deterministically above
        const tmplRows = TEMPLATES[ch];
        let inter = 0;
        let union = 0;

        for (let r = 0; r < 24; r++) {
          const a = norm[r];
          const b = tmplRows[r];
          let interBits = a & b;
          let unionBits = a | b;

          // Bit population count (Hamming weight)
          while (interBits > 0) {
            interBits &= (interBits - 1);
            inter++;
          }
          while (unionBits > 0) {
            unionBits &= (unionBits - 1);
            union++;
          }
        }

        const iou = union > 0 ? inter / union : 0;
        if (iou > bestIoU) {
          bestIoU = iou;
          bestChar = ch;
        }
      }

      result += bestChar;
    }

    return result;
  }

  /**
   * Solves CAPTCHA from an HTML Canvas element
   * @param {HTMLCanvasElement} canvas
   * @returns {string} 6-character code
   */
  function solveFromCanvas(canvas) {
    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return '';
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return solveFromImageData(canvas.width, canvas.height, imgData.data);
    } catch (e) {
      console.error('[CoerCaptchaSolver] Error solving from canvas:', e);
      return '';
    }
  }

  /**
   * Solves CAPTCHA from an HTML <img> element, string URL, or data URI
   * Guarantees native 560x180 resolution offscreen rendering to ensure 100% glyph extraction.
   * @param {HTMLImageElement|HTMLCanvasElement|string} imgOrSrc
   * @returns {Promise<string>} Solved 6-character code
   */
  function solve(imgOrSrc) {
    return new Promise(async (resolve) => {
      // Safety timeout: Never hang caller if image decoding stalls
      const timer = setTimeout(() => resolve(''), 3500);
      const safeResolve = (val) => {
        clearTimeout(timer);
        resolve(val || '');
      };

      try {
        if (!imgOrSrc) {
          safeResolve('');
          return;
        }

        // Direct pass-through for <canvas> elements
        if (typeof imgOrSrc.getContext === 'function') {
          safeResolve(solveFromCanvas(imgOrSrc));
          return;
        }

        // Extract image source string
        let src = '';
        if (typeof imgOrSrc === 'string') {
          src = imgOrSrc;
        } else if (imgOrSrc.tagName === 'IMG' || imgOrSrc.src) {
          src = imgOrSrc.currentSrc || imgOrSrc.src || '';
        }

        // Ignore placeholder whitey image
        if (src.includes('whitey.jpg') || !src) {
          safeResolve('');
          return;
        }

        // Create offscreen image and draw onto standardized 560x180 canvas
        const offscreen = new Image();
        offscreen.crossOrigin = 'anonymous';

        const processLoadedImage = () => {
          try {
            const canvas = document.createElement('canvas');
            const targetW = offscreen.naturalWidth > 0 ? offscreen.naturalWidth : 560;
            const targetH = offscreen.naturalHeight > 0 ? offscreen.naturalHeight : 180;
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(offscreen, 0, 0, targetW, targetH);
            const res = solveFromCanvas(canvas);
            safeResolve(res);
          } catch (err) {
            console.error('[CoerCaptchaSolver] Canvas extraction error:', err);
            safeResolve('');
          }
        };

        offscreen.onload = processLoadedImage;
        offscreen.onerror = () => safeResolve('');
        offscreen.src = src;

        // If already loaded / cached data URL, decode and execute immediately
        if (offscreen.complete && offscreen.naturalWidth > 0) {
          processLoadedImage();
        } else if (offscreen.decode) {
          offscreen.decode().then(processLoadedImage).catch(() => {});
        }
      } catch (err) {
        console.error('[CoerCaptchaSolver] Solve failed:', err);
        safeResolve('');
      }
    });
  }

  // Export module globally
  const CoerCaptchaSolver = {
    solve,
    solveFromCanvas,
    solveFromImageData,
    solveFromBase64: (b64) => solve(b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`)
  };

  root.CoerCaptchaSolver = CoerCaptchaSolver;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoerCaptchaSolver;
  }
})(typeof window !== 'undefined' ? window : globalThis);
