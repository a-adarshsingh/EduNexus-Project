import { useEffect, useState } from 'react'
import { Trash2, Play, Pause, Check } from 'lucide-react'
import { api } from '../api'
import { useApp } from '../store'
import { MicButton } from '../speech'
import { Err, Empty, H } from '../components/ui'
const day = (d: Date) => d.toISOString().slice(0, 10)
export default function Planner() {
  const { t } = useApp(); const [tasks, setTasks] = useState<any[]>([]); const [view, setView] = useState('week'); const [sel, setSel] = useState(day(new Date())); const [err, setErr] = useState('')
  const [f, setF] = useState({ subject: '', title: '', due_date: day(new Date()), priority: 'medium', duration_min: 30 })
  const [secs, setSecs] = useState(0); const [run, setRun] = useState(false); const [tSub, setTSub] = useState(''); const [brk, setBrk] = useState(false)
  const load = () => api('/planner/tasks').then(setTasks).catch(e => setErr(e.message)); useEffect(() => { load() }, [])
  useEffect(() => { if (!run) return; const i = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(i) }, [run])
  useEffect(() => { if (secs > 0 && secs % 1500 === 0) { setBrk(true); if ('Notification' in window && Notification.permission === 'granted') new Notification('EduNexus', { body: 'Time for a 5-minute break!' }) } }, [secs])
  const add = async () => { setErr(''); try { await api('/planner/tasks', { method: 'POST', body: { ...f, due_date: f.due_date || null } }); setF({ ...f, title: '' }); load() } catch (e: any) { setErr(e.message) } }
  const s = new Date(sel); const ws = new Date(s); ws.setDate(s.getDate() - s.getDay()); const we = new Date(ws); we.setDate(ws.getDate() + 6)
  const inView = (k: any) => { if (!k.due_date) return view === 'month' ? false : false; const d = k.due_date.slice(0, 10)
    return view === 'day' ? d === sel : view === 'week' ? d >= day(ws) && d <= day(we) : d.slice(0, 7) === sel.slice(0, 7) }
  const list = tasks.filter(inView); const noDate = tasks.filter(k => !k.due_date)
  const done = tasks.filter(k => k.done).length; const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0
  const stop = async () => { const m = Math.max(1, Math.round(secs / 60)); setRun(false); setSecs(0); setBrk(false); if (secs >= 30) { await api('/planner/sessions', { method: 'POST', body: { subject: tSub || null, minutes: m } }); alert(`Saved ${m} min study session.`) } }
  const Row = ({ k }: any) => <div className="flex items-center gap-3 py-2 border-b border-line last:border-0 text-sm">
    <button className="w-6 h-6 rounded-full border border-line grid place-items-center" style={k.done ? { background: 'var(--brand)', color: '#fff' } : {}} onClick={async () => { await api(`/planner/tasks/${k.id}`, { method: 'PATCH', body: { done: !k.done } }); load() }}>{k.done && <Check size={14} />}</button>
    <div className="flex-1 min-w-0"><div className={k.done ? 'line-through text-muted' : 'font-medium'}>{k.title}</div><div className="text-xs text-muted">{k.subject} · {k.duration_min} min · {k.due_date?.slice(0, 10) || 'no date'}</div></div>
    <span className="chip" style={{ color: k.priority === 'high' ? '#ef4444' : k.priority === 'low' ? '#10b981' : undefined }}>{k.priority}</span>
    <button onClick={async () => { await api(`/planner/tasks/${k.id}`, { method: 'DELETE' }); load() }} title="Delete"><Trash2 size={15} /></button></div>
  const dim = new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate(); const lead = new Date(s.getFullYear(), s.getMonth(), 1).getDay()
  return <div><H sub={`${done}/${tasks.length} tasks completed (${pct}%)`}>{t('planner')}</H>
    <div className="grid lg:grid-cols-3 gap-4"><div className="lg:col-span-2 space-y-4">
      <div className="card p-4"><div className="grid sm:grid-cols-2 gap-2"><input className="input" placeholder="Subject" value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} />
        <div className="flex gap-2"><input className="input" placeholder="Task (type or dictate)" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /><MicButton onText={x => setF(p => ({ ...p, title: p.title ? p.title + ' ' + x : x }))} /></div>
        <input className="input" type="date" value={f.due_date} onChange={e => setF({ ...f, due_date: e.target.value })} />
        <div className="flex gap-2"><select className="input" value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}><option>low</option><option>medium</option><option>high</option></select>
          <input className="input !w-28" type="number" min={1} value={f.duration_min} onChange={e => setF({ ...f, duration_min: Number(e.target.value) })} title="Minutes" /></div></div>
        <button className="btn mt-3" disabled={!f.subject.trim() || !f.title.trim()} onClick={add}>Add task</button><Err msg={err} /></div>
      <div className="card p-4"><div className="flex gap-2 mb-3 items-center flex-wrap">{['day', 'week', 'month'].map(v => <button key={v} className={view === v ? 'btn' : 'btn-ghost'} onClick={() => setView(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}
        <input className="input !w-auto ms-auto" type="date" value={sel} onChange={e => setSel(e.target.value)} /></div>
        {view === 'month' && <div className="grid grid-cols-7 gap-1 mb-3 text-center text-xs">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x, i) => <b key={i} className="text-muted">{x}</b>)}{Array.from({ length: lead }).map((_, i) => <span key={'l' + i} />)}
          {Array.from({ length: dim }).map((_, i) => { const ds = sel.slice(0, 8) + String(i + 1).padStart(2, '0'); const n = tasks.filter(k => k.due_date?.slice(0, 10) === ds).length
            return <button key={i} onClick={() => { setSel(ds); setView('day') }} className="rounded-lg py-2" style={{ background: n ? 'var(--soft)' : 'transparent', border: ds === day(new Date()) ? '1px solid var(--brand)' : '1px solid transparent' }}>{i + 1}{n > 0 && <div className="text-[10px] text-brand">{n}</div>}</button> })}</div>}
        {list.length === 0 ? <Empty>No tasks in this {view}.</Empty> : list.map(k => <Row key={k.id} k={k} />)}
        {noDate.length > 0 && <><h4 className="text-xs font-semibold text-muted mt-3">No date</h4>{noDate.map(k => <Row key={k.id} k={k} />)}</>}</div></div>
      <div className="card p-5 h-fit text-center"><h3 className="font-semibold">Study timer</h3>
        <div className="text-5xl font-bold my-4 tabular-nums">{String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}</div>
        <input className="input mb-3" placeholder="Subject (optional)" value={tSub} onChange={e => setTSub(e.target.value)} />
        <div className="flex gap-2 justify-center"><button className="btn" onClick={() => { setRun(!run); if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission() }}>{run ? <><Pause size={15} />Pause</> : <><Play size={15} />Start</>}</button>
          <button className="btn-ghost" disabled={secs < 30} onClick={stop}>Finish & save</button></div>
        {brk && <p className="mt-3 text-sm rounded-xl p-2" style={{ background: 'var(--soft)' }}>⏰ 25 minutes done. Take a 5-minute break!</p>}
        <p className="text-xs text-muted mt-3">A break reminder appears every 25 minutes. Sessions under 30 seconds aren't saved.</p></div></div></div>
}
