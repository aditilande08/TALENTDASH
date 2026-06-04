import { PrismaClient, Level, Currency, Source } from "@prisma/client";

const prisma = new PrismaClient();

// ── Company Name Normalisation ──
// Strips legal suffixes, lowercases, trims, and applies alias lookup.
const ALIASES: Record<string, string> = {
  "tata consultancy services": "tcs",
  "tata consultancy": "tcs",
  "tcs ltd": "tcs",
  "tcs ltd.": "tcs",
  "amazon web services": "amazon",
  "amazon.com": "amazon",
  "flipkart internet pvt ltd": "flipkart",
  "wipro technologies": "wipro",
  "infosys bpo": "infosys",
  "google india pvt. ltd.": "google",
  "google india": "google",
};

function normalizeCompanyName(raw: string): string {
  let name = raw.toLowerCase().trim();
  // Strip legal suffixes
  name = name
    .replace(/\s*(pvt\.?\s*ltd\.?|inc\.?|ltd\.?|llc\.?|corp\.?|\.com)\s*$/i, "")
    .trim();
  // Check alias table
  if (ALIASES[name]) return ALIASES[name];
  return name;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("🗑️  Clearing existing data...");
  await prisma.salary.deleteMany();
  await prisma.company.deleteMany();

  // ── Companies ──
  // 12 companies as required: Google, Amazon, Meta, Microsoft, Flipkart, Meesho,
  // NVIDIA, TCS, Infosys, Wipro, Razorpay, Zepto
  const companiesData = [
    { name: "Google", industry: "Technology", headquarters: "Mountain View, CA", founded_year: 1998, headcount_range: "150,000+" },
    { name: "Amazon", industry: "E-Commerce & Cloud", headquarters: "Seattle, WA", founded_year: 1994, headcount_range: "1,500,000+" },
    { name: "Meta", industry: "Technology", headquarters: "Menlo Park, CA", founded_year: 2004, headcount_range: "70,000+" },
    { name: "Microsoft", industry: "Technology", headquarters: "Redmond, WA", founded_year: 1975, headcount_range: "220,000+" },
    { name: "Flipkart", industry: "E-Commerce", headquarters: "Bengaluru, KA", founded_year: 2007, headcount_range: "30,000+" },
    { name: "Meesho", industry: "E-Commerce", headquarters: "Bengaluru, KA", founded_year: 2015, headcount_range: "2,000+" },
    { name: "NVIDIA", industry: "Semiconductors", headquarters: "Santa Clara, CA", founded_year: 1993, headcount_range: "30,000+" },
    { name: "TCS", industry: "IT Services", headquarters: "Mumbai, MH", founded_year: 1968, headcount_range: "600,000+" },
    { name: "Infosys", industry: "IT Services", headquarters: "Bengaluru, KA", founded_year: 1981, headcount_range: "340,000+" },
    { name: "Wipro", industry: "IT Services", headquarters: "Bengaluru, KA", founded_year: 1945, headcount_range: "250,000+" },
    { name: "Razorpay", industry: "Fintech", headquarters: "Bengaluru, KA", founded_year: 2014, headcount_range: "3,000+" },
    { name: "Zepto", industry: "Quick Commerce", headquarters: "Mumbai, MH", founded_year: 2021, headcount_range: "3,500+" },
  ];

  const companyMap: Record<string, string> = {};

  for (const c of companiesData) {
    const normalized = normalizeCompanyName(c.name);
    const slug = slugify(c.name);
    const created = await prisma.company.create({
      data: {
        name: c.name,
        slug,
        normalized_name: normalized,
        industry: c.industry,
        headquarters: c.headquarters,
        founded_year: c.founded_year,
        headcount_range: c.headcount_range,
      },
    });
    companyMap[c.name] = created.id;
  }

  // ── Normalization Demo ──
  // These should all resolve to the same "google" company via normalizeCompanyName:
  console.log("📋 Normalisation demo:");
  console.log(`  "Google India Pvt. Ltd." → "${normalizeCompanyName("Google India Pvt. Ltd.")}"`);
  console.log(`  "GOOGLE"                 → "${normalizeCompanyName("GOOGLE")}"`);
  console.log(`  "google  "               → "${normalizeCompanyName("google  ")}"`);
  console.log(`  "Tata Consultancy"       → "${normalizeCompanyName("Tata Consultancy")}"`);
  console.log(`  "TCS Ltd."               → "${normalizeCompanyName("TCS Ltd.")}"`);

  // ── Salary Records (60+ across all levels, cities, currencies) ──
  // Includes edge cases: zero bonus, zero stock, very high equity, Principal level
  const salaries: {
    company: string;
    role: string;
    level: Level;
    location: string;
    currency: Currency;
    experience_years: number;
    base_salary: bigint;
    bonus: bigint;
    stock: bigint;
    source: Source;
    confidence_score: number;
    is_verified: boolean;
  }[] = [
    // ── Google (7 records) ──
    { company: "Google", role: "Software Engineer", level: Level.L3, location: "Bengaluru", currency: Currency.INR, experience_years: 1, base_salary: 2200000n, bonus: 400000n, stock: 1000000n, source: Source.CONTRIBUTOR, confidence_score: 0.95, is_verified: true },
    { company: "Google", role: "Software Engineer", level: Level.L3, location: "Hyderabad", currency: Currency.INR, experience_years: 2, base_salary: 2100000n, bonus: 380000n, stock: 950000n, source: Source.CONTRIBUTOR, confidence_score: 0.92, is_verified: true },
    { company: "Google", role: "Software Engineer", level: Level.L4, location: "Bengaluru", currency: Currency.INR, experience_years: 4, base_salary: 3500000n, bonus: 700000n, stock: 2000000n, source: Source.CONTRIBUTOR, confidence_score: 0.93, is_verified: true },
    { company: "Google", role: "Software Engineer", level: Level.L5, location: "Hyderabad", currency: Currency.INR, experience_years: 7, base_salary: 5000000n, bonus: 1200000n, stock: 4000000n, source: Source.CONTRIBUTOR, confidence_score: 0.91, is_verified: true },
    { company: "Google", role: "Software Engineer", level: Level.L6, location: "Bengaluru", currency: Currency.INR, experience_years: 12, base_salary: 7500000n, bonus: 2000000n, stock: 8000000n, source: Source.SCRAPED, confidence_score: 0.7, is_verified: false },
    { company: "Google", role: "Data Scientist", level: Level.L4, location: "Bengaluru", currency: Currency.INR, experience_years: 5, base_salary: 3800000n, bonus: 750000n, stock: 2200000n, source: Source.CONTRIBUTOR, confidence_score: 0.88, is_verified: true },
    { company: "Google", role: "Software Engineer", level: Level.L5, location: "San Francisco", currency: Currency.USD, experience_years: 6, base_salary: 185000_00n, bonus: 30000_00n, stock: 80000_00n, source: Source.CONTRIBUTOR, confidence_score: 0.9, is_verified: true },

    // ── Amazon (7 records) ──
    { company: "Amazon", role: "Software Engineer", level: Level.SDE_I, location: "Bengaluru", currency: Currency.INR, experience_years: 0, base_salary: 1800000n, bonus: 200000n, stock: 600000n, source: Source.CONTRIBUTOR, confidence_score: 0.94, is_verified: true },
    { company: "Amazon", role: "Software Engineer", level: Level.SDE_I, location: "Hyderabad", currency: Currency.INR, experience_years: 1, base_salary: 1750000n, bonus: 180000n, stock: 550000n, source: Source.CONTRIBUTOR, confidence_score: 0.91, is_verified: true },
    { company: "Amazon", role: "Software Engineer", level: Level.SDE_II, location: "Bengaluru", currency: Currency.INR, experience_years: 4, base_salary: 3000000n, bonus: 400000n, stock: 1200000n, source: Source.CONTRIBUTOR, confidence_score: 0.93, is_verified: true },
    { company: "Amazon", role: "Software Engineer", level: Level.SDE_III, location: "Bengaluru", currency: Currency.INR, experience_years: 9, base_salary: 5200000n, bonus: 1000000n, stock: 3500000n, source: Source.CONTRIBUTOR, confidence_score: 0.88, is_verified: true },
    { company: "Amazon", role: "Data Engineer", level: Level.SDE_I, location: "Hyderabad", currency: Currency.INR, experience_years: 2, base_salary: 1900000n, bonus: 250000n, stock: 700000n, source: Source.SCRAPED, confidence_score: 0.65, is_verified: false },
    { company: "Amazon", role: "Product Manager", level: Level.SDE_II, location: "Bengaluru", currency: Currency.INR, experience_years: 4, base_salary: 2800000n, bonus: 500000n, stock: 1000000n, source: Source.AI_INFERRED, confidence_score: 0.6, is_verified: false },
    // Edge case: zero bonus
    { company: "Amazon", role: "Software Engineer", level: Level.SDE_I, location: "Pune", currency: Currency.INR, experience_years: 1, base_salary: 1700000n, bonus: 0n, stock: 500000n, source: Source.CONTRIBUTOR, confidence_score: 0.85, is_verified: true },

    // ── Meta (5 records) ──
    { company: "Meta", role: "Software Engineer", level: Level.L3, location: "Hyderabad", currency: Currency.INR, experience_years: 0, base_salary: 2400000n, bonus: 500000n, stock: 1500000n, source: Source.CONTRIBUTOR, confidence_score: 0.94, is_verified: true },
    { company: "Meta", role: "Software Engineer", level: Level.L4, location: "Hyderabad", currency: Currency.INR, experience_years: 4, base_salary: 3800000n, bonus: 800000n, stock: 2800000n, source: Source.CONTRIBUTOR, confidence_score: 0.92, is_verified: true },
    { company: "Meta", role: "Software Engineer", level: Level.L5, location: "Hyderabad", currency: Currency.INR, experience_years: 8, base_salary: 5500000n, bonus: 1400000n, stock: 5000000n, source: Source.CONTRIBUTOR, confidence_score: 0.91, is_verified: true },
    // Edge case: very high equity (Principal)
    { company: "Meta", role: "Software Engineer", level: Level.PRINCIPAL, location: "Hyderabad", currency: Currency.INR, experience_years: 18, base_salary: 9000000n, bonus: 3000000n, stock: 15000000n, source: Source.SCRAPED, confidence_score: 0.55, is_verified: false },
    { company: "Meta", role: "Software Engineer", level: Level.L5, location: "San Francisco", currency: Currency.USD, experience_years: 7, base_salary: 200000_00n, bonus: 40000_00n, stock: 120000_00n, source: Source.CONTRIBUTOR, confidence_score: 0.9, is_verified: true },

    // ── Microsoft (6 records) ──
    { company: "Microsoft", role: "Software Engineer", level: Level.SDE_I, location: "Hyderabad", currency: Currency.INR, experience_years: 0, base_salary: 2000000n, bonus: 300000n, stock: 800000n, source: Source.CONTRIBUTOR, confidence_score: 0.93, is_verified: true },
    { company: "Microsoft", role: "Software Engineer", level: Level.SDE_I, location: "Bengaluru", currency: Currency.INR, experience_years: 1, base_salary: 2100000n, bonus: 320000n, stock: 850000n, source: Source.CONTRIBUTOR, confidence_score: 0.91, is_verified: true },
    { company: "Microsoft", role: "Software Engineer", level: Level.SDE_II, location: "Hyderabad", currency: Currency.INR, experience_years: 4, base_salary: 3200000n, bonus: 600000n, stock: 1500000n, source: Source.CONTRIBUTOR, confidence_score: 0.92, is_verified: true },
    { company: "Microsoft", role: "Software Engineer", level: Level.SDE_III, location: "Bengaluru", currency: Currency.INR, experience_years: 8, base_salary: 4800000n, bonus: 1000000n, stock: 3000000n, source: Source.CONTRIBUTOR, confidence_score: 0.9, is_verified: true },
    { company: "Microsoft", role: "Program Manager", level: Level.SDE_II, location: "Bengaluru", currency: Currency.INR, experience_years: 3, base_salary: 2800000n, bonus: 500000n, stock: 1200000n, source: Source.CONTRIBUTOR, confidence_score: 0.88, is_verified: true },
    { company: "Microsoft", role: "Software Engineer", level: Level.L5, location: "London", currency: Currency.GBP, experience_years: 6, base_salary: 95000_00n, bonus: 15000_00n, stock: 40000_00n, source: Source.CONTRIBUTOR, confidence_score: 0.85, is_verified: true },

    // ── Flipkart (5 records) ──
    { company: "Flipkart", role: "Software Engineer", level: Level.SDE_I, location: "Bengaluru", currency: Currency.INR, experience_years: 0, base_salary: 1600000n, bonus: 150000n, stock: 400000n, source: Source.CONTRIBUTOR, confidence_score: 0.92, is_verified: true },
    { company: "Flipkart", role: "Software Engineer", level: Level.SDE_II, location: "Bengaluru", currency: Currency.INR, experience_years: 3, base_salary: 2800000n, bonus: 350000n, stock: 900000n, source: Source.CONTRIBUTOR, confidence_score: 0.9, is_verified: true },
    { company: "Flipkart", role: "Software Engineer", level: Level.SDE_III, location: "Bengaluru", currency: Currency.INR, experience_years: 7, base_salary: 4200000n, bonus: 700000n, stock: 2000000n, source: Source.CONTRIBUTOR, confidence_score: 0.88, is_verified: true },
    { company: "Flipkart", role: "Data Scientist", level: Level.SDE_I, location: "Bengaluru", currency: Currency.INR, experience_years: 1, base_salary: 1800000n, bonus: 200000n, stock: 500000n, source: Source.SCRAPED, confidence_score: 0.65, is_verified: false },
    // Edge case: zero stock
    { company: "Flipkart", role: "Software Engineer", level: Level.SDE_I, location: "Delhi", currency: Currency.INR, experience_years: 1, base_salary: 1500000n, bonus: 100000n, stock: 0n, source: Source.CONTRIBUTOR, confidence_score: 0.82, is_verified: true },

    // ── Meesho (4 records) ──
    { company: "Meesho", role: "Software Engineer", level: Level.SDE_I, location: "Bengaluru", currency: Currency.INR, experience_years: 1, base_salary: 1500000n, bonus: 150000n, stock: 300000n, source: Source.CONTRIBUTOR, confidence_score: 0.87, is_verified: true },
    { company: "Meesho", role: "Software Engineer", level: Level.SDE_II, location: "Bengaluru", currency: Currency.INR, experience_years: 3, base_salary: 2400000n, bonus: 300000n, stock: 700000n, source: Source.CONTRIBUTOR, confidence_score: 0.85, is_verified: true },
    { company: "Meesho", role: "Software Engineer", level: Level.SDE_III, location: "Bengaluru", currency: Currency.INR, experience_years: 6, base_salary: 3800000n, bonus: 500000n, stock: 1500000n, source: Source.SCRAPED, confidence_score: 0.62, is_verified: false },
    { company: "Meesho", role: "Data Analyst", level: Level.SDE_I, location: "Bengaluru", currency: Currency.INR, experience_years: 2, base_salary: 1200000n, bonus: 100000n, stock: 200000n, source: Source.CONTRIBUTOR, confidence_score: 0.8, is_verified: true },

    // ── NVIDIA (5 records) ──
    { company: "NVIDIA", role: "Software Engineer", level: Level.IC4, location: "Bengaluru", currency: Currency.INR, experience_years: 2, base_salary: 2600000n, bonus: 500000n, stock: 1500000n, source: Source.CONTRIBUTOR, confidence_score: 0.9, is_verified: true },
    { company: "NVIDIA", role: "Software Engineer", level: Level.IC5, location: "Bengaluru", currency: Currency.INR, experience_years: 5, base_salary: 4200000n, bonus: 900000n, stock: 3000000n, source: Source.CONTRIBUTOR, confidence_score: 0.88, is_verified: true },
    { company: "NVIDIA", role: "Software Engineer", level: Level.STAFF, location: "Pune", currency: Currency.INR, experience_years: 10, base_salary: 6500000n, bonus: 1500000n, stock: 5000000n, source: Source.CONTRIBUTOR, confidence_score: 0.85, is_verified: true },
    { company: "NVIDIA", role: "Software Engineer", level: Level.IC4, location: "San Francisco", currency: Currency.USD, experience_years: 3, base_salary: 160000_00n, bonus: 25000_00n, stock: 60000_00n, source: Source.CONTRIBUTOR, confidence_score: 0.9, is_verified: true },
    // Edge case: zero bonus AND zero stock (TC = base exactly)
    { company: "NVIDIA", role: "Software Engineer", level: Level.IC4, location: "Hyderabad", currency: Currency.INR, experience_years: 1, base_salary: 2200000n, bonus: 0n, stock: 0n, source: Source.SCRAPED, confidence_score: 0.5, is_verified: false },

    // ── TCS (5 records) ──
    { company: "TCS", role: "Software Engineer", level: Level.L3, location: "Mumbai", currency: Currency.INR, experience_years: 1, base_salary: 700000n, bonus: 50000n, stock: 0n, source: Source.CONTRIBUTOR, confidence_score: 0.9, is_verified: true },
    { company: "TCS", role: "Software Engineer", level: Level.L4, location: "Bengaluru", currency: Currency.INR, experience_years: 4, base_salary: 1100000n, bonus: 100000n, stock: 0n, source: Source.CONTRIBUTOR, confidence_score: 0.88, is_verified: true },
    { company: "TCS", role: "Software Engineer", level: Level.L5, location: "Hyderabad", currency: Currency.INR, experience_years: 8, base_salary: 1800000n, bonus: 200000n, stock: 0n, source: Source.CONTRIBUTOR, confidence_score: 0.85, is_verified: true },
    { company: "TCS", role: "Data Analyst", level: Level.L3, location: "Pune", currency: Currency.INR, experience_years: 2, base_salary: 650000n, bonus: 40000n, stock: 0n, source: Source.SCRAPED, confidence_score: 0.6, is_verified: false },
    { company: "TCS", role: "Software Engineer", level: Level.L3, location: "Delhi", currency: Currency.INR, experience_years: 1, base_salary: 680000n, bonus: 45000n, stock: 0n, source: Source.CONTRIBUTOR, confidence_score: 0.87, is_verified: true },

    // ── Infosys (4 records) ──
    { company: "Infosys", role: "Software Engineer", level: Level.L3, location: "Bengaluru", currency: Currency.INR, experience_years: 1, base_salary: 650000n, bonus: 40000n, stock: 0n, source: Source.CONTRIBUTOR, confidence_score: 0.88, is_verified: true },
    { company: "Infosys", role: "Software Engineer", level: Level.L4, location: "Pune", currency: Currency.INR, experience_years: 4, base_salary: 1050000n, bonus: 80000n, stock: 0n, source: Source.CONTRIBUTOR, confidence_score: 0.85, is_verified: true },
    { company: "Infosys", role: "Software Engineer", level: Level.L5, location: "Hyderabad", currency: Currency.INR, experience_years: 8, base_salary: 1700000n, bonus: 180000n, stock: 0n, source: Source.SCRAPED, confidence_score: 0.6, is_verified: false },
    { company: "Infosys", role: "Data Analyst", level: Level.L3, location: "Bengaluru", currency: Currency.INR, experience_years: 2, base_salary: 600000n, bonus: 35000n, stock: 0n, source: Source.CONTRIBUTOR, confidence_score: 0.82, is_verified: true },

    // ── Wipro (4 records) ──
    { company: "Wipro", role: "Software Engineer", level: Level.L3, location: "Bengaluru", currency: Currency.INR, experience_years: 1, base_salary: 600000n, bonus: 30000n, stock: 0n, source: Source.CONTRIBUTOR, confidence_score: 0.87, is_verified: true },
    { company: "Wipro", role: "Software Engineer", level: Level.L4, location: "Hyderabad", currency: Currency.INR, experience_years: 4, base_salary: 1000000n, bonus: 70000n, stock: 0n, source: Source.CONTRIBUTOR, confidence_score: 0.84, is_verified: true },
    { company: "Wipro", role: "Software Engineer", level: Level.L5, location: "Pune", currency: Currency.INR, experience_years: 8, base_salary: 1600000n, bonus: 150000n, stock: 0n, source: Source.CONTRIBUTOR, confidence_score: 0.82, is_verified: true },
    { company: "Wipro", role: "Data Analyst", level: Level.L3, location: "Mumbai", currency: Currency.INR, experience_years: 2, base_salary: 550000n, bonus: 25000n, stock: 0n, source: Source.SCRAPED, confidence_score: 0.58, is_verified: false },

    // ── Razorpay (5 records) ──
    { company: "Razorpay", role: "Software Engineer", level: Level.SDE_I, location: "Bengaluru", currency: Currency.INR, experience_years: 0, base_salary: 1500000n, bonus: 150000n, stock: 300000n, source: Source.CONTRIBUTOR, confidence_score: 0.9, is_verified: true },
    { company: "Razorpay", role: "Software Engineer", level: Level.SDE_II, location: "Bengaluru", currency: Currency.INR, experience_years: 3, base_salary: 2400000n, bonus: 300000n, stock: 600000n, source: Source.CONTRIBUTOR, confidence_score: 0.88, is_verified: true },
    { company: "Razorpay", role: "Software Engineer", level: Level.SDE_III, location: "Bengaluru", currency: Currency.INR, experience_years: 6, base_salary: 3800000n, bonus: 500000n, stock: 1200000n, source: Source.CONTRIBUTOR, confidence_score: 0.86, is_verified: true },
    { company: "Razorpay", role: "Product Manager", level: Level.SDE_II, location: "Bengaluru", currency: Currency.INR, experience_years: 4, base_salary: 2200000n, bonus: 250000n, stock: 500000n, source: Source.AI_INFERRED, confidence_score: 0.6, is_verified: false },
    // Very long company name test via role
    { company: "Razorpay", role: "Senior Backend Infrastructure Engineer", level: Level.SDE_III, location: "Bengaluru", currency: Currency.INR, experience_years: 7, base_salary: 4000000n, bonus: 600000n, stock: 1500000n, source: Source.CONTRIBUTOR, confidence_score: 0.84, is_verified: true },

    // ── Zepto (4 records) ──
    { company: "Zepto", role: "Software Engineer", level: Level.SDE_I, location: "Mumbai", currency: Currency.INR, experience_years: 0, base_salary: 1400000n, bonus: 100000n, stock: 400000n, source: Source.CONTRIBUTOR, confidence_score: 0.85, is_verified: true },
    { company: "Zepto", role: "Software Engineer", level: Level.SDE_II, location: "Mumbai", currency: Currency.INR, experience_years: 3, base_salary: 2200000n, bonus: 250000n, stock: 800000n, source: Source.CONTRIBUTOR, confidence_score: 0.83, is_verified: true },
    { company: "Zepto", role: "Software Engineer", level: Level.SDE_III, location: "Bengaluru", currency: Currency.INR, experience_years: 6, base_salary: 3500000n, bonus: 450000n, stock: 1200000n, source: Source.CONTRIBUTOR, confidence_score: 0.8, is_verified: true },
    // Edge case: very large salary (₹4+ Cr total comp)
    { company: "Zepto", role: "Software Engineer", level: Level.STAFF, location: "Mumbai", currency: Currency.INR, experience_years: 12, base_salary: 8000000n, bonus: 2000000n, stock: 30000000n, source: Source.SCRAPED, confidence_score: 0.5, is_verified: false },
  ];

  console.log(`\n📊 Seeding ${salaries.length} salary records...`);

  for (const s of salaries) {
    const companyId = companyMap[s.company];
    if (!companyId) {
      console.error(`❌ Company not found: ${s.company}`);
      continue;
    }

    // RULE: total_compensation is ALWAYS computed server-side
    const total_compensation = s.base_salary + s.bonus + s.stock;

    await prisma.salary.create({
      data: {
        company_id: companyId,
        role: s.role,
        level: s.level,
        location: s.location,
        currency: s.currency,
        experience_years: s.experience_years,
        base_salary: s.base_salary,
        bonus: s.bonus,
        stock: s.stock,
        total_compensation,
        source: s.source,
        confidence_score: s.confidence_score,
        is_verified: s.is_verified,
      },
    });
  }

  console.log(`\n✅ Seeded ${companiesData.length} companies and ${salaries.length} salary records`);
  console.log("\n📋 Edge cases included:");
  console.log("  - Zero bonus (Amazon SDE-I Pune)");
  console.log("  - Zero stock (Flipkart SDE-I Delhi)");
  console.log("  - Zero bonus AND zero stock (NVIDIA IC4 Hyderabad)");
  console.log("  - Very high equity / Principal (Meta Principal, Zepto Staff)");
  console.log("  - USD records (Google SF, Meta SF, NVIDIA SF)");
  console.log("  - GBP records (Microsoft London)");
  console.log("  - Very large salary ₹4Cr+ (Zepto Staff)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());