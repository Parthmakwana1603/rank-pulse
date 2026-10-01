import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useProjects } from '@/lib/api/queries';
import { ProjectScopeContext, projectKey, useProjectScope } from '@/lib/project-scope';

const STORAGE_KEY = 'rankpulse-project';

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Remembers which project the dashboard shows. Falls back to the first project when nothing is
 * chosen yet or the chosen project was deleted.
 */
export function ProjectProvider({ children }: { children: ReactNode }) {
  const projectsQuery = useProjects();
  const [chosen, setChosen] = useState<string | null>(readStored);
  const projects = projectsQuery.data;
  const projectId = useMemo(() => {
    if (!projects || projects.length === 0) return undefined;
    return projects.some((p) => projectKey(p) === chosen) ? chosen! : projectKey(projects[0]);
  }, [projects, chosen]);

  const setProjectId = useCallback((id: string) => {
    setChosen(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Storage unavailable: the choice lasts for this session only.
    }
  }, []);

  const value = useMemo(() => ({ projectId, setProjectId }), [projectId, setProjectId]);
  return <ProjectScopeContext.Provider value={value}>{children}</ProjectScopeContext.Provider>;
}

/** The selected project (undefined while loading or when the user has none). */
export function useSelectedProject() {
  const { projectId, setProjectId } = useProjectScope();
  const projectsQuery = useProjects();
  const project = projectsQuery.data?.find((p) => projectKey(p) === projectId);
  return { project, projectId, setProjectId, projectsQuery };
}
