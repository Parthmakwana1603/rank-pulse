import { createContext, useContext } from 'react';
import type { ProjectItem } from '@/lib/seo-data';

/** Stable key of a project: its id, or its name for demo projects without an id. */
export const projectKey = (p: Pick<ProjectItem, 'id' | 'name'>) => p.id ?? p.name;

/** The project the dashboard screens show data for (provided by ProjectProvider). */
export interface ProjectScope {
  /** Id of the selected project (demo projects without an id use their name). */
  projectId: string | undefined;
  setProjectId: (id: string) => void;
}

export const ProjectScopeContext = createContext<ProjectScope>({ projectId: undefined, setProjectId: () => {} });

export const useProjectScope = () => useContext(ProjectScopeContext);
