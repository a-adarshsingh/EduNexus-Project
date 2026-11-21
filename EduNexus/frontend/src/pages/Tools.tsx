import { useState } from 'react'
import { api } from '../api'
import { useApp } from '../store'
import { LANGS } from '../i18n'
import { MicButton } from '../speech'
import DocPicker from '../components/DocPicker'
import { Err, H, Spinner, CopyDl } from '../components/ui'
const T: [string, string, string][] = [['notes', 'AI Notes Generator', 'Notes from a topic or text'], ['explain', 'Topic Explainer', 'Step-by-step with examples'], ['simplify', 'Paragraph Simplifier', 'Plain-language version'], ['summary', 'Text Summarizer', 'Short summary'], ['flashcards', 'Flashcards', 'Q&A cards'], ['mcq', 'MCQ Generator', 'With answer key'], ['questions', 'Important Questions', 'Exam-style Q&A'], ['definitions', 'Definitions', 'Key terms'], ['vocabulary', 'Vocabulary', 'Words and meanings'], ['revision', 'Revision Material', 'Quick recap'], ['qa', 'Question Answer Generator', 'Practice pairs']]
export default function Tools() {
  const { t } = useApp(); const [k, setK] = useState('notes'); const [text, setText] = useState(''); const [lang, setLang] = useState('auto'); const [out, setOut] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [doc, setDoc] = useState('')
  const run = async () => { setErr(''); setOut(''); setBusy(true); try { setOut((await api('/tools', { method: 'POST', body: { kind: k, text, language: lang, document_id: doc ? Number(doc) : null } })).result) } catch (e: any) { setErr(e.message) } setBusy(false) }
  return <div><H sub="Output follows the language you write in, or the language you select.">{t('tools')}</H>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">{T.map(([id, n, s]) => <button key={id} onClick={() => setK(id)} className={`card p-3 text-start ${k === id ? 'ring-2 ring-[var(--brand)]' : ''}`}><div className="font-semibold text-sm">{n}</div><div className="text-xs text-muted">{s}</div></button>)}</div>
    <div className="card p-4 space-y-3"><div><div className="text-xs text-muted mb-1">Use a document (optional): upload a PDF, Word or text file, or pick one from My Library</div><DocPicker value={doc} onChange={setDoc} /></div><div className="flex gap-2"><textarea className="input" rows={6} placeholder={doc ? "Optional: tell the AI what to focus on…" : "Type or dictate a topic or paste text…"} value={text} onChange={e => setText(e.target.value)} /><MicButton onText={s => setText(x => x ? x + ' ' + s : s)} /></div>
      <div className="flex gap-2 flex-wrap"><select className="input !w-auto" value={lang} onChange={e => setLang(e.target.value)}><option value="auto">Auto language</option>{Object.entries(LANGS).map(([a, b]) => <option key={a} value={a}>{b}</option>)}</select>
        <button className="btn" onClick={run} disabled={busy || (!text.trim() && !doc)}>Generate</button></div>{busy && <Spinner />}<Err msg={err} />
      {out && <div><div className="flex justify-end mb-2"><CopyDl text={out} /></div><div className="whitespace-pre-wrap text-sm p-3 rounded-xl" style={{ background: 'var(--soft)' }}>{out}</div></div>}</div></div>
}
