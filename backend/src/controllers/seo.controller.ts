// Project-scoped SEO data: dashboard, keywords, audits, backlinks, competitors, content, AI SEO.
import type { Request, Response } from 'express';
import * as aiSeo from '../services/ai-seo.service.js';
import * as audits from '../services/audits.service.js';
import * as backlinks from '../services/backlinks.service.js';
import * as competitors from '../services/competitors.service.js';
import * as content from '../services/content.service.js';
import * as dashboard from '../services/dashboard.service.js';
import * as keywords from '../services/keywords.service.js';
import { ctxOf } from '../utils/context.js';
import { accepted, created, noContent, ok } from '../utils/respond.js';
import { idParams, parse, projectIdQuery } from '../validators/common.js';
import {
  addBacklinkSchema,
  addCompetitorSchema,
  addKeywordsSchema,
  createContentSchema,
  issueStatusSchema,
  startAuditSchema,
  updateContentSchema,
} from '../validators/resources.js';

const projectId = (req: Request) => parse(projectIdQuery, req.query).projectId;
const id = (req: Request) => parse(idParams, req.params).id;

// ── Dashboard ──────────────────────────────────────────────────────────────
export const summary = async (req: Request, res: Response) => ok(res, await dashboard.dashboardSummary(ctxOf(req), projectId(req)));

// ── Keywords ───────────────────────────────────────────────────────────────
export const listKeywords = async (req: Request, res: Response) => ok(res, await keywords.listKeywords(ctxOf(req), projectId(req)));
export const keywordSummary = async (req: Request, res: Response) => ok(res, await keywords.keywordSummary(ctxOf(req), projectId(req)));
export const addKeywords = async (req: Request, res: Response) => created(res, await keywords.addKeywords(ctxOf(req), parse(addKeywordsSchema, req.body)));
export async function deleteKeyword(req: Request, res: Response) {
  await keywords.deleteKeyword(ctxOf(req), id(req));
  noContent(res);
}

// ── Site audit ─────────────────────────────────────────────────────────────
export const startAudit = async (req: Request, res: Response) => accepted(res, await audits.startAudit(ctxOf(req), parse(startAuditSchema, req.body)));
export const getAuditRun = async (req: Request, res: Response) => ok(res, await audits.getAuditRun(ctxOf(req), id(req)));
export const latestAudits = async (req: Request, res: Response) => ok(res, await audits.latestAudits(ctxOf(req), projectId(req)));
export const auditChecks = async (req: Request, res: Response) => ok(res, await audits.latestChecks(ctxOf(req), projectId(req)));
export const auditHistory = async (req: Request, res: Response) => ok(res, await audits.auditHistory(ctxOf(req), projectId(req)));
export const getIssue = async (req: Request, res: Response) => ok(res, await audits.getIssue(ctxOf(req), id(req)));
export const setIssueStatus = async (req: Request, res: Response) =>
  ok(res, await audits.setIssueStatus(ctxOf(req), id(req), parse(issueStatusSchema, req.body).status));

// ── Backlinks ──────────────────────────────────────────────────────────────
export const listBacklinks = async (req: Request, res: Response) => ok(res, await backlinks.listBacklinks(ctxOf(req), projectId(req)));
export const addBacklink = async (req: Request, res: Response) => created(res, await backlinks.addBacklink(ctxOf(req), parse(addBacklinkSchema, req.body)));
export async function deleteBacklink(req: Request, res: Response) {
  await backlinks.deleteBacklink(ctxOf(req), id(req));
  noContent(res);
}
const analytics = (req: Request) => backlinks.backlinkAnalytics(ctxOf(req), projectId(req));
export const backlinkStats = async (req: Request, res: Response) => ok(res, (await analytics(req)).stats);
export const backlinkGrowth = async (req: Request, res: Response) => ok(res, (await analytics(req)).growth);
export const anchorDistribution = async (req: Request, res: Response) => ok(res, (await analytics(req)).anchors);
export const followNofollow = async (req: Request, res: Response) => ok(res, (await analytics(req)).linkTypes);
export const topDomains = async (req: Request, res: Response) => ok(res, (await analytics(req)).topDomains);

// ── Competitors ────────────────────────────────────────────────────────────
export const listCompetitors = async (req: Request, res: Response) => ok(res, await competitors.listCompetitors(ctxOf(req), projectId(req)));
export const addCompetitor = async (req: Request, res: Response) =>
  created(res, await competitors.addCompetitor(ctxOf(req), parse(addCompetitorSchema, req.body)));
export async function deleteCompetitor(req: Request, res: Response) {
  await competitors.deleteCompetitor(ctxOf(req), id(req));
  noContent(res);
}
export const keywordComparison = async (req: Request, res: Response) => ok(res, await competitors.keywordComparison(ctxOf(req), projectId(req)));
export const keywordGap = async (req: Request, res: Response) => ok(res, await competitors.keywordGap(ctxOf(req), projectId(req)));

// ── Content ────────────────────────────────────────────────────────────────
export const listContent = async (req: Request, res: Response) => ok(res, await content.listContent(ctxOf(req), projectId(req)));
export const contentStats = async (req: Request, res: Response) => ok(res, await content.contentStats(ctxOf(req), projectId(req)));
export const createContent = async (req: Request, res: Response) =>
  created(res, await content.createContent(ctxOf(req), parse(createContentSchema, req.body)));
export const updateContent = async (req: Request, res: Response) =>
  ok(res, await content.updateContent(ctxOf(req), id(req), parse(updateContentSchema, req.body)));
export async function deleteContent(req: Request, res: Response) {
  await content.deleteContent(ctxOf(req), id(req));
  noContent(res);
}

// ── AI SEO ─────────────────────────────────────────────────────────────────
const ai = (req: Request) => aiSeo.aiSeoData(ctxOf(req), projectId(req));
export const aiMetrics = async (req: Request, res: Response) => ok(res, (await ai(req)).metrics);
export const aiTrend = async (req: Request, res: Response) => ok(res, (await ai(req)).trend);
export const aiMentions = async (req: Request, res: Response) => ok(res, (await ai(req)).mentionsByPlatform);
export const aiRecommendations = async (req: Request, res: Response) => ok(res, (await ai(req)).recommendations);
