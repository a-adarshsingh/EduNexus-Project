import { useState } from 'react'
import { api } from '../api'
import { useApp } from '../store'
import { MicButton } from '../speech'
import { Err, H, Spinner, CopyDl } from '../components/ui'
const A: [string, string][] = [['grammar', 'Improve grammar'], ['rewrite', 'Rewrite'], ['simplify', 'Simplify'], ['expand', 'Expand'], ['shorten', 'Shorten'], ['tone', 'Change tone'], ['headings', 'Generate headings'], ['bullets', 'Bullet points']]
export default function Writing() {
  const { t } = useApp(); const [text, setText] = useState(''); const [tone, setTone] = useState('professional'); const [res, setRes] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  const run = async (kind: string) => { setErr(''); setBusy(true); try { setRes((await api('/tools', { method: 'POST', body: { kind, text, tone } })).result) } catch (e: any) { setErr(e.message) } setBusy(false) }
  return <div><H sub="Dictate or type, then improve with AI. Your text language is preserved.">{t('writing')}</H>
    <div className="grid lg:grid-cols-2 gap-4"><div className="card p-4"><div className="flex gap-2"><textarea className="input" rows={14} placeholder="Start writing or use the mic…" value={text} onChange={e => setText(e.target.value)} /><MicButton onText={s => setText(x => x ? x + ' ' + s : s)} /></div>
      <div className="flex flex-wrap gap-2 mt-3">{A.map(([k, l]) => <button key={k} className="btn-ghost" disabled={busy || !text.trim()} onClick={() => run(k)}>{l}</button>)}
        <select className="input !w-auto" value={tone} onChange={e => setTone(e.target.value)}>{['professional', 'friendly', 'formal', 'casual', 'academic', 'persuasive'].map(x => <option key={x}>{x}</option>)}</select></div>
      <div className="mt-3"><CopyDl text={text} name="draft.txt" /></div></div>
      <div className="card p-4"><div className="flex justify-between mb-2"><b className="text-sm">AI result</b>{res && <span className="flex gap-2"><button className="btn-ghost" onClick={() => setText(res)}>Use as text</button><CopyDl text={res} name="result.txt" /></span>}</div>
        {busy && <Spinner />}<Err msg={err} />{res ? <div className="whitespace-pre-wrap text-sm">{res}</div> : !busy && <p className="text-sm text-muted">Results appear here.</p>}</div></div></div>
}
