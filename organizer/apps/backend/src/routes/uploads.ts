import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { HttpError } from "../lib/httpError";
import { prisma } from "../lib/prisma";
import { getStorageProvider } from "../lib/storage";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * POST /api/uploads
 * multipart/form-data with a single "file" field. Stores via the configured
 * StorageProvider (local disk by default, S3 when STORAGE_PROVIDER=s3) and
 * records an UploadedFile row.
 */
router.post(
  "/",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw HttpError.badRequest('No file provided (expected multipart field "file")');
    }

    const provider = getStorageProvider();
    const { url } = await provider.putObject(req.file.buffer, req.file.originalname, req.file.mimetype);

    const uploaded = await prisma.uploadedFile.create({
      data: {
        userId: req.user!.id,
        url,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      },
    });

    res.status(201).json({
      file: {
        id: uploaded.id,
        userId: uploaded.userId,
        url: uploaded.url,
        filename: uploaded.filename,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        createdAt: uploaded.createdAt.toISOString(),
      },
    });
  })
);

export default router;
