import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, TextInput, SelectInput } from './modal-shell';
import { Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useAddKeywords, type AddKeywordsInput } from '@/lib/api/queries';
import { useSelectedProject } from '@/lib/project-context';

/** One list from the individual inputs and the bulk box: trimmed, lower-case, no duplicates. */
function collectKeywords(single: string[], bulk: string) {
  return [...new Set([...single, ...bulk.split('\n')].map((k) => k.trim().toLowerCase()).filter(Boolean))];
}

export function AddKeywordModal({ onClose }: { onClose: () => void }) {
  const { project, projectId } = useSelectedProject();
  const [keywords, setKeywords] = useState<string[]>(['']);
  const [bulk, setBulk] = useState('');
  const [searchEngine, setSearchEngine] = useState<AddKeywordsInput['searchEngine']>('google');
  const [device, setDevice] = useState<AddKeywordsInput['device']>('desktop');
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const addKeywords = useAddKeywords();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const list = collectKeywords(keywords, bulk);
    if (!projectId) return setFormError('Create a project first.');
    if (list.length === 0) return setFormError('Enter at least one keyword.');
    if (list.length > 100) return setFormError('Add at most 100 keywords at a time.');
    if (list.some((k) => k.length > 200)) return setFormError('Each keyword must be 200 characters or fewer.');
    addKeywords.mutate({ projectId, keywords: list, searchEngine, device }, { onSuccess: setResult });
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div role="status" className="rounded-xl border bg-success/5 px-3 py-2.5 text-sm text-success">
          Added {result.added} keyword{result.added === 1 ? '' : 's'} to {project?.name ?? 'your project'}.
          {result.skipped > 0 && ` ${result.skipped} ${result.skipped === 1 ? 'was' : 'were'} already tracked.`}
        </div>
        <ModalFooter>
          <PrimaryButton onClick={onClose}>Done</PrimaryButton>
        </ModalFooter>
      </div>
    );
  }

  const error = formError || addKeywords.error?.message;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {project && (
        <p className="text-xs text-muted-foreground">
          Adding to <span className="font-medium text-foreground">{project.name}</span>
        </p>
      )}
      <div>
        <FieldLabel>Add keywords one by one</FieldLabel>
        <div className="mt-1 space-y-2">
          {keywords.map((kw, i) => (
            <div key={i} className="flex gap-2">
              <TextInput
                placeholder="e.g. seo audit tool"
                aria-label={`Keyword ${i + 1}`}
                value={kw}
                onChange={(e) => setKeywords((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
              />
              {keywords.length > 1 && (
                <button
                  type="button"
                  aria-label="Remove keyword"
                  onClick={() => setKeywords((prev) => prev.filter((_, idx) => idx !== i))}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-muted-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setKeywords((prev) => [...prev, ''])}
          className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          <Plus className="h-4 w-4" />
          Add another keyword
        </button>
      </div>

      <div className="border-t pt-4">
        <FieldLabel htmlFor="kw-bulk">Or paste in bulk (one per line)</FieldLabel>
        <textarea
          id="kw-bulk"
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          placeholder={'seo audit tool\nkeyword research\nbacklink checker'}
          className="mt-1 h-24 w-full rounded-xl border bg-muted/40 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="kw-engine">Search Engine</FieldLabel>
          <SelectInput id="kw-engine" value={searchEngine} onChange={(e) => setSearchEngine(e.target.value as AddKeywordsInput['searchEngine'])}>
            <option value="google">Google</option>
            <option value="bing">Bing</option>
            <option value="yahoo">Yahoo</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel htmlFor="kw-device">Device</FieldLabel>
          <SelectInput id="kw-device" value={device} onChange={(e) => setDevice(e.target.value as AddKeywordsInput['device'])}>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </SelectInput>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton type="submit" disabled={addKeywords.isPending}>
          {addKeywords.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Track Keywords
        </PrimaryButton>
      </ModalFooter>
    </form>
  );
}
