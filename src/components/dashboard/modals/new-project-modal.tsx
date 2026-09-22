import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, TextInput, SelectInput } from './modal-shell';
import { Globe } from 'lucide-react';

export function NewProjectModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Project Name</FieldLabel>
        <TextInput placeholder="e.g. Acme Corp SEO" defaultValue="" />
      </div>
      <div>
        <FieldLabel>Website URL</FieldLabel>
        <div className="relative mt-1">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <TextInput placeholder="https://example.com" className="pl-9" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Industry</FieldLabel>
          <SelectInput defaultValue="">
            <option value="">Select…</option>
            <option>SaaS</option>
            <option>E-commerce</option>
            <option>Finance</option>
            <option>Health</option>
            <option>Education</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel>Target Country</FieldLabel>
          <SelectInput defaultValue="">
            <option value="">Select…</option>
            <option>United States</option>
            <option>United Kingdom</option>
            <option>Germany</option>
            <option>India</option>
          </SelectInput>
        </div>
      </div>
      <div>
        <FieldLabel>Tracking Keywords (comma separated)</FieldLabel>
        <TextInput placeholder="seo audit, keyword research, backlink checker" />
      </div>
      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>Create Project</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
