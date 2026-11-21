import { useEffect, useState } from 'react'
import { api } from '../api'
import { useApp } from '../store'
import { LANGS } from '../i18n'
import { BCP, speechOK, ttsOK } from '../speech'
import { Err, H } from '../components/ui'
const PROF = ['Student', 'Teacher', 'Professor', 'Researcher', 'Writer', 'Working Professional', 'Other']
export default function SettingsPage() {
  const { user, update, logout, t } = useApp(); const [p, setP] = useState({ full_name: user.full_name, profession: user.profession, course: user.course, institution: user.institution || '', interests: '' })
  const [pw, setPw] = useState({ current: '', new: '' }); const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [ol, setOl] = useState<any>(null)
  const [vl, setVl] = useState(localStorage.getItem('voiceLang') || 'en')
  useEffect(() => { api('/models').then(r => setOl({ ok: true, provider: r.provider, note: r.note })).catch(e => setOl({ ok: false, msg: e.message })) }, [])
  const go = async (fn: () => Promise<any>, ok: string) => { setErr(''); setMsg(''); try { await fn(); setMsg(ok) } catch (e: any) { setErr(e.message) } }
  return <div><H>{t('settings')}</H><Err msg={err} />{msg && <div className="text-sm rounded-xl px-3 py-2 mb-3" style={{ background: 'rgba(16,185,129,.12)', color: '#10b981' }}>{msg}</div>}
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="card p-5 space-y-2"><h3 className="font-semibold">Profile</h3>
        <input className="input" value={p.full_name} onChange={e => setP({ ...p, full_name: e.target.value })} />
        <select className="input" value={p.profession} onChange={e => setP({ ...p, profession: e.target.value })}>{PROF.map(x => <option key={x}>{x}</option>)}</select>
        <input className="input" placeholder="Course / subject" value={p.course} onChange={e => setP({ ...p, course: e.target.value })} />
        <input className="input" placeholder="Institution" value={p.institution} onChange={e => setP({ ...p, institution: e.target.value })} />
        <button className="btn" onClick={() => go(() => update({ ...p, institution: p.institution || null, interests: p.interests || null }), 'Profile saved.')}>Save profile</button></div>
      <div className="card p-5 space-y-2"><h3 className="font-semibold">Password</h3>
        <input className="input" type="password" placeholder="Current password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} />
        <input className="input" type="password" placeholder="New password (min 8)" value={pw.new} onChange={e => setPw({ ...pw, new: e.target.value })} />
        <button className="btn" onClick={() => go(async () => { await api('/auth/password', { method: 'POST', body: pw }); setPw({ current: '', new: '' }) }, 'Password updated.')}>Update password</button></div>
      <div className="card p-5 space-y-2"><h3 className="font-semibold">Language & appearance</h3>
        <label className="text-xs text-muted">Interface language (menus and buttons)</label><select className="input" value={user.interface_language} onChange={e => go(() => update({ interface_language: e.target.value }), 'Saved.')}>{Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <label className="text-xs text-muted">AI response language (Automatic = same language as your question)</label><select className="input" value={user.response_language} onChange={e => go(() => update({ response_language: e.target.value }), 'Saved.')}><option value="auto">Automatic (recommended)</option>{Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <div className="flex gap-2 pt-1"><button className={user.theme === 'light' ? 'btn' : 'btn-ghost'} onClick={() => update({ theme: 'light' })}>Light</button><button className={user.theme === 'dark' ? 'btn' : 'btn-ghost'} onClick={() => update({ theme: 'dark' })}>Dark</button></div></div>
      <div className="card p-5 space-y-2"><h3 className="font-semibold">AI engine & voice</h3>
        {!ol ? <p className="text-sm text-muted">Checking AI engine…</p> : ol.ok ? <p className="text-sm" style={{ color: '#10b981' }}>● AI engine: {ol.provider}. {ol.note}</p> : <p className="text-sm text-red-500">● {ol.msg}</p>}
        <p className="text-sm text-muted">Speech recognition: {speechOK ? 'available' : 'not supported in this browser'} · Text-to-speech: {ttsOK ? 'available' : 'not supported'}</p>
        <label className="text-xs text-muted">Default voice input language</label><select className="input" value={vl} onChange={e => { setVl(e.target.value); localStorage.setItem('voiceLang', e.target.value) }}>{Object.keys(BCP).map(k => <option key={k} value={k}>{LANGS[k]}</option>)}</select></div>
      <div className="card p-5 space-y-2 lg:col-span-2"><h3 className="font-semibold">Data management</h3>
        <div className="flex gap-2 flex-wrap"><button className="btn-ghost" onClick={() => confirm('Delete ALL your conversations?') && go(() => api('/data/chats', { method: 'DELETE' }), 'Conversations deleted.')}>Delete all conversations</button><button className="btn-ghost" onClick={logout}>{t('logout')}</button></div></div></div></div>
}
