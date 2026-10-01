import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, FieldError, FormAlert, TextInput, SelectInput } from './modal-shell';
import { Loader2, Users } from 'lucide-react';
import { useState } from 'react';
import { useAddCompetitor, type AddCompetitorInput } from '@/lib/api/queries';
import { countries } from '@/lib/api/projects';
import { useSelectedProject } from '@/lib/project-context';

export function AddCompetitorModal({ onClose }: { onClose: () => void }) {
  const { projectId } = useSelectedProject();
  const [domain, setDomain] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [targetCountry, setTargetCountry] = useState('');
  const [trackingScope, setTrackingScope] = useState<AddCompetitorInput['trackingScope']>('organic');
  const [domainError, setDomainError] = useState('');
  const addCompetitor = useAddCompetitor();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = domain.trim();
    let host = '';
    try {
      host = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname;
    } catch {
      host = '';
    }
    if (!value || !host.includes('.')) {
      setDomainError('Enter a domain like competitor.com.');
      return;
    }
    if (!projectId) return;
    addCompetitor.mutate(
      {
        projectId,
        domain: value,
        displayName: displayName.trim() || undefined,
        targetCountry: targetCountry || undefined,
        trackingScope,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <FieldLabel htmlFor="comp-domain">Competitor Domain</FieldLabel>
        <div className="relative mt-1">
          <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <TextInput
            id="comp-domain"
            autoFocus
            placeholder="competitor.com"
            className="mt-0 pl-9"
            value={domain}
            aria-invalid={!!domainError}
            onChange={(e) => {
              setDomain(e.target.value);
              setDomainError('');
            }}
          />
        </div>
        <FieldError id="comp-domain-error">{domainError}</FieldError>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="comp-name">Display Name</FieldLabel>
          <TextInput id="comp-name" placeholder="Defaults to the domain" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <FieldLabel htmlFor="comp-country">Target Country</FieldLabel>
          <SelectInput id="comp-country" value={targetCountry} onChange={(e) => setTargetCountry(e.target.value)}>
            <option value="">Any</option>
            {countries.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </SelectInput>
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="comp-scope">Tracking Scope</FieldLabel>
        <SelectInput id="comp-scope" value={trackingScope} onChange={(e) => setTrackingScope(e.target.value as AddCompetitorInput['trackingScope'])}>
          <option value="organic">Organic Keywords Only</option>
          <option value="paid">Paid + Organic</option>
          <option value="all">All Traffic Sources</option>
        </SelectInput>
      </div>
      <div className="rounded-xl border bg-muted/30 p-3.5 text-sm text-muted-foreground">
        The competitor is saved to this project. Traffic, keyword, backlink and authority figures for other domains need an SEO data
        provider, which isn't connected yet, so they show as “—” for now.
      </div>
      <FormAlert>{addCompetitor.error?.message}</FormAlert>
      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton type="submit" disabled={addCompetitor.isPending}>
          {addCompetitor.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Add Competitor
        </PrimaryButton>
      </ModalFooter>
    </form>
  );
}
