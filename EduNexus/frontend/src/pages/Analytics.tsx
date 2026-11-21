import { useEffect, useState } from 'react'
import { api } from '../api'
import { useApp } from '../store'
import { Empty, H, Err } from '../components/ui'
export default function Analytics() {
  const { t } = useApp(); const [a, setA] = useState<any>(null); const [err, setErr] = useState('')
  useEffect(() => { api('/analytics').then(setA).catch(e => setErr(e.message)) }, [])
  if (!a) return <Err msg={err} />
  const bars = (arr: any[]) => { const m = Math.max(1, ...arr.map(d => d.minutes)); return <div className="flex items-end gap-1 h-36">{arr.map(d => <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.date}: ${d.minutes} min`}><div className="w-full rounded-md" style={{ height: Math.max(3, d.minutes / m * 100) + '%', background: 'linear-gradient(180deg,var(--brand),var(--brand2))' }} />{arr.length <= 7 && <span className="text-xs text-muted">{d.label}</span>}</div>)}</div> }
  const stats = [['Study time', `${Math.floor(a.total_minutes / 60)}h ${a.total_minutes % 60}m`], ['Tasks completed', `${a.tasks_done}/${a.tasks_total}`], ['Documents', a.documents], ['AI learning sessions', a.ai_sessions]]
  return <div><H sub="Based on your real activity only.">{t('analytics')}</H>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">{stats.map(([l, v]) => <div key={l as string} className="card p-5"><div className="text-xs text-muted">{l}</div><div className="text-2xl font-bold mt-1">{v}</div></div>)}</div>
    {a.total_minutes === 0 && a.tasks_total === 0 && a.documents === 0 && a.ai_sessions === 0 && <Empty>No activity yet. Upload a document, chat with the assistant or run the study timer. Your progress will show here.</Empty>}
    <div className="grid lg:grid-cols-2 gap-4"><div className="card p-5"><h3 className="font-semibold mb-3">Weekly activity (minutes)</h3>{bars(a.daily)}</div>
      <div className="card p-5"><h3 className="font-semibold mb-3">Last 30 days</h3>{bars(a.monthly)}</div>
      <div className="card p-5 lg:col-span-2"><h3 className="font-semibold mb-3">Subject-wise activity</h3>{a.subjects.length === 0 ? <Empty>No subject data yet.</Empty> :
        a.subjects.map((s: any) => <div key={s.subject} className="flex justify-between py-2 border-b border-line last:border-0 text-sm"><span>{s.subject}</span><span className="text-muted">{s.minutes} min · {s.tasks_done} tasks done</span></div>)}</div></div></div>
}
