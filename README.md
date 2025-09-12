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

## Developer testing notes

This project includes a lightweight `useApi` hook used across features. A few testing tips:

- Prefer to assert hook-driven UI changes using RTL's `waitFor` or `act()` rather than relying on internal timing within hooks. Tests that await the public `refresh()` method should wrap assertions in `waitFor` so they observe committed state.
- `useApi` previously used extra macrotask waits to stabilize Jest runs; that behavior has been removed in favor of clearer test assertions. If you encounter flakiness in CI, prefer adding explicit `waitFor()` in the test rather than reintroducing hidden waits in the hook.
- Use `clearApiCache()` from `src/hooks/use-api.ts` in test setup/teardown if you need to reset internal caches between tests.

If you'd like, I can add a short `CONTRIBUTING.md` with testing conventions for this repository.
