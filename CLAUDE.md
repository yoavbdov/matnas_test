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
every component should be small and single-purpose.
If a file exceeds 150-200 lines - split it.

each folder should have one responsibility.
Note that i dont want to use vercel, only firebase.
Duplication is acceptable if it improves clarity
Avoid premature abstraction

If a new developer cannot understand a file in 30 seconds, it is too complex.
Make sure to add comments!

## Validation & Field Conventions

All validation constants live in `lib/validators.ts` (LIMITS object).
All forms must import from there — never hardcode limits inline.

### Field limits

| Field type | Max length | Notes |
|---|---|---|
| Name (שם — student / teacher / class / group / event / tournament / room / equipment) | 50 chars | `settings.MAX_STRING_LENGTH` |
| Description (תיאור) | 300 chars | `LIMITS.DESCRIPTION` |
| Notes / הערות | 300 chars | `settings.MAX_NOTE_LENGTH` |
| Email | 40 chars | `LIMITS.EMAIL` |
| Address / כתובת | 50 chars | `LIMITS.ADDRESS` |
| Phone (טלפון) | exactly 10 digits | `LIMITS.PHONE` — see phone rules below |
| Israeli ID / ת"ז | 9 digits only | `LIMITS.ISRAELI_ID` |
| Age / גיל | 0–120 | `settings.MAX_AGE` |
| Chess rating / מד כושר | 0–9999 (4 digits) | `settings.MAX_INT_INPUT` |
| Israeli chess player number | 6 digits only | `LIMITS.ISRAELI_CHESS_ID` |
| FIDE ID | 9 digits only | `LIMITS.FIDE_ID` |
| Attendance note | 120 chars | `LIMITS.ATTENDANCE_NOTE` |

### Phone rules
- Input: digits only (`inputMode="numeric"`, onChange uses `digitsOnly(value, 10)`)
- Validation on save: must be exactly 10 digits (use `validatePhone()`)
- **Storage format: always `053-2422215` — apply `formatPhone()` from `lib/utils.ts` before every `addDocument`/`updateDocument` call AND in every CSV/Excel parser before returning the parsed row**
- Display format: always pass through `formatPhone()` in tables and detail modals
- `formatPhone("0532422215")` → `"053-2422215"`, `formatPhone("053-2422215")` → `"053-2422215"` (idempotent)

### Digit-only fields
Use `digitsOnly(value, maxDigits)` from `lib/validators.ts` in `onChange`:
- Phone, Israeli ID, Israeli chess ID, FIDE ID

### Error messages
All error messages are defined in `VALIDATION_ERRORS` in `lib/validators.ts`.
Use them in `showToast()` — never write error strings inline.

## Shared UI Conventions

### CSV buttons
Always use the shared components — never inline custom buttons for CSV actions:
- Export (ייצוא): `<CsvExportBtn onClick={...} />` from `components/shared/CsvExportBtn.tsx`
- Import (ייבוא): `<CsvImportBtn onClick={...} />` from `components/shared/CsvImportBtn.tsx`

Both are green (`bg-green-600`) with white text and a Download/Upload icon.
Any new CSV export or import action must use these components.
