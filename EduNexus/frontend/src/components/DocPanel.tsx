import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send } from 'lucide-react'
import { api } from '../api'
import { LANGS } from '../i18n'
import { MicButton, speak } from '../speech'
import { Err, Spinner, CopyDl } from './ui'
const KINDS: [string, string][] = [['notes', 'Revision notes'], ['flashcards', 'Flashcards'], ['mcq', 'MCQs + answers'], ['questions', 'Important Q&A'], ['definitions', 'Difficult terms'], ['headings', 'Headings'], ['sections', 'Section summary']]
export default function DocPanel({ id, reader = false }: { id: number; reader?: boolean }) {
  const [doc, setDoc] = useState<any>(null); const [mode, setMode] = useState('medium'); const [lang, setLang] = useState('auto')
  const [out, setOut] = useState<any>(null); const [busy, setBusy] = useState(''); const [err, setErr] = useState(''); const [q, setQ] = useState(''); const [qa, setQa] = useState<any[]>([])
  useEffect(() => { setDoc(null); setOut(null); setQa([]); setErr(''); api(`/library/${id}`).then(d => { setDoc(d); if (d.summary) setOut({ title: 'Summary', text: d.summary }) }).catch(e => setErr(e.message)) }, [id])
  const run = async (label: string, path: string, body: any, pick: string) => { setErr(''); setBusy(label); try { const r = await api(`/library/${id}/${path}`, { method: 'POST', body }); setOut({ title: label, text: r[pick], lang: r.language }) } catch (e: any) { setErr(e.message) } setBusy('') }
  const ask = async () => { if (!q.trim()) return; setErr(''); setBusy('ask'); try { const r = await api(`/library/${id}/ask`, { method: 'POST', body: { question: q } }); setQa([{ q, ...r }, ...qa]); setQ('') } catch (e: any) { setErr(e.message) } setBusy('') }
  if (!doc) return err ? <Err msg={err} /> : <Spinner text="Loading document…" />
  const ok = doc.status === 'ready'
  return <div className={reader ? 'grid lg:grid-cols-2 gap-5' : ''}>
    {reader && <div className="card p-5"><div className="flex justify-between items-start gap-2"><div><h2 className="font-semibold break-all">{doc.filename}</h2><p className="text-xs text-muted">{doc.file_type.toUpperCase()} · {doc.category} · {doc.text_length} characters</p></div><Link to="/library" className="btn-ghost">Back</Link></div>
      <h4 className="text-sm font-semibold mt-4 mb-1">Extracted text preview</h4>{ok ? <pre className="text-xs whitespace-pre-wrap max-h-[60vh] overflow-auto p-3 rounded-xl" style={{ background: 'var(--soft)', fontFamily: 'inherit' }}>{doc.text}{doc.text_length > 8000 ? '\n\n… (preview truncated)' : ''}</pre>
        : <Err msg={doc.status === 'needs_ocr' ? 'Scanned PDF detected: no readable text. OCR is required (not installed yet).' : 'No readable text could be extracted.'} />}</div>}
    <div className="card p-5 space-y-3"><div className="flex items-center justify-between gap-2 flex-wrap"><h3 className="font-semibold">AI Summary & Study material</h3>
      <div className="flex gap-2"><select className="input !w-auto" value={mode} onChange={e => setMode(e.target.value)}><option value="short">Short</option><option value="medium">Medium</option><option value="detailed">Detailed</option></select>
        <select className="input !w-auto" value={lang} onChange={e => setLang(e.target.value)}><option value="auto">Auto language</option>{Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div></div>
      <div className="flex flex-wrap gap-2"><button className="btn" disabled={!ok || !!busy} onClick={() => run('Summary', 'summarize', { mode, language: lang }, 'summary')}>Generate summary</button>
        {KINDS.map(([k, l]) => <button key={k} className="btn-ghost" disabled={!ok || !!busy} onClick={() => run(l, 'generate', { kind: k, language: lang }, 'content')}>{l}</button>)}</div>
      {busy && busy !== 'ask' && <Spinner text={`Generating ${busy.toLowerCase()} with your local model… long documents are processed in chunks and can take a few minutes.`} />}<Err msg={err} />
      {out && <div><div className="flex justify-between items-center mb-2"><b className="text-sm">{out.title}</b><span className="flex gap-2"><button className="btn-ghost" onClick={() => speak(out.text, out.lang || 'en')}>🔊</button><CopyDl text={out.text} name={`${out.title}.txt`} /></span></div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed p-3 rounded-xl max-h-[50vh] overflow-auto" style={{ background: 'var(--soft)' }}>{out.text}</div></div>}
      <div className="pt-2 border-t border-line"><h4 className="text-sm font-semibold mb-2">Ask about this document</h4>
        <div className="flex gap-2"><input className="input" placeholder="Ask a question (any language)…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} />
          <MicButton onText={s => setQ(q ? q + ' ' + s : s)} /><button className="btn" disabled={!ok || busy === 'ask'} onClick={ask}><Send size={16} /></button></div>
        {busy === 'ask' && <Spinner text="Searching the document…" />}
        {qa.map((x, i) => <div key={i} className="mt-3 text-sm"><div className="font-semibold">Q: {x.q}</div><div className="whitespace-pre-wrap mt-1">{x.answer}</div><div className="text-xs text-muted mt-1">Based on document parts: {x.sources.join(', ')}</div></div>)}</div></div></div>
}
