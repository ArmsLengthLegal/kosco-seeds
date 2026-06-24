# Kosco Seeds — Software Audit

*Audit date: 2026-06-15. Covers security, code quality/bugs, and completeness.*
Live app: https://kosco-seeds.vercel.app · Repo: PUBLIC.

---

## 0. Incident found during audit: Supabase project was PAUSED

The Supabase project status was **`INACTIVE`** (free-tier projects pause after ~7 days idle).
This is why the app/database appeared dead. **Resolved during this audit** — restore was
triggered via the Management API; project went `INACTIVE → COMING_UP → ACTIVE_HEALTHY`.

**Prevention shipped:** a `/api/health` route (`src/app/api/health/route.ts`) that pings the DB,
plus a daily **Vercel Cron** (`vercel.json`, `30 6 * * *`) that hits it — keeps the project
active so it never auto-pauses again.

---

## 1. Security findings

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| C1 | 🔴 Critical | **Privilege escalation at signup** — signup let users self-select `super_admin`; the `handle_new_user()` trigger wrote the client role verbatim. Anyone on the internet could register as super_admin. | ✅ **FIXED** — signup no longer sends a role; trigger hardened to always insert `viewer`. |
| C2 | 🔴 Critical | **Anon JWT committed to public repo** in `.claude/settings.local.json` (tracked, not gitignored). | ✅ **FIXED** — untracked + gitignored. (Anon key is public-by-design; rotation optional.) |
| H1 | 🟠 High | **Bank/Aadhaar readable by all authenticated users.** Farmers SELECT policy is `to authenticated using (not is_deleted)` — every inspector/viewer can read `bank_account_number`, `bank_ifsc`, `pan_number`, `aadhar_number`. The "🔒 Admin only" UI label is cosmetic; no column-level enforcement. | ⏳ TODO — move sensitive cols to `farmer_sensitive` table (admin-only RLS) or expose farmers via a column-masked view. |
| H2 | 🟠 High | **Inspector over-read** — the blanket `authenticated` SELECT policy nullifies the narrower "assigned farmers only" policy (RLS policies are OR-combined). Inspectors see the whole farmer DB. | ⏳ TODO — drop the blanket policy; keep assignment-scoped + admin/manager policies. |
| M1 | 🟡 Medium | `public.users` RLS policies query `public.users` inside their own USING clause → recursion risk; amplifies role abuse. | ⏳ TODO — use a `security definer` `auth_role()` helper. |
| M2 | 🟡 Medium | **PostgREST filter injection** in farmer search — `params.q` interpolated raw into `.or(\`full_name.ilike.%${q}%,...\`)` (`farmers/page.tsx:29`). `,()*.` let an attacker inject filter conditions (e.g. surface soft-deleted rows). | ⏳ TODO — allowlist/escape `q` or use per-column `.ilike()`. |
| M3 | 🟡 Medium | Step-5 of farmer wizard sends unvalidated raw DOM values; empty `agreement_start_date: ''` errors against a `date` column. | ⏳ TODO — Zod-validate step 5; coerce empty dates to null. |
| L1 | 🟢 Low | Auth callback `next` param redirect — low risk (prefixed with `origin`) but validate it starts with a single `/`. | ⏳ TODO |
| L2 | 🟢 Low | `audit_log` insert policy `with check (true)` — any user can forge audit rows. | ⏳ TODO — restrict inserts to security-definer/service role. |

---

## 2. Code-quality & bug findings

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| B1 | 🔴 Critical | **Offline inspections discard all photos** — offline branch hardcodes `photos: []` (`inspections/[id]/page.tsx:178`); blobs never stored, never synced. Form requires ≥2 photos, so every offline inspection loses mandatory evidence. | ⏳ TODO — store photo blobs in IndexedDB draft. |
| B2 | 🔴 Critical | **Offline sync query never matches** — `db.draftInspections.where('isSynced').equals(0)` but `isSynced` is boolean; IndexedDB can't index booleans and `.equals(0)` ≠ `false`. Drafts never upload; pending badge always 0. | ⏳ TODO — store `isSynced` as 0/1 number. |
| B3 | 🔴 Critical | **Offline drafts have no `inspector_id`** (`''`); the insert payload omits it → NOT NULL / RLS failure on sync. | ⏳ TODO — capture user id at save time into payload. |
| B4 | 🟠 High | **No service worker** — `next-pwa` installed but never wired (`next.config.mjs` empty). App shell can't load with no signal, so the whole offline story is moot even if B1–B3 fixed. | ⏳ TODO — configure `withPWA` + manifest + precache inspection route. |
| B5 | 🟡 Medium | Type-unsafe Supabase relation casts (`as any`, `as unknown as`) hide one-to-one-vs-array embed shape; risk of `undefined` at runtime. | ⏳ TODO — generate Supabase types. |
| B6 | 🟡 Medium | Many Supabase calls ignore `{ error }` / no try-catch; `uploadPhoto` swallows failures yet inspection still marks submitted. | ⏳ TODO — check errors, surface them. |
| B7 | 🟡 Medium | Farmer-code generation `count(*)+1` is race-prone → duplicate `CS-RJ-#####`. | ⏳ TODO — DB sequence or unique+retry. |
| B8 | 🟢 Low | `package.json` name still `kosco-seeds-temp`; camera files may lack extension → `.undefined` storage path. | ⏳ TODO |

**Note:** the offline-first pipeline (the headline feature) is currently **non-functional** end to
end (B1+B2+B3+B4). It was clearly never run live. Treat "make offline actually work" as one
focused effort with a real offline test.

---

## 3. Completeness — built vs stub vs missing

**Functional:** auth (login/signup/forgot), dashboard (role-adaptive), farmers (list + 5-step
wizard + profile), add-field, create-agreement, assign-inspection, conduct-inspection (online),
photo upload, full DB schema + RLS + storage bucket.

**Stubs (ComingSoon):** agreements list · fields list (admin map) · inspections list ·
executive report · settings → users.

**Missing:** `/update-password` page (forgot-password dead-ends) · crops/qualities settings UI ·
audit-log viewer · "show contact" audit logging.

**Dormant dependencies (installed, unused):** `leaflet`/`react-leaflet` (maps) · `next-intl`
(Hindi) · `jspdf`/`xlsx` (PDF/Excel) · `next-pwa` (service worker).

---

## 4. Prioritized remediation order

1. ✅ **Resume Supabase + keep-alive** (done this audit).
2. ✅ **C1 signup privilege escalation** (done).
3. ✅ **C2 untrack committed key** (done).
4. **H1 + H2** — protect bank/Aadhaar, fix inspector over-read (PII exposure on a public app).
5. **B1–B4** — make offline actually work (or disable the offline UI until it does).
6. **Custom SMTP** (Resend/SendGrid) — emails currently unreliable.
7. `/update-password` page · list views · user-management UI.
8. M2 search injection · B5–B7 quality fixes.

> Until H1/H2 are fixed, avoid loading real farmer bank/Aadhaar data — non-admin staff can read it.
