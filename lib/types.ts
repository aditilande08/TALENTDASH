export interface SalaryEntry {
  id: number
  role: string
  level: string
  location: string
  base: number
  bonus: number
  stock: number
  currency: string
  yoe: number
  verified: boolean
  createdAt: string
  company: {
    id: number
    name: string
    industry: string
  }
}

export interface CompanyDetail {
  id: number
  name: string
  industry: string
  website: string
  hq: string
  size: string
  salaries: SalaryEntry[]
}

export interface CompanyListItem {
  id: number
  name: string
  industry: string
  hq: string
  size: string
  _count: { salaries: number }
  avgBase: number
  avgTotal: number
}

export interface InsightData {
  topPaying: { company: string; avg: number }[]
  locationBreakdown: { location: string; avg: number; count: number }[]
  roleBreakdown: { role: string; avg: number; count: number }[]
  levelProgression: { level: string; avg: number; count: number }[]
}
