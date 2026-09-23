/**
 * Client-side photo pipeline for listings.
 *
 * The POC has no file server: photos live in the same `localStorage` DB as
 * everything else, as data URLs. That budget is roughly 5 MB for the *whole*
 * store, so every upload is decoded, scaled to `MAX_EDGE` and re-encoded as
 * JPEG before it is kept — a 4 MB phone photo lands at ~200 KB. The caps below
 * are enforced at the point of upload so the store can never be pushed over
 * quota by a listing.
 */

export const MAX_PHOTOS = 8;
/** Longest edge, in px, after scaling. */
export const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.72;
/** Total encoded bytes allowed across one listing's gallery. */
export const MAX_TOTAL_BYTES = 3_000_000;
/** Anything larger than this is rejected before we try to decode it. */
export const MAX_SOURCE_BYTES = 25_000_000;

export const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif';

/** Approximate decoded size of a data URL, from its base64 payload. */
export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.round((base64.length * 3) / 4);
}

export const totalBytes = (photos: string[]) =>
  photos.reduce((sum, p) => sum + dataUrlBytes(p), 0);

export function prettyBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

/**
 * Decode a file to something canvas can draw. `createImageBitmap` is preferred
 * because it applies the EXIF orientation phone cameras write — without it,
 * portrait photos come back on their side.
 */
async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Older Safari rejects the options bag; fall through to the <img> path.
    }
  }

  const url = URL.createObjectURL(file);
  const img = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`${file.name} could not be read as an image.`));
      img.src = url;
    });
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    release: () => URL.revokeObjectURL(url),
  };
}

/** Scale + re-encode one file to a JPEG data URL small enough to persist. */
export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/'))
    throw new Error(`${file.name} is not an image.`);
  if (file.size > MAX_SOURCE_BYTES)
    throw new Error(`${file.name} is over ${prettyBytes(MAX_SOURCE_BYTES)}.`);

  const { source, width, height, release } = await decode(file);
  try {
    if (!width || !height) throw new Error(`${file.name} has no readable dimensions.`);

    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser blocked image processing.');
    // JPEG has no alpha; paint a white ground so transparent PNGs don't go black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    release();
  }
}

export interface IngestResult {
  photos: string[];
  /** One line per file that was skipped, ready to show the user. */
  skipped: string[];
}

/**
 * Compress and append `files` to `existing`, enforcing the count and size caps.
 * Files that don't fit are reported rather than silently dropped.
 */
export async function ingestPhotos(existing: string[], files: File[]): Promise<IngestResult> {
  const photos = [...existing];
  const skipped: string[] = [];
  let bytes = totalBytes(photos);

  for (const file of files) {
    if (photos.length >= MAX_PHOTOS) {
      skipped.push(`${file.name} — the ${MAX_PHOTOS}-photo limit is full.`);
      continue;
    }
    try {
      const dataUrl = await compressImage(file);
      const size = dataUrlBytes(dataUrl);
      if (bytes + size > MAX_TOTAL_BYTES) {
        skipped.push(`${file.name} — the gallery is over ${prettyBytes(MAX_TOTAL_BYTES)}.`);
        continue;
      }
      photos.push(dataUrl);
      bytes += size;
    } catch (err) {
      skipped.push((err as Error).message);
    }
  }

  return { photos, skipped };
}
