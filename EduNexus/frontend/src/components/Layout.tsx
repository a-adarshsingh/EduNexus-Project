import { ReactNode, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Library, MessagesSquare, Mic, FileText, Sparkles, PenLine, CalendarCheck, BarChart3, Settings, Star, LogOut, Menu, X, Sun, Moon } from 'lucide-react'
import { useApp } from '../store'
import { LANGS } from '../i18n'
const NAV: [string, string, any][] = [['/', 'dashboard', LayoutDashboard], ['/library', 'library', Library], ['/assistant', 'assistant', MessagesSquare], ['/voice', 'voice', Mic], ['/summarizer', 'summarizer', FileText], ['/tools', 'tools', Sparkles], ['/writing', 'writing', PenLine], ['/planner', 'planner', CalendarCheck], ['/analytics', 'analytics', BarChart3], ['/feedback', 'feedback', Star], ['/settings', 'settings', Settings]]
export default function Layout({ children }: { children: ReactNode }) {
  const { user, t, theme, lang, update, logout } = useApp(); const [open, setOpen] = useState(false); const loc = useLocation()
  const initials = user.full_name.split(' ').map((x: string) => x[0]).slice(0, 2).join('').toUpperCase()
  const side = <div className="h-full flex flex-col text-white p-5" style={{ background: 'var(--sidebar)' }}>
    <div className="flex items-center gap-2 mb-6"><div className="w-9 h-9 rounded-xl bg-white/20 grid place-items-center font-bold">E</div><div><div className="font-bold leading-4">EduNexus</div><div className="text-[10px] opacity-75">AI Learning Workspace</div></div></div>
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 mb-5">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-300 to-fuchsia-400 grid place-items-center font-bold text-slate-900">{initials}</div>
      <div className="min-w-0"><div className="font-semibold text-sm truncate">{user.full_name}</div><div className="text-xs opacity-80 truncate">{user.profession}</div><div className="text-xs opacity-80 truncate">{user.course}</div></div></div>
    <nav className="flex-1 overflow-y-auto space-y-1">{NAV.map(([to, k, I]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${isActive ? 'bg-white text-violet-700 font-semibold shadow' : 'hover:bg-white/15'}`}><I size={18} />{t(k)}</NavLink>)}</nav>
    <div className="pt-4 space-y-2">
      <div className="flex gap-2"><select value={lang} onChange={e => update({ interface_language: e.target.value })} className="flex-1 rounded-xl bg-white/15 text-white text-sm px-2 py-2 outline-none">
        {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k} className="text-black">{v}</option>)}</select>
        <button className="rounded-xl bg-white/15 px-3" title="Theme" onClick={() => update({ theme: theme === 'dark' ? 'light' : 'dark' })}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button></div>
      <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-white/15"><LogOut size={18} />{t('logout')}</button></div></div>
  return <div className="min-h-screen">
    <aside className="hidden lg:block fixed inset-y-0 start-0 w-72 z-30">{side}</aside>
    {open && <div className="lg:hidden fixed inset-0 z-40 flex"><div className="w-72">{side}</div><div className="flex-1 bg-black/50" onClick={() => setOpen(false)} /></div>}
    <div className="lg:ps-72"><div className="lg:hidden flex items-center justify-between p-3"><button className="btn-ghost" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button><b>EduNexus</b><span /></div>
      <motion.main key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }} className="p-4 md:p-8 max-w-6xl mx-auto">{children}</motion.main></div></div>
}
