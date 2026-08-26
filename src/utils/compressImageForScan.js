/**
 * Shrink booth-camera photos before AI so uploads stay fast on mobile data.
 * Returns a JPEG File (or the original if already small / not an image).
 */
export async function compressImageForScan(file, {
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82,
  maxBytes = 1.2 * 1024 * 1024
} = {}) {
  if (!file || !file.type?.startsWith('image/')) return file;
  if (file.size <= maxBytes && !file.type.includes('png')) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
  });

  if (!blob) return file;

  const base = (file.name || 'scan').replace(/\.[^.]+$/, '');
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}
