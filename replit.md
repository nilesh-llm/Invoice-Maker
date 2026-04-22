# BrandSync Quote & Invoice Pro

An AI-powered web app for generating professional, brand-aligned invoices and quotations using Google's Gemini AI.

## Features

- **AI Generation**: Uses `@google/genai` (Gemini Flash) to process natural language prompts and generate structured document data.
- **Brand Customization**: Supports multiple company profiles with specific branding, logos, and sender details.
- **Export Options**: Print, PDF (jsPDF + html2canvas), JPEG, and Word (.doc) export.
- **Document Types**: Invoice and Quotation.

## Tech Stack

- React 19 + TypeScript
- Vite 6 (build tool)
- Tailwind CSS v4 (with `@tailwindcss/postcss`)
- Google Gemini AI (`@google/genai`)
- jsPDF + html2canvas (PDF/image export)

## Environment Variables

- `GEMINI_API_KEY` — Google Gemini API key (required for AI generation)

## Project Structure

- `index.html` — HTML entry point
- `index.tsx` — React entry point
- `App.tsx` — Main application component
- `index.css` — Tailwind CSS v4 styles + print styles
- `vite.config.ts` — Vite config (port 5000, host 0.0.0.0)
- `postcss.config.js` — PostCSS config using `@tailwindcss/postcss`
- `services/geminiService.ts` — Gemini AI integration
- `components/InvoiceTemplate.tsx` — Invoice/quotation render component
- `companyProfiles.ts` — Company branding data
- `types.ts` — TypeScript types

## Running Locally

The workflow `Start application` runs `npm run dev` on port 5000.
