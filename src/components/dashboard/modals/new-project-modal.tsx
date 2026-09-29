import { useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import {
  ModalFooter,
  CancelButton,
  PrimaryButton,
  FieldLabel,
  FieldError,
  TextInput,
  SelectInput,
} from './modal-shell';
import { useCreateProject } from '@/lib/api/queries';
import {
  countries,
  industries,
  validateNewProject,
  type NewProjectErrors,
  type NewProjectForm,
} from '@/lib/api/projects';

const emptyForm: NewProjectForm = { name: '', websiteUrl: '', industry: '', targetCountry: '', keywords: '' };

export function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<NewProjectForm>(emptyForm);
  const [errors, setErrors] = useState<NewProjectErrors>({});
  const createProject = useCreateProject();

  const update = (key: keyof NewProjectForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const errorProps = (key: keyof NewProjectForm) =>
    errors[key] ? { 'aria-invalid': true, 'aria-describedby': `np-${key}-error` } : {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateNewProject(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    createProject.mutate(result.input, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <FieldLabel htmlFor="np-websiteUrl">Website URL</FieldLabel>
        <div className="relative">
          <Globe className="pointer-events-none absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <TextInput
            id="np-websiteUrl"
            autoFocus
            placeholder="https://example.com"
            className="pl-9"
            value={form.websiteUrl}
            onChange={update('websiteUrl')}
            {...errorProps('websiteUrl')}
          />
        </div>
        <FieldError id="np-websiteUrl-error">{errors.websiteUrl}</FieldError>
      </div>
      <div>
        <FieldLabel htmlFor="np-name">Project name (optional)</FieldLabel>
        <TextInput
          id="np-name"
          placeholder="Defaults to the domain, e.g. example.com"
          value={form.name}
          onChange={update('name')}
          {...errorProps('name')}
        />
        <FieldError id="np-name-error">{errors.name}</FieldError>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="np-industry">Industry</FieldLabel>
          <SelectInput id="np-industry" value={form.industry} onChange={update('industry')}>
            <option value="">Select…</option>
            {industries.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel htmlFor="np-targetCountry">Target country</FieldLabel>
          <SelectInput id="np-targetCountry" value={form.targetCountry} onChange={update('targetCountry')}>
            <option value="">Select…</option>
            {countries.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </SelectInput>
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="np-keywords">Tracking keywords (comma separated)</FieldLabel>
        <TextInput
          id="np-keywords"
          placeholder="seo audit, keyword research, backlink checker"
          value={form.keywords}
          onChange={update('keywords')}
          {...errorProps('keywords')}
        />
        <FieldError id="np-keywords-error">{errors.keywords}</FieldError>
      </div>

      {createProject.error && (
        <div role="alert" className="rounded-xl border bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {createProject.error.message}
        </div>
      )}

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton type="submit" disabled={createProject.isPending}>
          {createProject.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Project
        </PrimaryButton>
      </ModalFooter>
    </form>
  );
}
