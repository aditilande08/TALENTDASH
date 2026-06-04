# TalentDash — Compensation Intelligence Platform

A modern, full-stack compensation intelligence platform focused on structured, comparable, and normalized salary data across tech companies. Built for the 3-Day Software Engineering Trial Task.

**Live URL:** [https://talentdash-seven.vercel.app/](https://talentdash-seven.vercel.app/)

---

## 🎯 Platform Architecture

```
┌────────────────────────────────────────────────────────┐
│                        Frontend                        │
│     Next.js 16 + React 19 + TypeScript + Tailwind 4    │
│                                                        │
│  Pages:                                                │
│  /           → Homepage (ISR - 1h revalidation)        │
│  /salaries   → Interactive Salary Explorer (RSC + API) │
│  /companies  → Company Directory Listing (ISR)         │
│  /companies/[slug] → Company Details & Level Stats (SSG)│
│  /compare    → Side-by-Side Comparison Tool (CSR)       │
│  /insights   → Aggregated Salary Insights (CSR)        │
│  /submit     → Contribution Submission Form            │
└───────────────────────────┬────────────────────────────┘
                            │ fetch / SSR / SSG
┌───────────────────────────▼────────────────────────────┐
│                       API Layer                        │
│             Next.js API Routes (app/api/)              │
│                                                        │
│  GET  /api/salaries      → Filter, sort, paginate      │
│  GET  /api/companies     → List companies with stats   │
│  GET  /api/companies/[slug] → Details & level distribution│
│  GET  /api/compare       → Side-by-side delta stats    │
│  GET  /api/insights      → Aggregated statistics       │
│  GET  /api/levels        → Cross-company level mapping │
│  POST /api/ingest-salary → Normalise, validate, ingest │
└───────────────────────────┬────────────────────────────┘
                            │ Prisma ORM
┌───────────────────────────▼────────────────────────────┐
│                        Database                        │
│                PostgreSQL (Neon / Prisma)              │
│                                                        │
│  Tables:                                               │
│  Company → name, slug, normalized_name, industry, HQ   │
│  Salary  → base, bonus, stock, TC, level, location, YOE │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Engineering & Design Decisions

### 1. Robust Server-Side Data Ingestion Ingestion Pipeline (`POST /api/ingest-salary`)
* **Strict Validation:** Checks for all required fields, correct types, range validations (experience between 0–50, base salary > 0, confidence score between 0.0–1.0), and valid enums.
* **Company Name Normalization:** Standardizes inputs by lowercasing, trimming, stripping legal suffixes (e.g., *Pvt Ltd*, *Inc.*, *Llc*), and mapping common aliases (e.g., *"Google India"* -> *"google"*).
* **Computed Compensation:** `total_compensation` is always recalculated server-side (`base_salary + bonus + stock`) to avoid malicious or incorrect client-side data submission.
* **Duplicate Detection:** Rejects submissions if a record for the same company, role, level, and location exists with a base salary within 10% submitted in the last 48 hours.

### 2. High-Performance Querying & Database Indexes
Database fields are indexed in PostgreSQL for optimized lookup under heavy traffic:
* `@@index([company_id, level, location])` — Speeds up primary filter flows.
* `@@index([total_compensation])` — Optimizes sorting by total compensation.
* `@@index([submitted_at])` — For fast recent submission fetches.
* `@@index([location, level])` — Geolocation and seniority queries.

### 3. Responsive Styling Banning UI Frameworks
* Built using **pure CSS and TailwindCSS v4** utility classes to maximize load times and keep bundle sizes small.
* Standardized color system with elegant gradients, glassmorphism card layouts, and responsive data tables.
* Clean visual cues including red/green delta colors and winner badges in comparisons.

---

## 🛠️ Local Development & Setup

### Prerequisites
* Node.js v20+
* PostgreSQL database instance

### Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/aditilande08/TALENTDASH.git
   cd TALENTDASH
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@hostname:port/database"
   ```

4. **Sync database and generate Prisma Client:**
   ```bash
   npx prisma db push
   ```

5. **Seed the database:**
   ```bash
   npm run seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```
   *(Runs with Webpack mode for local OS environment compatibility).*

---

## 📋 API Documentation Reference

* **`GET /api/salaries`**: List database entries with support for `company`, `role`, `level`, `location`, `currency`, `sort`, `page`, and `limit`.
* **`GET /api/companies/[slug]`**: Returns metadata, raw salary entries, median total compensation, and level distributions for a company.
* **`GET /api/compare?s1={id}&s2={id}`**: Calculates comparison deltas side-by-side for two salary records.
* **`POST /api/ingest-salary`**: Submits a new compensation entry to the database.
