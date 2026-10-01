import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, FieldError, FormAlert, TextInput, SelectInput, TextArea } from './modal-shell';
import { useContent, useCreateContent, useUpdateContent, type ContentInput } from '@/lib/api/queries';
import type { ContentItem } from '@/lib/seo-data';
import { useSelectedProject } from '@/lib/project-context';

type Form = {
  title: string;
  urlPath: string;
  contentType: ContentInput['contentType'];
  status: ContentInput['status'];
  primaryKeyword: string;
  targetKeywords: string;
  metaDescription: string;
};

type Errors = Partial<Record<keyof Form, string>>;

const statusValue: Record<ContentItem['status'], ContentInput['status']> = {
  Draft: 'draft',
  Published: 'published',
  'Needs Update': 'needs-update',
  Outdated: 'outdated',
};

const fromItem = (item: ContentItem | undefined): Form => ({
  title: item?.title ?? '',
  urlPath: item?.url ?? '',
  contentType: (item?.type.toLowerCase() as ContentInput['contentType']) ?? 'blog',
  status: item ? statusValue[item.status] : 'draft',
  primaryKeyword: item?.primaryKeyword ?? '',
  targetKeywords: item?.targetKeywords?.join(', ') ?? '',
  metaDescription: item?.metaDescription ?? '',
});

function validate(form: Form): { ok: true; input: ContentInput } | { ok: false; errors: Errors } {
  const errors: Errors = {};
  const title = form.title.trim();
  if (!title) errors.title = 'Enter a title.';
  else if (title.length > 200) errors.title = 'Title must be 200 characters or fewer.';
  let urlPath = form.urlPath.trim();
  if (/^https?:\/\//i.test(urlPath)) {
    try {
      urlPath = new URL(urlPath).pathname;
    } catch {
      // Leave as typed; the check below reports it.
    }
  }
  if (urlPath && !urlPath.startsWith('/')) urlPath = `/${urlPath}`;
  if (!urlPath) errors.urlPath = 'Enter the URL path, like /blog/my-post.';
  else if (/\s/.test(urlPath)) errors.urlPath = 'The URL path cannot contain spaces.';
  const targetKeywords = [...new Set(form.targetKeywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean))];
  if (targetKeywords.length > 50) errors.targetKeywords = 'Use at most 50 target keywords.';
  if (form.metaDescription.trim().length > 500) errors.metaDescription = 'Keep the description under 500 characters.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    input: {
      title,
      urlPath,
      contentType: form.contentType,
      status: form.status,
      primaryKeyword: form.primaryKeyword.trim().toLowerCase() || null,
      targetKeywords,
      metaDescription: form.metaDescription.trim() || null,
    },
  };
}

/** Creates content, or edits it when `contentId` is given. */
export function NewContentModal({ onClose, contentId }: { onClose: () => void; contentId?: string }) {
  const contentQuery = useContent();
  const existing = contentId ? contentQuery.data?.find((c) => c.id === contentId) : undefined;
  if (contentId && !contentQuery.data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (contentId && !existing) return <p className="text-sm text-muted-foreground">This content no longer exists.</p>;
  return <ContentForm key={contentId ?? 'new'} onClose={onClose} existing={existing} />;
}

function ContentForm({ onClose, existing }: { onClose: () => void; existing?: ContentItem }) {
  const { projectId } = useSelectedProject();
  const [form, setForm] = useState<Form>(() => fromItem(existing));
  const [errors, setErrors] = useState<Errors>({});
  const create = useCreateContent();
  const update = useUpdateContent();
  const mutation = existing ? update : create;

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validate(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (existing?.id) update.mutate({ id: existing.id, ...result.input }, { onSuccess: onClose });
    else if (projectId) create.mutate({ projectId, ...result.input }, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <FieldLabel htmlFor="nc-title">Content Title</FieldLabel>
        <TextInput id="nc-title" autoFocus placeholder="e.g. The Complete Guide to Technical SEO" value={form.title} onChange={set('title')} aria-invalid={!!errors.title} />
        <FieldError id="nc-title-error">{errors.title}</FieldError>
      </div>
      <div>
        <FieldLabel htmlFor="nc-url">URL Slug</FieldLabel>
        <TextInput id="nc-url" placeholder="/blog/technical-seo-guide" value={form.urlPath} onChange={set('urlPath')} aria-invalid={!!errors.urlPath} />
        <FieldError id="nc-url-error">{errors.urlPath}</FieldError>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="nc-type">Content Type</FieldLabel>
          <SelectInput id="nc-type" value={form.contentType} onChange={set('contentType')}>
            <option value="blog">Blog Post</option>
            <option value="landing">Landing Page</option>
            <option value="tool">Tool Page</option>
            <option value="guide">Guide</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel htmlFor="nc-status">Status</FieldLabel>
          <SelectInput id="nc-status" value={form.status} onChange={set('status')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="needs-update">Needs Update</option>
            <option value="outdated">Outdated</option>
          </SelectInput>
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="nc-primary">Primary Keyword</FieldLabel>
        <TextInput id="nc-primary" placeholder="e.g. technical seo" value={form.primaryKeyword} onChange={set('primaryKeyword')} />
      </div>
      <div>
        <FieldLabel htmlFor="nc-targets">Target Keywords (comma separated)</FieldLabel>
        <TextInput id="nc-targets" placeholder="technical seo, seo checklist, site audit" value={form.targetKeywords} onChange={set('targetKeywords')} />
        <FieldError id="nc-targets-error">{errors.targetKeywords}</FieldError>
      </div>
      <div>
        <FieldLabel htmlFor="nc-meta">Meta Description</FieldLabel>
        <TextArea id="nc-meta" placeholder="A brief description for search engines…" rows={2} value={form.metaDescription} onChange={set('metaDescription')} />
        <FieldError id="nc-meta-error">{errors.metaDescription}</FieldError>
      </div>
      <FormAlert>{mutation.error?.message}</FormAlert>
      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {existing ? 'Save Changes' : 'Create Content'}
        </PrimaryButton>
      </ModalFooter>
    </form>
  );
}
