// The signed-in user's profile, feed, notifications, settings and reports.
import type { Request, Response } from 'express';
import * as feed from '../services/feed.service.js';
import * as profile from '../services/profile.service.js';
import * as reports from '../services/reports/reports.service.js';
import * as settings from '../services/settings.service.js';
import { ctxOf } from '../utils/context.js';
import { badRequest } from '../utils/http-error.js';
import { accepted, noContent, ok } from '../utils/respond.js';
import { idParams, parse, projectIdQuery } from '../validators/common.js';
import { activitiesQuery, createReportSchema, preferenceBody, preferenceParams, profilePatchSchema } from '../validators/resources.js';

const id = (req: Request) => parse(idParams, req.params).id;

// ── Profile ────────────────────────────────────────────────────────────────
export const getProfile = async (req: Request, res: Response) => ok(res, await profile.getProfile(ctxOf(req)));
export const updateProfile = async (req: Request, res: Response) =>
  ok(res, await profile.updateProfile(ctxOf(req), parse(profilePatchSchema, req.body)));
export async function uploadAvatar(req: Request, res: Response) {
  if (!req.file) throw badRequest('Attach an image in the "avatar" field.');
  ok(res, await profile.setAvatar(ctxOf(req), req.file));
}
export const deleteAvatar = async (req: Request, res: Response) => ok(res, await profile.removeAvatar(ctxOf(req)));

// ── Activity feed & notifications ──────────────────────────────────────────
export const activities = async (req: Request, res: Response) =>
  ok(res, await feed.listActivities(ctxOf(req), parse(activitiesQuery, req.query).projectId));
export const notifications = async (req: Request, res: Response) => ok(res, await feed.listNotifications(ctxOf(req)));
export async function readNotification(req: Request, res: Response) {
  await feed.markRead(ctxOf(req), id(req));
  noContent(res);
}
export async function readAllNotifications(req: Request, res: Response) {
  await feed.markAllRead(ctxOf(req));
  noContent(res);
}

// ── Settings ───────────────────────────────────────────────────────────────
export const notificationPreferences = async (req: Request, res: Response) =>
  ok(res, await settings.getNotificationPreferences(ctxOf(req)));
export const setNotificationPreference = async (req: Request, res: Response) =>
  ok(res, await settings.setNotificationPreference(ctxOf(req), parse(preferenceParams, req.params).key, parse(preferenceBody, req.body)));
export const integrations = async (_req: Request, res: Response) => ok(res, settings.listIntegrations());
export const billing = async (req: Request, res: Response) => ok(res, await settings.getBilling(ctxOf(req)));

// ── Reports ────────────────────────────────────────────────────────────────
export const reportTemplates = async (_req: Request, res: Response) => ok(res, reports.listTemplates());
export const listReports = async (req: Request, res: Response) =>
  ok(res, await reports.listReports(ctxOf(req), parse(projectIdQuery, req.query).projectId));
export const createReport = async (req: Request, res: Response) =>
  accepted(res, await reports.createReport(ctxOf(req), parse(createReportSchema, req.body)));
export const getReport = async (req: Request, res: Response) => ok(res, await reports.getReport(ctxOf(req), id(req)));
export const downloadReport = async (req: Request, res: Response) => ok(res, await reports.downloadReport(ctxOf(req), id(req)));
