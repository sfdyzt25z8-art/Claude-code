import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface PutObjectResult {
  url: string;
  key: string;
}

export interface StorageProvider {
  putObject(buffer: Buffer, filename: string, mimeType: string): Promise<PutObjectResult>;
}

function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).replace(/[^a-zA-Z0-9.]/g, "");
  const base = path
    .basename(filename, path.extname(filename))
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 60);
  const unique = crypto.randomBytes(8).toString("hex");
  return `${Date.now()}-${unique}-${base || "file"}${ext}`;
}

/**
 * Writes uploads to apps/backend/uploads/ on local disk. Files are served
 * back out via the static `/uploads` express route mounted in src/index.ts.
 */
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadsDir: string;
  private readonly publicBaseUrl: string;

  constructor(uploadsDir = path.join(process.cwd(), "uploads"), publicBaseUrl = "/uploads") {
    this.uploadsDir = uploadsDir;
    this.publicBaseUrl = publicBaseUrl;
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async putObject(buffer: Buffer, filename: string, _mimeType: string): Promise<PutObjectResult> {
    const key = sanitizeFilename(filename);
    const destination = path.join(this.uploadsDir, key);
    await fs.promises.writeFile(destination, buffer);
    return { url: `${this.publicBaseUrl}/${key}`, key };
  }
}

/**
 * Uploads to S3. Fully implemented (not a stub), but only meaningfully
 * exercised when AWS_REGION / AWS_S3_BUCKET / AWS credentials are present in
 * the environment - selected via STORAGE_PROVIDER=s3.
 */
export class S3StorageProvider implements StorageProvider {
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      throw new Error(
        "S3StorageProvider requires AWS_S3_BUCKET and AWS_REGION to be set when " +
          "STORAGE_PROVIDER=s3."
      );
    }
    this.bucket = bucket;
    this.region = region;
  }

  async putObject(buffer: Buffer, filename: string, mimeType: string): Promise<PutObjectResult> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
    const client = new S3Client({ region: this.region });
    const key = sanitizeFilename(filename);

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    return { url, key };
  }
}

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (provider) return provider;
  provider =
    process.env.STORAGE_PROVIDER === "s3" ? new S3StorageProvider() : new LocalStorageProvider();
  return provider;
}
