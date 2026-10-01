import { createContext, useContext } from 'react';
import type { ModalName } from './modal-shell';

export interface ModalContextValue {
  open: (name: ModalName, payload?: unknown) => void;
  close: () => void;
}

// Kept apart from modal-provider.tsx so modals can open other modals without an import cycle.
export const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
