import { prisma } from "@/lib/prisma";
import {
  formatCurrency,
  displayOrDash,
  median,
  LEVEL_BADGE_STYLES,
  LEVEL_DISPLAY,
} from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// ── FS3: generateStaticParams from real database ──
// NOT a hardcoded array. A live database query at build time.
// If a new company is added to the database, the next deployment
// automatically adds that company page.
export async function generateStaticParams() {
  const companies = await prisma.company.findMany({
    select: { slug: true },
  });
  return companies.map((c) => ({ slug: c.slug }));
}

// ── SEO: Dynamic metadata per company ──
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    select: { name: true, industry: true },
  });

  if (!company) {
    return { title: "Company Not Found | TalentDash" };
  }

  return {
    title: `${company.name} Salaries — Compensation by Level | TalentDash`,
    description: `Explore ${company.name} salary data across engineering levels. Compare base salary, bonus, stock, and total compensation for ${company.industry || "tech"} roles.`,
    openGraph: {
      title: `${company.name} Salaries | TalentDash`,
      description: `Structured compensation data for ${company.name}. Level-based salary breakdown.`,
      url: `https://talentdash.vercel.app/companies/${slug}`,
    },
  };
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      salaries: { orderBy: { total_compensation: "desc" } },
    },
  });

  if (!company) notFound();

  const sals = company.salaries;
  const tcValues = sals.map((s) => Number(s.total_compensation));

  // Median TC (NOT average — true statistical median)
  const medianTC = median(tcValues);
  const minTC = tcValues.length > 0 ? Math.min(...tcValues) : 0;
  const maxTC = tcValues.length > 0 ? Math.max(...tcValues) : 0;

  // Level distribution — horizontal stacked bar
  const levelCounts: Record<string, number> = {};
  for (const s of sals) {
    levelCounts[s.level] = (levelCounts[s.level] || 0) + 1;
  }
  const levelEntries = Object.entries(levelCounts).sort(
    ([, a], [, b]) => b - a
  );
  const totalRecords = sals.length;

  // Per-level avg TC for the bar chart
  const levelAvgTC: Record<string, { total: number; count: number }> = {};
  for (const s of sals) {
    const entry = levelAvgTC[s.level] || { total: 0, count: 0 };
    entry.total += Number(s.total_compensation);
    entry.count++;
    levelAvgTC[s.level] = entry;
  }
  const levelBars = Object.entries(levelAvgTC)
    .map(([level, d]) => ({
      level,
      avg: Math.round(d.total / d.count),
      count: d.count,
    }))
    .sort((a, b) => a.avg - b.avg);
  const maxLevelAvg = levelBars[levelBars.length - 1]?.avg || 1;

  // Level distribution colors for stacked bar
  const LEVEL_COLORS: Record<string, string> = {
    L3: "#94a3b8",
    L4: "#60a5fa",
    L5: "#818cf8",
    L6: "#a78bfa",
    SDE_I: "#94a3b8",
    SDE_II: "#60a5fa",
    SDE_III: "#818cf8",
    STAFF: "#a78bfa",
    PRINCIPAL: "#1e3a5f",
    IC4: "#60a5fa",
    IC5: "#818cf8",
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="text-xs text-[#717171] mb-5">
        <Link
          href="/companies"
          className="hover:text-[#FF5A5F] no-underline text-[#717171]"
        >
          Companies
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#222222]">{company.name}</span>
      </div>

      {/* Company Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#222222] tracking-tight mb-1">
            {company.name}
          </h1>
          <div className="flex items-center gap-2 text-sm text-[#717171]">
            {company.industry && (
              <span className="px-2 py-0.5 bg-[#F7F7F7] rounded text-xs font-medium text-[#484848]">
                {company.industry}
              </span>
            )}
            {company.founded_year && <span>Est. {company.founded_year}</span>}
            {company.headcount_range && (
              <>
                <span>·</span>
                <span>{company.headcount_range} employees</span>
              </>
            )}
            {company.headquarters && (
              <>
                <span>·</span>
                <span>{company.headquarters}</span>
              </>
            )}
          </div>
        </div>
        <Link
          href={`/compare?c1=${company.slug}`}
          className="btn-outline no-underline"
        >
          Compare
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="card card-padded">
          <div className="stat-label">Median Total Comp</div>
          <div className="stat-value mono text-[#FF5A5F]">
            {formatCurrency(medianTC)}
          </div>
        </div>
        <div className="card card-padded">
          <div className="stat-label">Salary Records</div>
          <div className="stat-value">{sals.length}</div>
        </div>
        <div className="card card-padded">
          <div className="stat-label">Min TC</div>
          <div className="stat-value mono">{formatCurrency(minTC)}</div>
        </div>
        <div className="card card-padded">
          <div className="stat-label">Max TC</div>
          <div className="stat-value mono text-[#008A05]">
            {formatCurrency(maxTC)}
          </div>
        </div>
      </div>

      {/* Level Distribution + Level Progression */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Stacked Level Distribution Bar */}
        <div className="card card-padded">
          <div className="text-sm font-semibold text-[#222222] mb-4">
            Level Distribution
          </div>
          {/* Stacked bar */}
          <div className="w-full h-8 rounded-lg overflow-hidden flex mb-4">
            {levelEntries.map(([level, count]) => (
              <div
                key={level}
                style={{
                  width: `${(count / totalRecords) * 100}%`,
                  backgroundColor: LEVEL_COLORS[level] || "#94a3b8",
                }}
                className="h-full flex items-center justify-center text-white text-[10px] font-semibold"
                title={`${LEVEL_DISPLAY[level] || level}: ${count} records (${Math.round((count / totalRecords) * 100)}%)`}
              >
                {(count / totalRecords) * 100 > 10
                  ? LEVEL_DISPLAY[level] || level
                  : ""}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {levelEntries.map(([level, count]) => (
              <div key={level} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{
                    backgroundColor: LEVEL_COLORS[level] || "#94a3b8",
                  }}
                />
                <span className="text-[#484848] font-medium">
                  {LEVEL_DISPLAY[level] || level}
                </span>
                <span className="text-[#717171]">({count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Level Progression Bars */}
        <div className="card card-padded">
          <div className="text-sm font-semibold text-[#222222] mb-4">
            Avg Total Comp by Level
          </div>
          <div className="space-y-3">
            {levelBars.map((l) => (
              <div key={l.level}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#222222]">
                    {LEVEL_DISPLAY[l.level] || l.level}{" "}
                    <span className="text-[#717171] text-xs">({l.count})</span>
                  </span>
                  <span className="text-sm font-semibold mono text-[#FF5A5F]">
                    {formatCurrency(l.avg)}
                  </span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(l.avg / maxLevelAvg) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Salary Table for this company */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-[#EBEBEB]">
          <div className="text-sm font-semibold text-[#222222]">
            All Salary Records
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Level</th>
              <th>Location</th>
              <th>Base</th>
              <th>Bonus</th>
              <th>Stock</th>
              <th>Total Comp</th>
              <th>Exp</th>
            </tr>
          </thead>
          <tbody>
            {sals.map((s) => {
              const badge = LEVEL_BADGE_STYLES[s.level] || {
                bg: "bg-gray-100",
                text: "text-gray-700",
              };
              return (
                <tr key={s.id}>
                  <td className="text-[#222222] font-medium">{s.role}</td>
                  <td>
                    <span className={`level-badge ${badge.bg} ${badge.text}`}>
                      {LEVEL_DISPLAY[s.level] || s.level}
                    </span>
                  </td>
                  <td>{s.location}</td>
                  <td className="mono">
                    {formatCurrency(Number(s.base_salary), s.currency)}
                  </td>
                  <td className="mono">
                    {displayOrDash(Number(s.bonus), s.currency)}
                  </td>
                  <td className="mono">
                    {displayOrDash(Number(s.stock), s.currency)}
                  </td>
                  <td className="mono font-bold text-[#0369A1] text-base">
                    {formatCurrency(Number(s.total_compensation), s.currency)}
                  </td>
                  <td className="text-center">{s.experience_years}y</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: `${company.name} Salary Data`,
            description: `Compensation data for ${company.name} across ${Object.keys(levelCounts).length} engineering levels. ${sals.length} salary records.`,
            url: `https://talentdash.vercel.app/companies/${company.slug}`,
            creator: {
              "@type": "Organization",
              name: "TalentDash",
            },
            distribution: {
              "@type": "DataDownload",
              encodingFormat: "application/json",
              contentUrl: `https://talentdash.vercel.app/api/companies/${company.slug}`,
            },
          }),
        }}
      />
    </div>
  );
}
