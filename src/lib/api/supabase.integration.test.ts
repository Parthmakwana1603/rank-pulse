// End-to-end tests against a real Supabase (e.g. `npx supabase start`), skipped unless configured:
//   VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=<anon key> npm test
// Sign-ups must be auto-confirmed (the local Supabase default) and use throwaway accounts.
import { describe, expect, it } from 'vitest';
import type { ProjectItem } from '@/lib/seo-data';
import { supabase } from '@/lib/supabase';
import { apiGet } from './client';
import { addSampleProjects, createProject, deleteProject } from './projects';

const configured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
const password = 'test-password-123';
const newEmail = () => `rankpulse-test-${crypto.randomUUID()}@example.com`;

async function signUp(name: string, email = newEmail()) {
  const { data, error } = await supabase!.auth.signUp({ email, password, options: { data: { name } } });
  if (error) throw error;
  expect(data.session, 'sign-up should return a session (auto-confirm must be on)').not.toBeNull();
  return data.user!;
}

describe.skipIf(!configured)('Supabase integration', () => {
  it('creates a profile from the sign-up name', async () => {
    const user = await signUp('Test Person');
    const { data, error } = await supabase!.from('profiles').select('name, plan, role').eq('id', user.id).single();
    expect(error).toBeNull();
    expect(data).toEqual({ name: 'Test Person', plan: 'free', role: 'owner' });
    await supabase!.auth.signOut();
  });

  it('runs the full project lifecycle and keeps users apart', async () => {
    const ownerEmail = newEmail();
    await signUp('Owner', ownerEmail);
    expect(await apiGet<ProjectItem[]>('/projects')).toEqual([]);

    await createProject({
      name: 'example.com',
      websiteUrl: 'https://example.com',
      industry: 'saas',
      targetCountry: 'GB',
      trackingKeywords: ['seo audit', 'keyword research'],
    });
    let projects = await apiGet<ProjectItem[]>('/projects');
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      name: 'example.com',
      websiteUrl: 'https://example.com',
      favicon: 'E',
      status: 'active',
      keywords: 2,
      traffic: '—',
      lastAudit: 'not run yet',
      trend: [],
    });

    await expect(
      createProject({ name: 'dup', websiteUrl: 'https://EXAMPLE.com', trackingKeywords: [] })
    ).rejects.toMatchObject({ status: 409, message: 'You already have a project for this website.' });

    await addSampleProjects();
    await addSampleProjects(); // running it twice must not create duplicates
    projects = await apiGet<ProjectItem[]>('/projects');
    expect(projects).toHaveLength(7);
    expect(projects.find((p) => p.name === 'acme-corp.com')).toMatchObject({ health: 94, authority: 64, traffic: '248.5K' });

    // Endpoints Supabase doesn't serve yet still come from the mock data.
    expect((await apiGet<unknown[]>('/keywords')).length).toBeGreaterThan(0);

    const ownerProjectId = projects[0].id!;
    await supabase!.auth.signOut();

    // A second user sees nothing and cannot delete the first user's project.
    await signUp('Other');
    expect(await apiGet<ProjectItem[]>('/projects')).toEqual([]);
    await deleteProject({ id: ownerProjectId, name: 'example.com' });
    await supabase!.auth.signOut();

    // Back as the owner: the project survived the other user's delete attempt.
    const { error } = await supabase!.auth.signInWithPassword({ email: ownerEmail, password });
    expect(error).toBeNull();
    expect((await apiGet<ProjectItem[]>('/projects')).map((p) => p.id)).toContain(ownerProjectId);
    await supabase!.auth.signOut();
  });

  it('lets the owner delete their project', async () => {
    const email = newEmail();
    await signUp('Deleter', email);
    await createProject({ name: 'to-delete.com', websiteUrl: 'https://to-delete.com', trackingKeywords: ['a'] });
    const [project] = await apiGet<ProjectItem[]>('/projects');
    await deleteProject(project);
    expect(await apiGet<ProjectItem[]>('/projects')).toEqual([]);

    // Signing out and back in keeps working with the same credentials.
    await supabase!.auth.signOut();
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    expect(error).toBeNull();
    await supabase!.auth.signOut();
  });

  it('rejects anonymous access', async () => {
    await supabase!.auth.signOut();
    expect(await apiGet<ProjectItem[]>('/projects')).toEqual([]);
    await expect(
      createProject({ name: 'anon.com', websiteUrl: 'https://anon.com', trackingKeywords: [] })
    ).rejects.toMatchObject({ status: 403 });
  });
});
