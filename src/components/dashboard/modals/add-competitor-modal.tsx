import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, TextInput, SelectInput } from './modal-shell';
import { Users } from 'lucide-react';

export function AddCompetitorModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Competitor Domain</FieldLabel>
        <div className="relative mt-1">
          <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <TextInput placeholder="competitor.com" className="pl-9" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Display Name</FieldLabel>
          <TextInput placeholder="Competitor A" />
        </div>
        <div>
          <FieldLabel>Target Country</FieldLabel>
          <SelectInput defaultValue="us">
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
            <option value="de">Germany</option>
            <option value="in">India</option>
          </SelectInput>
        </div>
      </div>
      <div>
        <FieldLabel>Tracking Scope</FieldLabel>
        <SelectInput defaultValue="organic">
          <option value="organic">Organic Keywords Only</option>
          <option value="paid">Paid + Organic</option>
          <option value="all">All Traffic Sources</option>
        </SelectInput>
      </div>
      <div className="rounded-xl border bg-muted/30 p-3.5 text-sm text-muted-foreground">
        We'll automatically fetch traffic, keywords, backlinks, and authority data for this domain. This may take a few minutes.
      </div>
      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>Add Competitor</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
