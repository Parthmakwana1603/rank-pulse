import { z, type ZodTypeAny } from 'zod';
import { badRequest } from '../utils/http-error.js';

export const uuid = z.string().uuid('Must be a valid id.');

export const projectIdQuery = z.object({ projectId: uuid });
export const idParams = z.object({ id: uuid });

/** Accepts "example.com" or "https://example.com/path"; returns a normalised http(s) URL string. */
export const httpUrl = z
  .string()
  .trim()
  .min(1, 'Enter a URL.')
  .max(2048)
  .transform((value, ctx) => {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      if (!/^https?:$/.test(url.protocol) || !url.hostname.includes('.')) throw new Error();
      return url.toString();
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid URL, like https://example.com.' });
      return z.NEVER;
    }
  });

export const countryCode = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{2}$/, 'Use a 2-letter country code.'));

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** Parses `input` with `schema`, throwing a 400 whose message names the first problem. */
export function parse<S extends ZodTypeAny>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const issues = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  const first = issues[0];
  const message = first.path ? `${first.path}: ${first.message}` : first.message;
  throw badRequest(message, issues);
}
