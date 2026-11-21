import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Search, Trash2, Pencil, FileText } from 'lucide-react'
import { api } from '../api'
import { useApp } from '../store'
import { MicButton } from '../speech'
import { Err, Empty, Spinner, H, fmtSize } from '../components/ui'
const COL: any = { pdf: '#ef4444', docx: '#2F6BFF', txt: '#14b8a6' }
const STAT: any = { ready: ['Ready', '#10b981'], needs_ocr: ['Needs OCR (scanned)', '#f59e0b'], failed: ['Failed', '#ef4444'], empty: ['No text', '#f59e0b'], processing: ['Processing', '#8b5cf6'] }
export default function Library() {
  const { t } = useApp(); const nav = useNavigate(); const [docs, setDocs] = useState<any[]>([]); const [q, setQ] = useState(''); const [type, setType] = useState('')
  const [cat, setCat] = useState('General'); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [drag, setDrag] = useState(false); const file = useRef<HTMLInputElement>(null)
  const load = () => api(`/library?q=${encodeURIComponent(q)}&type=${type}`).then(setDocs).catch(e => setErr(e.message))
  useEffect(() => { load() }, [q, type])
  const up = async (files: FileList | null) => { if (!files) return; setErr(''); setBusy(true)
    for (const f of Array.from(files)) { const fd = new FormData(); fd.append('file', f); fd.append('category', cat); try { await api('/library/upload', { method: 'POST', form: fd }) } catch (e: any) { setErr(f.name + ': ' + e.message) } }
    setBusy(false); load() }
  return <div><H sub="Upload PDF, DOCX or TXT files. Your library is private to you.">{t('library')}</H>
    <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); up(e.dataTransfer.files) }}
      className="card p-6 text-center mb-5" style={{ borderStyle: 'dashed', borderColor: drag ? 'var(--brand)' : undefined }}>
      <Upload className="mx-auto text-brand" /><p className="mt-2 text-sm">Drag & drop files here, or</p>
      <div className="flex justify-center gap-2 mt-3 flex-wrap"><input className="input !w-44" placeholder="Category" value={cat} onChange={e => setCat(e.target.value)} />
        <button className="btn" onClick={() => file.current?.click()} disabled={busy}>{t('upload')}</button></div>
      <input ref={file} type="file" multiple accept=".pdf,.docx,.txt" hidden onChange={e => { up(e.target.files); e.target.value = '' }} />{busy && <Spinner text="Uploading and extracting text…" />}<Err msg={err} /></div>
    <div className="flex gap-2 mb-4 flex-wrap items-center"><div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute start-3 top-3.5 text-muted" /><input className="input !ps-9" placeholder="Search documents or category" value={q} onChange={e => setQ(e.target.value)} /></div>
      <MicButton onText={s => setQ(q ? q + ' ' + s : s)} />{['', 'pdf', 'docx', 'txt'].map(x => <button key={x} className={type === x ? 'btn' : 'btn-ghost'} onClick={() => setType(x)}>{x ? x.toUpperCase() : 'All'}</button>)}</div>
    {docs.length === 0 ? <Empty>No documents found. Upload your first file above.</Empty> :
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{docs.map(d => { const s = STAT[d.status] || STAT.processing
        return <div key={d.id} className="card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl grid place-items-center text-white" style={{ background: COL[d.file_type] }}><FileText size={20} /></div>
            <div className="min-w-0"><div className="font-semibold text-sm truncate" title={d.filename}>{d.filename}</div><div className="text-xs text-muted">{d.file_type.toUpperCase()} · {fmtSize(d.size_bytes)} · {d.created_at.slice(0, 10)}</div></div></div>
          <div className="flex gap-2 items-center"><span className="chip" style={{ color: s[1] }}>● {s[0]}</span><span className="chip">{d.category}</span></div>
          <p className="text-xs text-muted line-clamp-3 min-h-[3rem]">{d.summary ? d.summary.slice(0, 160) + '…' : 'No summary yet. Open the document to generate one.'}</p>
          <div className="flex gap-2 mt-auto"><button className="btn flex-1 justify-center" onClick={() => nav(`/library/${d.id}`)}>{t('open')}</button>
            <button className="btn-ghost" title="Rename" onClick={async () => { const n = prompt('Rename document', d.filename); if (n) { await api(`/library/${d.id}`, { method: 'PATCH', body: { filename: n } }); load() } }}><Pencil size={15} /></button>
            <button className="btn-ghost" title="Delete" onClick={async () => { if (confirm('Delete this document?')) { await api(`/library/${d.id}`, { method: 'DELETE' }); load() } }}><Trash2 size={15} /></button></div></div> })}</div>}</div>
}
