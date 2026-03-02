/**
 * Compresses an image file before converting to Base64 to prevent Vercel 413 (Payload Too Large) errors.
 * Vercel Serverless Functions have a strict ~4.5MB request body size limit.
 * PDFs are ignored (returned as-is).
 */
export const compressImageFile = async (file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        // If it's a PDF, we don't compress it in the browser, just return its base64.
        // PDFs usually contain vector data or pre-compressed images.
        if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions keeping aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                // Force a JPEG compression regardless of input to reduce size if needed,
                // but respect standard image formats
                const compressedDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
                resolve(compressedDataUrl.split(',')[1]);
            };

            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};
