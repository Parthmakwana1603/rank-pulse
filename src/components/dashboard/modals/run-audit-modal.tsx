import { useState, useEffect } from 'react';
import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, SelectInput, TextInput } from './modal-shell';
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const steps = ['Configuring', 'Crawling pages', 'Analyzing issues', 'Complete'] as const;

export function RunAuditModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (phase >= 3) return;
    const timer = setTimeout(() => setPhase((p) => p + 1), 800);
    return () => clearTimeout(timer);
  }, [phase]);

  const isDone = phase >= 3;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Crawl Depth</FieldLabel>
          <SelectInput defaultValue="standard">
            <option value="quick">Quick (top 100 pages)</option>
            <option value="standard">Standard (top 500 pages)</option>
            <option value="full">Full (all pages)</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel>Max Pages</FieldLabel>
          <TextInput type="number" defaultValue="500" />
        </div>
      </div>
      <div>
        <FieldLabel>User Agent</FieldLabel>
        <SelectInput defaultValue="desktop">
          <option value="desktop">Desktop</option>
          <option value="mobile">Mobile</option>
          <option value="googlebot">Googlebot</option>
        </SelectInput>
      </div>

      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          {isDone ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          <p className="text-sm font-semibold">
            {isDone ? 'Audit Complete' : `Audit in progress — ${steps[phase]}…`}
          </p>
        </div>
        <div className="mt-3 space-y-2">
          {steps.map((step, i) => {
            const done = i <= phase;
            return (
              <div key={step} className="flex items-center gap-2.5 text-sm">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted" />
                )}
                <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{step}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${((phase + 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      {isDone && (
        <div className="flex items-center gap-2 rounded-xl border bg-success/10 p-3 text-sm text-success">
          <ShieldCheck className="h-4 w-4" />
          94% site health · 23 errors · 87 warnings · 88 notices found.
        </div>
      )}

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>{isDone ? 'View Results' : 'Run in Background'}</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
