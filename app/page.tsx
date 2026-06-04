import { prisma } from "@/lib/prisma";
import { formatCurrency, median } from "@/lib/utils";
import Link from "next/link";

// ISR: revalidate every hour — homepage changes daily with trending data
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch stats
  const [totalSalaries, totalCompanies, recentSalaries] = await Promise.all([
    prisma.salary.count(),
    prisma.company.count(),
    prisma.salary.findMany({
      take: 5,
      orderBy: { submitted_at: "desc" },
      include: { company: true },
    }),
  ]);

  // Top companies by median TC
  const companies = await prisma.company.findMany({
    include: {
      salaries: { select: { total_compensation: true } },
    },
  });

  const topCompanies = companies
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      industry: c.industry,
      count: c.salaries.length,
      medianTC: median(c.salaries.map((s) => Number(s.total_compensation))),
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.medianTC - a.medianTC)
    .slice(0, 6);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#222222] tracking-tight mb-3">
          Know Your Worth
        </h1>
        <p className="text-lg text-[#484848] max-w-2xl mx-auto mb-6">
          Structured, comparable compensation data across top tech companies.
          Compare by{" "}
          <span className="font-semibold text-[#222222]">
            equivalent engineering levels
          </span>
          , not job titles.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/salaries" className="btn-primary no-underline">
            Explore Salaries
          </Link>
          <Link href="/compare" className="btn-outline no-underline">
            Compare Offers
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        <div className="card card-padded text-center">
          <div className="text-3xl font-bold text-[#FF5A5F] mb-1">
            {totalSalaries}
          </div>
          <div className="text-sm text-[#717171]">Salary Records</div>
        </div>
        <div className="card card-padded text-center">
          <div className="text-3xl font-bold text-[#FF5A5F] mb-1">
            {totalCompanies}
          </div>
          <div className="text-sm text-[#717171]">Companies</div>
        </div>
        <div className="card card-padded text-center">
          <div className="text-3xl font-bold text-[#FF5A5F] mb-1">11</div>
          <div className="text-sm text-[#717171]">Engineering Levels</div>
        </div>
      </div>

      {/* Top Companies by Median TC */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#222222]">
            Top Companies by Median Total Comp
          </h2>
          <Link
            href="/companies"
            className="text-sm text-[#FF5A5F] hover:underline no-underline font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {topCompanies.map((c) => (
            <Link
              key={c.slug}
              href={`/companies/${c.slug}`}
              className="card card-padded hover:border-[#222222] transition-colors no-underline group"
            >
              <div className="font-semibold text-[#222222] mb-1 group-hover:text-[#FF5A5F] transition-colors">
                {c.name}
              </div>
              <div className="text-xs text-[#717171] mb-3">
                {c.industry} · {c.count} records
              </div>
              <div className="text-lg font-bold mono text-[#0369A1]">
                {formatCurrency(c.medianTC)}
              </div>
              <div className="text-xs text-[#717171]">Median Total Comp</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Submissions */}
      <div>
        <h2 className="text-lg font-bold text-[#222222] mb-4">
          Recent Submissions
        </h2>
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Level</th>
                <th>Location</th>
                <th>Total Comp</th>
              </tr>
            </thead>
            <tbody>
              {recentSalaries.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link
                      href={`/companies/${s.company.slug}`}
                      className="text-[#222222] font-medium hover:text-[#FF5A5F] no-underline"
                    >
                      {s.company.name}
                    </Link>
                  </td>
                  <td>{s.role}</td>
                  <td className="text-xs font-medium text-[#484848]">
                    {s.level}
                  </td>
                  <td>{s.location}</td>
                  <td className="mono font-bold text-[#0369A1]">
                    {formatCurrency(Number(s.total_compensation), s.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON-LD for homepage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "TalentDash",
            url: "https://talentdash.vercel.app",
            description:
              "Career intelligence platform with structured, comparable salary data for tech professionals in India.",
            potentialAction: {
              "@type": "SearchAction",
              target:
                "https://talentdash.vercel.app/salaries?company={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </div>
  );
}
