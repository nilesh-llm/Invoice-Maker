import React from 'react';
import { DocumentData } from '../types';

interface Props {
  data: DocumentData;
}

const formatMoney = (value: number, currencyCode: string) =>
  `${value.toLocaleString()} ${currencyCode}`;

const LogoBlock: React.FC<{ data: DocumentData; className?: string }> = ({ data, className }) => {
  const { theme } = data;

  if (theme.logoUrl) {
    return (
      <img
        src={theme.logoUrl}
        alt={`${theme.orgName} logo`}
        className={className || 'w-full object-contain'}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className={className || 'text-lg font-black uppercase tracking-wide'}>
      {theme.logoPlaceholder || theme.orgName}
    </div>
  );
};

const Metadata: React.FC<{ data: DocumentData; light?: boolean }> = ({ data, light }) => {
  const labelClass = light ? 'text-white/60' : 'text-slate-400';
  const valueClass = light ? 'text-white' : 'text-slate-900';

  return (
    <div className="grid grid-cols-3 gap-6">
      {[
        ['Document No', data.docNumber],
        ['Date', data.date],
        ['Due Date', data.dueDate],
      ].map(([label, value]) => (
        <div key={label}>
          <div className={`text-[10px] font-bold uppercase tracking-widest ${labelClass}`}>{label}</div>
          <div className={`mt-2 text-sm font-semibold ${valueClass}`}>{value}</div>
        </div>
      ))}
    </div>
  );
};

const PartyDetails: React.FC<{ data: DocumentData; fromLabel?: string }> = ({ data, fromLabel = 'From' }) => {
  const { theme } = data;

  return (
    <div className="grid grid-cols-2 gap-10">
      <div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Billed To</div>
        <div className="text-base font-bold leading-tight">{data.clientName}</div>
        <div className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {data.clientSsmNumber && <div>{data.clientSsmNumber}</div>}
          {data.clientAddress}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{fromLabel}</div>
        <div className="text-base font-bold leading-tight">{theme.orgName}</div>
        {theme.orgTagline && <div className="mt-1 text-xs font-semibold text-slate-500">{theme.orgTagline}</div>}
        <div className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {theme.ssmNumber && <div className="font-semibold text-slate-700">Reg No: {theme.ssmNumber}</div>}
          {theme.orgAddress}
        </div>
      </div>
    </div>
  );
};

const Totals: React.FC<{ data: DocumentData; accentClass?: string }> = ({ data, accentClass = 'text-slate-900' }) => (
  <div className="space-y-3">
    <div className="flex justify-between text-sm">
      <span className="text-slate-400 uppercase tracking-widest text-[11px] font-bold">Subtotal</span>
      <span className="font-bold">{formatMoney(data.subtotal, data.currencyCode)}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-slate-400 uppercase tracking-widest text-[11px] font-bold">Tax ({data.taxRate || 0}%)</span>
      <span className="font-bold">{formatMoney(data.tax, data.currencyCode)}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-slate-400 uppercase tracking-widest text-[11px] font-bold">Shipping</span>
      <span className="font-bold">{formatMoney(data.shipping || 0, data.currencyCode)}</span>
    </div>
    <div className="pt-6 text-right">
      <div className="text-slate-400 uppercase tracking-widest text-[11px] font-bold mb-2">{data.type} Total</div>
      <div className={`text-4xl font-black tracking-tight ${accentClass}`}>{formatMoney(data.total, data.currencyCode)}</div>
    </div>
  </div>
);

const BankDetails: React.FC<{ data: DocumentData }> = ({ data }) => {
  const { theme } = data;

  if (!theme.bankName && !theme.bankAccountNumber) return null;

  return (
    <div>
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Bank Account Details</div>
      <div className="text-sm space-y-1 text-slate-600 leading-relaxed font-medium">
        <div className="font-bold text-slate-900">{theme.bankAccountName || theme.orgName}</div>
        {theme.bankName && <div>{theme.bankName}</div>}
        {theme.bankBranch && <div>Branch: {theme.bankBranch}</div>}
        {theme.bankAccountNumber && <div>Account No: {theme.bankAccountNumber}</div>}
        {theme.swiftCode && <div>SWIFT Code: {theme.swiftCode}</div>}
      </div>
    </div>
  );
};

const ItemsTable: React.FC<{ data: DocumentData; variant?: 'morr' | 'tumeng' | 'healing' }> = ({ data, variant = 'morr' }) => {
  const headerClass =
    variant === 'tumeng'
      ? 'bg-teal-600 text-white rounded-xl px-5'
      : variant === 'healing'
        ? 'border-y border-[#d7c6ad] text-[#7b6041]'
        : 'border-y border-slate-200 text-slate-400';

  return (
    <div>
      <div className={`grid grid-cols-12 py-4 mb-6 ${headerClass}`}>
        <div className="col-span-6 text-[11px] font-bold uppercase tracking-widest">Description</div>
        <div className="col-span-2 text-[11px] font-bold uppercase tracking-widest text-right">Unit Cost</div>
        <div className="col-span-2 text-[11px] font-bold uppercase tracking-widest text-center">Qty</div>
        <div className="col-span-2 text-[11px] font-bold uppercase tracking-widest text-right">Amount</div>
      </div>
      <div className="space-y-6">
        {data.items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 items-start">
            <div className="col-span-6 text-sm font-medium leading-relaxed pr-10">{item.description}</div>
            <div className="col-span-2 text-sm text-right font-medium">{item.unitPrice.toLocaleString()}</div>
            <div className="col-span-2 text-sm text-center font-medium">{item.quantity}</div>
            <div className="col-span-2 text-sm text-right font-bold">{item.total.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MorrTemplate: React.FC<Props> = ({ data }) => {
  const { theme } = data;

  return (
    <div
      className="bg-white p-12 md:p-16 shadow-2xl rounded-sm border border-gray-100 mx-auto max-w-[900px] print-area text-slate-900"
      style={{ fontFamily: theme.fontFamily || "'Inter', sans-serif" }}
    >
      <div className="flex justify-between items-start mb-16 no-break">
        <h1 className="text-6xl font-black text-slate-400 tracking-tighter uppercase">{data.type}</h1>
        <div className="w-36 flex justify-end">
          <LogoBlock data={data} />
        </div>
      </div>
      <div className="mb-10"><Metadata data={data} /></div>
      <div className="grid grid-cols-3 gap-12 mb-16">
        <div className="col-span-2"><PartyDetails data={data} /></div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Purchase Order</div>
          <div className="text-sm font-medium">{data.purchaseOrder || '-'}</div>
        </div>
      </div>
      <div className="mb-12">
        <ItemsTable data={data} />
        <div className="border-b border-slate-200 w-full mt-10"></div>
      </div>
      <div className="flex justify-between items-start mb-24">
        <div className="max-w-[40%] space-y-10">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Terms</div>
            <div className="text-sm text-slate-700 leading-relaxed font-medium">{data.notes || 'Payment is due within 7 days'}</div>
          </div>
          <BankDetails data={data} />
        </div>
        <div className="w-[35%]"><Totals data={data} /></div>
      </div>
      <p className="text-center text-[10px] text-slate-300 font-medium italic">
        This is a computer-generated document and no signature is required.
      </p>
    </div>
  );
};

const TumengTemplate: React.FC<Props> = ({ data }) => {
  const { theme } = data;

  return (
    <div
      className="bg-white shadow-2xl rounded-sm border border-teal-100 mx-auto max-w-[900px] print-area text-slate-900 overflow-hidden"
      style={{ fontFamily: theme.fontFamily || "'Inter', sans-serif" }}
    >
      <div className="bg-teal-600 text-white px-12 py-10">
        <div className="flex items-center justify-between gap-10">
          <div>
            <div className="text-sm font-bold tracking-[0.35em] uppercase text-white/70">{data.type}</div>
            <h1 className="mt-4 text-5xl font-black tracking-tight">{theme.orgName}</h1>
            <div className="mt-3 text-sm font-semibold text-white/80">Reg No: {theme.ssmNumber}</div>
          </div>
          <div className="w-52 shrink-0 bg-white/10 border border-white/30 p-3">
            <LogoBlock data={data} className="w-full object-contain" />
          </div>
        </div>
        <div className="mt-10"><Metadata data={data} light /></div>
      </div>

      <div className="px-12 py-12">
        <div className="mb-12"><PartyDetails data={data} fromLabel="Issued By" /></div>
        <div className="mb-12"><ItemsTable data={data} variant="tumeng" /></div>
        <div className="grid grid-cols-2 gap-12 items-start border-t border-teal-100 pt-10">
          <div className="space-y-10">
            <div>
              <div className="text-[11px] font-bold text-teal-700 uppercase tracking-widest mb-3">Payment Terms</div>
              <div className="text-sm text-slate-700 leading-relaxed font-medium">{data.notes || 'Payment is due within 7 days'}</div>
            </div>
            <BankDetails data={data} />
          </div>
          <Totals data={data} accentClass="text-teal-700" />
        </div>
        <p className="mt-16 text-center text-[10px] text-slate-300 font-medium italic">
          This is a computer-generated document and no signature is required.
        </p>
      </div>
    </div>
  );
};

const HouseOfHealingTemplate: React.FC<Props> = ({ data }) => {
  const { theme } = data;

  return (
    <div
      className="bg-[#fffaf3] shadow-2xl rounded-sm border border-[#eadcc8] mx-auto max-w-[900px] print-area text-[#2f332d]"
      style={{ fontFamily: theme.fontFamily || "'Inter', sans-serif" }}
    >
      <div className="p-12 md:p-16">
        <div className="border-b border-[#d7c6ad] pb-10 mb-10">
          <div className="flex items-start justify-between gap-12">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.4em] text-[#c08f57]">{data.type}</div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-[#365f52]">{theme.orgName}</h1>
              <div className="mt-2 text-sm font-semibold text-[#7b6041]">{theme.orgTagline}</div>
              <div className="mt-4 text-xs font-bold text-[#7b6041]">Reg No: {theme.ssmNumber}</div>
            </div>
            <div className="w-56 border border-[#d7c6ad] bg-white p-3">
              <LogoBlock data={data} className="w-full object-contain" />
            </div>
          </div>
          <div className="mt-10"><Metadata data={data} /></div>
        </div>

        <div className="mb-12"><PartyDetails data={data} fromLabel="Care Provider" /></div>
        <div className="mb-12"><ItemsTable data={data} variant="healing" /></div>

        <div className="grid grid-cols-5 gap-12 border-t border-[#d7c6ad] pt-10">
          <div className="col-span-3 space-y-10">
            <div>
              <div className="text-[11px] font-bold text-[#7b6041] uppercase tracking-widest mb-3">Notes</div>
              <div className="text-sm text-[#4d554b] leading-relaxed font-medium">{data.notes || 'Payment is due within 7 days'}</div>
            </div>
            <BankDetails data={data} />
          </div>
          <div className="col-span-2 bg-white/70 border border-[#eadcc8] p-6">
            <Totals data={data} accentClass="text-[#365f52]" />
          </div>
        </div>

        <p className="mt-16 text-center text-[10px] text-[#b8a98f] font-medium italic">
          This is a computer-generated document and no signature is required.
        </p>
      </div>
    </div>
  );
};

const InvoiceTemplate: React.FC<Props> = ({ data }) => {
  if (data.theme.companyId === 'tumeng-bi') return <TumengTemplate data={data} />;
  if (data.theme.companyId === 'house-of-healing') return <HouseOfHealingTemplate data={data} />;
  return <MorrTemplate data={data} />;
};

export default InvoiceTemplate;
