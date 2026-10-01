import { ModalFooter, CancelButton, PrimaryButton, FormAlert } from './modal-shell';
import { Globe, FileSpreadsheet, Upload, Check, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useImportProjects } from '@/lib/api/queries';
import type { ImportResultDto } from '@/lib/api/types';

const MAX_BYTES = 1024 * 1024;

const sources = [
  { id: 'gsc', label: 'Google Search Console', icon: Globe, description: 'Import properties you already manage' },
  { id: 'csv', label: 'CSV File', icon: FileSpreadsheet, description: 'Upload a CSV with project URLs' },
];

export function ImportProjectModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<ImportResultDto | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const importProjects = useImportProjects();

  const choose = (f: File | undefined) => {
    setFileError('');
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) return setFileError('Choose a .csv file.');
    if (f.size > MAX_BYTES) return setFileError('The file must be 1 MB or smaller.');
    setFile(f);
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div role="status" className="rounded-xl border bg-success/5 px-3 py-2.5 text-sm text-success">
          Imported {result.created.length} project{result.created.length === 1 ? '' : 's'}.
        </div>
        {result.skipped.length > 0 && (
          <div className="rounded-xl border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Skipped {result.skipped.length} row{result.skipped.length === 1 ? '' : 's'}:</p>
            <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
              {result.skipped.map((s) => (
                <li key={s.row}>
                  Row {s.row}{s.website ? ` (${s.website})` : ''}: {s.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        <ModalFooter>
          <PrimaryButton onClick={onClose}>Done</PrimaryButton>
        </ModalFooter>
      </div>
    );
  }

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
        <>
          <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              choose(e.dataTransfer.files[0]);
            }}
            className={`w-full rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-primary/40 ${dragging ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">{file ? file.name : 'Drop your CSV file here'}</p>
            <p className="text-xs text-muted-foreground">{file ? 'Click to choose a different file' : 'or click to browse (max 1 MB, 100 rows)'}</p>
          </button>
          <p className="text-xs text-muted-foreground">
            First row must be a header with a <code>website_url</code> (or <code>url</code>) column. Optional columns: <code>name</code>,{' '}
            <code>industry</code>, <code>target_country</code> (2-letter code) and <code>keywords</code> (separated by “;”).
          </p>
        </>
      )}
      {selected === 'gsc' && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm font-medium">Google Search Console import isn't available yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            It needs a Google OAuth app and API credentials, which haven't been set up. Use a CSV file for now.
          </p>
        </div>
      )}
      <FormAlert>{fileError || importProjects.error?.message}</FormAlert>
      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton
          disabled={selected !== 'csv' || !file || importProjects.isPending}
          onClick={() => file && importProjects.mutate(file, { onSuccess: setResult })}
        >
          {importProjects.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Import
        </PrimaryButton>
      </ModalFooter>
    </div>
  );
}
