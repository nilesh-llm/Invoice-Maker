
export type DocumentType = 'QUOTATION' | 'INVOICE';
export type CompanyId = 'morr' | 'tumeng-bi' | 'house-of-healing';

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
  theme: BrandingTheme;
}
