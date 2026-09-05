import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building, Users, Clock, CheckCircle2, ShieldAlert,
  RefreshCw, ArrowRight, Phone, Mail
} from 'lucide-react'
import * as api from '../../services/api'

export default function GovDepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const res = await api.getDepartments()
      setDepartments(res.departments || [])
    } catch (err) {
      console.error('Failed to load departments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Building size={13} className="text-emerald-600" />
            <span>Civic Agencies & Routing</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            Departments & Field Officers
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Operational distribution across Capital Development Authority (CDA), IESCO, SNGPL, WASA, IWMB, and ICT Administration.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          title="Refresh Departments"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
        </button>
      </section>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2 bg-white rounded-2xl border border-slate-200">
            <RefreshCw size={20} className="animate-spin text-emerald-600" />
            <span>Loading municipal departments...</span>
          </div>
        ) : departments.length > 0 ? (
          departments.map((dept) => {
            return (
              <div
                key={dept.id || dept._id || dept.name}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {dept.code || 'MUNI'}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active Agency
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {dept.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {dept.description || 'Mandated municipal authority handling civic hazards in Islamabad Capital Territory.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="text-slate-400 block text-[10px]">SLA Target</span>
                      <strong className="text-slate-800 font-mono">{dept.sla_hours || 48} Hours</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="text-slate-400 block text-[10px]">Jurisdiction</span>
                      <strong className="text-slate-800">Islamabad ICT</strong>
                    </div>
                  </div>

                  <Link
                    to={`/gov/queue?department=${encodeURIComponent(dept.id || dept.name)}`}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>View Department Queue</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            No departments loaded.
          </div>
        )}
      </div>
    </div>
  )
}
