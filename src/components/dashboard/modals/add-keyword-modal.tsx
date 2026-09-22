import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, TextInput, SelectInput } from './modal-shell';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

export function AddKeywordModal({ onClose }: { onClose: () => void }) {
  const [keywords, setKeywords] = useState<string[]>(['']);
  const [bulk, setBulk] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Add keywords one by one</FieldLabel>
        <div className="mt-1 space-y-2">
          {keywords.map((kw, i) => (
            <div key={i} className="flex gap-2">
              <TextInput
                placeholder="e.g. seo audit tool"
                value={kw}
                onChange={(e) => setKeywords((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
              />
              {keywords.length > 1 && (
                <button
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
          onClick={() => setKeywords((prev) => [...prev, ''])}
          className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          <Plus className="h-4 w-4" />
          Add another keyword
        </button>
      </div>

      <div className="border-t pt-4">
        <FieldLabel>Or paste in bulk (one per line)</FieldLabel>
        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          placeholder={'seo audit tool\nkeyword research\nbacklink checker'}
          className="mt-1 h-24 w-full rounded-xl border bg-muted/40 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Search Engine</FieldLabel>
          <SelectInput defaultValue="google">
            <option value="google">Google</option>
            <option value="bing">Bing</option>
            <option value="yahoo">Yahoo</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel>Device</FieldLabel>
          <SelectInput defaultValue="desktop">
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </SelectInput>
        </div>
      </div>

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>Track Keywords</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
