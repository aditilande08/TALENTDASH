'use client'

import { useEffect, useState } from 'react'

interface CompanyOption { id: number; name: string }

export default function SubmitPage() {
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [form, setForm] = useState({
    companyId: '',
    role: '',
    level: '',
    location: '',
    base: '',
    bonus: '',
    stock: '',
    yoe: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/companies').then((r) => r.json()).then(setCompanies)
  }, [])

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: parseInt(form.companyId),
          role: form.role,
          level: form.level,
          location: form.location,
          base: parseInt(form.base),
          bonus: parseInt(form.bonus) || 0,
          stock: parseInt(form.stock) || 0,
          yoe: parseInt(form.yoe) || 0,
        }),
      })

      if (res.ok) {
        setStatus('success')
        setForm({ companyId: '', role: '', level: '', location: '', base: '', bonus: '', stock: '', yoe: '' })
      } else {
        const data = await res.json()
        setErrorMsg(data.error || 'Something went wrong')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="page-container py-10" style={{ maxWidth: 640 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Submit Salary</h1>
        <p className="text-sm text-dim">
          Contribute anonymous compensation data. All submissions are unverified by default.
        </p>
      </div>

      {status === 'success' && (
        <div className="card card-padded mb-6" style={{ borderColor: 'var(--accent-green)', background: 'var(--accent-green-dim)' }}>
          <div className="text-sm font-medium text-green">Salary submitted successfully.</div>
          <div className="text-xs text-dim mt-1">Your entry will appear in the salary explorer as &quot;Pending&quot; until verified.</div>
        </div>
      )}

      {status === 'error' && (
        <div className="card card-padded mb-6" style={{ borderColor: 'var(--accent-red)', background: 'var(--accent-red-dim)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--accent-red)' }}>{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card card-padded">
        <div className="space-y-5">
          {/* Company */}
          <div>
            <label className="block text-xs font-medium text-dim uppercase tracking-wider mb-1.5">Company *</label>
            <select
              value={form.companyId}
              onChange={(e) => handleChange('companyId', e.target.value)}
              required
              className="filter-input"
              style={{ cursor: 'pointer' }}
            >
              <option value="">Select a company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Role & Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-dim uppercase tracking-wider mb-1.5">Role *</label>
              <input className="filter-input" placeholder="e.g. Software Engineer" value={form.role} onChange={(e) => handleChange('role', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-dim uppercase tracking-wider mb-1.5">Level *</label>
              <input className="filter-input" placeholder="e.g. L3, SDE1, E4" value={form.level} onChange={(e) => handleChange('level', e.target.value)} required />
            </div>
          </div>

          {/* Location & YoE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-dim uppercase tracking-wider mb-1.5">Location *</label>
              <input className="filter-input" placeholder="e.g. Bangalore" value={form.location} onChange={(e) => handleChange('location', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-dim uppercase tracking-wider mb-1.5">Years of Experience</label>
              <input className="filter-input" type="number" min="0" max="40" placeholder="0" value={form.yoe} onChange={(e) => handleChange('yoe', e.target.value)} />
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-default)', margin: '4px 0' }} />

          <div className="text-xs font-medium text-dim uppercase tracking-wider">Compensation (Annual, INR)</div>

          {/* Comp fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-dim mb-1.5">Base Salary *</label>
              <input className="filter-input mono" type="number" min="0" placeholder="2000000" value={form.base} onChange={(e) => handleChange('base', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-dim mb-1.5">Annual Bonus</label>
              <input className="filter-input mono" type="number" min="0" placeholder="400000" value={form.bonus} onChange={(e) => handleChange('bonus', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-dim mb-1.5">Stock (Annual)</label>
              <input className="filter-input mono" type="number" min="0" placeholder="1000000" value={form.stock} onChange={(e) => handleChange('stock', e.target.value)} />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="btn btn-primary w-full"
            style={{ marginTop: 8 }}
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Salary'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-xs text-dim leading-relaxed">
        <strong>Privacy:</strong> All submissions are anonymous. We do not collect any personal identifying information.
        Submitted data helps the community make better career decisions.
      </div>
    </div>
  )
}
