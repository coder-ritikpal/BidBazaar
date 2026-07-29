let multerFactory;

try {
  const { default: multer } = await import("multer");
  multerFactory = multer;
} catch {
  multerFactory = null;
}

const fallbackUpload = {
  array: () => (req, _res, next) => {
    req.files = req.files || [];
    next();
  },
};

const upload = multerFactory
  ? multerFactory({
      storage: multerFactory.memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
      },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype?.startsWith("image/")) {
          cb(null, true);
          return;
        }

        cb(new Error("Only image uploads are allowed"));
      },
    })
  : fallbackUpload;

export default upload;
