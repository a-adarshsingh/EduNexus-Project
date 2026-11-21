import { useEffect, useRef, useState } from 'react'
import { Send, Plus, Trash2, Pencil, Copy, Volume2, Paperclip } from 'lucide-react'
import { api } from '../api'
import { useApp } from '../store'
import { MicButton, speak } from '../speech'
import { Err, Spinner } from '../components/ui'
import DocPicker from '../components/DocPicker'
export default function Assistant() {
  const { t } = useApp(); const [convs, setConvs] = useState<any[]>([]); const [cid, setCid] = useState<number | null>(null); const [msgs, setMsgs] = useState<any[]>([])
  const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [models, setModels] = useState<string[]>([]); const [model, setModel] = useState('')
  const [docs, setDocs] = useState<any[]>([]); const [doc, setDoc] = useState(''); const end = useRef<HTMLDivElement>(null)
  const loadC = () => api('/conversations').then(setConvs).catch(() => {})
  useEffect(() => { loadC(); api('/models').then(r => { setModels(r.models); setModel(r.models[0] || '') }).catch(e => setErr(e.message)); api('/library').then(d => setDocs(d.filter((x: any) => x.status === 'ready'))) }, [])
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, busy])
  const open = async (id: number) => { setCid(id); setErr(''); setMsgs(await api(`/conversations/${id}`)) }
  const send = async () => { const m = text.trim(); if (!m || busy) return; setText(''); setErr(''); setMsgs(x => [...x, { role: 'user', content: m }]); setBusy(true)
    try { const r = await api('/chat', { method: 'POST', body: { message: m, conversation_id: cid, model: model || null, document_id: doc ? Number(doc) : null } })
      setCid(r.conversation_id); setMsgs(x => [...x, { role: 'assistant', content: r.reply, language: r.language }]); loadC() } catch (e: any) { setErr(e.message) } setBusy(false) }
  return <div className="grid lg:grid-cols-[260px_1fr] gap-4 h-[calc(100vh-120px)]">
    <div className="card p-3 flex flex-col overflow-hidden"><button className="btn justify-center mb-3" onClick={() => { setCid(null); setMsgs([]) }}><Plus size={16} />New chat</button>
      <div className="overflow-auto space-y-1 flex-1">{convs.map(c => <div key={c.id} className={`flex items-center gap-1 rounded-xl px-2 py-2 text-sm cursor-pointer ${c.id === cid ? 'bg-soft font-semibold' : ''}`} onClick={() => open(c.id)}>
        <span className="flex-1 truncate">{c.title}</span>
        <button title="Rename" onClick={async e => { e.stopPropagation(); const n = prompt('Rename conversation', c.title); if (n) { await api(`/conversations/${c.id}`, { method: 'PATCH', body: { title: n } }); loadC() } }}><Pencil size={13} /></button>
        <button title="Delete" onClick={async e => { e.stopPropagation(); if (confirm('Delete this conversation?')) { await api(`/conversations/${c.id}`, { method: 'DELETE' }); if (cid === c.id) { setCid(null); setMsgs([]) } loadC() } }}><Trash2 size={13} /></button></div>)}</div></div>
    <div className="card p-4 flex flex-col overflow-hidden">
      <div className="flex gap-2 mb-3 flex-wrap"><select className="input !w-auto" value={model} onChange={e => setModel(e.target.value)}>{models.length === 0 && <option value="">No models</option>}{models.map(m => <option key={m}>{m}</option>)}</select>
        <div className="flex items-center gap-1"><Paperclip size={16} className="text-muted" /><DocPicker value={doc} onChange={setDoc} compact /></div></div>
      <div className="flex-1 overflow-auto space-y-3 pe-1">{msgs.length === 0 && <div className="text-center text-muted text-sm mt-16">{t('assistant')}: ask in Hindi, English, Hinglish or any supported language.<br />I'll reply in the same language.</div>}
        {msgs.map((m, i) => <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'ms-auto text-white' : ''}`} style={m.role === 'user' ? { background: 'linear-gradient(135deg,var(--brand),var(--brand2))' } : { background: 'var(--soft)' }}>{m.content}
          {m.role === 'assistant' && <div className="flex gap-3 mt-2 opacity-70"><button title="Copy" onClick={() => navigator.clipboard.writeText(m.content)}><Copy size={14} /></button><button title="Read aloud" onClick={() => speak(m.content, m.language || 'en')}><Volume2 size={14} /></button></div>}</div>)}
        {busy && <Spinner text="Thinking…" />}<div ref={end} /></div>
      <Err msg={err} />
      <div className="flex gap-2 mt-3"><textarea className="input" rows={2} placeholder="Ask anything…" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
        <MicButton onText={s => setText(x => x ? x + ' ' + s : s)} /><button className="btn" onClick={send} disabled={busy}><Send size={16} /></button></div></div></div>
}
