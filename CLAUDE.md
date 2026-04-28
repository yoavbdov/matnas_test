# matnas_test — Chess School Management System

The name of the system is Chess Nimbus.

Next.js 16 + React 19 + Tailwind CSS + Firebase app for managing a chess school (Israeli context, Hebrew UI, RTL).
Use tsx and not js or mjs.

## Project Structure

```
/app/               Next.js App Router pages and API routes
/components/        Reusable UI components (layout/, shared/)
/context/           React contexts (Auth, Data, Toast)
/firebase/          All Firebase-related files (see below)
/lib/               Application utilities and types
/public/            Static assets
/scripts/           Dev scripts (e.g. Firestore seed data)
```

## Firebase folder (`/firebase/`)

All Firebase SDK usage and config is consolidated here:

- `firebase.ts` — Firebase app initialization, exports `auth` and `db`
- `firestore.ts` — Generic Firestore write operations (add/update/delete)
- `hooks/useAuth.ts` — React hook: Firebase auth state listener
- `hooks/useCollection.ts` — React hook: real-time Firestore collection listener
- `hooks/useDocument.ts` — React hook: real-time Firestore single-doc listener

Firebase config is supplied via environment variables — see `.env.local.example` at root.

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in values from Firebase Console.
Never commit `.env.local`.

## Key commands

```bash
npm run dev        # start dev server
npm run build      # production build
npx ts-node scripts/seed.ts   # seed Firestore with demo data
```

Its very important that all of the code will be easy to understand for a human, comments etc...
Make sure to keep the components short, and if needed devide them.
