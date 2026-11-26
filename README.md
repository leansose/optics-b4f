This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Opticmizer pages

Four one-screen pages: `/` (quality), `/finance`, `/product`, `/simulator`.
Filters (shop, year, model group) sit under the header and apply to every page.
Use ← / → to move between pages while not typing in a control. Charts use Recharts
with a blue `#42a5f5` brand identity.

The Product page has its own search, category/treatment/complexity/price filters
and sortable columns on top of the shared filters.

The Simulator replaces the old data-quality page. Add as many ranges as needed,
type a percentage or drag the slider, and pick the driver each range changes
(order value, production/logistics/incident cost, or delivered orders). Profit
updates live for the current filters.

Data is pre-aggregated from `public/data/lentes/csv` into `src/data/cube.json`
(used by the filters), `src/data/metrics.json` and `src/data/products.json`:

```bash
python3 scripts/build-metrics.py
npm run build-products   # Node version: no Python needed
```
