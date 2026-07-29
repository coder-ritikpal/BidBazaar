import ImageKit from "imagekit";
import config from "../config/config.js";

const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = config;

let imagekit;

// Initialize ImageKit client only if all credentials are provided
if (IMAGEKIT_PUBLIC_KEY && IMAGEKIT_PRIVATE_KEY && IMAGEKIT_URL_ENDPOINT) {
  imagekit = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });
} else {
  // Log a warning during server startup if ImageKit is not configured
  console.warn("[Inventory Service] ImageKit is not configured. File uploads will fail.");
}

/**
 * Uploads product images to ImageKit.
 * @param {Array<object>} files - An array of file objects from multer (with buffer and originalname).
 * @returns {Promise<Array<{url: string, thumbnailUrl: string, id: string}>>} A promise that resolves to an array of image objects.
 */
export const uploadProductImages = async (files) => {
  // Return early if no files are provided
  if (!files || files.length === 0) {
    return [];
  }

  // Throw a runtime error if the service is called without proper configuration
  if (!imagekit) {
    throw new Error(
      "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your environment variables.",
    );
  }

  // Create an array of upload promises
  const uploadPromises =
    files.map((file) =>
      imagekit.upload({
        file: file.buffer,
        fileName: file.originalname, // Let ImageKit handle unique naming
        folder: "/bidbazaar/products", // Use a more specific folder
        useUniqueFileName: true, // Recommended for avoiding name conflicts
      }),
    );

  // Wait for all uploads to complete
  const results = await Promise.all(uploadPromises);

  // Map the results to the desired format
  return results.map((result) => ({
    url: result.url,
    thumbnailUrl: result.thumbnailUrl,
    id: result.fileId,
  }));
};
