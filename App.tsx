
import React, { useState, useRef } from 'react';
import { generateDocumentData } from './services/geminiService';
import { CompanyId, DocumentData, DocumentType } from './types';
import InvoiceTemplate from './components/InvoiceTemplate';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { COMPANY_PROFILES, getCompanyProfile } from './companyProfiles';

const App: React.FC = () => {
  const [companyId, setCompanyId] = useState<CompanyId>('morr');
  const [prompt, setPrompt] = useState('');
  const [docType, setDocType] = useState<DocumentType>('INVOICE');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError("Please provide the context and line items for the document.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await generateDocumentData(docType, getCompanyProfile(companyId), prompt);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToPDF = async () => {
    if (!printRef.current) return;
    const element = printRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${result?.type}_${result?.docNumber}.pdf`);
    setShowExportMenu(false);
  };

  const exportToJPG = async () => {
    if (!printRef.current) return;
    const element = printRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const link = document.createElement('a');
    link.download = `${result?.type}_${result?.docNumber}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
    setShowExportMenu(false);
  };

  const exportToWord = () => {
    if (!printRef.current) return;
    const html = printRef.current.innerHTML;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Export HTML to Word</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + html + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${result?.type}_${result?.docNumber}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
    setShowExportMenu(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation / Header */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 no-print flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">BrandSync <span className="text-indigo-600">Pro</span></span>
        </div>
        
        {result && (
          <div className="relative">
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-full font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-semibold transition-all shadow-lg hover:shadow-indigo-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export As
                  <svg className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-[60]">
                    <button onClick={exportToPDF} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-3">
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/></svg>
                      PDF Document
                    </button>
                    <button onClick={exportToJPG} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-3">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                      Image (JPG)
                    </button>
                    <button onClick={exportToWord} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-3">
                      <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                      Word (.doc)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow flex flex-col lg:flex-row p-6 gap-8">
        {/* Sidebar Input */}
        <div className="lg:w-1/3 space-y-6 no-print">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Generator Controls
            </h2>
            
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Document Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDocType('INVOICE')}
                    className={`py-2 text-sm font-medium rounded-md transition-all ${docType === 'INVOICE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType('QUOTATION')}
                    className={`py-2 text-sm font-medium rounded-md transition-all ${docType === 'QUOTATION' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Quotation
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Company</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value as CompanyId)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                >
                  {COMPANY_PROFILES.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">The selected company controls sender details, branding, and document layout.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Context & Items</label>
                <textarea
                  rows={6}
                  placeholder="e.g., Create an invoice for John Doe at TechSpark. Include 10 hours of consulting at $150/hr and a design system setup for $2000."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Branding...
                  </>
                ) : (
                  <>
                    Generate {docType.toLowerCase()}
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-xl">
            <h3 className="font-bold text-lg mb-2">Pro Tip</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Include client details and itemized costs in your prompt for the most accurate generation. The selected company will apply its own sender details and document style.
            </p>
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="lg:w-2/3 min-h-[800px] flex flex-col items-center justify-start py-8">
          {!result && !loading && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Ready to create?</h3>
              <p className="text-slate-500 max-w-sm">Enter your details on the left to generate a stunning, brand-aligned document.</p>
            </div>
          )}

          {loading && (
            <div className="w-full max-w-[800px] bg-white p-12 rounded-3xl animate-pulse space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="h-8 w-48 bg-slate-100 rounded-lg"></div>
                  <div className="h-4 w-32 bg-slate-50 rounded-lg"></div>
                </div>
                <div className="h-12 w-32 bg-slate-100 rounded-lg"></div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="h-24 bg-slate-50 rounded-xl"></div>
                <div className="h-24 bg-slate-50 rounded-xl"></div>
              </div>
              <div className="h-64 bg-slate-50 rounded-xl"></div>
              <div className="flex justify-end">
                <div className="h-32 w-64 bg-slate-50 rounded-xl"></div>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="w-full fade-in" ref={printRef}>
              <InvoiceTemplate data={result} />
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 px-6 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-400 text-sm gap-4">
          <p>© {new Date().getFullYear()} BrandSync Quote & Invoice Pro. Powered by Gemini Flash.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
