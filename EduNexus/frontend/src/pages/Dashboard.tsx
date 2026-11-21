import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, Library, MessagesSquare, FileText, CalendarCheck } from 'lucide-react'
import { api } from '../api'
import { useApp } from '../store'
import Orb from '../components/Orb'
import { Empty } from '../components/ui'
export default function Dashboard() {
  const { user, t } = useApp(); const nav = useNavigate()
  const [docs, setDocs] = useState<any[]>([]); const [convs, setConvs] = useState<any[]>([]); const [tasks, setTasks] = useState<any[]>([]); const [an, setAn] = useState<any>(null)
  useEffect(() => { api('/library').then(setDocs).catch(() => {}); api('/conversations').then(setConvs).catch(() => {}); api('/planner/tasks?upcoming=true').then(setTasks).catch(() => {}); api('/analytics').then(setAn).catch(() => {}) }, [])
  const max = Math.max(1, ...(an?.daily || []).map((d: any) => d.minutes))
  const quick = [[Mic, 'voice', '/voice'], [Library, 'library', '/library'], [MessagesSquare, 'assistant', '/assistant'], [FileText, 'summarizer', '/summarizer'], [CalendarCheck, 'planner', '/planner']] as any[]
  return <div className="space-y-6">
    <motion.section initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[28px] text-white p-8 grid md:grid-cols-2 gap-6 items-center overflow-hidden" style={{ background: 'var(--hero)', boxShadow: 'var(--shadow)' }}>
      <div><p className="opacity-80 text-sm">{t('welcome')}</p><h1 className="text-3xl md:text-4xl font-bold mt-1">{user.full_name.split(' ')[0]} 👋</h1>
        <p className="opacity-90 mt-1 text-sm">{user.profession} · {user.course}</p>
        <p className="mt-4 opacity-95">Every concept you understand today makes tomorrow easier. One focused step at a time.</p>
        <div className="flex flex-wrap gap-3 mt-6"><Link to="/assistant" className="btn !bg-white !text-violet-700" style={{ background: '#fff' }}>{t('openAssistant')}</Link>
          <Link to="/library" className="btn-ghost !text-white !bg-white/15 !border-white/30">{t('exploreLibrary')}</Link>
          <Link to="/planner" className="btn-ghost !text-white !bg-white/15 !border-white/30">Start Learning</Link></div></div>
      <div className="py-6"><Orb size={220} onClick={() => nav('/voice')} /><p className="text-center text-xs opacity-80 mt-6">Tap the orb to talk</p></div></motion.section>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{quick.map(([I, k, to]) => <Link key={to} to={to} className="card p-4 flex flex-col items-center gap-2 hover:-translate-y-1 transition text-center text-sm"><I className="text-brand" />{t(k)}</Link>)}</div>
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="card p-5"><h3 className="font-semibold mb-3">Recent documents</h3>{docs.length === 0 ? <Empty>No documents yet. Upload one in My Library.</Empty> :
        docs.slice(0, 4).map(d => <div key={d.id} className="flex items-center justify-between py-2 border-b border-line last:border-0 text-sm"><span className="truncate me-2">{d.filename}</span><Link className="btn-ghost !py-1" to={`/library/${d.id}`}>{t('open')}</Link></div>)}</div>
      <div className="card p-5"><h3 className="font-semibold mb-3">Recent conversations</h3>{convs.length === 0 ? <Empty>No conversations yet. Ask the Learning Assistant anything.</Empty> :
        convs.slice(0, 5).map(c => <Link key={c.id} to="/assistant" className="block py-2 border-b border-line last:border-0 text-sm truncate">{c.title}</Link>)}</div>
      <div className="card p-5"><h3 className="font-semibold mb-3">Upcoming tasks</h3>{tasks.length === 0 ? <Empty>No upcoming tasks. Plan your study in Study Planner.</Empty> :
        tasks.map(k => <div key={k.id} className="py-2 border-b border-line last:border-0 text-sm"><b>{k.title}</b><div className="text-xs text-muted">{k.subject}{k.due_date ? ' · ' + k.due_date.slice(0, 10) : ''}</div></div>)}</div></div>
    <div className="card p-5"><h3 className="font-semibold mb-1">Weekly study overview</h3>
      {!an || an.total_minutes === 0 ? <Empty>No study time logged yet. Use the timer in Study Planner to start tracking.</Empty> :
        <div className="flex items-end gap-3 h-36 mt-3">{an.daily.map((d: any) => <div key={d.date} className="flex-1 flex flex-col items-center gap-1"><div className="w-full rounded-lg" style={{ height: Math.max(4, d.minutes / max * 100) + '%', background: 'linear-gradient(180deg,var(--brand),var(--brand2))' }} title={d.minutes + ' min'} /><span className="text-xs text-muted">{d.label}</span></div>)}</div>}</div></div>
}
