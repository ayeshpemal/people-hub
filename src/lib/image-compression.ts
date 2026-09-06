/**
 * Browser-side image downscaling + compression.
 * Enforces max 1280px on the longest edge and a strict size ceiling,
 * preferring WebP with a JPEG fallback. No server-side transforms needed.
 */

const MAX_EDGE = 1280;
const MAX_BYTES = 500 * 1024; // strictly below 500 KB

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image file."));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function supportsWebp(canvas: HTMLCanvasElement): boolean {
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

export interface CompressedImage {
  file: File;
  width: number;
  height: number;
  bytes: number;
  type: string;
}

export async function compressImage(file: File): Promise<CompressedImage> {
  const img = await loadImage(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  let width = Math.max(1, Math.round(img.naturalWidth * scale));
  let height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  const mime = supportsWebp(canvas) ? "image/webp" : "image/jpeg";

  let blob: Blob | null = null;

  // Step quality down, then dimensions, until strictly under the ceiling.
  for (let pass = 0; pass < 6; pass++) {
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing is not available in this browser.");
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    for (const quality of [0.82, 0.7, 0.58, 0.45]) {
      const attempt = await canvasToBlob(canvas, mime, quality);
      if (attempt && attempt.size < MAX_BYTES) {
        blob = attempt;
        break;
      }
      blob = attempt ?? blob;
    }
    if (blob && blob.size < MAX_BYTES) break;

    width = Math.max(1, Math.round(width * 0.8));
    height = Math.max(1, Math.round(height * 0.8));
  }

  if (!blob) throw new Error("Could not compress that image.");
  if (blob.size >= MAX_BYTES) {
    throw new Error("That image is too detailed to compress under 500 KB. Try a simpler photo.");
  }

  const ext = mime === "image/webp" ? "webp" : "jpg";
  const base = file.name.replace(/\.[^./\\]+$/, "") || "photo";
  const out = new File([blob], `${base}.${ext}`, { type: mime });

  return { file: out, width, height, bytes: out.size, type: mime };
}
