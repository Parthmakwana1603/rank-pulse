import { createContext, useContext, useState, useCallback } from 'react';
import { ModalShell, type ModalName } from './modal-shell';
import { NewProjectModal } from './new-project-modal';
import { ImportProjectModal } from './import-project-modal';
import { ProjectDetailModal } from './project-detail-modal';
import { AddKeywordModal } from './add-keyword-modal';
import { KeywordDetailModal } from './keyword-detail-modal';
import { RunAuditModal } from './run-audit-modal';
import { AuditIssueModal } from './audit-issue-modal';
import { AddBacklinkModal } from './add-backlink-modal';
import { AddCompetitorModal } from './add-competitor-modal';
import { NewContentModal } from './new-content-modal';
import { ContentDetailModal } from './content-detail-modal';
import { GenerateReportModal } from './generate-report-modal';
import { ExportPdfModal } from './export-pdf-modal';

interface ModalContextValue {
  open: (name: ModalName, payload?: unknown) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ModalName | null>(null);
  const [payload, setPayload] = useState<unknown>(null);

  const open = useCallback((name: ModalName, p?: unknown) => {
    setPayload(p ?? null);
    setActive(name);
  }, []);

  const close = useCallback(() => {
    setActive(null);
    setPayload(null);
  }, []);

  const renderModal = () => {
    if (!active) return null;
    return (
      <ModalShell name={active} onClose={close}>
        {active === 'new-project' && <NewProjectModal onClose={close} />}
        {active === 'import-project' && <ImportProjectModal onClose={close} />}
        {active === 'project-detail' && (
          <ProjectDetailModal onClose={close} project={payload as string} />
        )}
        {active === 'add-keyword' && <AddKeywordModal onClose={close} />}
        {active === 'keyword-detail' && (
          <KeywordDetailModal onClose={close} keyword={payload as string} />
        )}
        {active === 'run-audit' && <RunAuditModal onClose={close} />}
        {active === 'audit-issue' && (
          <AuditIssueModal onClose={close} issueTitle={payload as string} />
        )}
        {active === 'add-backlink' && <AddBacklinkModal onClose={close} />}
        {active === 'add-competitor' && <AddCompetitorModal onClose={close} />}
        {active === 'new-content' && <NewContentModal onClose={close} />}
        {active === 'content-detail' && (
          <ContentDetailModal onClose={close} title={payload as string} />
        )}
        {active === 'generate-report' && <GenerateReportModal onClose={close} />}
        {active === 'export-pdf' && <ExportPdfModal onClose={close} />}
      </ModalShell>
    );
  };

  return (
    <ModalContext.Provider value={{ open, close }}>
      {children}
      {renderModal()}
    </ModalContext.Provider>
  );
}
