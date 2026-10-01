import type { z } from 'zod';
import * as repo from '../repositories/profiles.repository.js';
import * as storage from '../repositories/storage.repository.js';
import type { Ctx } from '../utils/context.js';
import { badRequest, notFound } from '../utils/http-error.js';
import type { profilePatchSchema } from '../validators/resources.js';

export interface ProfileDto {
  id: string;
  email: string;
  name: string;
  company: string | null;
  jobTitle: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  role: 'owner' | 'member' | 'viewer';
  /** Short-lived signed URL of the profile picture, or null. */
  avatarUrl: string | null;
}

async function toDto(ctx: Ctx, row: repo.ProfileRow): Promise<ProfileDto> {
  let avatarUrl: string | null = null;
  if (row.profile_image) {
    try {
      avatarUrl = await storage.signedUrl(ctx.db, 'avatars', row.profile_image, 60 * 60);
    } catch {
      avatarUrl = null; // A missing file shouldn't break the profile.
    }
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    company: row.company,
    jobTitle: row.job_title,
    plan: row.plan,
    role: row.role,
    avatarUrl,
  };
}

export async function getProfile(ctx: Ctx): Promise<ProfileDto> {
  const row = await repo.findProfile(ctx.db, ctx.userId);
  if (!row) throw notFound('Profile not found.');
  return toDto(ctx, row);
}

export async function updateProfile(ctx: Ctx, patch: z.output<typeof profilePatchSchema>): Promise<ProfileDto> {
  const row = await repo.updateProfile(ctx.db, ctx.userId, {
    ...(patch.name !== undefined && { name: patch.name }),
    ...(patch.company !== undefined && { company: patch.company || null }),
    ...(patch.jobTitle !== undefined && { job_title: patch.jobTitle || null }),
  });
  if (!row) throw notFound('Profile not found.');
  return toDto(ctx, row);
}

const imageSignatures: { type: string; ext: string; test: (b: Buffer) => boolean }[] = [
  { type: 'image/png', ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/gif', ext: 'gif', test: (b) => b.subarray(0, 4).toString('ascii') === 'GIF8' },
  { type: 'image/webp', ext: 'webp', test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
];

export async function setAvatar(ctx: Ctx, file: { buffer: Buffer; mimetype: string }): Promise<ProfileDto> {
  // Trust the file's bytes, not the client-supplied MIME type.
  const kind = imageSignatures.find((s) => s.test(file.buffer));
  if (!kind) throw badRequest('Upload a PNG, JPEG, GIF or WebP image.');
  const current = await repo.findProfile(ctx.db, ctx.userId);
  if (!current) throw notFound('Profile not found.');
  const path = `${ctx.userId}/avatar-${Date.now()}.${kind.ext}`;
  await storage.uploadFile(ctx.db, 'avatars', path, file.buffer, kind.type);
  const row = await repo.updateProfile(ctx.db, ctx.userId, { profile_image: path });
  if (current.profile_image && current.profile_image !== path) {
    await storage.removeFile(ctx.db, 'avatars', current.profile_image).catch(() => {});
  }
  return toDto(ctx, row!);
}

export async function removeAvatar(ctx: Ctx): Promise<ProfileDto> {
  const current = await repo.findProfile(ctx.db, ctx.userId);
  if (!current) throw notFound('Profile not found.');
  if (current.profile_image) await storage.removeFile(ctx.db, 'avatars', current.profile_image).catch(() => {});
  const row = await repo.updateProfile(ctx.db, ctx.userId, { profile_image: null });
  return toDto(ctx, row!);
}
