export interface PreparedImageData {
  name: string;
  mimeType: string;
  sizeLabel: string;
  base64: string;
}

const TARGET_MAX_RAW_BYTES = 1.8 * 1024 * 1024; // Keeps base64 JSON well below Vercel 4.5 MB limit
const MAX_DIMENSION = 1600;

export async function prepareScreenshotUpload(
  file: File
): Promise<PreparedImageData> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });

  if (file.size <= TARGET_MAX_RAW_BYTES) {
    return {
      name: file.name || 'pasted-screenshot.png',
      mimeType: file.type,
      sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      base64: dataUrl,
    };
  }

  // Downscale large screenshots smoothly so Vercel serverless payloads stay under 4.5 MB
  return new Promise<PreparedImageData>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(
        1,
        MAX_DIMENSION / Math.max(img.width || 1, img.height || 1)
      );
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          name: file.name || 'pasted-screenshot.png',
          mimeType: file.type,
          sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          base64: dataUrl,
        });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const outMime = 'image/jpeg';
      const compressed = canvas.toDataURL(outMime, 0.85);
      const approxBytes = Math.round((compressed.length * 3) / 4);

      resolve({
        name: file.name || 'pasted-screenshot.jpg',
        mimeType: outMime,
        sizeLabel: `${Math.max(1, Math.round(approxBytes / 1024))} KB`,
        base64: compressed,
      });
    };
    img.onerror = () => {
      resolve({
        name: file.name || 'pasted-screenshot.png',
        mimeType: file.type,
        sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        base64: dataUrl,
      });
    };
    img.src = dataUrl;
  });
}
