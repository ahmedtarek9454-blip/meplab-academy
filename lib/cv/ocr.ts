/**
 * In-browser OCR for scanned CVs and photos (Tesseract.js, Arabic + English).
 * All files are self-hosted under /public/ocr so nothing is fetched from third parties.
 */
export type Progress = (pct: number, stage: 'load' | 'ocr') => void;

let workerP: Promise<any> | null = null;
let progressCb: Progress | undefined;

async function getWorker(onProgress?: Progress) {
  progressCb = onProgress;
  if (workerP) return workerP;
  workerP = (async () => {
    const T: any = await import('tesseract.js');
    const base = (typeof window !== 'undefined' && (window as any).__OCR_BASE__) || '/ocr';
    const worker = await T.createWorker(['eng', 'ara'], 1, {
      workerPath: `${base}/worker.min.js`,
      corePath: `${base}/`,            // tesseract.js picks the right core file inside this folder
      langPath: base,                  // eng.traineddata / ara.traineddata
      gzip: false,
      cacheMethod: 'none',
      logger: (m: any) => {
        if (!progressCb) return;
        if (m.status === 'recognizing text') progressCb(Math.round((m.progress || 0) * 100), 'ocr');
        else progressCb(0, 'load');
      }
    });
    await worker.setParameters({ preserve_interword_spaces: '1' });
    return worker;
  })();
  workerP.catch(() => { workerP = null; });
  return workerP;
}

/** downscale very large photos so OCR stays fast; returns a canvas */
async function toCanvas(src: ImageBitmap | HTMLCanvasElement, maxSide = 2200) {
  const w = (src as any).width, h = (src as any).height;
  const k = Math.min(1, maxSide / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src as any, 0, 0, c.width, c.height);
  // light contrast boost helps phone photos
  const img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const v = Math.max(0, Math.min(255, (g - 128) * 1.25 + 128));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export async function ocrImageFile(file: File, onProgress?: Progress): Promise<string> {
  const bmp = await createImageBitmap(file);
  const canvas = await toCanvas(bmp);
  const worker = await getWorker(onProgress);
  const { data } = await worker.recognize(canvas);
  return cleanOcr(data.text || '');
}

/** OCR a scanned PDF: render each page with pdf.js, then recognise */
export async function ocrPdfPages(pdfDoc: any, onProgress?: Progress, maxPages = 4): Promise<string> {
  const worker = await getWorker(onProgress);
  let out = '';
  const n = Math.min(pdfDoc.numPages, maxPages);
  for (let i = 1; i <= n; i++) {
    const page = await pdfDoc.getPage(i);
    const vp = page.getViewport({ scale: 2 });
    const c = document.createElement('canvas');
    c.width = vp.width; c.height = vp.height;
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    const { data } = await worker.recognize(await toCanvas(c));
    out += (data.text || '') + '\n';
    onProgress?.(Math.round((i / n) * 100), 'ocr');
  }
  return cleanOcr(out);
}

/** common OCR slips in CVs */
export function cleanOcr(t: string) {
  return t
    .replace(/(?<=[A-Za-z])[|¦](?=[A-Za-z])/g, 'I')   // on|y → only, but keep 'Jan 2019 | Present'
    .replace(/(\d)[oO](\d)/g, '$10$2')
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
