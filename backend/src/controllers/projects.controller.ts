import type { Request, Response } from 'express';
import * as service from '../services/projects.service.js';
import { ctxOf } from '../utils/context.js';
import { badRequest } from '../utils/http-error.js';
import { created, noContent, ok } from '../utils/respond.js';
import { idParams, parse } from '../validators/common.js';
import { newProjectSchema, projectPatchSchema } from '../validators/projects.js';

export async function list(req: Request, res: Response) {
  ok(res, await service.listProjects(ctxOf(req)));
}

export async function get(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  ok(res, await service.getProject(ctxOf(req), id));
}

export async function create(req: Request, res: Response) {
  created(res, await service.createProject(ctxOf(req), parse(newProjectSchema, req.body)));
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  ok(res, await service.updateProject(ctxOf(req), id, parse(projectPatchSchema, req.body)));
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await service.deleteProject(ctxOf(req), id);
  noContent(res);
}

export async function importCsv(req: Request, res: Response) {
  if (!req.file) throw badRequest('Attach a CSV file in the "file" field.');
  ok(res, await service.importProjects(ctxOf(req), req.file.buffer));
}
