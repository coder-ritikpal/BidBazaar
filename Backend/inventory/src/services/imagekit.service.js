import ImageKit, { toFile } from "@imagekit/nodejs";
import config from "../config/config.js";


const { IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = config;

let imagekit; // Initialize ImageKit client only if credentials are provided
if (IMAGEKIT_PRIVATE_KEY && IMAGEKIT_URL_ENDPOINT) {
  imagekit = new ImageKit({
    privateKey: IMAGEKIT_PRIVATE_KEY,
  });
} else {
  // Log a warning during server startup if ImageKit is not configured
  console.warn(
    "[Inventory Service] ImageKit is not configured. File uploads will fail.",
  );
}

/**
 * Uploads product images to ImageKit.
 * @param {Array<object>} files
 * An array of file objects from multer
 * (with buffer and originalname).
 * @returns {Promise<Array<{ url: string, thumbnailUrl: string, id: string }>>}
 */
export const uploadProductImages = async (files) => {
  // Return early if no files are provided
  if (!files || files.length === 0) {
    return [];
  }

  // Throw a runtime error if ImageKit is not configured
  if (!imagekit) {
    throw new Error(
      "ImageKit is not configured. Set IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT in your environment variables.",
    );
  }

  // Upload all files concurrently
  const uploadPromises = files.map(async (file) => {
    const imageFile = await toFile(
      file.buffer,
      file.originalname,
    );
    return imagekit.files.upload({
      file: imageFile,
      fileName: file.originalname,
      folder: "/bidbazaar/products",
      useUniqueFileName: true,
    });
  });

  // Wait for all uploads to complete
  const results = await Promise.all(uploadPromises);

  // Return only the fields required by the application
  return results.map((result) => ({
    url: result.url,
    thumbnailUrl: result.thumbnailUrl,
    id: result.fileId,
  }));
  };
