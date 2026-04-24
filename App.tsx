import React, { useEffect, useMemo, useRef, useState } from 'react';
import { generateDocumentData } from './services/geminiService';
import { CompanyId, DocumentData, DocumentType, InvoiceTemplateId, SavedInvoiceRecord } from './types';
import InvoiceTemplate from './components/InvoiceTemplate';
import { COMPANY_PROFILES, getCompanyProfile } from './companyProfiles';
import { deleteInvoiceRecord, listSavedInvoices, saveInvoiceRecord } from './services/storageService';
import {
  exportElementToImage,
  exportElementToPdf,
  exportElementToWord,
  sanitizeFileName,
} from './services/exportService';

const TEMPLATE_OPTIONS: Array<{ id: InvoiceTemplateId; label: string; description: string }> = [
  { id: 'standard', label: 'Standard', description: 'Clean business layout for most invoices.' },
  { id: 'spreadsheet', label: 'Spreadsheet', description: 'Heavier table layout for itemized billing.' },
  { id: 'continental', label: 'Continental', description: 'Bold branded header with presentation feel.' },
  { id: 'compact', label: 'Compact', description: 'Condensed format for short invoices and quotes.' },
];

const createBaseName = (data?: DocumentData | null, fallbackType?: DocumentType) =>
  sanitizeFileName(`${data?.type || fallbackType || 'INVOICE'}_${data?.docNumber || 'draft'}`);

const recalculateDocumentTotals = (data: DocumentData): DocumentData => {
  const items = data.items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return {
      ...item,
      quantity,
      unitPrice,
      total: Number((quantity * unitPrice).toFixed(2)),
    };
  });

  const subtotal = Number(items.reduce((sum, item) => sum + item.total, 0).toFixed(2));
  const taxRate = Number(data.taxRate) || 0;
  const shipping = Number(data.shipping) || 0;
  const tax = Number(((subtotal * taxRate) / 100).toFixed(2));
  const total = Number((subtotal + tax + shipping).toFixed(2));

  return {
    ...data,
    items,
    subtotal,
    taxRate,
    shipping,
    tax,
    total,
  };
};

const updateDraftField = (data: DocumentData, field: keyof DocumentData, value: string | number) => {
  const next = {
    ...data,
    [field]: value,
  } as DocumentData;

  return recalculateDocumentTotals(next);
};

const updateDraftItem = (
  data: DocumentData,
  index: number,
  field: 'description' | 'quantity' | 'unitPrice',
  value: string
) => {
  const items = data.items.map((item, itemIndex) =>
    itemIndex === index
      ? {
          ...item,
          [field]: field === 'description' ? value : Number(value) || 0,
        }
      : item
  );

  return recalculateDocumentTotals({
    ...data,
    items,
  });
};

const addDraftItem = (data: DocumentData) =>
  recalculateDocumentTotals({
    ...data,
    items: [...data.items, { description: 'New item', quantity: 1, unitPrice: 0, total: 0 }],
  });

const removeDraftItem = (data: DocumentData, index: number) =>
  recalculateDocumentTotals({
    ...data,
    items: data.items.filter((_, itemIndex) => itemIndex !== index),
  });

const ExportMenu: React.FC<{
  onPdf: () => void;
  onWord: () => void;
  onImage: () => void;
  disabled?: boolean;
  busy?: 'PDF' | 'IMAGE' | 'WORD' | null;
}> = ({ onPdf, onWord, onImage, disabled, busy }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (busy) setOpen(false);
  }, [busy]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        disabled={disabled || Boolean(busy)}
        className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Exporting...' : 'Export'}
      </button>
      {open && !disabled && !busy && (
        <div className="absolute right-0 z-[60] mt-2 w-44 rounded-2xl border border-slate-100 bg-white py-2 shadow-2xl">
          <button onClick={onPdf} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">PDF</button>
          <button onClick={onWord} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Word</button>
          <button onClick={onImage} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Image</button>
        </div>
      )}
    </div>
  );
};

const DraftEditor: React.FC<{
  draft: DocumentData;
  isEditing: boolean;
  setDraft: React.Dispatch<React.SetStateAction<DocumentData | null>>;
}> = ({ draft, isEditing, setDraft }) => {
  const disabledClass = isEditing ? '' : 'pointer-events-none opacity-70';

  return (
    <div className={`space-y-5 ${disabledClass}`}>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-semibold text-slate-700">
          Client Name
          <input
            value={draft.clientName}
            onChange={(e) => setDraft((current) => current ? updateDraftField(current, 'clientName', e.target.value) : current)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Client Email
          <input
            value={draft.clientEmail || ''}
            onChange={(e) => setDraft((current) => current ? updateDraftField(current, 'clientEmail', e.target.value) : current)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
      </div>

      <label className="text-sm font-semibold text-slate-700">
        Client Address
        <textarea
          rows={3}
          value={draft.clientAddress}
          onChange={(e) => setDraft((current) => current ? updateDraftField(current, 'clientAddress', e.target.value) : current)}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-semibold text-slate-700">
          Document No
          <input
            value={draft.docNumber}
            onChange={(e) => setDraft((current) => current ? updateDraftField(current, 'docNumber', e.target.value) : current)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Purchase Order
          <input
            value={draft.purchaseOrder || ''}
            onChange={(e) => setDraft((current) => current ? updateDraftField(current, 'purchaseOrder', e.target.value) : current)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="text-sm font-semibold text-slate-700">
          Date
          <input
            value={draft.date}
            onChange={(e) => setDraft((current) => current ? updateDraftField(current, 'date', e.target.value) : current)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Due Date
          <input
            value={draft.dueDate}
            onChange={(e) => setDraft((current) => current ? updateDraftField(current, 'dueDate', e.target.value) : current)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Tax Rate %
          <input
            type="number"
            value={draft.taxRate || 0}
            onChange={(e) => setDraft((current) => current ? updateDraftField(current, 'taxRate', Number(e.target.value) || 0) : current)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-semibold text-slate-700">
          Shipping
          <input
            type="number"
            value={draft.shipping || 0}
            onChange={(e) => setDraft((current) => current ? updateDraftField(current, 'shipping', Number(e.target.value) || 0) : current)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Template
          <select
            value={draft.templateId || 'standard'}
            onChange={(e) => setDraft((current) => current ? updateDraftField(current, 'templateId', e.target.value as InvoiceTemplateId) : current)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          >
            {TEMPLATE_OPTIONS.map((template) => (
              <option key={template.id} value={template.id}>{template.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="text-sm font-semibold text-slate-700">
        Terms and Notes
        <textarea
          rows={4}
          value={draft.notes}
          onChange={(e) => setDraft((current) => current ? updateDraftField(current, 'notes', e.target.value) : current)}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
        />
      </label>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Line Items</h3>
          <button
            type="button"
            onClick={() => setDraft((current) => current ? addDraftItem(current) : current)}
            className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600"
          >
            Add item
          </button>
        </div>
        <div className="space-y-3">
          {draft.items.map((item, index) => (
            <div key={`${draft.docNumber}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-12 gap-3">
                <label className="col-span-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                  <input
                    value={item.description}
                    onChange={(e) => setDraft((current) => current ? updateDraftItem(current, index, 'description', e.target.value) : current)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
                <label className="col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Qty
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => setDraft((current) => current ? updateDraftItem(current, index, 'quantity', e.target.value) : current)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
                <label className="col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Price
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => setDraft((current) => current ? updateDraftItem(current, index, 'unitPrice', e.target.value) : current)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
                <div className="col-span-2 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => setDraft((current) => current ? removeDraftItem(current, index) : current)}
                    disabled={draft.items.length === 1}
                    className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<SavedInvoiceRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'PDF' | 'IMAGE' | 'WORD' | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecords(listSavedInvoices());
  }, []);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedId) || records[0] || null,
    [records, selectedId]
  );

  useEffect(() => {
    if (!selectedId && records[0]) {
      setSelectedId(records[0].id);
    }
  }, [records, selectedId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin1234') {
      setIsAuthed(true);
      setError(null);
      return;
    }
    setError('Invalid admin username or password.');
  };

  const runExport = async (type: 'PDF' | 'IMAGE' | 'WORD', action: () => Promise<void>) => {
    setExporting(type);
    setError(null);
    try {
      await action();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Export failed: ${message}`);
    } finally {
      setExporting(null);
    }
  };

  const handleDelete = (id: string) => {
    deleteInvoiceRecord(id);
    const nextRecords = listSavedInvoices();
    setRecords(nextRecords);
    if (selectedId === id) {
      setSelectedId(nextRecords[0]?.id || null);
    }
  };

  if (!isAuthed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <form onSubmit={handleLogin} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <div className="text-sm font-bold uppercase tracking-[0.24em] text-indigo-600">/admin</div>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Admin Access</h1>
            <p className="mt-2 text-sm text-slate-500">Saved invoices are stored locally in the deployed browser environment for Replit-safe access.</p>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </label>
          </div>
          {error && <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <button type="submit" className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-4 font-bold text-white">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.24em] text-indigo-600">BrandSync Admin</div>
            <h1 className="text-2xl font-black text-slate-900">Saved Invoices</h1>
          </div>
          <a href="/" className="rounded-full bg-slate-100 px-5 py-2 font-semibold text-slate-700">Back to App</a>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[320px,1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Archive</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-500">{records.length} saved</span>
          </div>
          <div className="space-y-3">
            {records.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                No saved invoices yet. Save one from the main screen first.
              </div>
            )}
            {records.map((record) => (
              <button
                key={record.id}
                onClick={() => setSelectedId(record.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  selectedRecord?.id === record.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{record.data.type}</div>
                <div className="mt-1 text-sm font-bold text-slate-900">{record.data.docNumber}</div>
                <div className="mt-1 text-sm text-slate-600">{record.data.clientName}</div>
                <div className="mt-2 text-xs text-slate-400">{new Date(record.savedAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-5">
          {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {selectedRecord ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">{selectedRecord.data.type}</div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedRecord.data.docNumber}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleDelete(selectedRecord.id)}
                    className="rounded-full border border-red-200 bg-white px-5 py-2 font-semibold text-red-600"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="rounded-full bg-slate-100 px-5 py-2 font-semibold text-slate-700"
                  >
                    Print
                  </button>
                  <ExportMenu
                    onPdf={() => runExport('PDF', async () => previewRef.current && exportElementToPdf(previewRef.current, createBaseName(selectedRecord.data)))}
                    onWord={() => runExport('WORD', async () => previewRef.current && exportElementToWord(previewRef.current, createBaseName(selectedRecord.data)))}
                    onImage={() => runExport('IMAGE', async () => previewRef.current && exportElementToImage(previewRef.current, createBaseName(selectedRecord.data)))}
                    busy={exporting}
                  />
                </div>
              </div>
              <div ref={previewRef}>
                <InvoiceTemplate data={selectedRecord.data} />
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
              Select a saved invoice from the left to preview and export it.
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  const [companyId, setCompanyId] = useState<CompanyId>('morr');
  const [prompt, setPrompt] = useState('');
  const [docType, setDocType] = useState<DocumentType>('INVOICE');
  const [templateId, setTemplateId] = useState<InvoiceTemplateId>('standard');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<DocumentData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savedRecords, setSavedRecords] = useState<SavedInvoiceRecord[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'PDF' | 'IMAGE' | 'WORD' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedRecords(listSavedInvoices());
  }, []);

  const selectedCompany = getCompanyProfile(companyId);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please provide the context and line items for the document.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await generateDocumentData(docType, selectedCompany, prompt);
      setDraft(
        recalculateDocumentTotals({
          ...data,
          templateId,
        })
      );
      setSavedId(null);
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!draft) return;
    const record = saveInvoiceRecord(draft);
    setDraft(record.data);
    setSavedId(record.id);
    setSavedRecords(listSavedInvoices());
    setIsEditing(false);
  };

  const runExport = async (type: 'PDF' | 'IMAGE' | 'WORD', action: () => Promise<void>) => {
    setExporting(type);
    setError(null);
    try {
      await action();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Export failed: ${message}`);
    } finally {
      setExporting(null);
    }
  };

  if (isAdminRoute) {
    return <AdminPage />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md no-print">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-black text-slate-800">BrandSync Pro</div>
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Preview, edit, save, export</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a href="/admin/" className="rounded-full bg-slate-100 px-5 py-2 font-semibold text-slate-700">Admin</a>
          {draft && (
            <>
              <button
                onClick={() => setIsEditing((current) => !current)}
                className="rounded-full bg-white px-5 py-2 font-semibold text-slate-700 ring-1 ring-slate-200"
              >
                {isEditing ? 'Close Edit' : 'Edit'}
              </button>
              <button
                onClick={handleSave}
                className="rounded-full bg-indigo-600 px-5 py-2 font-semibold text-white shadow-lg shadow-indigo-100"
              >
                Save
              </button>
              <button
                onClick={() => window.print()}
                disabled={!savedId}
                className="rounded-full bg-slate-100 px-5 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Print
              </button>
              <ExportMenu
                onPdf={() => runExport('PDF', async () => printRef.current && exportElementToPdf(printRef.current, createBaseName(draft, docType)))}
                onWord={() => runExport('WORD', async () => printRef.current && exportElementToWord(printRef.current, createBaseName(draft, docType)))}
                onImage={() => runExport('IMAGE', async () => printRef.current && exportElementToImage(printRef.current, createBaseName(draft, docType)))}
                disabled={!savedId}
                busy={exporting}
              />
            </>
          )}
        </div>
      </nav>

      <main className="flex flex-grow flex-col gap-8 p-6 lg:flex-row">
        <div className="space-y-6 no-print lg:w-[380px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800">Invoice Controls</h2>
              <p className="mt-1 text-sm text-slate-500">Choose the company, add the description, pick the template, then preview the invoice before saving it.</p>
            </div>

            <form onSubmit={handlePreview} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Document Type</label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setDocType('INVOICE')}
                    className={`rounded-lg py-2 text-sm font-semibold transition-all ${docType === 'INVOICE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType('QUOTATION')}
                    className={`rounded-lg py-2 text-sm font-semibold transition-all ${docType === 'QUOTATION' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Quotation
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Company Name</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value as CompanyId)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  {COMPANY_PROFILES.map((company) => (
                    <option key={company.id} value={company.id}>{company.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Create an invoice for the client, include items, rates, due date and any payment terms."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">Select Invoice Template</label>
                <div className="grid gap-3">
                  {TEMPLATE_OPTIONS.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setTemplateId(template.id)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        templateId === template.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-800">{template.label}</div>
                      <div className="mt-1 text-sm text-slate-500">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-6 py-4 font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Preparing preview...' : 'Preview'}
              </button>
            </form>
          </div>

          {draft && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Editable Draft</h2>
                  <p className="text-sm text-slate-500">Use the Edit button above to unlock these fields, then Save when the invoice is ready.</p>
                </div>
                {savedId && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-600">Saved</span>}
              </div>
              <DraftEditor draft={draft} isEditing={isEditing} setDraft={setDraft} />
            </div>
          )}
        </div>

        <div className="flex min-h-[800px] flex-1 flex-col items-center justify-start py-8">
          {!draft && !loading && (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-slate-800">Ready to preview</h3>
              <p className="max-w-sm text-slate-500">Generate a preview from the left, then edit the invoice details before saving it for print and export.</p>
            </div>
          )}

          {loading && (
            <div className="w-full max-w-[900px] animate-pulse space-y-8 rounded-3xl bg-white p-12">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="h-8 w-48 rounded-lg bg-slate-100" />
                  <div className="h-4 w-32 rounded-lg bg-slate-50" />
                </div>
                <div className="h-12 w-32 rounded-lg bg-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="h-24 rounded-xl bg-slate-50" />
                <div className="h-24 rounded-xl bg-slate-50" />
              </div>
              <div className="h-64 rounded-xl bg-slate-50" />
            </div>
          )}

          {draft && !loading && (
            <div className="w-full fade-in" ref={printRef}>
              <InvoiceTemplate data={draft} />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-8 no-print">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-400 md:flex-row">
          <p>© {new Date().getFullYear()} BrandSync Quote & Invoice Pro. Saved drafts in this deployment: {savedRecords.length}</p>
          <div className="flex items-center gap-6">
            <a href="/admin/" className="transition-colors hover:text-indigo-600">Admin dashboard</a>
            <span>{selectedCompany.label}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
