import { Router } from 'express';
import * as account from '../controllers/account.controller.js';
import * as projects from '../controllers/projects.controller.js';
import * as seo from '../controllers/seo.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { jobLimiter } from '../middleware/rate-limit.js';
import { singleFile } from '../middleware/upload.js';
import { ok } from '../utils/respond.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => ok(res, { status: 'ok' }));

// Everything below needs a signed-in user.
apiRouter.use(requireAuth);

// Profile
apiRouter.get('/profile', account.getProfile);
apiRouter.patch('/profile', account.updateProfile);
apiRouter.post('/profile/avatar', singleFile('avatar', 2 * 1024 * 1024, ['image/png', 'image/jpeg', 'image/webp', 'image/gif']), account.uploadAvatar);
apiRouter.delete('/profile/avatar', account.deleteAvatar);

// Projects
apiRouter.get('/projects', projects.list);
apiRouter.post('/projects', projects.create);
apiRouter.post('/projects/import', jobLimiter, singleFile('file', 1024 * 1024, ['text/csv', 'application/vnd.ms-excel', 'text/plain', 'application/csv']), projects.importCsv);
apiRouter.get('/projects/:id', projects.get);
apiRouter.patch('/projects/:id', projects.update);
apiRouter.delete('/projects/:id', projects.remove);

// Dashboard, activity feed, notifications
apiRouter.get('/dashboard/summary', seo.summary);
apiRouter.get('/activities', account.activities);
apiRouter.get('/notifications', account.notifications);
apiRouter.post('/notifications/read-all', account.readAllNotifications);
apiRouter.post('/notifications/:id/read', account.readNotification);

// Keywords
apiRouter.get('/keywords', seo.listKeywords);
apiRouter.get('/keywords/summary', seo.keywordSummary);
apiRouter.post('/keywords', seo.addKeywords);
apiRouter.delete('/keywords/:id', seo.deleteKeyword);

// Site audit
apiRouter.post('/audit/runs', jobLimiter, seo.startAudit);
apiRouter.get('/audit/runs/:id', seo.getAuditRun);
apiRouter.get('/audit/latest', seo.latestAudits);
apiRouter.get('/audit/checks', seo.auditChecks);
apiRouter.get('/audit/history', seo.auditHistory);
apiRouter.get('/audit/issues/:id', seo.getIssue);
apiRouter.patch('/audit/issues/:id', seo.setIssueStatus);

// Backlinks
apiRouter.get('/backlinks', seo.listBacklinks);
apiRouter.post('/backlinks', seo.addBacklink);
apiRouter.get('/backlinks/stats', seo.backlinkStats);
apiRouter.get('/backlinks/growth', seo.backlinkGrowth);
apiRouter.get('/backlinks/anchor-distribution', seo.anchorDistribution);
apiRouter.get('/backlinks/follow-nofollow', seo.followNofollow);
apiRouter.get('/backlinks/top-domains', seo.topDomains);
apiRouter.delete('/backlinks/:id', seo.deleteBacklink);

// Competitors
apiRouter.get('/competitors', seo.listCompetitors);
apiRouter.post('/competitors', seo.addCompetitor);
apiRouter.get('/competitors/keyword-comparison', seo.keywordComparison);
apiRouter.get('/competitors/gap-analysis', seo.keywordGap);
apiRouter.delete('/competitors/:id', seo.deleteCompetitor);

// Content
apiRouter.get('/content', seo.listContent);
apiRouter.get('/content/stats', seo.contentStats);
apiRouter.post('/content', seo.createContent);
apiRouter.patch('/content/:id', seo.updateContent);
apiRouter.delete('/content/:id', seo.deleteContent);

// AI SEO
apiRouter.get('/ai-seo/metrics', seo.aiMetrics);
apiRouter.get('/ai-seo/trend', seo.aiTrend);
apiRouter.get('/ai-seo/mentions-by-platform', seo.aiMentions);
apiRouter.get('/ai-seo/recommendations', seo.aiRecommendations);

// Reports
apiRouter.get('/reports/templates', account.reportTemplates);
apiRouter.get('/reports', account.listReports);
apiRouter.post('/reports', jobLimiter, account.createReport);
apiRouter.get('/reports/:id', account.getReport);
apiRouter.get('/reports/:id/download', account.downloadReport);

// Settings
apiRouter.get('/settings/notifications', account.notificationPreferences);
apiRouter.put('/settings/notifications/:key', account.setNotificationPreference);
apiRouter.get('/settings/integrations', account.integrations);
apiRouter.get('/settings/billing', account.billing);
