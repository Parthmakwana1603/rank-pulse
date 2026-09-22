import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, TextInput, SelectInput, TextArea } from './modal-shell';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export function AddBacklinkModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'add' | 'disavow'>('add');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-xl bg-muted/50 p-1">
        {(['add', 'disavow'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all ${mode === m ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            {m === 'add' ? 'Add Backlink' : 'Disavow Link'}
          </button>
        ))}
      </div>

      <div>
        <FieldLabel>Source URL</FieldLabel>
        <TextInput placeholder="https://example.com/blog/mention" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Target Page</FieldLabel>
          <TextInput placeholder="/blog/seo-guide" />
        </div>
        <div>
          <FieldLabel>Link Type</FieldLabel>
          <SelectInput defaultValue="follow">
            <option value="follow">Follow</option>
            <option value="nofollow">Nofollow</option>
            <option value="ugc">UGC</option>
            <option value="sponsored">Sponsored</option>
          </SelectInput>
        </div>
      </div>
      <div>
        <FieldLabel>Anchor Text</FieldLabel>
        <TextInput placeholder="e.g. best SEO tool" />
      </div>
      <div>
        <FieldLabel>Domain Authority (optional)</FieldLabel>
        <TextInput type="number" placeholder="0-100" />
      </div>
      {mode === 'disavow' && (
        <div className="rounded-xl border bg-destructive/5 p-3 text-sm text-muted-foreground">
          Disavowed links tell Google to ignore these backlinks when assessing your site. Use with caution.
        </div>
      )}
      <div>
        <FieldLabel>Notes</FieldLabel>
        <TextArea placeholder="Add any notes about this backlink…" rows={2} />
      </div>

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>
          <span className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            {mode === 'add' ? 'Add Backlink' : 'Disavow Link'}
          </span>
        </PrimaryButton>
      </ModalFooter>
    </div>
  );
}
