import { prisma } from "@/lib/prisma";
import { formatCurrency, median } from "@/lib/utils";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Companies — TalentDash",
  description:
    "Browse tech companies with structured salary data. Compare compensation across engineering levels.",
};

// Static — regenerated when companies change
export const revalidate = 3600;

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    include: {
      _count: { select: { salaries: true } },
      salaries: { select: { total_compensation: true } },
    },
    orderBy: { name: "asc" },
  });

  const companyCards = companies.map((c) => {
    const tcValues = c.salaries.map((s) => Number(s.total_compensation));
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      industry: c.industry,
      headquarters: c.headquarters,
      headcount_range: c.headcount_range,
      count: c._count.salaries,
      medianTC: median(tcValues),
    };
  });

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#222222] tracking-tight mb-1">
          Companies
        </h1>
        <p className="text-sm text-[#717171]">
          {companies.length} companies with salary data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companyCards.map((c) => (
          <Link
            key={c.id}
            href={`/companies/${c.slug}`}
            className="card card-padded hover:border-[#222222] transition-all duration-150 no-underline group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-[#222222] group-hover:text-[#FF5A5F] transition-colors">
                  {c.name}
                </div>
                <div className="text-xs text-[#717171] mt-0.5">
                  {c.industry}
                  {c.headquarters && ` · ${c.headquarters}`}
                </div>
              </div>
              {c.headcount_range && (
                <span className="text-[10px] font-medium text-[#717171] bg-[#F7F7F7] px-2 py-0.5 rounded">
                  {c.headcount_range}
                </span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xl font-bold mono text-[#0369A1]">
                  {c.count > 0 ? formatCurrency(c.medianTC) : "—"}
                </div>
                <div className="text-[10px] text-[#717171]">
                  Median Total Comp
                </div>
              </div>
              <div className="text-xs text-[#717171]">
                {c.count} {c.count === 1 ? "record" : "records"}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
