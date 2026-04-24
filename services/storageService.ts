import { DocumentData, SavedInvoiceRecord } from '../types';

const STORAGE_KEY = 'brandsync_saved_invoices_v1';

const isBrowser = () => typeof window !== 'undefined';

const readSavedInvoices = (): SavedInvoiceRecord[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SavedInvoiceRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSavedInvoices = (records: SavedInvoiceRecord[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const listSavedInvoices = () => readSavedInvoices();

export const saveInvoiceRecord = (data: DocumentData) => {
  const id = data.id || `inv_${Date.now()}`;
  const record: SavedInvoiceRecord = {
    id,
    savedAt: new Date().toISOString(),
    data: {
      ...data,
      id,
    },
  };

  const existing = readSavedInvoices().filter((entry) => entry.id !== id);
  writeSavedInvoices([record, ...existing]);

  return record;
};

export const deleteInvoiceRecord = (id: string) => {
  const existing = readSavedInvoices().filter((entry) => entry.id !== id);
  writeSavedInvoices(existing);
};
