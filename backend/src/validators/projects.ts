import { z } from 'zod';
import { countryCode, httpUrl } from './common.js';

export const industries = ['saas', 'ecommerce', 'finance', 'health', 'education', 'other'] as const;

/** Same rules as validateNewProject() in the frontend and the database constraints. */
export const newProjectSchema = z
  .object({
    websiteUrl: httpUrl,
    name: z.string().trim().max(100, 'Name must be 100 characters or fewer.').optional(),
    industry: z.enum(industries).optional(),
    targetCountry: countryCode.optional(),
    trackingKeywords: z.array(z.string()).max(1000).default([]),
  })
  .transform((input, ctx) => {
    const url = new URL(input.websiteUrl);
    const websiteUrl = url.pathname === '/' ? url.origin : `${url.origin}${url.pathname.replace(/\/$/, '')}`;
    const name = input.name || url.hostname.replace(/^www\./, '');
    if (name.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Name must be at least 2 characters.' });
    }
    const trackingKeywords = [...new Set(input.trackingKeywords.map((k) => k.trim().toLowerCase()).filter(Boolean))];
    if (trackingKeywords.length > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['trackingKeywords'], message: 'You can track at most 100 keywords per project.' });
    }
    if (trackingKeywords.some((k) => k.length > 200)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['trackingKeywords'], message: 'Each keyword must be 200 characters or fewer.' });
    }
    return { name, websiteUrl, industry: input.industry, targetCountry: input.targetCountry, trackingKeywords };
  });

export type NewProjectInput = z.output<typeof newProjectSchema>;

export const projectPatchSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100).optional(),
    status: z.enum(['active', 'paused']).optional(),
    industry: z.enum(industries).nullable().optional(),
    targetCountry: countryCode.nullable().optional(),
  })
  .strict()
  .refine((p) => Object.keys(p).length > 0, 'Nothing to update.');

export type ProjectPatch = z.output<typeof projectPatchSchema>;
