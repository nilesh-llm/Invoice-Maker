import React from 'react';
import { DocumentData, InvoiceTemplateId } from '../types';

interface Props {
  data: DocumentData;
}

const formatMoney = (value: number, currencyCode: string) =>
  `${currencyCode} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getTemplateId = (data: DocumentData): InvoiceTemplateId => data.templateId || 'standard';

const LogoBlock: React.FC<{ data: DocumentData; className?: string }> = ({ data, className }) => {
  const { theme } = data;
  const isMorrLogo = theme.logoUrl === '/logo.png';

  if (theme.logoUrl) {
    return (
      <img
        src={theme.logoUrl}
        alt={`${theme.orgName} logo`}
        className={className || 'w-full object-contain'}
        referrerPolicy="no-referrer"
        style={isMorrLogo ? { mixBlendMode: 'multiply' } : undefined}
      />
    );
  }

  return (
    <div className={className || 'text-lg font-black uppercase tracking-wide'}>
      {theme.logoPlaceholder || theme.orgName}
    </div>
  );
};

const Metadata: React.FC<{ data: DocumentData; mutedClass?: string; valueClass?: string }> = ({
  data,
  mutedClass = 'text-slate-500',
  valueClass = 'text-slate-900',
}) => (
  <div className="grid grid-cols-3 gap-4 md:gap-6">
    {[
      [data.type === 'INVOICE' ? 'Invoice No' : 'Quotation No', data.docNumber],
      ['Date', data.date],
      ['Due Date', data.dueDate],
    ].map(([label, value]) => (
      <div key={label}>
        <div className={`text-[10px] font-bold uppercase tracking-[0.24em] ${mutedClass}`}>{label}</div>
        <div className={`mt-1.5 text-[13px] font-semibold ${valueClass}`}>{value}</div>
      </div>
    ))}
  </div>
);

const PartyDetails: React.FC<{ data: DocumentData; labelClass?: string; bodyClass?: string }> = ({
  data,
  labelClass = 'text-slate-500',
  bodyClass = 'text-slate-600',
}) => {
  const { theme } = data;

  return (
    <div className="grid grid-cols-2 gap-8 md:gap-10">
      <div>
        <div className={`mb-2 text-[10px] font-bold uppercase tracking-[0.24em] ${labelClass}`}>Invoice To</div>
        <div className="text-[15px] font-bold leading-snug text-slate-900">{data.clientName}</div>
        <div className={`mt-2 space-y-1 text-[13px] leading-relaxed whitespace-pre-line ${bodyClass}`}>
          {data.clientSsmNumber && <div>{data.clientSsmNumber}</div>}
          {data.clientAddress}
        </div>
      </div>
      <div>
        <div className={`mb-2 text-[10px] font-bold uppercase tracking-[0.24em] ${labelClass}`}>From</div>
        <div className="text-[15px] font-bold leading-snug text-slate-900">{theme.orgName}</div>
        <div className={`mt-2 space-y-1 text-[13px] leading-relaxed whitespace-pre-line ${bodyClass}`}>
          {theme.orgAddress}
          {theme.ssmNumber && <div className="font-medium text-slate-700">Reg No: {theme.ssmNumber}</div>}
          {theme.orgTagline && <div>{theme.orgTagline}</div>}
        </div>
      </div>
    </div>
  );
};

const Totals: React.FC<{ data: DocumentData; accentColor?: string; cardClassName?: string }> = ({
  data,
  accentColor,
  cardClassName,
}) => (
  <div className={cardClassName || 'space-y-2.5'}>
    <div className="flex justify-between text-[13px]">
      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Subtotal</span>
      <span className="font-bold">{formatMoney(data.subtotal, data.currencyCode)}</span>
    </div>
    <div className="flex justify-between text-[13px]">
      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Tax ({data.taxRate || 0}%)</span>
      <span className="font-bold">{formatMoney(data.tax, data.currencyCode)}</span>
    </div>
    <div className="flex justify-between text-[13px]">
      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Shipping</span>
      <span className="font-bold">{formatMoney(data.shipping || 0, data.currencyCode)}</span>
    </div>
    <div className="mt-4 border-t border-slate-200 pt-4 text-right">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{data.type} Total</div>
      <div className="text-[22px] font-bold tracking-tight" style={{ color: accentColor || data.theme.primaryColor }}>
        {formatMoney(data.total, data.currencyCode)}
      </div>
    </div>
  </div>
);

const BankDetails: React.FC<{ data: DocumentData; titleClassName?: string; bodyClassName?: string }> = ({
  data,
  titleClassName = 'text-slate-500',
  bodyClassName = 'text-slate-600',
}) => {
  const { theme } = data;

  if (!theme.bankName && !theme.bankAccountNumber) return null;

  return (
    <div>
      <div className={`mb-3 text-[10px] font-bold uppercase tracking-[0.24em] ${titleClassName}`}>Bank Details</div>
      <div className={`space-y-1 text-[13px] font-medium leading-relaxed ${bodyClassName}`}>
        <div className="font-bold text-slate-900">{theme.bankAccountName || theme.orgName}</div>
        {theme.bankName && <div>{theme.bankName}</div>}
        {theme.bankBranch && <div>Branch: {theme.bankBranch}</div>}
        {theme.bankAccountNumber && <div>Account No: {theme.bankAccountNumber}</div>}
      </div>
    </div>
  );
};

const TermsAndCondition: React.FC<{ data: DocumentData; titleClassName?: string; bodyClassName?: string }> = ({
  data,
  titleClassName = 'text-slate-500',
  bodyClassName = 'text-slate-700',
}) => {
  const terms = data.notes?.trim();
  if (!terms) return null;

  return (
    <div>
      <div className={`mb-3 text-[10px] font-bold uppercase tracking-[0.24em] ${titleClassName}`}>Terms and Condition</div>
      <div className={`text-[13px] font-medium leading-relaxed whitespace-pre-line ${bodyClassName}`}>{terms}</div>
    </div>
  );
};

const ItemsTable: React.FC<{
  data: DocumentData;
  headerClassName?: string;
  rowBorderClassName?: string;
  headerStyle?: React.CSSProperties;
}> = ({
  data,
  headerClassName = 'border-y border-slate-200 text-slate-500',
  rowBorderClassName = 'border-slate-100',
  headerStyle,
}) => (
  <div>
    <div className={`grid grid-cols-12 py-3.5 mb-5 ${headerClassName}`} style={headerStyle}>
      <div className="col-span-6 text-[10px] font-bold uppercase tracking-[0.24em]">Description</div>
      <div className="col-span-2 text-right text-[10px] font-bold uppercase tracking-[0.24em]">Unit Price</div>
      <div className="col-span-2 text-center text-[10px] font-bold uppercase tracking-[0.24em]">Qty</div>
      <div className="col-span-2 text-right text-[10px] font-bold uppercase tracking-[0.24em]">Amount</div>
    </div>
    <div className="space-y-5">
      {data.items.map((item, idx) => (
        <div key={idx} className={`grid grid-cols-12 items-start border-b pb-4 last:border-b-0 last:pb-0 ${rowBorderClassName}`}>
          <div className="col-span-6 pr-8 text-[13px] font-medium leading-relaxed text-slate-800">{item.description}</div>
          <div className="col-span-2 text-right text-[13px] font-medium text-slate-700">
            {formatMoney(item.unitPrice, data.currencyCode)}
          </div>
          <div className="col-span-2 text-center text-[13px] font-medium text-slate-700">{item.quantity}</div>
          <div className="col-span-2 text-right text-[13px] font-bold text-slate-900">
            {formatMoney(item.total, data.currencyCode)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StandardTemplate: React.FC<Props> = ({ data }) => {
  const { theme } = data;

  return (
    <div
      className="mx-auto max-w-[900px] rounded-sm border border-gray-200 bg-white p-10 text-slate-900 shadow-2xl print-area md:p-12"
      style={{ fontFamily: theme.fontFamily || "'Inter', sans-serif" }}
    >
      <div className="mb-12 flex items-start justify-between gap-10 no-break">
        <div>
          <h1 className="mt-2 text-[34px] font-black uppercase tracking-tight text-slate-900">{data.type}</h1>
        </div>
        <div className="flex w-32 justify-end">
          <LogoBlock data={data} />
        </div>
      </div>

      <div className="mb-8">
        <Metadata data={data} />
      </div>

      <div className="mb-12 grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <PartyDetails data={data} />
        </div>
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Purchase Order</div>
          <div className="text-[13px] font-medium text-slate-700">{data.purchaseOrder || '-'}</div>
        </div>
      </div>

      <div className="mb-10">
        <ItemsTable data={data} />
      </div>

      <div className="mb-16 flex items-start justify-between gap-12">
        <div className="max-w-[44%] space-y-8">
          <TermsAndCondition data={data} />
          <BankDetails data={data} />
        </div>
        <div className="w-[36%] rounded-sm border border-slate-200 bg-slate-50 p-5">
          <Totals data={data} />
        </div>
      </div>

      <p className="text-center text-[10px] font-medium italic text-slate-400">
        This is a computer-generated document and no signature is required.
      </p>
    </div>
  );
};

const SpreadsheetTemplate: React.FC<Props> = ({ data }) => {
  const accent = data.theme.primaryColor;

  return (
    <div
      className="mx-auto max-w-[980px] border border-slate-200 bg-white shadow-2xl print-area"
      style={{ fontFamily: data.theme.fontFamily || "'Inter', sans-serif" }}
    >
      <div className="border-b border-slate-200 p-8">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900">{data.type}</h1>
          </div>
          <div className="w-28 shrink-0">
            <LogoBlock data={data} />
          </div>
        </div>
        <div className="mt-6">
          <Metadata data={data} />
        </div>
      </div>

      <div className="p-8">
        <div className="mb-8">
          <PartyDetails data={data} />
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <ItemsTable
            data={data}
            headerClassName="bg-slate-100 px-4 text-slate-600"
            rowBorderClassName="border-slate-200"
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,320px]">
          <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <TermsAndCondition data={data} />
            <BankDetails data={data} />
          </div>
          <div className="rounded-2xl bg-slate-50 p-5 shadow-sm">
            <Totals data={data} accentColor={accent} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ContinentalTemplate: React.FC<Props> = ({ data }) => {
  const accent = data.theme.primaryColor;

  return (
    <div
      className="mx-auto max-w-[900px] overflow-hidden rounded-sm border border-slate-200 bg-white text-slate-900 shadow-2xl print-area"
      style={{ fontFamily: data.theme.fontFamily || "'Inter', sans-serif" }}
    >
      <div className="px-10 py-8 text-white" style={{ backgroundColor: accent }}>
        <div className="flex items-center justify-between gap-10">
          <div>
            <h1 className="mt-3 text-[30px] font-black tracking-tight">{data.theme.orgName}</h1>
            <div className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/85">{data.theme.orgAddress}</div>
            {data.theme.ssmNumber && <div className="mt-2 text-[12px] font-semibold text-white/80">Reg No: {data.theme.ssmNumber}</div>}
          </div>
          <div className="w-44 shrink-0 border border-white/30 bg-white/10 p-3">
            <LogoBlock data={data} className="w-full object-contain" />
          </div>
        </div>
        <div className="mt-8">
          <Metadata data={data} mutedClass="text-white/65" valueClass="text-white" />
        </div>
      </div>

      <div className="px-10 py-10">
        <div className="mb-10">
          <PartyDetails data={data} labelClass="text-slate-500" bodyClass="text-slate-600" />
        </div>
        <div className="mb-10">
          <ItemsTable
            data={data}
            headerClassName="rounded-lg px-4 text-white"
            rowBorderClassName="border-slate-100"
            headerStyle={{ backgroundColor: accent }}
          />
        </div>
        <div className="grid grid-cols-2 items-start gap-10 border-t border-slate-200 pt-8">
          <div className="space-y-8">
            <TermsAndCondition data={data} titleClassName="text-slate-600" bodyClassName="text-slate-700" />
            <BankDetails data={data} titleClassName="text-slate-600" bodyClassName="text-slate-700" />
          </div>
          <div className="rounded-sm border bg-white p-5 shadow-sm" style={{ borderColor: accent }}>
            <Totals data={data} accentColor={accent} />
          </div>
        </div>
        <p className="mt-14 text-center text-[10px] font-medium italic text-slate-400">
          This is a computer-generated document and no signature is required.
        </p>
      </div>
    </div>
  );
};

const CompactTemplate: React.FC<Props> = ({ data }) => {
  const accent = data.theme.primaryColor;

  return (
    <div
      className="mx-auto max-w-[820px] rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-2xl print-area"
      style={{ fontFamily: data.theme.fontFamily || "'Inter', sans-serif" }}
    >
      <div className="mb-8 flex items-center justify-between gap-6">
        <div>
          <h1 className="mt-2 text-2xl font-black uppercase">{data.type}</h1>
          <div className="mt-2 text-sm text-slate-500">{data.docNumber}</div>
        </div>
        <div className="w-28">
          <LogoBlock data={data} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Bill To</div>
          <div className="mt-2 text-sm font-bold text-slate-900">{data.clientName}</div>
          <div className="mt-1 whitespace-pre-line text-sm text-slate-600">{data.clientAddress}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Dates</div>
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <div>Date: {data.date}</div>
            <div>Due: {data.dueDate}</div>
            <div>PO: {data.purchaseOrder || '-'}</div>
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200">
        <ItemsTable
          data={data}
          headerClassName="px-4 text-white"
          rowBorderClassName="border-slate-200"
          headerStyle={{ backgroundColor: accent }}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <TermsAndCondition data={data} />
          <BankDetails data={data} />
        </div>
        <div className="rounded-2xl border border-slate-200 p-5">
          <Totals data={data} accentColor={accent} />
        </div>
      </div>
    </div>
  );
};

const InvoiceTemplate: React.FC<Props> = ({ data }) => {
  const templateId = getTemplateId(data);

  if (templateId === 'spreadsheet') return <SpreadsheetTemplate data={data} />;
  if (templateId === 'continental') return <ContinentalTemplate data={data} />;
  if (templateId === 'compact') return <CompactTemplate data={data} />;
  return <StandardTemplate data={data} />;
};

export default InvoiceTemplate;
