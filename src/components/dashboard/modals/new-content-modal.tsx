import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, TextInput, SelectInput, TextArea } from './modal-shell';

export function NewContentModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Content Title</FieldLabel>
        <TextInput placeholder="e.g. The Complete Guide to Technical SEO" />
      </div>
      <div>
        <FieldLabel>URL Slug</FieldLabel>
        <TextInput placeholder="/blog/technical-seo-guide" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Content Type</FieldLabel>
          <SelectInput defaultValue="blog">
            <option value="blog">Blog Post</option>
            <option value="landing">Landing Page</option>
            <option value="tool">Tool Page</option>
            <option value="guide">Guide</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel>Status</FieldLabel>
          <SelectInput defaultValue="draft">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="needs-update">Needs Update</option>
          </SelectInput>
        </div>
      </div>
      <div>
        <FieldLabel>Primary Keyword</FieldLabel>
        <TextInput placeholder="e.g. technical seo" />
      </div>
      <div>
        <FieldLabel>Target Keywords (comma separated)</FieldLabel>
        <TextInput placeholder="technical seo, seo checklist, site audit" />
      </div>
      <div>
        <FieldLabel>Meta Description</FieldLabel>
        <TextArea placeholder="A brief description for search engines…" rows={2} />
      </div>
      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>Create Content</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
