# BrandSync Quote & Invoice Pro

BrandSync Quote & Invoice Pro is a React + Vite web app for generating branded invoices and quotations with Google Gemini. Users choose a company profile, describe the job or order, preview an AI-generated document, edit the details, save it in the browser, and export it as PDF, image, or Word.

The project is configured for Replit preview and Replit deployment. Preview runs the Vite dev server. Deployment builds the app and serves the generated `dist` folder through `server.js`.

## Features

- Generate invoices and quotations from natural language prompts.
- Use multiple built-in issuer company profiles.
- Choose from several document templates.
- Edit client details, document numbers, dates, tax, shipping, notes, terms, and line items before saving.
- Save generated documents in browser `localStorage`.
- View saved documents from the admin dashboard at `/admin`.
- Export saved or previewed documents as PDF, image, or Word.
- Serve production builds with a small Node HTTP server that supports direct links such as `/admin`.

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Google Gemini via `@google/genai`
- `html2canvas` and `jspdf` for exports
- Node HTTP server for production/Replit deployment

## Project Structure

```text
.
├── App.tsx                         # Main React app and admin dashboard
├── index.tsx                       # React entry point
├── index.html                      # Main app HTML entry
├── admin/index.html                # Admin HTML entry for /admin
├── index.css                       # Tailwind and print styles
├── companyProfiles.ts              # Issuer company branding and bank details
├── components/InvoiceTemplate.tsx  # Rendered invoice/quotation template
├── services/geminiService.ts       # Gemini prompt and response handling
├── services/storageService.ts      # Browser localStorage persistence
├── services/exportService.ts       # PDF, image, and Word export helpers
├── types.ts                        # Shared TypeScript types
├── vite.config.ts                  # Vite dev/build config
├── server.js                       # Production static server for Replit
├── package.json                    # Scripts and dependencies
└── .replit                         # Replit workflow/deployment config
```

## Requirements

- Node.js 20 or newer
- npm
- Google Gemini API key

## Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

The Vite config exposes this value to the frontend as:

```ts
process.env.GEMINI_API_KEY
process.env.API_KEY
```

For Replit deployment, add `GEMINI_API_KEY` in Replit Secrets as well. Do not commit `.env.local`; it is ignored by git.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:5000
```

Open the admin dashboard at:

```text
http://localhost:5000/admin
```

## Production Build

Build the app:

```bash
npm run build
```

This creates the production output in `dist/`.

Run the production server:

```bash
npm run start
```

`npm run start` intentionally runs the build first and then starts `server.js`:

```bash
npm run build && node server.js
```

This prevents Replit deployments from starting with missing or stale `dist` files.

## Replit Deployment

The `.replit` file is configured with:

```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

Replit preview uses:

```bash
npm run dev
```

Replit deployment uses:

```bash
npm run start
```

Because deployment serves static build files instead of the Vite dev server, direct browser visits to routes like `/admin` must be handled by `server.js`.

## Admin Dashboard

The admin dashboard is available at:

```text
/admin
```

Default login:

```text
Username: admin
Password: admin1234
```

The admin dashboard reads saved invoices from the same browser `localStorage` key used by the main app. This means saved invoices are local to the browser and deployment environment where they were created. They are not stored in a database.

## Important Deployment Note: `/admin` 404 Fix

If Replit preview works but the deployed URL shows:

```text
Not found
```

when opening `/admin`, the issue is usually production routing. Vite preview can handle app routes differently from a deployed static server.

This project fixes that in `server.js`:

- Static files are served from `dist`.
- `/admin` first tries `dist/admin/index.html`.
- If that file is missing, `/admin` falls back to `dist/index.html`.
- Other app routes fall back to `dist/index.html`.

That fallback keeps direct URLs like these working after deployment:

```text
https://your-replit-app.replit.app/admin
https://your-replit-app.replit.app/admin/
https://your-replit-app.replit.app/admin/anything
```

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server on port `5000`.

```bash
npm run build
```

Creates a production build in `dist/`.

```bash
npm run start
```

Builds the app and starts the production Node server.

```bash
npm run preview
```

Runs Vite preview for checking the built app locally.

```bash
npm run lint
```

Runs TypeScript validation with `tsc --noEmit`.

## How The App Works

1. The user chooses an issuer company profile.
2. The user chooses `INVOICE` or `QUOTATION`.
3. The user chooses a visual template.
4. The user enters a natural language description of the client, items, pricing, terms, and other document details.
5. `services/geminiService.ts` sends a structured prompt to Gemini.
6. Gemini returns document data.
7. The app applies the selected company profile to the generated data.
8. The user previews and edits the document.
9. The user saves the document to browser `localStorage`.
10. The user can export the document from the main screen or admin dashboard.

## Data Storage

Saved documents are stored in browser `localStorage` with this key:

```text
brandsync_saved_invoices_v1
```

This is simple and Replit-safe, but it has limitations:

- Saved invoices are browser-specific.
- Clearing browser data removes saved invoices.
- Different users or devices will not share the same saved invoices.
- A database is required for shared admin access across devices.

## Company Profiles

Company profile data lives in:

```text
companyProfiles.ts
```

Current profile IDs:

```text
morr
tumeng-bi
house-of-healing
```

To add another company, update:

- `CompanyId` in `types.ts`
- `COMPANY_PROFILES` in `companyProfiles.ts`
- Any required logo/image asset in the project root or public serving path

## Export Formats

The app supports:

- PDF
- Image
- Word document

Export logic is implemented in:

```text
services/exportService.ts
```

The export functions capture the rendered invoice template from the page, so layout and styling changes in `InvoiceTemplate.tsx` affect exported files.

## Troubleshooting

### `/admin` works in preview but not after deployment

Run a fresh deployment after confirming these files are present:

- `server.js`
- `admin/index.html`
- `package.json` with `"start": "npm run build && node server.js"`
- `.replit` with deployment build and run commands

Then redeploy on Replit.

### AI generation fails

Check that:

- `.env.local` contains `GEMINI_API_KEY` for local development.
- Replit Secrets contains `GEMINI_API_KEY` for deployment.
- The API key is valid and has access to Gemini.

### Saved invoices are missing

Saved invoices are stored in the current browser only. Use the same browser/profile where the invoices were saved.

### Exports look different from the screen

Exports are based on rendered HTML. Check:

- `components/InvoiceTemplate.tsx`
- `index.css`
- browser zoom level
- image/logo loading paths

## Security Notes

- The admin login is currently a frontend-only check.
- The default credentials are visible in the source code.
- Saved documents are stored in browser `localStorage`.

For production use with real client data, replace the frontend-only admin login with server-side authentication and move saved invoices into a database.

## Recommended Production Improvements

- Add real authentication for admin access.
- Store invoices in a database instead of `localStorage`.
- Add user accounts or company-level access control.
- Move admin credentials into server-side environment variables.
- Add automated tests for generation, saving, routing, and export flows.
- Code-split the app if bundle size becomes a concern.

## License

This project is private. Add a license before distributing it publicly.
