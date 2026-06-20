# Aurus Merchant Portal

Web3 SaaS subscription management dashboard with Solana blockchain integration.

## Features

- Generate subscription checkout links with AI prompt parsing
- Interactive pricing tabs (Basic, Premium, Enterprise, Custom)
- Real-time activity ledger tracking transactions
- Revenue and transaction status charts
- Phantom wallet connection
- Light / dark theme toggle
- Devnet payment simulation (no real funds)

## Quick Start

Open `index.html` directly in a browser. No build step required for the vanilla version.

For the Next.js development build:

```bash
npm install
npm run dev
```

Then open `http://localhost:3001` (port 3000 is avoided if already in use).

## Project Structure

| File / Folder | Purpose |
| --- | --- |
| `index.html` | Main application (vanilla JS + Tailwind + Chart.js) |
| `backend.js` | LocalStorage-backed state and helper APIs |
| `checkout.html` | Legacy standalone checkout page |
| `src/` | Next.js 15 + TypeScript source (optional build) |
| `src/app/page.tsx` | Next.js dashboard page |
| `src/components/` | React components (pricing, charts, ledger, wallet) |
| `src/lib/store.ts` | Zustand state management |

## Environment

- Node.js 24+
- Modern browser with ES2020 support
- Phantom wallet extension (optional, for real Solana flow)

## License

MIT
