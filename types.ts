
export type DocumentType = 'QUOTATION' | 'INVOICE';
export type CompanyId = 'morr' | 'tumeng-bi' | 'house-of-healing';
export type InvoiceTemplateId = 'standard' | 'spreadsheet' | 'continental' | 'compact';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BrandingTheme {
  companyId?: CompanyId;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoPlaceholder: string;
  logoUrl?: string;
  orgName: string;
  orgTagline: string;
  orgAddress: string;
  orgEmail: string;
  orgPhone: string;
  ssmNumber?: string;
  sstNumber?: string;
  taxId?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  swiftCode?: string;
}

export interface DocumentData {
  id?: string;
  type: DocumentType;
  docNumber: string;
  currencySymbol: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientTaxId?: string;
  clientSsmNumber?: string;
  purchaseOrder?: string;
  items: LineItem[];
  subtotal: number;
  taxRate?: number;
  tax: number;
  shipping?: number;
  total: number;
  currencyCode: string;
  notes: string;
  templateId?: InvoiceTemplateId;
  theme: BrandingTheme;
}

export interface SavedInvoiceRecord {
  id: string;
  savedAt: string;
  data: DocumentData;
}
