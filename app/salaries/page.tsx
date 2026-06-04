"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  formatCurrency,
  displayOrDash,
  LEVEL_BADGE_STYLES,
  LEVEL_DISPLAY,
  VALID_LEVELS,
  convertCurrency,
  CURRENCY_RATES,
} from "@/lib/utils";

interface SalaryRecord {
  id: string;
  role: string;
  level: string;
  location: string;
  currency: string;
  experience_years: number;
  base_salary: number;
  bonus: number;
  stock: number;
  total_compensation: number;
  is_verified: boolean;
  company: { id: string; name: string; slug: string; industry: string | null };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LOCATIONS = [
  "",
  "Bengaluru",
  "Hyderabad",
  "Mumbai",
  "Pune",
  "Delhi",
  "San Francisco",
  "London",
];
const ROLES = [
  "",
  "Software Engineer",
  "Data Scientist",
  "Data Engineer",
  "Data Analyst",
  "Product Manager",
  "Program Manager",
];

function SalaryTableContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL params
  const [company, setCompany] = useState(searchParams.get("company") || "");
  const [role, setRole] = useState(searchParams.get("role") || "");
  const [level, setLevel] = useState(searchParams.get("level") || "");
  const [location, setLocation] = useState(
    searchParams.get("location") || ""
  );
  const [displayCurrency, setDisplayCurrency] = useState(
    searchParams.get("currency") || "INR"
  );
  const [sort, setSort] = useState(
    searchParams.get("sort") || "total_comp_desc"
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );

  const [data, setData] = useState<SalaryRecord[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Debounce company search
  const [companyDebounced, setCompanyDebounced] = useState(company);
  useEffect(() => {
    const timer = setTimeout(() => setCompanyDebounced(company), 300);
    return () => clearTimeout(timer);
  }, [company]);

  // Update URL with current filters (shareable link)
  const updateURL = useCallback(
    (params: Record<string, string>) => {
      const url = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) url.set(k, v);
      });
      router.replace(`/salaries?${url.toString()}`, { scroll: false });
    },
    [router]
  );

  // Fetch salaries
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (companyDebounced) params.set("company", companyDebounced);
      if (role) params.set("role", role);
      if (level) params.set("level", level);
      if (location) params.set("location", location);
      params.set("sort", sort);
      params.set("page", page.toString());
      params.set("limit", "25");

      const res = await fetch(`/api/salaries?${params}`);
      const json = await res.json();
      setData(json.data);
      setMeta(json.meta);
      setLoading(false);

      updateURL({
        company: companyDebounced,
        role,
        level,
        location,
        currency: displayCurrency,
        sort,
        page: page > 1 ? page.toString() : "",
      });
    };
    fetchData();
  }, [companyDebounced, role, level, location, sort, page, displayCurrency, updateURL]);

  function handleSort(field: string) {
    if (sort === `${field}_desc`) setSort(`${field}_asc`);
    else setSort(`${field}_desc`);
    setPage(1);
  }

  function clearFilters() {
    setCompany("");
    setRole("");
    setLevel("");
    setLocation("");
    setPage(1);
  }

  // Convert salary amount to display currency
  function displayAmount(amount: number, fromCurrency: string): string {
    if (displayCurrency === fromCurrency)
      return formatCurrency(amount, fromCurrency);
    const converted = convertCurrency(amount, fromCurrency, displayCurrency);
    return formatCurrency(converted, displayCurrency);
  }

  function displayAmountOrDash(amount: number, fromCurrency: string): string {
    if (amount === 0) return "—";
    return displayAmount(amount, fromCurrency);
  }

  const sortArrow = (field: string) => {
    if (sort === `${field}_desc`) return " ↓";
    if (sort === `${field}_asc`) return " ↑";
    return "";
  };

  const startRecord = (meta.page - 1) * meta.limit + 1;
  const endRecord = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#222222] tracking-tight mb-1">
          Salary Explorer
        </h1>
        <p className="text-sm text-[#717171]">
          {meta.total} salary records · Filter, sort, and compare compensation
          data
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card card-padded mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input
            className="filter-input"
            placeholder="Search company..."
            value={company}
            onChange={(e) => {
              setCompany(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="filter-select"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Roles</option>
            {ROLES.filter(Boolean).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Level multi-select as dropdown for simplicity */}
          <select
            className="filter-select"
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Levels</option>
            {VALID_LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_DISPLAY[l] || l}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Locations</option>
            {LOCATIONS.filter(Boolean).map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {/* Currency Toggle */}
          <div className="flex items-center gap-1 bg-[#F7F7F7] rounded-lg p-1">
            {(["INR", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setDisplayCurrency(c)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                  displayCurrency === c
                    ? "bg-white text-[#222222] shadow-sm"
                    : "text-[#717171] hover:text-[#484848]"
                }`}
              >
                {c === "INR" ? "₹ INR" : "$ USD"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Level</th>
                <th>Location</th>
                <th>Exp</th>
                <th className="sortable" onClick={() => handleSort("total_comp")}>
                  Base Salary
                </th>
                <th>Stock</th>
                <th
                  className="sortable"
                  onClick={() => handleSort("total_comp")}
                >
                  Total Comp{sortArrow("total_comp")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}>
                          <div
                            className="skeleton"
                            style={{ height: 14, width: "80%" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                : data.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      <div className="flex flex-col items-center gap-2">
                        <span>No records found for these filters.</span>
                        <button
                          onClick={clearFilters}
                          className="text-[#FF5A5F] hover:underline font-medium"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )
                : data.map((s) => {
                    const badge = LEVEL_BADGE_STYLES[s.level] || {
                      bg: "bg-gray-100",
                      text: "text-gray-700",
                    };
                    return (
                      <tr key={s.id}>
                        <td>
                          <Link
                            href={`/companies/${s.company.slug}`}
                            className="text-[#222222] font-medium hover:text-[#FF5A5F] no-underline transition-colors"
                          >
                            {s.company.name}
                          </Link>
                        </td>
                        <td className="text-[#222222] font-medium">
                          {s.role}
                        </td>
                        <td>
                          <span
                            className={`level-badge ${badge.bg} ${badge.text}`}
                          >
                            {LEVEL_DISPLAY[s.level] || s.level}
                          </span>
                        </td>
                        <td>{s.location}</td>
                        <td className="text-center">{s.experience_years}y</td>
                        <td className="mono">
                          {displayAmount(s.base_salary, s.currency)}
                        </td>
                        <td className="mono">
                          {displayAmountOrDash(s.stock, s.currency)}
                        </td>
                        <td className="mono font-bold text-[#0369A1] text-base">
                          {displayAmount(s.total_compensation, s.currency)}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 0 && !loading && data.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#EBEBEB]">
            <span className="text-xs text-[#717171]">
              Showing {startRecord}–{endRecord} of {meta.total} records
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(meta.totalPages, p + 1))
                }
                disabled={page === meta.totalPages}
                className="btn-outline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SalariesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="skeleton" style={{ height: 400 }} />
        </div>
      }
    >
      <SalaryTableContent />
    </Suspense>
  );
}
