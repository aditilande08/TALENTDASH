# CompX — Compensation Intelligence Platform

A full-stack compensation intelligence platform focused on structured, comparable salary data across tech companies. Built for the AI Software Engineer Internship assignment.
**Live URL:** https://compx-tawny.vercel.app/

## What This Is

CompX helps engineers compare compensation **intelligently** — not by job titles (which vary wildly), but by **equivalent engineering levels** across companies. A Google L3, Microsoft SDE1 (59), Amazon SDE1 (L4), and Meta E3 are all the same seniority. This platform maps them.

**Core principle: Levels matter more than job titles.**

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  Next.js 16 + React 19 + TypeScript + Tailwind  │
│                                                   │
│  Pages:                                           │
│  /           → Dashboard (SSR)                    │
│  /salaries   → Salary explorer (CSR + API)        │
│  /levels     → Cross-company level mapping (CSR)  │
│  /companies  → Company directory (SSR)            │
│  /companies/[id] → Company detail (SSR)           │
│  /compare    → Side-by-side comparison (CSR)      │
│  /insights   → Analytics & findings (CSR)         │
│  /submit     → Salary submission form (CSR)       │
└──────────────────────┬──────────────────────────┘
                       │ fetch / SSR
┌──────────────────────▼──────────────────────────┐
│                 API Layer                         │
│           Next.js API Routes (app/api/)           │
│                                                   │
│  GET  /api/salaries     → Filter, sort, paginate  │
│  GET  /api/companies    → List with avg comp       │
│  GET  /api/companies/[id] → Detail + all salaries  │
│  GET  /api/levels       → Cross-company mapping    │
│  GET  /api/compare?ids= → Side-by-side stats       │
│  GET  /api/insights     → Aggregated analytics     │
│  POST /api/submit       → New salary entry          │
└──────────────────────┬──────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────┐
│                  Database                         │
│              PostgreSQL (Neon/Prisma)              │
│                                                   │
│  Tables:                                          │
│  Company      → id, name, industry, hq, size      │
│  Salary       → base, bonus, stock, level, yoe    │
│  LevelMapping → companyLevel → normalizedLevel    │
│                 (enables cross-company comparison) │
└─────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. LevelMapping as a First-Class Model
Instead of hardcoding level equivalencies, `LevelMapping` is a database table with a `normalizedLevel` (1-10 scale). This means:
- Adding new companies = just insert rows, no code changes
- Level comparisons are data-driven, not hardcoded
- The comparison page uses normalized levels for apples-to-apples analysis

### 2. SSR for Static Pages, CSR for Interactive Pages
- Dashboard, Companies, Company Detail → Server-side rendered (fast initial load, SEO)
- Salaries, Levels, Compare, Submit → Client-side (interactivity required for filters/forms)

### 3. Structured Compensation Breakdown
Every salary entry has `base + bonus + stock` — not just "CTC". This matches how compensation actually works at tech companies and enables meaningful comparison.

### 4. No Authentication (By Design)
For this scope, auth adds complexity without value. Salary submissions are anonymous. In production, you'd add:
- Email verification for higher trust scores
- Rate limiting on submissions
- Admin dashboard for data review

## Competitor Research

| Feature | Levels.fyi | 6figr | AmbitionBox | Glassdoor | CompX |
|---|---|---|---|---|---|
| Level mapping | ✅ Core | ❌ | ❌ | ❌ | ✅ |
| Comp breakdown | ✅ | ✅ | ❌ (CTC only) | ❌ (ranges) | ✅ |
| Company compare | ✅ by level | ❌ | ✅ basic | ✅ basic | ✅ by level |
| Salary submit | ✅ verified | ✅ payroll | ✅ anonymous | ✅ anonymous | ✅ anonymous |
| Filter/sort | ✅ | ✅ | ✅ | ✅ | ✅ |
| India focus | Partial | ✅ | ✅ | Partial | ✅ |

**Key insight:** Only Levels.fyi maps levels across companies. That's their moat. CompX replicates this core feature.

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 16, React 19, TypeScript | SSR + CSR flexibility, type safety |
| Styling | TailwindCSS 4 | Utility-first, fast iteration |
| Backend | Next.js API Routes | Co-located with frontend, no separate server |
| Database | PostgreSQL | Relational data, joins for level mapping |
| ORM | Prisma 6 | Type-safe queries, migrations, seeding |
| Font | Geist Sans/Mono | Clean, professional typography |

## Setup

```bash
# Clone
git clone <repo-url>
cd compensation-platform

# Install dependencies
npm install

# Set up database
# Create a .env file with DATABASE_URL pointing to your PostgreSQL instance
npx prisma db push
npx tsx prisma/seed.ts

# Run dev server
npm run dev
```

## Database Schema

```sql
-- Core: Company + Salary (standard compensation data)
Company (id, name, industry, website, hq, size)
Salary  (id, companyId, role, level, location, base, bonus, stock, yoe, verified)

-- Differentiator: Cross-company level normalization
LevelMapping (id, companyId, companyLevel, normalizedLevel, title, seniorityLabel)
-- Example: Google L3 → normalizedLevel 3, Microsoft SDE1 (59) → normalizedLevel 3
```

## API Documentation

### `GET /api/salaries`
Query params: `company`, `role`, `location`, `level`, `sort`, `order`, `page`, `limit`
Returns: `{ data: Salary[], total, page, totalPages }`

### `GET /api/companies`
Returns: `CompanyWithStats[]` (includes avgBase, avgTotal, count)

### `GET /api/companies/[id]`
Returns: `Company` with all salary entries

### `GET /api/levels`
Returns: `{ levels: LevelRow[], companyNames: string[], compensation: Record }`

### `GET /api/compare?ids=1,2,3`
Returns: `ComparisonData[]` with avgBase, avgBonus, avgStock, avgTotal, byRole

### `GET /api/insights`
Returns: `{ topPaying, locationBreakdown, roleBreakdown, insights: string[] }`

### `POST /api/submit`
Body: `{ companyId, role, level, location, base, bonus?, stock?, yoe? }`
Returns: `{ success: true, id: number }`

## Tradeoffs & Edge Cases

1. **No auth** — Prioritized functionality over access control for this scope
2. **Crowdsourced data quality** — Added `verified` boolean; in production would add multi-tier verification (anonymous → email → offer letter)
3. **Level mapping is manual** — Seeded with known mappings; in production would allow community submissions + admin review
4. **Free-text level input** — On submit form, users type their level; ideally would be a dropdown populated from LevelMapping
5. **No rate limiting** — Would add in production to prevent spam submissions

## What I'd Add Next

1. **Verification tiers** — Email verification for higher trust scores (like Levels.fyi)
2. **Salary range visualization** — Box plots or percentile charts instead of just averages
3. **Time-series trends** — Track how compensation changes over time
4. **Search** — Global search across companies, roles, levels
5. **Admin dashboard** — Review and approve submitted salaries
