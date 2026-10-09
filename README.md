# RA AVM: Web & Field App

The web app and field-team mobile app for **RA AVM**, a property-management operations platform built by Reasonable Automations. This repo is the frontend. The API, background workers, and scrapers run in a separate private service, described under [Platform architecture](#platform-architecture).

One React codebase ships in two forms:
- **The web app**, used by property managers and admins in the office.
- **RA Field**, an iOS app built with Capacitor, used by the field team on site.

---

## What RA AVM is

RA AVM is the system a property-management firm uses to run its portfolio day to day. Maintenance, field-team work, vendors, inspections, insurance, utilities, client invoicing, and bookkeeping all live in one app. It sits alongside the firm's accounting systems (**QuickBooks Online** and **Buildium**) and syncs with them. The goal is that nobody has to re-key data between them.

The platform supports three property types with different billing behavior: **Concierge** (expenses passed through at cost), **HOA**, and **Rental** (vendor markup). It has three user roles: `admin`, `property_manager`, and `field_team_member`.

### Product features

**Portfolio & properties**
- Properties, units, locations, owners, and tenants, with notes and documents.
- Effective-dated property rates (management fee, hourly/emergency labor, late fee). Billing always uses the rate that applied on the service date.
- Global search across the portfolio.

**Maintenance & field operations**
- Tasks, recurring task templates, vendor **Work Orders**, and internal **Field Team Orders (FTOs)**.
- Field-team hours and expense submissions, with a manager approval step.
- **Projects**: groups of tasks with a budget, milestones, change orders, a schedule of values, quotes, inbound payments, a derived cash-flow ledger, and progress-billing draws.
- Project intake: AI pulls a draft project out of meeting notes.
- A per-property and portfolio-wide activity feed.

**AI intake & drafts**
- Inbound SMS (Twilio) and Outlook calendar events are classified by AI into draft tasks, work orders, and FTOs. Staff approve or reject them in a review queue.
- Duplicate-bill detection and a feedback loop that tunes AI suggestions over time.

**Inspections**
- Inspection checklists, which can be imported from a Word document.
- Scheduling, photo capture, and running inspections on mobile.
- An inspections dashboard.

**Insurance & vendor compliance**
- Property insurance policies, with AI extraction from the policy PDF.
- Tracking of expiring policies and renters insurance.
- Vendor compliance documents (certificates of insurance, W-9s, business licenses), classified by AI. A dashboard flags anything missing or expired.
- A 1099 report.

**Utilities**
- Automated bill capture from **16 utility provider portals** on a schedule.
- Manual PDF upload as a fallback.
- AI extracts amounts, service periods, and due dates from each bill.
- See [Utility bill scrapers](#utility-bill-scrapers) below for how capture works.

**Accounting**
- Bills and bill drafts, vendor credits, card refunds, check printing, and employee reimbursements.
- **Client invoicing**: monthly invoices per property, using pass-through, markup, or standard billing models. Invoices can be split into one PDF per location and emailed to clients.
- **Credit-card reconciliation**: upload a bank statement. AI matches charges against booked expenses in both QuickBooks and Buildium, and the platform produces a signed reconciliation report.
- A general ledger, transaction list, and chart of accounts.
- Two-way integration with **QuickBooks Online** and **Buildium**.

**Operations**
- Calendar (Outlook sync), reminders, and to-dos.
- A "My Day" dashboard showing open maintenance, recent bills, and expiring leases and insurance.
- In-app bug reporting.

---

## What RA AVM automates

Most of the platform's value is work that happens without anyone typing it in.

### AI intake → review queue
- **Texts.** Owners, tenants, and staff text a Twilio number. AI reads the conversation, photos included, and drafts the right tickets.
- **Calendar.** Events on the firm's Outlook calendar are synced and classified the same way.
- **Project intake.** Paste meeting notes, and AI drafts a project: scope, budget lines, and milestones.

For texts and calendar events, AI decides whether each request is a task, a vendor work order, an internal field-team order, or a pair. It matches the request to the right property and records the reasoning behind its suggestion. All drafts go into the **AI Drafts** queue. Staff approve them (with edits if needed) or reject them, and their feedback is used to improve later suggestions.

### Utility bill scrapers
Utility bills for managed properties arrive without anyone logging in anywhere.
- **One scraper per provider portal.** A headless-browser (Python + Playwright) scraper exists for each of 16 providers:

  | Category | Providers |
  |---|---|
  | Electric | Eversource, United Illuminating, Third Taxing District |
  | Gas | Southern CT Gas, Connecticut Natural Gas |
  | Water / sewer | Aquarion, Regional Water, First District Water, SNEW, WPCA |
  | Internet | Verizon Fios, Optimum, Frontier, Starlink |
  | Waste | WinWaste, Santaguida Sanitation |

  Each scraper logs into the provider's site with the account's saved credentials and downloads the latest statement PDF.
- **Scheduled jobs.** Scrapes are queued per utility account and run on a schedule. Each run is recorded with its status, so failed logins and missing statements show up instead of slipping by.
- **AI bill parsing.** Each PDF goes to an AI parser that returns a structured statement: account number, amount due, statement and due dates, service period, and line items. The bill is then attached to the right property. A manually uploaded PDF goes through the same parser.
- **Straight into accounting.** Parsed bills become bill drafts, which are checked for duplicates and then posted as bills and passed through to the owner's invoice. Nobody keys in a utility bill by hand.

### Document AI
- **Insurance policies.** Upload a policy PDF and AI fills in the carrier, policy number, coverage, and dates. Expirations then appear on the dashboard automatically.
- **Vendor compliance.** Uploaded vendor documents (certificates of insurance, W-9s, 1099s, business licenses) are classified and read by AI. The compliance dashboard flags vendors with missing or expired paperwork.
- **Inspection checklists.** Imported from a Word document instead of rebuilt by hand.

### Accounting automation
- **QuickBooks Online and Buildium sync.** Bills, payments, vendors, and the chart of accounts flow both ways. Incoming webhooks are logged with a health monitor and can be replayed, so a broken integration gets noticed instead of failing silently.
- **Monthly client invoicing.** Each property's bills, field-team labor, and fees are rolled up using its billing model (pass-through, markup, or standard) and the rates in effect on each service date. The platform generates the PDFs, split per location when needed, and emails them.
- **Credit-card reconciliation.** Upload the card statement and AI matches every charge to a booked expense across QuickBooks and Buildium. Staff only review the exceptions, and the platform produces a signed reconciliation report.

---

## What's in this repo

### The office app (admins & property managers)

The sidebar is organized around how the firm works:

| Section | Pages |
|---|---|
| **Dashboard** | My Day, open maintenance, recent bills, expirations |
| **Properties** | All Properties → property detail (overview, units, locations, owners, tasks, bills, utilities, invoicing, insurance, inspections, notes); Insurance; Inspections |
| **Accounting** | Bills, Bill Drafts, Invoices, Vendor Credits, Print Checks, Reimbursements, Reconciliation, General Ledger, Chart of Accounts |
| **Maintenance** | All Tasks, Projects, Recurring Tasks, Field Team Orders, Work Orders, Activity Feed |
| **Vendors** | All Vendors, Compliance |
| **Calendar** | Calendar, Reminders, To-Dos |

### The field app (RA Field)

Field-team members get a separate, simpler layout under `/fto/*`. It covers their assigned Field Team Orders, work orders, property inspections (a step-by-step runner with photos), and hours/expense submissions. The same code is packaged as a native iOS app through Capacitor (`ios/`, app ID `com.reasonableautomations.ravm`).

### Tech

- React 18, React Router 6, TypeScript, Vite.
- TailwindCSS 3 with Radix UI primitives (`client/components/ui/` holds generated primitives; don't edit those by hand).
- `fetchJSON()` (`client/api/`) is the single HTTP client. Auth is JWT plus a role, enforced by `RequireAuth`.
- FullCalendar for scheduling. Client-side PDF, Excel, and Word handling (pdf-lib, jsPDF, exceljs, mammoth) for invoices, statements, and checklist imports.
- Vitest for tests. Deployed as a static SPA (Netlify).

```
client/
  pages/       route components
  components/  shared UI (components/ui = Radix primitives)
  layout/      ShellLayout (office), FTOShellLayout (field)
  data/        typed data-fetching per feature
  hooks/       custom hooks
  api/         fetchJSON, auth, upload helpers
ios/          Capacitor iOS project (RA Field)
```

---

## Platform architecture

```
 Web app / RA Field (this repo) ──▶ RA AVM API (Go) ──▶ PostgreSQL
                                      │
                                      ├── scraper service (Python + Playwright, 16 providers)
                                      ├── AI services (Anthropic, OpenRouter)
                                      └── integrations: QuickBooks Online, Buildium,
                                          Outlook (Microsoft Graph), Twilio
```

- **API:** Go with PostgreSQL. It's organized into feature modules (properties, maintenance, projects, invoicing, accounting, reconciliation, utilities, inspections, insurance, vendor compliance, AI, SMS, and others). Money is stored as integer cents, and totals are derived when read rather than stored.
- **Background work:** scrape jobs, calendar sync, recurring tasks, and integration webhooks run on the server.
- The backend source is private.

---

## Running locally

```bash
npm install
npm run dev        # http://localhost:5173, talks to the API at localhost:8080
npm test           # Vitest
npm run typecheck
```

The frontend expects the RA AVM API at `localhost:8080`; it is not included in this repo.
