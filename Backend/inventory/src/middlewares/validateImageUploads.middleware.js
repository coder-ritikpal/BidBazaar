const getImageMimeType = (buffer) => {
  if (!Buffer.isBuffer(buffer)) return null;

  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))) {
    return "image/gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
};

export const validateImageUploads = (req, res, next) => {
  for (const file of req.files || []) {
    const detectedMimeType = getImageMimeType(file.buffer);
    if (!detectedMimeType) {
      return res.status(400).json({ message: "Unsupported or invalid image file." });
    }

    file.mimetype = detectedMimeType;
  }

  next();
};
