import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { AppError } from "../shared/errors.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_MULTIPART_SIZE = MAX_IMAGE_SIZE + 1024 * 1024;
const STORAGE_ROOT = resolve(process.cwd(), "storage", "uploads", "photos");
const PUBLIC_PATH_PREFIX = "/uploads/photos";

const ALLOWED_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
} as const;

type AllowedExtension = keyof typeof ALLOWED_TYPES;

type UploadedFile = {
  filename: string;
  contentType: string;
  data: Buffer;
};

export async function saveUploadedFile(request: IncomingMessage) {
  const file = await readMultipartImage(request);
  const extension = validateImageFile(file);
  const fileName = generateFileName(extension);
  const filePath = resolve(STORAGE_ROOT, fileName);

  if (!filePath.startsWith(`${STORAGE_ROOT}/`)) {
    throw new AppError(400, "INVALID_UPLOAD_PATH", "Invalid upload path");
  }

  await mkdir(STORAGE_ROOT, { recursive: true });
  await writeFile(filePath, file.data, { flag: "wx" });

  return {
    url: `${PUBLIC_PATH_PREFIX}/${fileName}`,
    fileName,
    size: file.data.length,
    contentType: file.contentType
  };
}

export function generateFileName(extension: AllowedExtension) {
  return `${Date.now()}_${randomBytes(6).toString("hex")}.${extension}`;
}

export function validateImageFile(file: UploadedFile): AllowedExtension {
  if (file.data.length === 0) {
    throw new AppError(400, "EMPTY_UPLOAD", "Uploaded file cannot be empty");
  }

  if (file.data.length > MAX_IMAGE_SIZE) {
    throw new AppError(413, "UPLOAD_TOO_LARGE", "Image must be 5MB or smaller");
  }

  const extension = extname(file.filename).slice(1).toLowerCase();
  if (!isAllowedExtension(extension)) {
    throw new AppError(400, "INVALID_FILE_TYPE", "Only jpg, jpeg, png and webp images are allowed");
  }

  if (ALLOWED_TYPES[extension] !== file.contentType) {
    throw new AppError(400, "INVALID_MIME_TYPE", "Image MIME type does not match the file extension");
  }

  if (!matchesImageSignature(file.data, extension)) {
    throw new AppError(400, "INVALID_IMAGE_CONTENT", "Uploaded file content is not a supported image");
  }

  return extension;
}

export async function sendLocalUploadedFile(response: ServerResponse, fileName: string) {
  if (!/^\d+_[a-f0-9]{12}\.(jpg|jpeg|png|webp)$/.test(fileName)) {
    throw new AppError(400, "INVALID_FILE_NAME", "Invalid file name");
  }

  const filePath = resolve(STORAGE_ROOT, fileName);
  if (!filePath.startsWith(`${STORAGE_ROOT}/`)) {
    throw new AppError(400, "INVALID_UPLOAD_PATH", "Invalid upload path");
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "content-type": ALLOWED_TYPES[extname(fileName).slice(1) as AllowedExtension],
      "cache-control": "public, max-age=31536000, immutable"
    });
    response.end(body);
  } catch {
    throw new AppError(404, "UPLOAD_NOT_FOUND", "Uploaded image not found");
  }
}

export async function deleteLocalFile(url: string) {
  const prefix = `${PUBLIC_PATH_PREFIX}/`;
  if (!url.startsWith(prefix)) {
    return;
  }

  const fileName = url.slice(prefix.length);
  if (!/^\d+_[a-f0-9]{12}\.(jpg|jpeg|png|webp)$/.test(fileName)) {
    return;
  }

  const filePath = resolve(STORAGE_ROOT, fileName);
  if (!filePath.startsWith(`${STORAGE_ROOT}/`)) {
    return;
  }

  try {
    await unlink(filePath);
  } catch {
    // Missing local files should not block the business operation.
  }
}

async function readMultipartImage(request: IncomingMessage): Promise<UploadedFile> {
  const contentType = request.headers["content-type"] ?? "";
  const boundary = parseBoundary(contentType);
  if (!boundary) {
    throw new AppError(400, "INVALID_MULTIPART", "Upload request must be multipart/form-data");
  }

  const body = await readLimitedBody(request, MAX_MULTIPART_SIZE);
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let cursor = 0;

  while (cursor < body.length) {
    const start = body.indexOf(boundaryBuffer, cursor);
    if (start === -1) {
      break;
    }

    const partStart = start + boundaryBuffer.length;
    if (body.subarray(partStart, partStart + 2).toString("latin1") === "--") {
      break;
    }

    const next = body.indexOf(boundaryBuffer, partStart);
    if (next === -1) {
      break;
    }

    const part = trimCrlf(body.subarray(partStart, next));
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const rawHeaders = part.subarray(0, headerEnd).toString("latin1");
      const data = trimCrlf(part.subarray(headerEnd + 4));
      const file = parseFilePart(rawHeaders, data);
      if (file) {
        return file;
      }
    }

    cursor = next;
  }

  throw new AppError(400, "UPLOAD_FILE_REQUIRED", "A file field named photo is required");
}

function parseFilePart(rawHeaders: string, data: Buffer): UploadedFile | null {
  const headers = new Map(
    rawHeaders.split("\r\n").map((line) => {
      const index = line.indexOf(":");
      return [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()];
    })
  );
  const disposition = headers.get("content-disposition") ?? "";

  if (!/name="photo"/.test(disposition) || !/filename="/.test(disposition)) {
    return null;
  }

  const filename = disposition.match(/filename="([^"]*)"/)?.[1] ?? "";
  return {
    filename,
    contentType: headers.get("content-type") ?? "",
    data
  };
}

function parseBoundary(contentType: string | string[]) {
  const value = Array.isArray(contentType) ? contentType[0] : contentType;
  return value.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1] ?? value.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];
}

async function readLimitedBody(request: IncomingMessage, limit: number) {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) {
      throw new AppError(413, "UPLOAD_TOO_LARGE", "Image must be 5MB or smaller");
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

function trimCrlf(buffer: Buffer) {
  let start = 0;
  let end = buffer.length;

  if (buffer.subarray(0, 2).toString("latin1") === "\r\n") {
    start = 2;
  }
  if (buffer.subarray(end - 2, end).toString("latin1") === "\r\n") {
    end -= 2;
  }

  return buffer.subarray(start, end);
}

function isAllowedExtension(extension: string): extension is AllowedExtension {
  return Object.prototype.hasOwnProperty.call(ALLOWED_TYPES, extension);
}

function matchesImageSignature(data: Buffer, extension: AllowedExtension) {
  if (extension === "jpg" || extension === "jpeg") {
    return data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }

  if (extension === "png") {
    return data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  return data.length > 12 && data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP";
}
