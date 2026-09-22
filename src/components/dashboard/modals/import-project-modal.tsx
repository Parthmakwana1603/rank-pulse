import { ModalFooter, CancelButton, PrimaryButton } from './modal-shell';
import { Globe, FileSpreadsheet, Upload, Check } from 'lucide-react';
import { useState } from 'react';

const sources = [
  { id: 'gsc', label: 'Google Search Console', icon: Globe, description: 'Import properties you already manage' },
  { id: 'csv', label: 'CSV File', icon: FileSpreadsheet, description: 'Upload a CSV with project URLs' },
];

export function ImportProjectModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Choose a source to import your projects from.</p>
      <div className="space-y-2.5">
        {sources.map((s) => {
          const Icon = s.icon;
          const isActive = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${isActive ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:bg-muted/50'}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
              {isActive && <Check className="h-5 w-5 text-primary" />}
            </button>
          );
        })}
      </div>
      {selected === 'csv' && (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/40">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Drop your CSV file here</p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
        </div>
      )}
      {selected === 'gsc' && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm font-medium">Connect Google Search Console</p>
          <p className="mt-1 text-xs text-muted-foreground">You'll be redirected to authorize access to your properties.</p>
        </div>
      )}
      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>Import</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
