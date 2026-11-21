import { useEffect, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { api } from '../api'
export default function DocPicker({ value, onChange, compact = false }: { value: string; onChange: (v: string) => void; compact?: boolean }) {
  const [docs, setDocs] = useState<any[]>([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const f = useRef<HTMLInputElement>(null)
  const load = () => api('/library').then((d: any[]) => setDocs(d.filter(x => x.status === 'ready'))).catch(() => {})
  useEffect(() => { load() }, [])
  const up = async (files: FileList | null) => {
    if (!files?.[0]) return; setErr(''); setBusy(true)
    try {
      const fd = new FormData(); fd.append('file', files[0]); fd.append('category', 'Study Tools')
      const r = await api('/library/upload', { method: 'POST', form: fd })
      if (r.status !== 'ready') setErr(r.status === 'needs_ocr' ? 'Scanned PDF: no readable text (OCR is needed).' : 'No readable text was found in this file.')
      else { await load(); onChange(String(r.id)) }
    } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }
  return <div className="flex flex-col gap-1"><div className="flex gap-2 items-center flex-wrap">
    <select className="input !w-auto max-w-[260px]" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{compact ? 'No document attached' : 'No document (use typed text)'}</option>{docs.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}</select>
    <button type="button" className="btn-ghost" disabled={busy} onClick={() => f.current?.click()}><Upload size={15} />{busy ? 'Uploading…' : 'Upload document'}</button>
    {value && <button type="button" className="btn-ghost" onClick={() => onChange('')} title="Remove document"><X size={15} /></button>}
    <input ref={f} type="file" accept=".pdf,.docx,.txt" hidden onChange={e => { up(e.target.files); e.target.value = '' }} /></div>
    {err && <span className="text-xs text-red-500">{err}</span>}</div>
}
