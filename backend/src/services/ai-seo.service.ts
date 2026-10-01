// AI SEO / GEO metrics (AI visibility, mentions per AI platform, citations, recommendations).
//
// Measuring how often AI assistants mention a site needs a provider that queries those assistants
// or buys that data. None has been chosen (BACKEND_BLOCKERS.md), and inventing one isn't safe, so
// these endpoints return empty data for a project the caller owns. A provider can be added behind
// this module without changing routes or the frontend contract:
//
//   interface AiVisibilityProvider {
//     metrics(domain: string): Promise<{ key: string; value: number; target: number | null }[]>;
//     mentionsByPlatform(domain: string): Promise<{ platform: string; mentions: number }[]>;
//     trend(domain: string, weeks: number): Promise<{ weekStart: string; visibility: number; mentions: number }[]>;
//   }
import type { Ctx } from '../utils/context.js';
import { requireProject } from './projects.service.js';

export async function aiSeoData(ctx: Ctx, projectId: string) {
  await requireProject(ctx, projectId);
  return {
    metrics: [] as { key: string; value: number; change: number | null; target: number | null }[],
    trend: [] as { weekStart: string; visibility: number; mentions: number }[],
    mentionsByPlatform: [] as { platform: string; mentions: number }[],
    recommendations: [] as { title: string; impact: 'High' | 'Medium' | 'Low'; expectedGain: string }[],
  };
}
