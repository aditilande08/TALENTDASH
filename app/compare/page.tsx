"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  formatCurrency,
  displayOrDash,
  LEVEL_BADGE_STYLES,
  LEVEL_DISPLAY,
} from "@/lib/utils";

interface SalaryOption {
  id: string;
  role: string;
  level: string;
  location: string;
  experience_years: number;
  base_salary: number;
  bonus: number;
  stock: number;
  total_compensation: number;
  currency: string;
  company: { name: string; slug: string };
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [salaries, setSalaries] = useState<SalaryOption[]>([]);
  const [s1, setS1] = useState<string>(searchParams.get("s1") || "");
  const [s2, setS2] = useState<string>(searchParams.get("s2") || "");
  const [comparison, setComparison] = useState<{
    record_1: SalaryOption;
    record_2: SalaryOption;
    delta: {
      base_delta: number;
      bonus_delta: number;
      stock_delta: number;
      tc_delta: number;
      experience_delta: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Load all salary records for dropdown
  useEffect(() => {
    fetch("/api/salaries?limit=100&sort=total_comp_desc")
      .then((r) => r.json())
      .then((data) => setSalaries(data.data));
  }, []);

  // Fetch comparison when both selected
  const fetchComparison = useCallback(async () => {
    if (!s1 || !s2 || s1 === s2) {
      setComparison(null);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/compare?s1=${s1}&s2=${s2}`);
    if (res.ok) {
      const data = await res.json();
      setComparison(data);
    }
    setLoading(false);
    router.replace(`/compare?s1=${s1}&s2=${s2}`, { scroll: false });
  }, [s1, s2, router]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  function deltaClass(val: number) {
    if (val > 0) return "delta-positive";
    if (val < 0) return "delta-negative";
    return "delta-neutral";
  }

  function formatDelta(val: number, currency: string = "INR") {
    if (val === 0) return "—";
    const prefix = val > 0 ? "+" : "";
    return prefix + formatCurrency(val, currency);
  }

  const getLabel = (s: SalaryOption) =>
    `${s.company.name} · ${s.role} · ${LEVEL_DISPLAY[s.level] || s.level} · ${s.location}`;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#222222] tracking-tight mb-1">
          Compare Salaries
        </h1>
        <p className="text-sm text-[#717171]">
          Select two salary records for side-by-side comparison
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="card card-padded">
          <label className="text-xs font-semibold text-[#717171] uppercase tracking-wider mb-2 block">
            Record A
          </label>
          <select
            className="filter-select"
            value={s1}
            onChange={(e) => setS1(e.target.value)}
          >
            <option value="">Select a salary record...</option>
            {salaries.map((s) => (
              <option key={s.id} value={s.id}>
                {getLabel(s)} — {formatCurrency(s.total_compensation, s.currency)}
              </option>
            ))}
          </select>
        </div>
        <div className="card card-padded">
          <label className="text-xs font-semibold text-[#717171] uppercase tracking-wider mb-2 block">
            Record B
          </label>
          <select
            className="filter-select"
            value={s2}
            onChange={(e) => setS2(e.target.value)}
          >
            <option value="">Select a salary record...</option>
            {salaries.map((s) => (
              <option key={s.id} value={s.id}>
                {getLabel(s)} — {formatCurrency(s.total_compensation, s.currency)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison not ready */}
      {!s1 || !s2 ? (
        <div className="empty-state card">
          Pick two salary records above to compare.
        </div>
      ) : s1 === s2 ? (
        <div className="empty-state card">
          Select two different records to compare.
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 60 }} />
          ))}
        </div>
      ) : comparison ? (
        <div className="space-y-6">
          {/* Winner Badge */}
          {comparison.delta.tc_delta !== 0 && (
            <div className="flex justify-center">
              <div className="px-4 py-2 bg-[#0369A1] text-white text-sm font-semibold rounded-full">
                {comparison.delta.tc_delta > 0
                  ? `${comparison.record_1.company.name} pays ${formatCurrency(Math.abs(comparison.delta.tc_delta))} more`
                  : `${comparison.record_2.company.name} pays ${formatCurrency(Math.abs(comparison.delta.tc_delta))} more`}
              </div>
            </div>
          )}

          {/* Side-by-side Table */}
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Record A</th>
                  <th>Record B</th>
                  <th>Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium text-[#222222]">Company</td>
                  <td className="font-medium">{comparison.record_1.company.name}</td>
                  <td className="font-medium">{comparison.record_2.company.name}</td>
                  <td className="text-[#717171]">—</td>
                </tr>
                <tr>
                  <td className="font-medium text-[#222222]">Role</td>
                  <td>{comparison.record_1.role}</td>
                  <td>{comparison.record_2.role}</td>
                  <td className="text-[#717171]">—</td>
                </tr>
                <tr>
                  <td className="font-medium text-[#222222]">Level</td>
                  <td>
                    <span className={`level-badge ${LEVEL_BADGE_STYLES[comparison.record_1.level]?.bg} ${LEVEL_BADGE_STYLES[comparison.record_1.level]?.text}`}>
                      {LEVEL_DISPLAY[comparison.record_1.level]}
                    </span>
                  </td>
                  <td>
                    <span className={`level-badge ${LEVEL_BADGE_STYLES[comparison.record_2.level]?.bg} ${LEVEL_BADGE_STYLES[comparison.record_2.level]?.text}`}>
                      {LEVEL_DISPLAY[comparison.record_2.level]}
                    </span>
                  </td>
                  <td className="text-[#717171]">—</td>
                </tr>
                <tr>
                  <td className="font-medium text-[#222222]">Location</td>
                  <td>{comparison.record_1.location}</td>
                  <td>{comparison.record_2.location}</td>
                  <td className="text-[#717171]">—</td>
                </tr>
                <tr>
                  <td className="font-medium text-[#222222]">Experience</td>
                  <td>{comparison.record_1.experience_years}y</td>
                  <td>{comparison.record_2.experience_years}y</td>
                  <td className={deltaClass(comparison.delta.experience_delta)}>
                    {comparison.delta.experience_delta > 0 ? "+" : ""}
                    {comparison.delta.experience_delta}y
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-[#222222]">Base Salary</td>
                  <td className="mono">
                    {formatCurrency(comparison.record_1.base_salary)}
                  </td>
                  <td className="mono">
                    {formatCurrency(comparison.record_2.base_salary)}
                  </td>
                  <td className={`mono ${deltaClass(comparison.delta.base_delta)}`}>
                    {formatDelta(comparison.delta.base_delta)}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-[#222222]">Bonus</td>
                  <td className="mono">
                    {displayOrDash(comparison.record_1.bonus)}
                  </td>
                  <td className="mono">
                    {displayOrDash(comparison.record_2.bonus)}
                  </td>
                  <td className={`mono ${deltaClass(comparison.delta.bonus_delta)}`}>
                    {formatDelta(comparison.delta.bonus_delta)}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-[#222222]">Stock</td>
                  <td className="mono">
                    {displayOrDash(comparison.record_1.stock)}
                  </td>
                  <td className="mono">
                    {displayOrDash(comparison.record_2.stock)}
                  </td>
                  <td className={`mono ${deltaClass(comparison.delta.stock_delta)}`}>
                    {formatDelta(comparison.delta.stock_delta)}
                  </td>
                </tr>
                <tr className="bg-[#F7F7F7]">
                  <td className="font-bold text-[#222222]">Total Comp</td>
                  <td className="mono font-bold text-[#0369A1] text-base">
                    {formatCurrency(comparison.record_1.total_compensation)}
                  </td>
                  <td className="mono font-bold text-[#0369A1] text-base">
                    {formatCurrency(comparison.record_2.total_compensation)}
                  </td>
                  <td className={`mono text-base font-bold ${deltaClass(comparison.delta.tc_delta)}`}>
                    {formatDelta(comparison.delta.tc_delta)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="skeleton" style={{ height: 400 }} />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
