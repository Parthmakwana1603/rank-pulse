import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, FieldError, FormAlert, TextInput, SelectInput, TextArea } from './modal-shell';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useAddBacklink, type AddBacklinkInput } from '@/lib/api/queries';
import { useSelectedProject } from '@/lib/project-context';

interface Form {
  sourceUrl: string;
  targetPage: string;
  linkType: AddBacklinkInput['linkType'];
  anchorText: string;
  domainAuthority: string;
  notes: string;
}

type Errors = Partial<Record<keyof Form, string>>;

function validate(form: Form): Errors {
  const errors: Errors = {};
  const source = form.sourceUrl.trim();
  try {
    const url = new URL(/^https?:\/\//i.test(source) ? source : `https://${source}`);
    if (!source || !url.hostname.includes('.')) throw new Error();
  } catch {
    errors.sourceUrl = 'Enter the full URL of the page that links to you.';
  }
  if (!form.targetPage.trim()) errors.targetPage = 'Enter the page on your site that is linked to.';
  if (form.domainAuthority.trim()) {
    const da = Number(form.domainAuthority);
    if (!Number.isInteger(da) || da < 0 || da > 100) errors.domainAuthority = 'Use a whole number from 0 to 100.';
  }
  if (form.anchorText.length > 500) errors.anchorText = 'Anchor text must be 500 characters or fewer.';
  return errors;
}

export function AddBacklinkModal({ onClose }: { onClose: () => void }) {
  const { projectId } = useSelectedProject();
  const [mode, setMode] = useState<'add' | 'disavow'>('add');
  const [form, setForm] = useState<Form>({ sourceUrl: '', targetPage: '', linkType: 'follow', anchorText: '', domainAuthority: '', notes: '' });
  const [errors, setErrors] = useState<Errors>({});
  const addBacklink = useAddBacklink();

  const update = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length || !projectId) return;
    addBacklink.mutate(
      {
        projectId,
        sourceUrl: form.sourceUrl.trim(),
        targetPage: form.targetPage.trim(),
        linkType: form.linkType,
        anchorText: form.anchorText.trim(),
        domainAuthority: form.domainAuthority.trim() ? Number(form.domainAuthority) : null,
        notes: form.notes.trim() || undefined,
        disavow: mode === 'disavow',
      },
      { onSuccess: onClose }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="flex gap-2 rounded-xl bg-muted/50 p-1">
        {(['add', 'disavow'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all ${mode === m ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            {m === 'add' ? 'Add Backlink' : 'Disavow Link'}
          </button>
        ))}
      </div>

      <div>
        <FieldLabel htmlFor="bl-source">Source URL</FieldLabel>
        <TextInput id="bl-source" autoFocus placeholder="https://example.com/blog/mention" value={form.sourceUrl} onChange={update('sourceUrl')} aria-invalid={!!errors.sourceUrl} />
        <FieldError id="bl-source-error">{errors.sourceUrl}</FieldError>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="bl-target">Target Page</FieldLabel>
          <TextInput id="bl-target" placeholder="/blog/seo-guide" value={form.targetPage} onChange={update('targetPage')} aria-invalid={!!errors.targetPage} />
          <FieldError id="bl-target-error">{errors.targetPage}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="bl-type">Link Type</FieldLabel>
          <SelectInput id="bl-type" value={form.linkType} onChange={update('linkType')}>
            <option value="follow">Follow</option>
            <option value="nofollow">Nofollow</option>
            <option value="ugc">UGC</option>
            <option value="sponsored">Sponsored</option>
          </SelectInput>
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="bl-anchor">Anchor Text</FieldLabel>
        <TextInput id="bl-anchor" placeholder="e.g. best SEO tool" value={form.anchorText} onChange={update('anchorText')} />
        <FieldError id="bl-anchor-error">{errors.anchorText}</FieldError>
      </div>
      <div>
        <FieldLabel htmlFor="bl-da">Domain Authority (optional)</FieldLabel>
        <TextInput id="bl-da" type="number" min={0} max={100} placeholder="0-100" value={form.domainAuthority} onChange={update('domainAuthority')} aria-invalid={!!errors.domainAuthority} />
        <FieldError id="bl-da-error">{errors.domainAuthority}</FieldError>
      </div>
      {mode === 'disavow' && (
        <div className="rounded-xl border bg-destructive/5 p-3 text-sm text-muted-foreground">
          Disavowed links tell Google to ignore these backlinks when assessing your site. Use with caution. RankPulse records the
          decision; you still need to upload a disavow file in Google Search Console.
        </div>
      )}
      <div>
        <FieldLabel htmlFor="bl-notes">Notes</FieldLabel>
        <TextArea id="bl-notes" placeholder="Add any notes about this backlink…" rows={2} value={form.notes} onChange={update('notes')} />
      </div>

      <FormAlert>{addBacklink.error?.message}</FormAlert>

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton type="submit" disabled={addBacklink.isPending}>
          <span className="flex items-center gap-1.5">
            {addBacklink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {mode === 'add' ? 'Add Backlink' : 'Disavow Link'}
          </span>
        </PrimaryButton>
      </ModalFooter>
    </form>
  );
}
