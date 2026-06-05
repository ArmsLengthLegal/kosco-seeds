# Kosco Seeds — Product Roadmap & Pending Work

*Living document. Last updated: 2026-06-05*

This is the strategic plan for the Kosco Seeds platform. Phase 1 (field inspection MVP)
is live at https://kosco-seeds.vercel.app. This document covers what's done, what's
pending to finish the MVP, and where the product should go next.

---

## 1. Current State (audited)

### ✅ Built & working
| Module | Status |
|--------|--------|
| Auth — login, signup (role select), forgot-password, callback | ✅ Functional |
| Dashboard — role-adaptive (inspector tasks vs admin stats) | ✅ Functional |
| Farmers — list + search | ✅ Functional |
| Farmer — 5-step add wizard (saves to DB, auto-code) | ✅ Functional |
| Farmer — profile (contact, fields, agreements, inspections) | ✅ Functional |
| Fields — add field form | ✅ Functional |
| Agreements — create | ✅ Functional |
| Inspection — assign (standard 1/2 + additional/complaint) | ✅ Functional |
| Inspection — conduct (GPS, camera, observations, offline save) | ✅ Functional |
| Database — full schema, RLS, seed data | ✅ Live (Supabase) |
| Photo storage bucket | ✅ Created |
| Design system — large fonts, brand theme, mobile-first | ✅ Done |
| Deployment — Vercel production + auto-deploy | ✅ Live |

### 🟡 Stubbed (placeholder "Coming soon" pages)
- Agreements **list** view
- Fields **list** view (all-fields admin map)
- Inspections **list** view
- Reports — executive
- Settings — users

### ⚪ Installed but never wired up
- `next-pwa` — no service worker / offline app-shell caching yet
- `leaflet` / `react-leaflet` — no maps yet (field boundary, route planning, isolation buffer)
- `next-intl` — no Hindi translation yet
- `jspdf` / `xlsx` — no PDF/Excel export yet

---

## 2. Pending to Finish MVP (Phase 1.5) — do these next

These close the gaps in what's already started. Priority order:

1. **Custom SMTP for email** 🔴 CRITICAL
   - Supabase's built-in email is rate-limited (~3/hour) and lands in spam — this is why
     confirmation emails don't arrive. Wire **Resend** or **SendGrid** SMTP in Supabase Auth.
   - Until then, new users must be confirmed manually (admin creates them).

2. **Password reset page** (`/update-password`)
   - forgot-password sends the link but there's no page to set the new password.

3. **List views** (agreements, inspections, fields) — replace the 3 stubs with real
   filterable/searchable lists with season toggle (Kharif/Rabi).

4. **Settings → Users** — admin UI to add/edit/deactivate users, assign roles & zones.
   (Right now users can only be created via signup or manually in Supabase.)

5. **Settings → Crops & Seed Qualities** — manage crop varieties and inspection timing rules
   without touching the database.

6. **Offline photo persistence** 🔴 BUG
   - The conduct-inspection form currently saves `photos: []` when offline — photos are lost.
   - Store photo blobs in IndexedDB and upload them on reconnect (sync engine already scaffolded).

7. **PWA / installable app**
   - Configure `next-pwa`, generate icons, enable service-worker caching of the app shell so
     inspectors can open the app with no signal. Add the install prompt.

8. **"Show Contact" audit logging**
   - Spec requires inspector viewing farmer phone to be logged in `audit_log`. Not yet done.

9. **Executive dashboard report** — real numbers: farmers, area, completion rate, expected yield,
   season comparison, failed/pending inspections. Plus PDF export.

---

## 3. What This Software Could Become — Feature Brainstorm

Kosco is a **seed production company**. Field inspection is only one step of the seed lifecycle.
The platform can grow to run the entire operation. Grouped by business area:

### A. Field & Inspection (current core — deepen it)
- **Leaflet maps**: draw field boundaries, auto-centroid, isolation-distance buffer rings,
  plot all fields by district/tehsil, "nearby fields within N km" for route planning.
- **Route optimizer**: cluster a day's assignments geographically, suggest visit order, export list.
- **Sowing-date calendar heatmap**: plan inspection windows by region.
- **Rogue/off-type threshold alerts**: auto-flag >1% (configurable per crop) for rejection.
- **Weather widget** on inspector's task list (OpenWeatherMap) to plan visits.
- **Inspection scheduling automation**: auto-suggest 2nd inspection date from sowing + crop config.
- **Offline map tiles**: pre-cache tiles for the inspector's operating area.

### B. Seed Lifecycle (the big opportunity — Kosco's actual business)
The field inspection ends at harvest. The seed then goes through procurement → processing →
testing → packaging → sale. Each is a module:
- **Procurement / buy-back**: record seed quantity bought back from each farmer against the
  agreement, weighbridge slips, moisture at intake, rate, deductions.
- **Farmer payments**: track amount due, paid, pending per agreement; bank transfer / DBT records;
  payment receipts (link to `production_agreements.id`).
- **Lot & inventory management**: assign lot numbers, track raw seed → processed seed, godown
  stock, bin locations.
- **Seed processing**: cleaning/grading batches, recovery %, wastage.
- **Lab / quality testing**: germination %, genetic purity, physical purity, moisture, vigour —
  per lot. Pass/fail against certification standards.
- **Tagging & certification**: generate certification tags, track SSCA certificate numbers,
  print labels with QR codes.
- **Sales & dispatch**: dealer/distributor orders, dispatch challans, stock-out tracking.

### C. Government / Compliance
- **SSCA portal export**: khasra-wise registered-field export in the exact format the State Seed
  Certification Agency portal expects (Excel). Track registration status (pending/submitted/approved).
- **Registration workflow**: per-field government registration number, agency dates, status.
- **Compliance reports**: isolation-distance certificates, inspection certificates per field.
- **Subsidy / DBT tracking**: if farmers get input subsidies.

### D. Farmer Relationship (CRM)
- **Farmer self-view** (no-login URL via SMS): farmer sees their agreement, inspection dates,
  inspector contact, payment status.
- **WhatsApp / SMS notifications** (MSG91 / Twilio): inspection reminders, agreement expiry,
  payment confirmations, advisories. `notifications` queue table is already in the schema.
- **Feedback & complaints**: capture farmer complaints → auto-create additional inspection.
- **Farmer segmentation & tags**: VIP, repeat, defaulter, etc. (tags system already in schema).

### E. Analytics & Intelligence
- **Yield prediction**: aggregate inspector estimates per crop/zone vs. allotted seed →
  expected multiplication ratio; flag underperforming areas.
- **Procurement forecasting**: expected vs. actual yield to plan godown space and cash flow.
- **Inspector performance**: inspections/day, on-time %, rejection rates, GPS-verified visits.
- **Season-over-season comparison**: area, farmers, yield, quality trends.
- **Executive PDF reports** for management.

### F. Platform & Operations
- **Hindi (and other languages)** — critical for field staff & farmers.
- **Native Android inspector app** (React Native) — better offline, camera, background photo sync.
- **Bulk import**: farmers and khasra numbers from Excel with validation/error report.
- **Audit log viewer** for admins.
- **Role/permission fine-tuning**: zone-scoped managers, column-level bank-detail masking.
- **Document vault**: agreements, ID proofs, certificates per farmer.
- **Multi-company / multi-tenant** (schema already designed for it) — sell the platform to other
  seed companies later.

---

## 4. Phased Roadmap

### Phase 1 — Field Inspection MVP ✅ (LIVE)
Auth, farmers, fields, agreements, assign + conduct inspection, offline capture.

### Phase 1.5 — Finish MVP (1–2 weeks)
SMTP email, password reset, list views, user/crop settings, offline photo fix, PWA,
audit logging, executive report. *(Section 2 above.)*

### Phase 2 — Maps, Reports & i18n (2–4 weeks)
Leaflet field mapping + boundary drawing, isolation buffers, route planning, nearby fields;
government/SSCA Excel export; yield-prediction report; Hindi i18n; bulk import.

### Phase 3 — Seed Lifecycle (4–8 weeks)
Procurement/buy-back, farmer payments, lot & inventory, lab testing, tagging/certification,
dispatch. *This is where the platform becomes the company's full operating system.*

### Phase 4 — CRM, Notifications & Intelligence (ongoing)
WhatsApp/SMS notifications, farmer self-view, complaints workflow, analytics dashboards,
inspector performance, procurement forecasting, native Android app.

### Phase 5 — Scale (future)
Multi-tenant SaaS for other seed companies, marketplace, advisory/agronomy content,
satellite/NDVI crop monitoring, AI off-type detection from photos.

---

## 6. Competitive Analysis — What the Market Has That We Don't

Researched leading farm/agri inspection apps (FarmQA, Farmonaut, Agrio, DTN Scout, Cropin,
Pure Harvest, Fulcrum) and general inspection platforms (SafetyCulture/iAuditor, GoAudits,
FastField, InspectAll). Below: standard market features we're missing, ranked by value for
Kosco's specific context (field seed inspection, low-literacy staff, no signal, anti-fraud).

### 🔴 Must-add — these are table-stakes we lack
1. **Geofence / on-site verification** — verify the captured GPS actually falls *inside the
   registered field boundary*. Today we capture GPS but don't check it's the right place. This
   is the single biggest trust/anti-fraud feature — proves the inspector was physically there.
2. **Official Field Inspection Report (FIR) as PDF** — Indian seed cert requires an FIR
   "in triplicate" per inspection. Auto-generate a branded PDF, store it, email it. We have
   zero PDF output today.
3. **E-signatures** — inspector + farmer sign the FIR on the phone. Legally meaningful for a
   certification document. Standard in every inspection app; we have none.
4. **Crop-specific standards engine + auto scoring** — encode per-crop rules (isolation
   distance: ~100m self-pollinated / ~500m cross-pollinated; off-type % threshold; required
   inspection stages) and **auto-compute pass / conditional / fail** instead of manual. Today
   the verdict is a manual button.
5. **Configurable inspections per crop (2–4)** — Indian standards require 2–4 inspections at
   vegetative / flowering / pre-harvest stages depending on crop. We hardcoded 2 + additional.
   Make count & stages part of crop config.
6. **Voice notes** — let inspectors *dictate* observations instead of typing. Directly serves
   our "usable by less-educated field staff" mandate — a real differentiator for rural India.

### 🟡 High-value — market-standard, strong ROI
7. **Configurable form builder / inspection templates** — different crops need different
   checklists. Market apps let you build/clone templates per crop with **conditional fields**
   (show/hide based on answers). Ours is one hardcoded form.
8. **CAPA / corrective-action workflow** — when something fails, create a tracked action:
   assign → due date → resolve → sign-off → time-stamped record. We only have a "follow-up?"
   checkbox with no tracking. This also drives the complaint-based additional inspections.
9. **Map annotation** — draw *where* in the field the problem is (rogue patch, disease spot)
   and its extent, on the field map.
10. **Push notifications** — assigned inspections, overdue tasks, rejections. (PWA push +
    later WhatsApp/SMS.)
11. **Branded PDF reports auto-emailed to stakeholders** — managers/owner get the report
    without logging in.
12. **Real-time analytics dashboard** — compliance/pass rates, overdue, inspector KPIs,
    rejections by region. (Overlaps our executive report.)
13. **Activity feed / "my team today"** — manager sees live field activity across inspectors.

### 🟢 Advanced / future differentiators
14. **Satellite / NDVI crop-health imagery** (Farmonaut, EOS) — overlay remote crop health with
    ground observations to target inspections. Phase 5.
15. **AI from photos** — pest/disease ID and **off-type detection** from crop photos. Emerging
    standard; strong fit since we already capture photos. Phase 5.
16. **QR / barcode** — tie each inspection/lot/seed bag to a scannable code for traceability.
    Becomes essential in the Phase 3 seed-lifecycle (lot tracking, tagging).
17. **Billing / fee management** — per-acre inspection fees and per-sample test fees, auto-charged
    to accounts (Pure Harvest, Cropin do this) — if Kosco bills growers or tracks SSCA fees.
18. **IoT / sensor integration** — soil moisture, weather stations — long-term.

### Domain corrections to bake in (India seed cert specifics)
- Inspections are **2–4 per crop** (not fixed 2) at vegetative / flowering / pre-harvest stages.
- **Isolation distance is crop-specific** (~100m self-pollinated, ~500m cross-pollinated) — store
  the standard per crop and validate against the captured distance.
- **Off-type/rogue thresholds are crop-specific** — auto-flag rejection when exceeded.
- A plot failing standards is **"liable for rejection"** — model this rejection state explicitly.
- FIR is an **official document** — needs the right fields, signatures, and a print/PDF format.

---

## 5. Known Issues / Tech Debt
- Supabase default SMTP unreliable → **must** add custom SMTP before real onboarding.
- Offline inspection drops photos (`photos: []` in offline branch).
- No `/update-password` page (forgot-password link dead-ends).
- Bank-detail RLS is row-level, not column-level — managers can read bank fields. Tighten.
- `package.json` project name is still `kosco-seeds-temp` (cosmetic).
- No automated tests yet.
- CREDENTIALS.md holds the GitHub PAT and service-role key in plaintext — keep it gitignored
  (it is) and rotate keys before any wider team access.
