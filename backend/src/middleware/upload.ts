import multer from 'multer';
import { badRequest } from '../utils/http-error.js';

/** Single in-memory file upload with a size cap and a MIME allow-list. */
export function singleFile(field: string, maxBytes: number, allowedTypes: string[]) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: 10 },
    fileFilter: (_req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) cb(null, true);
      else cb(badRequest(`Unsupported file type. Allowed: ${allowedTypes.join(', ')}.`));
    },
  }).single(field);
}
