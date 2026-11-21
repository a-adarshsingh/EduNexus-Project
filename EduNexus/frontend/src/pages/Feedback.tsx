import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { api } from '../api'
import { useApp } from '../store'
import { Err, H } from '../components/ui'
function Stars({ value, onChange, size = 28, label }: { value: number; onChange: (n: number) => void; size?: number; label: string }) {
  const [h, setH] = useState(0)
  return <div role="radiogroup" aria-label={label} className="inline-flex gap-1" onMouseLeave={() => setH(0)}>
    {[1, 2, 3, 4, 5].map(n => { const on = (h || value) >= n
      return <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className="p-0.5 transition-transform hover:scale-110"
        onMouseEnter={() => setH(n)} onClick={() => onChange(value === n ? 0 : n)}>
        <Star size={size} fill={on ? '#FFD23F' : 'none'} stroke={on ? '#F5B800' : 'var(--muted)'} strokeWidth={1.8} /></button> })}</div>
}
const RATED: [string, string][] = [['ease', 'How easy was the app to use?'], ['language', 'Did the AI answer in the same language you used?'], ['design', 'How do you like the design and colors?'],
  ['library', 'How useful were My Library and the Summarizer?'], ['voice', 'How was the Voice Assistant?'], ['tools', 'How useful were Study Tools, Writing Studio and Planner?'], ['speed', 'How fast and reliable was the app?']]
const TEXTQ: [string, string, string][] = [['liked', 'What did you like the most?', 'Tell us what worked well for you…'],
  ['wrong', 'What felt wrong, confusing or not working?', 'Describe any problem or mistake you saw…'],
  ['improve', 'What should we improve, and how?', 'Tell us what to change and how it could be better…'],
  ['ideas', 'What other features should we add to EduNexus?', 'Share your ideas for new features…'],
  ['comments', 'Anything else you want to tell us?', 'Optional comments…']]
export default function Feedback() {
  const { t } = useApp(); const [overall, setOverall] = useState(0); const [r, setR] = useState<Record<string, number>>({}); const [txt, setTxt] = useState<Record<string, string>>({})
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [count, setCount] = useState(0)
  useEffect(() => { api('/feedback/mine').then((x: any[]) => setCount(x.length)).catch(() => {}) }, [done])
  const send = async () => {
    if (!overall) { setErr('Please give an overall star rating first.'); return }
    setErr(''); setBusy(true)
    try { const ratings: Record<string, number> = {}; Object.entries(r).forEach(([k, v]) => { if (v) ratings[k] = v })
      await api('/feedback', { method: 'POST', body: { overall, ratings, ...txt } }); setDone(true); setOverall(0); setR({}); setTxt({}) }
    catch (e: any) { setErr(e.message) } setBusy(false) }
  return <div><H sub="Tell us how EduNexus felt. Your answers help us make it better.">{t('feedback')}</H>
    {done && <div className="card p-5 mb-4 text-sm" style={{ background: 'var(--soft)' }}><b>Thank you for your feedback! 🎉</b><div className="text-muted mt-1">We read every response. You can send more feedback any time.</div>
      <button className="btn-ghost mt-3" onClick={() => setDone(false)}>Send another</button></div>}
    {!done && <div className="space-y-4">
      <div className="card p-5 flex items-center justify-between flex-wrap gap-3"><div><div className="font-semibold">Overall, how was your experience?<sup className="ms-0.5 font-bold" style={{ color: '#ef4444' }}>*</sup></div>
        <div className="text-xs text-muted">Tap a star. Tap it again to clear.</div></div><Stars value={overall} onChange={setOverall} size={36} label="Overall rating" /></div>
      <div className="card p-5"><h3 className="font-semibold mb-3">Rate each part</h3>
        {RATED.map(([id, q]) => <div key={id} className="flex items-center justify-between gap-3 flex-wrap py-2 border-b border-line last:border-0"><span className="text-sm">{q}</span>
          <Stars value={r[id] || 0} onChange={n => setR({ ...r, [id]: n })} size={24} label={q} /></div>)}</div>
      <div className="card p-5 space-y-4">{TEXTQ.map(([id, q, ph]) => <div key={id}><label className="block text-sm font-medium mb-1">{q}</label>
        <textarea className="input" rows={3} maxLength={2000} placeholder={ph} value={txt[id] || ''} onChange={e => setTxt({ ...txt, [id]: e.target.value })} /></div>)}</div>
      <Err msg={err} /><div className="flex items-center gap-3"><button className="btn" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Submit feedback'}</button>
        {count > 0 && <span className="text-xs text-muted">You have sent {count} feedback{count > 1 ? 's' : ''} so far.</span>}</div></div>}</div>
}
